import { NextRequest, NextResponse } from "next/server";
import { scrypt as callbackScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { verifyAgentKey } from "@/lib/agent/auth";
import { signSession } from "@/lib/auth/session";
import connectToDb from "@/lib/utils/db";
import { User, Tenant, Saler } from "@/lib/models/User";
import Store from "@/lib/models/Store";

const scrypt = promisify(callbackScrypt);

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

async function verifyPw(password: string, stored: string): Promise<boolean> {
  try {
    const [algorithm, salt, storedHash] = stored.split("$");
    if (algorithm !== "scrypt" || !salt || !storedHash) return false;
    const storedBuf = Buffer.from(storedHash, "hex");
    const derived = (await scrypt(password.normalize("NFKC"), salt, storedBuf.length)) as Buffer;
    return derived.length === storedBuf.length && timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAgentKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  try {
    await connectToDb();

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select("+secure _id status")
      .lean();

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPw(password, user.secure as string);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    /* Detect account type */
    const tenant = await Tenant.findOne({ userId: user._id }).select("_id status").lean();

    let payload: {
      userId: string;
      accountType: "TENANT" | "SALER";
      tenantId?: string;
      salerId?: string;
      storeId?: string;
    };

    if (tenant) {
      if (tenant.status !== "ACTIVE") {
        return NextResponse.json({ error: "Tenant account inactive" }, { status: 403 });
      }
      payload = {
        userId: user._id.toString(),
        accountType: "TENANT",
        tenantId: tenant._id.toString(),
      };
    } else {
      const saler = await Saler.findOne({ userId: user._id }).select("_id storeId tenantId status").lean();
      if (!saler) {
        return NextResponse.json({ error: "No account profile found" }, { status: 403 });
      }
      if (saler.status !== "ACTIVE") {
        return NextResponse.json({ error: "Saler account inactive" }, { status: 403 });
      }
      const salerStore = await Store.findById(saler.storeId).select("_id tenantId status").lean();
      if (!salerStore || salerStore.status !== "ACTIVE") {
        return NextResponse.json({ error: "Store not active" }, { status: 403 });
      }
      const salerTenant = await Tenant.findById(salerStore.tenantId).select("_id status").lean();
      if (!salerTenant || salerTenant.status !== "ACTIVE") {
        return NextResponse.json({ error: "Tenant inactive" }, { status: 403 });
      }
      payload = {
        userId: user._id.toString(),
        accountType: "SALER",
        tenantId: salerTenant._id.toString(),
        salerId: saler._id.toString(),
        storeId: salerStore._id.toString(),
      };
    }

    const now = Date.now();
    const token = signSession({
      ...payload,
      issuedAt: now,
      expiresAt: now + SESSION_DURATION_MS,
    });

    return NextResponse.json({ ok: true, token, accountType: payload.accountType });
  } catch (error) {
    console.error("AGENT_TOKEN_ERROR", error);
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }
}
