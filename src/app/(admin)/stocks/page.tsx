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
  seuilCritique: number;
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
    .select("_id designation price seuilCritique")
    .lean();

  // Le prix d'un article est une liste { montant, devise } : on valorise le stock en CDF
  // (prix CDF s'il existe, sinon prix USD converti au taux EXCHANGE).
  const exchange = Number(process.env.EXCHANGE) || 0;
  const unitPriceCdf = (prices?: Array<{ amount: number; currency: string }>) => {
    const cdf = prices?.find((price) => price.currency === "CDF");
    if (cdf) return cdf.amount;
    const usd = prices?.find((price) => price.currency === "USD");
    return usd ? Math.round(usd.amount * exchange) : 0;
  };

  const productMap = new Map(
    products.map((p) => [
      p._id.toString(),
      { designation: p.designation, price: unitPriceCdf(p.price), seuilCritique: p.seuilCritique ?? 0 },
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
        seuilCritique: prod.seuilCritique,
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
