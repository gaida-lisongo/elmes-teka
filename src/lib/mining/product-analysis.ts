import { Types } from "mongoose";
import connectToDb from "@/lib/utils/db";
import Commande from "@/lib/models/Commande";
import Product from "@/lib/models/Product";

/* ── OLS helpers ──────────────────────────────────────────── */

function olsSlope(y: number[]): { a: number; b: number; r2: number; rmse: number } {
  const n = y.length;
  if (n < 2) return { a: y[0] ?? 0, b: 0, r2: 0, rmse: 0 };
  const x = y.map((_, i) => i + 1);
  const sumX = x.reduce((s, v) => s + v, 0);
  const sumY = y.reduce((s, v) => s + v, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
  const denom = n * sumX2 - sumX * sumX;
  const b = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  const yHat = x.map((xi) => a + b * xi);
  const yBar = sumY / n;
  const ssRes = y.reduce((s, yi, i) => s + (yi - yHat[i]) ** 2, 0);
  const ssTot = y.reduce((s, yi) => s + (yi - yBar) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / n);
  return { a, b, r2, rmse };
}

function weightedMA(y: number[]): number {
  const weights = [4, 4, 3, 3, 2, 2, 1, 1];
  const n = Math.min(y.length, 8);
  const slice = y.slice(-n);
  let wSum = 0;
  let total = 0;
  for (let i = 0; i < slice.length; i++) {
    const w = weights[8 - n + i];
    total += slice[i] * w;
    wSum += w;
  }
  return wSum === 0 ? 0 : total / wSum;
}

export function forecastNextWeek(series: number[]): {
  forecast: number;
  rmse: number;
  r2: number;
  low: number;
  high: number;
} {
  if (series.length === 0) return { forecast: 0, rmse: 0, r2: 0, low: 0, high: 0 };
  const { a, b, r2, rmse } = olsSlope(series);
  const n = series.length;
  let forecast: number;
  if (r2 >= 0.3) {
    forecast = a + b * (n + 1);
  } else {
    forecast = weightedMA(series);
  }
  forecast = Math.max(0, forecast);
  const interval = 1.5 * rmse;
  return {
    forecast: Math.round(forecast * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    r2: Math.round(r2 * 1000) / 1000,
    low: Math.max(0, Math.round((forecast - interval) * 100) / 100),
    high: Math.round((forecast + interval) * 100) / 100,
  };
}

/* ── getProductVelocity ───────────────────────────────────── */

interface ProductVelocity {
  productId: string;
  name: string;
  weeklySeries: number[];
}

export async function getProductVelocity(
  tenantId: string,
  anneeId: string,
  shopId?: string,
): Promise<ProductVelocity[]> {
  await connectToDb();

  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const match: Record<string, unknown> = {
    tenantId: new Types.ObjectId(tenantId),
    anneeId: new Types.ObjectId(anneeId),
    status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
    createdAt: { $gte: eightWeeksAgo },
  };
  if (shopId) match.shopId = new Types.ObjectId(shopId);

  const pipeline = [
    { $match: match },
    { $unwind: "$commandes" },
    {
      $group: {
        _id: {
          product: "$commandes.product",
          week: {
            $floor: {
              $divide: [
                { $subtract: ["$createdAt", eightWeeksAgo] },
                7 * 24 * 60 * 60 * 1000,
              ],
            },
          },
        },
        ca: { $sum: "$commandes.total" },
      },
    },
    {
      $group: {
        _id: "$_id.product",
        weeks: { $push: { week: "$_id.week", ca: "$ca" } },
      },
    },
  ];

  const rows = await Commande.aggregate(pipeline).exec();
  const productIds = rows.map((r) => r._id);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id designation")
    .lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p.designation]));

  return rows.map((row) => {
    const series = Array<number>(8).fill(0);
    for (const { week, ca } of row.weeks as { week: number; ca: number }[]) {
      const idx = Math.min(Math.max(Math.floor(week), 0), 7);
      series[idx] = (series[idx] ?? 0) + ca;
    }
    return {
      productId: row._id.toString(),
      name: productMap.get(row._id.toString()) ?? "Produit inconnu",
      weeklySeries: series,
    };
  });
}

/* ── getBCGMatrix ─────────────────────────────────────────── */

interface BCGEntry {
  productId: string;
  name: string;
  quadrant: "STAR" | "CASH_COW" | "DOG" | "QUESTION";
  growthRate: number;
  marketShare: number;
}

export async function getBCGMatrix(
  tenantId: string,
  anneeId: string,
): Promise<BCGEntry[]> {
  await connectToDb();

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const agg = await Commande.aggregate([
    {
      $match: {
        tenantId: new Types.ObjectId(tenantId),
        anneeId: new Types.ObjectId(anneeId),
        status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
      },
    },
    { $unwind: "$commandes" },
    {
      $group: {
        _id: "$commandes.product",
        caTotal: { $sum: "$commandes.total" },
        caCurrent: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", startOfCurrentMonth] }, "$commandes.total", 0],
          },
        },
        caPrev: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$createdAt", startOfPrevMonth] },
                  { $lt: ["$createdAt", startOfCurrentMonth] },
                ],
              },
              "$commandes.total",
              0,
            ],
          },
        },
      },
    },
  ]).exec();

  if (!agg.length) return [];

  const totalCA = agg.reduce((s: number, r: { caTotal: number }) => s + r.caTotal, 0);
  const productIds = agg.map((r: { _id: Types.ObjectId }) => r._id);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id designation")
    .lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p.designation]));

  const entries = agg.map((r: { _id: Types.ObjectId; caTotal: number; caCurrent: number; caPrev: number }) => {
    const growthRate =
      r.caPrev > 0 ? (r.caCurrent - r.caPrev) / r.caPrev : r.caCurrent > 0 ? 1 : 0;
    const marketShare = totalCA > 0 ? r.caTotal / totalCA : 0;
    return { productId: r._id.toString(), name: productMap.get(r._id.toString()) ?? "Inconnu", growthRate, marketShare, caTotal: r.caTotal };
  });

  const shares = entries.map((e: { marketShare: number }) => e.marketShare).sort((a: number, b: number) => a - b);
  const medianShare = shares[Math.floor(shares.length / 2)] ?? 0;

  return entries.map((e: { productId: string; name: string; growthRate: number; marketShare: number }) => {
    let quadrant: BCGEntry["quadrant"];
    if (e.growthRate > 0 && e.marketShare > medianShare) quadrant = "STAR";
    else if (e.growthRate <= 0 && e.marketShare > medianShare) quadrant = "CASH_COW";
    else if (e.growthRate > 0 && e.marketShare <= medianShare) quadrant = "QUESTION";
    else quadrant = "DOG";
    return {
      productId: e.productId,
      name: e.name,
      quadrant,
      growthRate: Math.round(e.growthRate * 1000) / 1000,
      marketShare: Math.round(e.marketShare * 1000) / 1000,
    };
  });
}
