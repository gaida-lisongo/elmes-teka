import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import { Tenant } from "@/lib/models/User";
import { listConversations } from "@/lib/ai/conversations";
import AdvisorClient from "./AdvisorClient";

export const metadata: Metadata = {
  title: "Conseiller IA | ELMES-TEKA",
  description: "Assistant IA pour entrepreneurs congolais",
};

export default async function AdvisorPage() {
  const session = await getTenantSession();
  if (!session) redirect("/signin");

  await connectToDb();

  // Résoudre l'exercice actif Premium
  const tenantDoc = await Tenant.findById(session.tenantId)
    .select("activeAnneeId")
    .lean();

  let activeAnnee = null;

  if (tenantDoc?.activeAnneeId) {
    activeAnnee = await Annee.findOne({
      _id: tenantDoc.activeAnneeId,
      tenantId: session.tenantId,
      plan: "PREMIUM",
      status: "ACTIVE",
    })
      .select("_id debut fin aiCredits")
      .lean();
  }

  if (!activeAnnee) {
    // Fallback : dernier exercice ACTIVE+PAID Premium
    activeAnnee = await Annee.findOne({
      tenantId: session.tenantId,
      plan: "PREMIUM",
      status: "ACTIVE",
      "provider.status": "PAID",
    })
      .select("_id debut fin aiCredits")
      .sort({ fin: -1 })
      .lean();
  }

  if (!activeAnnee) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Fonctionnalité Premium
          </h2>
          <p className="mt-2 text-gray-500">
            Le Conseiller IA est disponible avec le pack Premium. Activez un exercice Premium pour y accéder.
          </p>
        </div>
      </div>
    );
  }

  const credits = activeAnnee.aiCredits ?? { total: 0, used: 0 };
  const conversations = await listConversations(session.tenantId, activeAnnee._id.toString());

  return (
    <AdvisorClient
      anneeId={activeAnnee._id.toString()}
      creditsTotal={credits.total}
      creditsUsed={credits.used}
      initialConversations={conversations}
    />
  );
}
