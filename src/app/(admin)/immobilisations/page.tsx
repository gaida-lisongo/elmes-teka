import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import ImmobilisationsClient from "./ImmobilisationsClient";

// @ts-ignore – actions créées par Agent 2
import { getImmobilisations } from "@/actions/immobilisations.actions";

export default async function ImmobilisationsPage() {
  let tenantId: string;
  try {
    const session = await requireTenantSession();
    tenantId = session.tenantId;
  } catch {
    redirect("/");
  }

  await connectToDb();

  const anneeActive = await Annee.findOne({
    tenantId: new Types.ObjectId(tenantId!),
    status: "ACTIVE",
  })
    .select("_id")
    .sort({ debut: -1 })
    .lean();

  let initialData = null;
  try {
    if (anneeActive) {
      const result = await getImmobilisations(anneeActive._id.toString());
      if (result.success) initialData = result.data;
    }
  } catch {
    /* sera résolu après merge Agent 2 si le modèle n'est pas encore chargé */
  }

  return <ImmobilisationsClient initialData={initialData} />;
}
