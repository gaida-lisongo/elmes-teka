import { Types } from "mongoose";
import connectToDb from "@/lib/utils/db";
import Commande from "@/lib/models/Commande";
import Customer from "@/lib/models/Customer";

/* ── Tercile helper ──────────────────────────────────────── */

function tercile(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const t1 = sorted[Math.floor(n / 3)] ?? 0;
  const t2 = sorted[Math.floor((2 * n) / 3)] ?? 0;
  return [t1, t2];
}

function scoreAsc(value: number, t1: number, t2: number): 1 | 2 | 3 {
  if (value <= t1) return 1;
  if (value <= t2) return 2;
  return 3;
}

function scoreDesc(value: number, t1: number, t2: number): 1 | 2 | 3 {
  if (value >= t2) return 1;
  if (value >= t1) return 2;
  return 3;
}

/* ── Types ───────────────────────────────────────────────── */

export interface RFMEntry {
  clientId: string;
  name: string;
  scoreR: 1 | 2 | 3;
  scoreF: 1 | 2 | 3;
  scoreM: 1 | 2 | 3;
  segment: string;
  totalRevenue: number;
  orderCount: number;
  lastOrderDate: string;
}

export interface SegmentStats {
  name: string;
  count: number;
  avgRevenue: number;
}

/* ── computeRFM ──────────────────────────────────────────── */

export async function computeRFM(
  tenantId: string,
  anneeId: string,
): Promise<RFMEntry[]> {
  await connectToDb();
  const now = new Date();

  const agg = await Commande.aggregate([
    {
      $match: {
        tenantId: new Types.ObjectId(tenantId),
        anneeId: new Types.ObjectId(anneeId),
        status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] },
      },
    },
    {
      $group: {
        _id: "$clientId",
        totalRevenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
        lastOrderDate: { $max: "$createdAt" },
      },
    },
  ]).exec();

  if (!agg.length) return [];

  const clientIds = agg.map((r: { _id: Types.ObjectId }) => r._id);
  const customers = await Customer.find({ _id: { $in: clientIds } })
    .select("_id name")
    .lean();
  const customerMap = new Map(customers.map((c) => [c._id.toString(), c.name]));

  const recencies = agg.map((r: { lastOrderDate: Date }) =>
    Math.floor((now.getTime() - new Date(r.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)),
  );
  const frequencies = agg.map((r: { orderCount: number }) => r.orderCount);
  const monetaries = agg.map((r: { totalRevenue: number }) => r.totalRevenue);

  const [rT1, rT2] = tercile(recencies);
  const [fT1, fT2] = tercile(frequencies);
  const [mT1, mT2] = tercile(monetaries);

  return agg.map((r: { _id: Types.ObjectId; totalRevenue: number; orderCount: number; lastOrderDate: Date }, i: number) => {
    const scoreR = scoreDesc(recencies[i], rT1, rT2);
    const scoreF = scoreAsc(frequencies[i], fT1, fT2);
    const scoreM = scoreAsc(monetaries[i], mT1, mT2);

    let segment: string;
    const rfmKey = `${scoreR}${scoreF}${scoreM}`;
    if (rfmKey === "333") segment = "Champions";
    else if (scoreR + scoreF >= 5) segment = "Loyaux";
    else if (scoreR === 1) segment = "À risque";
    else if (scoreM === 1) segment = "Petits acheteurs";
    else segment = "Potentiels";

    return {
      clientId: r._id.toString(),
      name: customerMap.get(r._id.toString()) ?? "Client inconnu",
      scoreR,
      scoreF,
      scoreM,
      segment,
      totalRevenue: Math.round(r.totalRevenue * 100) / 100,
      orderCount: r.orderCount,
      lastOrderDate: new Date(r.lastOrderDate).toISOString(),
    };
  });
}

/* ── compareSegments ─────────────────────────────────────── */

export function compareSegments(rfmData: RFMEntry[]): {
  segments: SegmentStats[];
  fStat: number;
  hasDifference: boolean;
} {
  const segMap = new Map<string, number[]>();
  for (const r of rfmData) {
    const arr = segMap.get(r.segment) ?? [];
    arr.push(r.totalRevenue);
    segMap.set(r.segment, arr);
  }

  const segments: SegmentStats[] = Array.from(segMap.entries()).map(([name, values]) => ({
    name,
    count: values.length,
    avgRevenue:
      values.length > 0
        ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100
        : 0,
  }));

  const N = rfmData.length;
  const k = segments.length;
  if (k < 2 || N <= k) return { segments, fStat: 0, hasDifference: false };

  const grandMean = rfmData.reduce((s, r) => s + r.totalRevenue, 0) / N;
  const ssBetween = segments.reduce(
    (s, seg) => s + seg.count * (seg.avgRevenue - grandMean) ** 2,
    0,
  );
  let ssWithin = 0;
  for (const [name, values] of segMap.entries()) {
    const seg = segments.find((s) => s.name === name);
    if (!seg) continue;
    for (const v of values) ssWithin += (v - seg.avgRevenue) ** 2;
  }

  const dfBetween = k - 1;
  const dfWithin = N - k;
  const fStat =
    dfWithin <= 0 || ssWithin === 0 ? 0 : ssBetween / dfBetween / (ssWithin / dfWithin);

  return {
    segments,
    fStat: Math.round(fStat * 100) / 100,
    hasDifference: fStat > 2.5,
  };
}

/* ── getTopSegmentPairs ──────────────────────────────────── */

export function getTopSegmentPairs(
  segments: SegmentStats[],
): { pair: [string, string]; cohenD: number; relative: string; detectable: boolean }[] {
  const pairs: { pair: [string, string]; cohenD: number; relative: string; detectable: boolean }[] = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const s1 = segments[i];
      const s2 = segments[j];
      if (!s1 || !s2) continue;
      const sPooled =
        s1.count > 0 && s2.count > 0
          ? Math.sqrt(
              (s1.avgRevenue ** 2 * (s1.count - 1) + s2.avgRevenue ** 2 * (s2.count - 1)) /
                (s1.count + s2.count - 2),
            )
          : 0;
      const cohenD = sPooled === 0 ? 0 : (s1.avgRevenue - s2.avgRevenue) / sPooled;
      const base = Math.max(s1.avgRevenue, s2.avgRevenue, 1);
      const relPct = Math.round((Math.abs(s1.avgRevenue - s2.avgRevenue) / base) * 100);
      pairs.push({
        pair: [s1.name, s2.name],
        cohenD: Math.round(cohenD * 100) / 100,
        relative: `${relPct}%`,
        detectable: Math.abs(cohenD) > 0.5,
      });
    }
  }
  return pairs.sort((a, b) => Math.abs(b.cohenD) - Math.abs(a.cohenD)).slice(0, 5);
}
