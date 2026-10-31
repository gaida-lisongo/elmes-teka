import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Store from "@/lib/models/Store";
import LiquiditesClient from "./LiquiditesClient";

import { getLiquidites } from "@/actions/liquidites.actions";

export default async function LiquiditesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const shell = await getAdminShellAccount();
  if (!shell) redirect("/signin");

  const { slug } = await params;
  const tenantId = shell.account.tenantId!;

  await connectToDb();

  const annee = await Annee.findOne({
    tenantId: new Types.ObjectId(tenantId),
    slug,
  })
    .select("_id slug")
    .lean();

  if (!annee) redirect("/");

  const anneeId = annee._id.toString();

  let shopId: string;
  let storeDesignation: string | undefined;

  if (shell.account.type === "SALER" && shell.account.storeId) {
    shopId = shell.account.storeId;
    storeDesignation = shell.account.storeDesignation ?? undefined;
  } else {
    const store = await Store.findOne({
      tenantId: new Types.ObjectId(tenantId),
      status: "ACTIVE",
    })
      .select("_id designation")
      .sort({ createdAt: 1 })
      .lean();
    if (!store) redirect("/");
    shopId = store._id.toString();
    storeDesignation = store.designation;
  }

  let initialData: any = null;
  try {
    const result = await getLiquidites(anneeId, shopId);
    if (result.success) {
      initialData = {
        items: (result.data ?? []).map((item: any) => ({
          _id: item.id,
          shopId: item.shopId,
          anneeId: item.anneeId,
          agentId: "",
          libelle: item.libelle,
          montant: item.montant,
          currency: item.currency,
          type: item.type,
          reference: item.reference,
          dateOperation: item.dateOperation,
          status: item.status,
          description: item.description ?? "",
          createdAt: item.createdAt,
        })),
        anneeLabel: slug,
        storeDesignation,
      };
    }
  } catch {
    /* actions pas encore disponibles – sera résolu après merge Agent 2 */
  }

  return (
    <LiquiditesClient
      shopId={shopId}
      anneeId={anneeId}
      initialData={initialData}
      role={shell.account.type}
    />
  );
}
