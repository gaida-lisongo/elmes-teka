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

/* ── P-value computation (F-distribution) ───────────────── */
/*
 * Implémentation autonome sans dépendance externe.
 * Algorithmes : approximation de Lanczos pour logGamma,
 * fraction continue de Lentz pour la fonction bêta incomplète régularisée.
 * Précision ~1e-9 pour les paramètres typiques d'une ANOVA à faible N.
 */

function logGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const n = z - 1;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  let x = c[0]!;
  for (let i = 1; i <= 8; i++) x += c[i]! / (n + i);
  const t = n + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (n + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Fonction bêta incomplète régularisée I(x ; a, b) par la méthode de Lentz.
 * Retourne P(X ≤ x) pour X ~ Beta(a, b).
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (x > (a + 1) / (a + b + 2)) return 1 - incompleteBeta(1 - x, b, a);

  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta) / a;

  const EPS = 3e-10;
  const TINY = 1e-30;
  let f = 1.0;
  let C = f;
  let D = 1 - (a + b) * x / (a + 1);
  if (Math.abs(D) < TINY) D = TINY;
  D = 1 / D;
  f = D;

  for (let m = 1; m <= 300; m++) {
    // Étape paire
    let num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    D = 1 + num * D; if (Math.abs(D) < TINY) D = TINY;
    C = 1 + num / C; if (Math.abs(C) < TINY) C = TINY;
    D = 1 / D; f *= C * D;
    // Étape impaire
    num = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    D = 1 + num * D; if (Math.abs(D) < TINY) D = TINY;
    C = 1 + num / C; if (Math.abs(C) < TINY) C = TINY;
    D = 1 / D;
    const delta = C * D;
    f *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return front * f;
}

/**
 * Valeur p unilatérale supérieure : P(F_{df1,df2} ≥ fStat).
 * Utilisée pour l'ANOVA à un facteur (test du rapport de variances).
 */
function fPValue(fStat: number, df1: number, df2: number): number {
  if (fStat <= 0 || df1 <= 0 || df2 <= 0) return 1;
  return incompleteBeta(df2 / (df2 + df1 * fStat), df2 / 2, df1 / 2);
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
  /** Écart-type intra-segment (corrigé de Bessel, n-1). Requis pour le d de Cohen. */
  stdDevRevenue: number;
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
  dfBetween: number;
  dfWithin: number;
  /** P(F ≥ fStat) calculée par la fonction bêta incomplète (Lanczos + Lentz). */
  pValue: number;
  /** true si p < 0.05 (seuil conventionnel α = 5 %). */
  hasDifference: boolean;
  /**
   * Avertissement de circularité : la dimension M (monétaire) du segment RFM
   * est construite à partir de totalRevenue, qui est aussi la variable comparée ici.
   * Cette ANOVA est exploratoire ; elle ne constitue pas une preuve prédictive.
   * Pour une validation prospective, segmenter sur t0 et mesurer sur t1.
   */
  circularityNote: string;
} {
  const segMap = new Map<string, number[]>();
  for (const r of rfmData) {
    const arr = segMap.get(r.segment) ?? [];
    arr.push(r.totalRevenue);
    segMap.set(r.segment, arr);
  }

  const segments: SegmentStats[] = Array.from(segMap.entries()).map(([name, values]) => {
    const n = values.length;
    const avg = n > 0 ? values.reduce((s, v) => s + v, 0) / n : 0;
    // Écart-type corrigé de Bessel (n-1) — nécessaire pour le d de Cohen poolé
    const variance = n > 1 ? values.reduce((s, v) => s + (v - avg) ** 2, 0) / (n - 1) : 0;
    return {
      name,
      count: n,
      avgRevenue: Math.round(avg * 100) / 100,
      stdDevRevenue: Math.round(Math.sqrt(variance) * 100) / 100,
    };
  });

  const N = rfmData.length;
  const k = segments.length;

  const circularityNote =
    "ANOVA exploratoire — la variable monétaire (M) du segment RFM est construite " +
    "à partir de totalRevenue, qui est aussi la variable comparée. " +
    "Ne pas utiliser comme preuve prédictive sans séparation temporelle t0/t1.";

  if (k < 2 || N <= k) {
    return { segments, fStat: 0, dfBetween: 0, dfWithin: 0, pValue: 1, hasDifference: false, circularityNote };
  }

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

  const pValue = Math.round(fPValue(fStat, dfBetween, dfWithin) * 10000) / 10000;

  return {
    segments,
    fStat: Math.round(fStat * 100) / 100,
    dfBetween,
    dfWithin,
    pValue,
    hasDifference: pValue < 0.05,
    circularityNote,
  };
}

/* ── getTopSegmentPairs ──────────────────────────────────── */

/**
 * Comparaison paire-à-paire par le d de Cohen poolé.
 *
 * Formule correcte (Hedges 1981) :
 *   s_poolé = sqrt( ((n1-1)*s1² + (n2-1)*s2²) / (n1+n2-2) )
 *   d = (μ1 - μ2) / s_poolé
 *
 * Nécessite stdDevRevenue dans SegmentStats (écart-type intra-segment, corrigé de Bessel).
 */
export function getTopSegmentPairs(
  segments: SegmentStats[],
): { pair: [string, string]; cohenD: number; relative: string; detectable: boolean }[] {
  const pairs: { pair: [string, string]; cohenD: number; relative: string; detectable: boolean }[] = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const s1 = segments[i];
      const s2 = segments[j];
      if (!s1 || !s2) continue;

      const df = s1.count + s2.count - 2;
      const sPooled =
        df > 0 && (s1.count > 1 || s2.count > 1)
          ? Math.sqrt(
              ((s1.count - 1) * s1.stdDevRevenue ** 2 +
                (s2.count - 1) * s2.stdDevRevenue ** 2) /
                df,
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
