import { createStoreWithinPlan } from "@/lib/payments/store-access";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { getAgentSession } from "@/lib/agent/auth";
import connectToDb from "@/lib/utils/db";
import { Tenant } from "@/lib/models/User";
import Store from "@/lib/models/Store";

export async function GET(request: NextRequest) {
  const session = getAgentSession(request);
  if (!session || session.accountType !== "TENANT" || !session.tenantId) {
    return NextResponse.json({ error: "TENANT session required" }, { status: 401 });
  }

  await connectToDb();

  const tenantId = new Types.ObjectId(session.tenantId);
  const tenant = await Tenant.findById(tenantId).select("_id status").lean();
  if (!tenant || tenant.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tenant not active" }, { status: 403 });
  }

  const stores = await Store.find({ tenantId }).select("-__v").lean();
  return NextResponse.json({
    ok: true,
    data: stores.map((s) => ({
      id: s._id.toString(),
      designation: s.designation,
      description: s.description,
      reference: s.reference,
      status: s.status,
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = getAgentSession(request);
  if (!session || session.accountType !== "TENANT" || !session.tenantId) {
    return NextResponse.json({ error: "TENANT session required" }, { status: 401 });
  }

  let body: { designation?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const designation = body.designation?.trim();
  if (!designation) {
    return NextResponse.json({ error: "designation required" }, { status: 400 });
  }

  await connectToDb();

  const tenantId = new Types.ObjectId(session.tenantId);
  const tenant = await Tenant.findById(tenantId).select("_id status").lean();
  if (!tenant || tenant.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tenant not active" }, { status: 403 });
  }

  const reference = `STR-${randomBytes(5).toString("hex").toUpperCase()}`;
  let store;
  try {
    store = await createStoreWithinPlan(session.tenantId, { designation, description: body.description ?? designation, reference });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Création refusée." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: store._id.toString(),
      designation: store.designation,
      reference: store.reference,
      status: store.status,
    },
  });
}
