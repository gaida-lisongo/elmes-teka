/**
 * POST /api/admin/activate-premium
 *
 * Active le plan PREMIUM + 100 crédits IA sur tous les exercices ACTIVE
 * du tenant connecté. Réservé au compte administrateur.
 */
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import connectToDb from "@/lib/utils/db";
import { Tenant, User } from "@/lib/models/User";
import Annee from "@/lib/models/Annee";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "inbtpkinshasa@gmail.com";

export async function POST() {
  const session = await getSession();
  if (!session || session.accountType !== "TENANT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  await connectToDb();

  const user = await User.findById(session.userId).select("email").lean();
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Accès réservé à l'administrateur" }, { status: 403 });
  }

  const tenant = await Tenant.findById(session.tenantId).select("_id").lean();
  if (!tenant) {
    return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
  }

  // Upgrade tous les exercices ACTIVE → PREMIUM + 100 crédits
  const result = await Annee.updateMany(
    { tenantId: tenant._id, status: "ACTIVE" },
    {
      $set: {
        plan: "PREMIUM",
        "aiCredits.total": 100,
        "aiCredits.used": 0,
        "aiCredits.lastResetAt": new Date(),
      },
    },
  );

  // Mettre à jour le plan préféré du tenant
  await Tenant.updateOne({ _id: tenant._id }, { $set: { preferredPlan: "PREMIUM" } });

  return NextResponse.json({
    ok: true,
    modifiedAnnees: result.modifiedCount,
    message: `${result.modifiedCount} exercice(s) passé(s) en PREMIUM avec 100 crédits IA.`,
  });
}
