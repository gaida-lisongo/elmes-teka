import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Store from "@/lib/models/Store";
import JournalClient from "./JournalClient";

// @ts-ignore – actions créées par Agent 2
import { getJournalOperations } from "@/actions/comptabilite.actions";

const PAGE_SIZE = 50;

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  let tenantId: string;
  try {
    const session = await requireTenantSession();
    tenantId = session.tenantId;
  } catch {
    redirect("/");
  }

  const sp = await searchParams;
  const currentPage = Number(sp.page) || 1;
  const typeFilter = sp.type ?? "";

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
      const result = await getJournalOperations(anneeActive._id.toString());
      if (result.success) {
        let entries: typeof result.data = result.data;

        /* Résoudre les noms de boutiques depuis leurs ObjectId */
        const uniqueShopIds = [...new Set(entries.map((e: any) => e.shopId).filter(Boolean))];
        const stores = uniqueShopIds.length > 0
          ? await Store.find({
              _id: { $in: uniqueShopIds.map((id: string) => new Types.ObjectId(id)) },
            })
              .select("_id designation")
              .lean()
          : [];
        const storeNameMap: Record<string, string> = {};
        for (const s of stores) {
          storeNameMap[s._id.toString()] = s.designation;
        }

        if (typeFilter) {
          entries = entries.filter((e: { type: string }) => e.type === typeFilter);
        }
        const total = entries.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const start = (currentPage - 1) * PAGE_SIZE;
        const items = entries
          .slice(start, start + PAGE_SIZE)
          .map((e: any, i: number) => ({
            _id: `${e.reference}-${i}`,
            date: e.date,
            type: e.type,
            libelle: e.libelle,
            montant: e.montant,
            currency: e.currency,
            reference: e.reference,
            shopDesignation: storeNameMap[e.shopId] ?? e.shopId,
          }));
        initialData = { items, total, page: currentPage, totalPages };
      }
    }
  } catch {
    /* sera résolu après merge Agent 2 si le modèle n'est pas encore chargé */
  }

  return <JournalClient initialData={initialData} />;
}
