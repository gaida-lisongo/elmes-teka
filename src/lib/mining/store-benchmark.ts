import { Types } from "mongoose";
import connectToDb from "@/lib/utils/db";
import Commande from "@/lib/models/Commande";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";

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

export interface StoreBenchmark {
  storeId: string;
  designation: string;
  caTotal: number;
  caMoyenJour: number;
  tendance: number;
  parCategory: { category: string; ca: number; share: number }[];
}

export async function benchmarkStores(
  tenantId: string,
  anneeId: string,
): Promise<StoreBenchmark[]> {
  await connectToDb();

  const annee = await Annee.findById(anneeId).select("debut fin").lean();
  const joursTotaux =
    annee
      ? Math.max(
          1,
          Math.ceil(
            (new Date(annee.fin).getTime() - new Date(annee.debut).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 365;

  const now = new Date();
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  // Totaux par boutique + catégorie produit
  const aggTotal = await Commande.aggregate([
    {
      $match: {
        tenantId: new Types.ObjectId(tenantId),
        anneeId: new Types.ObjectId(anneeId),
        status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
      },
    },
    { $unwind: "$commandes" },
    {
      $lookup: {
        from: "products",
        localField: "commandes.product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { shopId: "$shopId", category: { $ifNull: ["$productDoc.categorie", "Autre"] } },
        ca: { $sum: "$commandes.total" },
      },
    },
    {
      $group: {
        _id: "$_id.shopId",
        caTotal: { $sum: "$ca" },
        categories: { $push: { category: "$_id.category", ca: "$ca" } },
      },
    },
  ]).exec();

  // Série hebdo par boutique pour tendance OLS
  const aggWeekly = await Commande.aggregate([
    {
      $match: {
        tenantId: new Types.ObjectId(tenantId),
        anneeId: new Types.ObjectId(anneeId),
        status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
        createdAt: { $gte: eightWeeksAgo },
      },
    },
    {
      $group: {
        _id: {
          shopId: "$shopId",
          week: {
            $floor: {
              $divide: [
                { $subtract: ["$createdAt", eightWeeksAgo] },
                7 * 24 * 60 * 60 * 1000,
              ],
            },
          },
        },
        ca: { $sum: "$totalAmount" },
      },
    },
    { $group: { _id: "$_id.shopId", weeks: { $push: { week: "$_id.week", ca: "$ca" } } } },
  ]).exec();

  const weeklyMap = new Map<string, number[]>();
  for (const row of aggWeekly as { _id: Types.ObjectId; weeks: { week: number; ca: number }[] }[]) {
    const series = Array<number>(8).fill(0);
    for (const { week, ca } of row.weeks) {
      const idx = Math.min(Math.max(Math.floor(week), 0), 7);
      series[idx] = (series[idx] ?? 0) + ca;
    }
    weeklyMap.set(row._id.toString(), series);
  }

  const storeIds = aggTotal.map((r: { _id: Types.ObjectId }) => r._id);
  const stores = await Store.find({ _id: { $in: storeIds } })
    .select("_id designation")
    .lean();
  const storeMap = new Map(stores.map((s) => [s._id.toString(), s.designation]));

  return (aggTotal as { _id: Types.ObjectId; caTotal: number; categories: { category: string; ca: number }[] }[]).map((row) => {
    const sid = row._id.toString();
    const caTotal = Math.round(row.caTotal * 100) / 100;
    const caMoyenJour = Math.round((caTotal / joursTotaux) * 100) / 100;
    const series = weeklyMap.get(sid) ?? Array<number>(8).fill(0);
    const tendance = Math.round(olsSlope(series) * 100) / 100;

    const parCategory = row.categories
      .map(({ category, ca }) => ({
        category,
        ca: Math.round(ca * 100) / 100,
        share: caTotal > 0 ? Math.round((ca / caTotal) * 1000) / 1000 : 0,
      }))
      .sort((a, b) => b.ca - a.ca);

    return {
      storeId: sid,
      designation: storeMap.get(sid) ?? "Boutique inconnue",
      caTotal,
      caMoyenJour,
      tendance,
      parCategory,
    };
  });
}
