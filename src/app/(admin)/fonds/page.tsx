import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Store from "@/lib/models/Store";
import FondsClient from "./FondsClient";

// @ts-ignore – actions créées par Agent 2
import { getFonds } from "@/actions/fonds.actions";

export default async function FondsPage() {
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

  let initialData = null;
  try {
    if (anneeActive) {
      const result = await getFonds(anneeId);
      if (result.success) initialData = result.data;
    }
  } catch {
    /* sera résolu après merge Agent 2 si le modèle n'est pas encore chargé */
  }

  return <FondsClient shopId={shopId} anneeId={anneeId} initialData={initialData} />;
}
