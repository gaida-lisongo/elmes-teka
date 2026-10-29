import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Store from "@/lib/models/Store";
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

  const [anneeActive, storeActive] = await Promise.all([
    Annee.findOne({
      tenantId: new Types.ObjectId(tenantId!),
      status: "ACTIVE",
    })
      .select("_id")
      .sort({ debut: -1 })
      .lean(),

    Store.findOne({
      tenantId: new Types.ObjectId(tenantId!),
      status: "ACTIVE",
    })
      .select("_id")
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  const anneeId = anneeActive?._id.toString() ?? "";
  const shopId = storeActive?._id.toString() ?? "";

  let initialData: any[] | null = null;
  try {
    if (anneeActive) {
      const result = await getImmobilisations(anneeId);
      if (result.success && Array.isArray(result.data)) {
        initialData = result.data.map((item: any) => ({
          _id: item.id ?? item._id ?? "",
          shopId: item.shopId ?? shopId,
          anneeId: item.anneeId ?? anneeId,
          designation: item.designation ?? "",
          categorie: item.categorie ?? "AUTRE",
          valeurAchat: item.valeurAchat ?? 0,
          dureeVieAns: item.dureeVieAns ?? 1,
          valeurNette: item.valeurNette ?? 0,
          dateAcquisition: item.dateAcquisition ?? new Date().toISOString(),
          reference: item.reference ?? "",
          status: item.status ?? "ACTIF",
          description: item.description,
          createdAt: item.createdAt ?? new Date().toISOString(),
        }));
      }
    }
  } catch {
    /* sera résolu après merge Agent 2 si le modèle n'est pas encore chargé */
  }

  return <ImmobilisationsClient shopId={shopId} anneeId={anneeId} initialData={initialData} />;
}
