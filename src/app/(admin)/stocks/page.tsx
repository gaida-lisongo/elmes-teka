import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Stock from "@/lib/models/Stock";
import Product from "@/lib/models/Product";
import Store from "@/lib/models/Store";
import StocksOverviewClient from "./StocksOverviewClient";

interface StockRow {
  storeId: string;
  storeDesignation: string;
  productId: string;
  productDesignation: string;
  qte: number;
  prixUnitaire: number;
  valeurTotale: number;
}

export default async function StocksOverviewPage() {
  let tenantId: string;
  try {
    const session = await requireTenantSession();
    tenantId = session.tenantId;
  } catch {
    redirect("/");
  }

  await connectToDb();

  const tenantOid = new Types.ObjectId(tenantId!);

  // Exercice actif du tenant
  const anneeActive = await Annee.findOne({
    tenantId: tenantOid,
    status: "ACTIVE",
  })
    .select("_id debut fin slug")
    .sort({ debut: -1 })
    .lean();

  if (!anneeActive) {
    return (
      <StocksOverviewClient
        anneeLabel={null}
        rows={[]}
        totalValeur={0}
      />
    );
  }

  // Boutiques du tenant
  const stores = await Store.find({ tenantId: tenantOid, status: { $in: ["ACTIVE", "PENDING_PAYMENT"] } })
    .select("_id designation")
    .lean();

  const storeMap = new Map(stores.map((s) => [s._id.toString(), s.designation]));

  // Stocks actifs pour cet exercice
  const stocks = await Stock.find({
    anneeId: anneeActive._id,
    shopId: { $in: stores.map((s) => s._id) },
    status: "ACTIVE",
  })
    .select("shopId stocks")
    .lean();

  // Récupère tous les productIds référencés
  const productIds = [
    ...new Set(
      stocks.flatMap((s) => s.stocks.map((item) => item.product.toString()))
    ),
  ];

  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id designation price")
    .lean();

  const productMap = new Map(
    products.map((p) => [
      p._id.toString(),
      { designation: p.designation, price: (p as any).price ?? 0 },
    ])
  );

  const rows: StockRow[] = [];

  for (const stock of stocks) {
    const storeDesignation = storeMap.get(stock.shopId.toString()) ?? "—";
    for (const item of stock.stocks) {
      const pid = item.product.toString();
      const prod = productMap.get(pid);
      if (!prod) continue;
      rows.push({
        storeId: stock.shopId.toString(),
        storeDesignation,
        productId: pid,
        productDesignation: prod.designation,
        qte: item.qte,
        prixUnitaire: prod.price,
        valeurTotale: item.qte * prod.price,
      });
    }
  }

  rows.sort((a, b) =>
    a.storeDesignation.localeCompare(b.storeDesignation) ||
    a.productDesignation.localeCompare(b.productDesignation)
  );

  const totalValeur = rows.reduce((sum, r) => sum + r.valeurTotale, 0);

  const anneeLabel = `${new Date(anneeActive.debut).getFullYear()} - ${new Date(anneeActive.fin).getFullYear()}`;

  return (
    <StocksOverviewClient
      anneeLabel={anneeLabel}
      rows={rows}
      totalValeur={totalValeur}
    />
  );
}
