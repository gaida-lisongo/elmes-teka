import { redirect } from "next/navigation";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import { Types } from "mongoose";
import ClotureClient from "./ClotureClient";

// @ts-ignore – actions créées par Agent 2
import { getClosureData } from "@/actions/comptabilite.actions";

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
      const result = await getClosureData(anneeActive._id.toString());
      if (result.success && result.data) {
        const d = result.data;
        stats = {
          nbCommandesPending: d.commandesEnAttente,
          nbCreancesEnCours: d.creancesEnCours,
          nbDettesEnCours: d.dettesEnCours,
          stocksValides: 0,
        };
      }
    }
  } catch {
    /* sera résolu après merge Agent 2 si le modèle n'est pas encore chargé */
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
