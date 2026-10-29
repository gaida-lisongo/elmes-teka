import { redirect } from "next/navigation";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import { Types } from "mongoose";
import ClotureClient from "./ClotureClient";

// @ts-ignore – actions créées par Agent 2
import { getClotureStats } from "@/actions/comptabilite.actions";

export default async function CloturePage() {
  let tenantId: string;
  try {
    const session = await requireTenantSession();
    tenantId = session.tenantId;
  } catch {
    redirect("/");
  }

  await connectToDb();

  const tenantOid = new Types.ObjectId(tenantId!);

  // Exercice actif
  const anneeActive = await Annee.findOne({
    tenantId: tenantOid,
    status: "ACTIVE",
  })
    .select("_id debut fin slug status")
    .sort({ debut: -1 })
    .lean();

  let stats = null;
  try {
    if (anneeActive) {
      const result = await getClotureStats(anneeActive._id.toString());
      if (result.success) stats = result.data;
    }
  } catch {
    /* actions pas encore disponibles – sera résolu après merge Agent 2 */
  }

  return (
    <ClotureClient
      anneeActive={
        anneeActive
          ? {
              id: anneeActive._id.toString(),
              slug: anneeActive.slug,
              debut: anneeActive.debut.toISOString(),
              fin: anneeActive.fin.toISOString(),
              status: anneeActive.status,
            }
          : null
      }
      stats={stats}
    />
  );
}
