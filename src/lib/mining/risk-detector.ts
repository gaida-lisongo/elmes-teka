import { Types } from "mongoose";
import connectToDb from "@/lib/utils/db";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";
import Stock from "@/lib/models/Stock";
import Product from "@/lib/models/Product";
import Store from "@/lib/models/Store";

function olsSlope(y: number[]): number {
  const n = y.length;
  if (n < 2) return 0;
  const x = y.map((_, i) => i + 1);
  const sumX = x.reduce((s, v) => s + v, 0);
  const sumY = y.reduce((s, v) => s + v, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
  const denom = n * sumX2 - sumX * sumX;
  return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}

export interface RiskAlert {
  type: "RUPTURE" | "LIQUIDITE" | "CONCENTRATION" | "TENDANCE_BASSE";
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  affectedItems: string[];
}

export async function detectRisks(
  tenantId: string,
  anneeId: string,
): Promise<RiskAlert[]> {
  await connectToDb();
  const alerts: RiskAlert[] = [];
  const tid = new Types.ObjectId(tenantId);
  const aid = new Types.ObjectId(anneeId);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

  /* ── RUPTURE ──────────────────────────────────────────── */
  const recentSales = await Commande.aggregate([
    {
      $match: {
        tenantId: tid,
        anneeId: aid,
        status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
        createdAt: { $gte: sevenDaysAgo },
      },
    },
    { $unwind: "$commandes" },
    { $group: { _id: "$commandes.product", qty: { $sum: "$commandes.qte" } } },
  ]).exec() as { _id: Types.ObjectId; qty: number }[];

  const soldProductIds = recentSales.map((r) => r._id);

  // Isolation multi-tenant : récupérer uniquement les boutiques de ce tenant/exercice
  const stores = await Store.find({ tenantId: tid, anneeId: aid })
    .select("_id")
    .lean();
  const shopIds = stores.map((s) => s._id);

  const stocks = await Stock.find({
    shopId: { $in: shopIds },
    anneeId: aid,
    status: "ACTIVE",
    "stocks.product": { $in: soldProductIds },
  })
    .select("stocks")
    .lean();

  const stockMap = new Map<string, number>();
  for (const stockDoc of stocks) {
    for (const item of stockDoc.stocks) {
      const pid = item.product.toString();
      stockMap.set(pid, (stockMap.get(pid) ?? 0) + item.qte);
    }
  }

  // Récupérer les seuils critiques des produits vendus récemment
  const soldProducts = await Product.find({ _id: { $in: soldProductIds } })
    .select("designation seuilCritique")
    .lean();
  const productInfoMap = new Map(
    soldProducts.map((p) => [p._id.toString(), p]),
  );

  const rupturedIds = soldProductIds.filter(
    (pid) => (stockMap.get(pid.toString()) ?? 0) <= 0,
  );
  const nearCriticalIds = soldProductIds.filter((pid) => {
    const qty = stockMap.get(pid.toString()) ?? 0;
    const seuil = productInfoMap.get(pid.toString())?.seuilCritique ?? 0;
    return qty > 0 && seuil > 0 && qty < seuil;
  });

  if (rupturedIds.length > 0) {
    const names = rupturedIds
      .map((pid) => productInfoMap.get(pid.toString())?.designation ?? "Inconnu")
      .filter(Boolean);
    alerts.push({
      type: "RUPTURE",
      severity: "HIGH",
      message: `${rupturedIds.length} produit(s) en rupture de stock avec des ventes récentes.`,
      affectedItems: names,
    });
  }

  if (nearCriticalIds.length > 0) {
    const names = nearCriticalIds
      .map((pid) => productInfoMap.get(pid.toString())?.designation ?? "Inconnu")
      .filter(Boolean);
    alerts.push({
      type: "RUPTURE",
      severity: "MEDIUM",
      message: `${nearCriticalIds.length} produit(s) en dessous du seuil critique avec des ventes récentes.`,
      affectedItems: names,
    });
  }

  /* ── LIQUIDITE ────────────────────────────────────────── */
  const [caAgg, depAgg] = await Promise.all([
    Commande.aggregate([
      {
        $match: {
          tenantId: tid,
          anneeId: aid,
          status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
        },
      },
      { $group: { _id: null, ca: { $sum: "$totalAmount" } } },
    ]).exec(),
    Depense.aggregate([
      {
        $match: {
          tenantId: tid,
          anneeId: aid,
          status: { $in: ["APPROVED", "PAID"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]).exec(),
  ]);

  const ca = (caAgg[0] as { ca: number } | undefined)?.ca ?? 0;
  const totalDep = (depAgg[0] as { total: number } | undefined)?.total ?? 0;

  // Faux négatif corrigé : dépenses sans CA → alerte immédiate
  if (ca === 0 && totalDep > 0) {
    alerts.push({
      type: "LIQUIDITE",
      severity: "HIGH",
      message: `Dépenses de ${Math.round(totalDep).toLocaleString()} enregistrées sans chiffre d'affaires.`,
      affectedItems: [],
    });
  }

  const depRatio = ca > 0 ? totalDep / ca : 0;

  if (depRatio > 0.8) {
    alerts.push({
      type: "LIQUIDITE",
      severity: "HIGH",
      message: `Les dépenses représentent ${Math.round(depRatio * 100)}% du chiffre d'affaires.`,
      affectedItems: [],
    });
  } else if (depRatio > 0.6) {
    alerts.push({
      type: "LIQUIDITE",
      severity: "MEDIUM",
      message: `Les dépenses représentent ${Math.round(depRatio * 100)}% du chiffre d'affaires.`,
      affectedItems: [],
    });
  }

  /* ── CONCENTRATION ───────────────────────────────────── */
  const clientAgg = await Commande.aggregate([
    {
      $match: {
        tenantId: tid,
        anneeId: aid,
        status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
      },
    },
    { $group: { _id: "$clientId", ca: { $sum: "$totalAmount" } } },
    { $sort: { ca: -1 } },
    { $limit: 3 },
  ]).exec() as { _id: Types.ObjectId; ca: number }[];

  const top3CA = clientAgg.reduce((s, r) => s + r.ca, 0);
  const concRatio = ca > 0 ? top3CA / ca : 0;

  if (concRatio > 0.6 && ca > 0) {
    const { default: Customer } = await import("@/lib/models/Customer");
    const clients = await Customer.find({ _id: { $in: clientAgg.map((r) => r._id) } })
      .select("name")
      .lean();
    alerts.push({
      type: "CONCENTRATION",
      severity: "HIGH",
      message: `Les 3 premiers clients représentent ${Math.round(concRatio * 100)}% du CA.`,
      affectedItems: clients.map((c) => c.name),
    });
  } else if (concRatio > 0.4 && ca > 0) {
    alerts.push({
      type: "CONCENTRATION",
      severity: "MEDIUM",
      message: `Les 3 premiers clients représentent ${Math.round(concRatio * 100)}% du CA.`,
      affectedItems: [],
    });
  }

  /* ── TENDANCE_BASSE ──────────────────────────────────── */
  const weeklyAgg = await Commande.aggregate([
    {
      $match: {
        tenantId: tid,
        anneeId: aid,
        status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
        createdAt: { $gte: eightWeeksAgo },
      },
    },
    {
      $group: {
        _id: {
          $floor: {
            $divide: [
              { $subtract: ["$createdAt", eightWeeksAgo] },
              7 * 24 * 60 * 60 * 1000,
            ],
          },
        },
        ca: { $sum: "$totalAmount" },
      },
    },
  ]).exec() as { _id: number; ca: number }[];

  const weekSeries = Array<number>(8).fill(0);
  for (const { _id, ca: weekCA } of weeklyAgg) {
    const idx = Math.min(Math.max(Math.floor(_id), 0), 7);
    weekSeries[idx] = (weekSeries[idx] ?? 0) + weekCA;
  }

  const slope = olsSlope(weekSeries);
  const avgCA = weekSeries.reduce((s, v) => s + v, 0) / 8;
  const slopePct = avgCA > 0 ? slope / avgCA : 0;

  if (slopePct < -0.1) {
    alerts.push({
      type: "TENDANCE_BASSE",
      severity: "MEDIUM",
      message: `Le chiffre d'affaires hebdomadaire baisse de ${Math.round(Math.abs(slopePct) * 100)}% par semaine.`,
      affectedItems: [],
    });
  }

  return alerts;
}
