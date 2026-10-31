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

export async function POST() {
  // Un jeton d'agent ne peut jamais attribuer un abonnement payé gratuitement.
  return NextResponse.json({ error: "Créez votre exercice et payez le pack depuis /annees." }, { status: 403 });
}
