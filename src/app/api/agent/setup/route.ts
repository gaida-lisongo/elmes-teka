import { NextRequest, NextResponse } from "next/server";
import { randomBytes, scrypt as callbackScrypt } from "node:crypto";
import { promisify } from "node:util";
import { v4 as uuidv4 } from "uuid";

import { verifyAgentKey } from "@/lib/agent/auth";
import connectToDb from "@/lib/utils/db";
import { User, Tenant, Saler } from "@/lib/models/User";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";

const scrypt = promisify(callbackScrypt);

const TENANT_EMAIL = "claude-agent-tenant@elmes-test.dev";
const SALER_EMAIL = "claude-agent-saler@elmes-test.dev";
const STORE_REFERENCE = "CLAUDE-AGENT-001";

async function hashPw(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password.normalize("NFKC"), salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  if (!verifyAgentKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDb();

    /* ── Check idempotency: if tenant already exists, return existing IDs ── */
    const existingUser = await User.findOne({ email: TENANT_EMAIL }).select("_id").lean();
    if (existingUser) {
      const existingTenant = await Tenant.findOne({ userId: existingUser._id }).select("_id").lean();
      const existingStore = await Store.findOne({ reference: STORE_REFERENCE }).select("_id").lean();
      const existingAnnee = await Annee.findOne({
        tenantId: existingTenant?._id,
        status: "ACTIVE",
      }).select("_id").lean();
      const existingSalerUser = await User.findOne({ email: SALER_EMAIL }).select("_id").lean();
      const existingSaler = existingSalerUser
        ? await Saler.findOne({ userId: existingSalerUser._id }).select("_id").lean()
        : null;

      return NextResponse.json({
        ok: true,
        idempotent: true,
        tenantId: existingTenant?._id.toString() ?? null,
        storeId: existingStore?._id.toString() ?? null,
        anneeId: existingAnnee?._id.toString() ?? null,
        salerId: existingSaler?._id.toString() ?? null,
        salerUserId: existingSalerUser?._id.toString() ?? null,
        tenantUserId: existingUser._id.toString(),
      });
    }

    /* ── 1. Create TENANT user ── */
    const tenantMatricule = `TEN-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const tenantPass = process.env.CLAUDE_AGENT_TENANT_PASS;
    const salerPassEnv = process.env.CLAUDE_AGENT_SALER_PASS;
    if (!tenantPass || !salerPassEnv) {
      return NextResponse.json(
        { error: "CLAUDE_AGENT_TENANT_PASS and CLAUDE_AGENT_SALER_PASS env vars required" },
        { status: 500 }
      );
    }

    const tenantUser = await User.create({
      pseudo: "Claude Agent Tenant",
      telephone: "+00000000001",
      email: TENANT_EMAIL,
      secure: await hashPw(tenantPass),
      matricule: tenantMatricule,
      status: "ACTIVE",
    });

    /* ── 2. Create Tenant profile ── */
    const nRef = `REF-${randomBytes(5).toString("hex").toUpperCase()}`;
    const slug = slugify("Claude Agent Tenant");
    const tenant = await Tenant.create({
      userId: tenantUser._id,
      storesId: [],
      apiKey: `pk_${uuidv4().replaceAll("-", "")}`,
      apiSecret: `sk_${randomBytes(32).toString("hex")}`,
      slug,
      designation: "Claude Agent Tenant",
      description: [{ title: "Présentation", content: "Compte de test pour l'agent Claude ELMES-TEKA." }],
      status: "ACTIVE",
      type: "COMPANY",
      email: TENANT_EMAIL,
      telephone: "+00000000001",
      nRef,
    });

    /* ── 3. Create Store for tenant ── */
    const store = await Store.create({
      tenantId: tenant._id,
      designation: "Boutique Agent Claude",
      description: "Boutique de test pour l'agent Claude.",
      reference: STORE_REFERENCE,
      status: "ACTIVE",
      coordonnes: [],
      capitals: [],
      caisses: [],
      photos: [],
    });

    /* ── 4. Link store to tenant ── */
    await Tenant.updateOne({ _id: tenant._id }, { $push: { storesId: store._id } });

    /* ── 5. Create an active fiscal year (exercice) ── */
    const year = new Date().getFullYear();
    const annee = await Annee.create({
      tenantId: tenant._id,
      debut: new Date(`${year}-01-01`),
      fin: new Date(`${year}-12-31`),
      slug: String(year),
      status: "ACTIVE",
      provider: {
        name: "FLEXPAY",
        orderNumber: null,
        message: "Agent setup — compte de test",
        status: "PAID",
        amount: 0,
        currency: "USD",
        paidAt: new Date(),
      },
    });

    /* ── 6. Create SALER user ── */
    const salerMatricule = `SAL-${new Date().getFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const salerUser = await User.create({
      pseudo: "Claude Agent Saler",
      telephone: "+00000000002",
      email: SALER_EMAIL,
      secure: await hashPw(salerPassEnv),
      matricule: salerMatricule,
      status: "ACTIVE",
    });

    /* ── 7. Create Saler profile ── */
    const saler = await Saler.create({
      userId: salerUser._id,
      tenantId: tenant._id,
      storeId: store._id,
      status: "ACTIVE",
    });

    return NextResponse.json({
      ok: true,
      idempotent: false,
      tenantUserId: tenantUser._id.toString(),
      tenantId: tenant._id.toString(),
      storeId: store._id.toString(),
      anneeId: annee._id.toString(),
      salerUserId: salerUser._id.toString(),
      salerId: saler._id.toString(),
    });
  } catch (error) {
    console.error("AGENT_SETUP_ERROR", error);
    return NextResponse.json({ error: "Setup failed", detail: String(error) }, { status: 500 });
  }
}
