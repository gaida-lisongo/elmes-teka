import { Types } from "mongoose";
import connectToDb from "@/lib/utils/db";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

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

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export interface SolvabilityScore {
  score: number;
  components: {
    regularite: number;
    croissance: number;
    diversification: number;
    marge: number;
  };
  interpretation: string;
  disclaimer: string;
}

export async function computeSolvabilityScore(
  tenantId: string,
  anneeId: string,
): Promise<SolvabilityScore> {
  await connectToDb();
  const tid = new Types.ObjectId(tenantId);
  const aid = new Types.ObjectId(anneeId);
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

  /* ── Ventes hebdomadaires ─────────────────────────────── */
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
  for (const { _id, ca } of weeklyAgg) {
    const idx = Math.min(Math.max(Math.floor(_id), 0), 7);
    weekSeries[idx] = (weekSeries[idx] ?? 0) + ca;
  }

  const mu = weekSeries.reduce((s, v) => s + v, 0) / 8;
  const sigma = stdDev(weekSeries);
  const cv = mu > 0 ? sigma / mu : 1;
  const regularite = clamp(Math.round((1 - cv) * 100));

  const slope = olsSlope(weekSeries);
  const slopePct = mu > 0 ? (slope / mu) * 100 : 0;
  const croissance = clamp(Math.round(50 + slopePct * 5));

  /* ── CA + top client + dépenses sur la même fenêtre 8 semaines ── */
  // Horizons homogénéisés : toutes les composantes mesurent la même période
  const [caAgg, clientAgg, depAgg] = await Promise.all([
    Commande.aggregate([
      {
        $match: {
          tenantId: tid,
          anneeId: aid,
          status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
          createdAt: { $gte: eightWeeksAgo },
        },
      },
      { $group: { _id: null, ca: { $sum: "$totalAmount" } } },
    ]).exec(),
    Commande.aggregate([
      {
        $match: {
          tenantId: tid,
          anneeId: aid,
          status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
          createdAt: { $gte: eightWeeksAgo },
        },
      },
      { $group: { _id: "$clientId", ca: { $sum: "$totalAmount" } } },
      { $sort: { ca: -1 } },
      { $limit: 1 },
    ]).exec(),
    Depense.aggregate([
      {
        $match: {
          tenantId: tid,
          anneeId: aid,
          status: { $in: ["APPROVED", "PAID"] },
          createdAt: { $gte: eightWeeksAgo },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]).exec(),
  ]);

  const caTotal = (caAgg[0] as { ca: number } | undefined)?.ca ?? 0;
  const topClientCA = (clientAgg[0] as { ca: number } | undefined)?.ca ?? 0;
  const totalDep = (depAgg[0] as { total: number } | undefined)?.total ?? 0;

  const topClientShare = caTotal > 0 ? (topClientCA / caTotal) * 100 : 100;
  const diversification = clamp(Math.round(100 - topClientShare));

  // Marge réelle (peut être négative) — clampée à 0 uniquement pour le score
  // La valeur brute est disponible pour l'affichage
  const margeRatio = caTotal > 0 ? (caTotal - totalDep) / caTotal : 0;
  const marge = clamp(Math.round(Math.max(0, margeRatio) * 100));

  const score = Math.round((regularite * 0.25 + croissance * 0.25 + diversification * 0.25 + marge * 0.25));

  let interpretation: string;
  if (score >= 75) interpretation = "Profil solide — bonne régularité et diversification.";
  else if (score >= 50) interpretation = "Profil acceptable — quelques points à améliorer.";
  else if (score >= 25) interpretation = "Profil fragile — attention aux risques de liquidité.";
  else interpretation = "Profil à risque élevé — action corrective recommandée.";

  return {
    score,
    components: { regularite, croissance, diversification, marge },
    interpretation,
    disclaimer: "Score indicatif. Ne constitue pas une décision de crédit.",
  };
}
