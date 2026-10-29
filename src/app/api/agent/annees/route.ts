import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getAgentSession } from "@/lib/agent/auth";
import connectToDb from "@/lib/utils/db";
import { Tenant } from "@/lib/models/User";
import Annee from "@/lib/models/Annee";

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

  const annees = await Annee.find({ tenantId }).select("-__v -provider").sort({ debut: -1 }).lean();
  return NextResponse.json({
    ok: true,
    data: annees.map((a) => ({
      id: a._id.toString(),
      slug: a.slug,
      debut: a.debut,
      fin: a.fin,
      status: a.status,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = getAgentSession(request);
  if (!session || session.accountType !== "TENANT" || !session.tenantId) {
    return NextResponse.json({ error: "TENANT session required" }, { status: 401 });
  }

  let body: { debut?: string; fin?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const debut = body.debut ? new Date(body.debut) : null;
  const fin = body.fin ? new Date(body.fin) : null;
  const slug = body.slug?.trim();

  if (!debut || !fin || !slug || isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    return NextResponse.json({ error: "debut, fin (ISO dates) and slug required" }, { status: 400 });
  }
  if (fin <= debut) {
    return NextResponse.json({ error: "fin must be after debut" }, { status: 400 });
  }

  await connectToDb();

  const tenantId = new Types.ObjectId(session.tenantId);
  const tenant = await Tenant.findById(tenantId).select("_id status").lean();
  if (!tenant || tenant.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tenant not active" }, { status: 403 });
  }

  const existing = await Annee.findOne({ tenantId, slug }).select("_id").lean();
  if (existing) {
    return NextResponse.json({ error: `Annee with slug '${slug}' already exists` }, { status: 409 });
  }

  const annee = await Annee.create({
    tenantId,
    debut,
    fin,
    slug,
    status: "ACTIVE",
    provider: {
      name: "FLEXPAY",
      orderNumber: null,
      message: "Created via agent API",
      status: "PAID",
      amount: 0,
      currency: "USD",
      paidAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: annee._id.toString(),
      slug: annee.slug,
      debut: annee.debut,
      fin: annee.fin,
      status: annee.status,
    },
  });
}
