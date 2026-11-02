import { Types } from "mongoose";
import connectToDb from "@/lib/utils/db";
import Commande from "@/lib/models/Commande";
import Customer from "@/lib/models/Customer";

/* ═══════════════════════════════════════════════════════════════════
   BLOC 1 — Helpers RFM
   ═══════════════════════════════════════════════════════════════════ */

function tercile(values: number[]): [number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return [sorted[Math.floor(n / 3)] ?? 0, sorted[Math.floor((2 * n) / 3)] ?? 0];
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

/* ═══════════════════════════════════════════════════════════════════
   BLOC 2 — Fonctions mathématiques spéciales
   Sources : Abramowitz & Stegun (1964), Press et al. (2007),
             Lanczos (1964), Lentz (1976), Royston (1992).
   ═══════════════════════════════════════════════════════════════════ */

/** Log-gamma via approximation de Lanczos (g=7, précision ~15 chiffres). */
function logGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const n = z - 1;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0]!;
  for (let i = 1; i <= 8; i++) x += c[i]! / (n + i);
  const t = n + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (n + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Fonction bêta incomplète régularisée I(x ; a, b) par la méthode de Lentz.
 * Donne P(X ≤ x) pour X ~ Beta(a, b).
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (x > (a + 1) / (a + b + 2)) return 1 - incompleteBeta(1 - x, b, a);
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta) / a;
  const EPS = 3e-10, TINY = 1e-30;
  let f = 1.0, C = f;
  let D = 1 - (a + b) * x / (a + 1);
  if (Math.abs(D) < TINY) D = TINY;
  D = 1 / D; f = D;
  for (let m = 1; m <= 300; m++) {
    let num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    D = 1 + num * D; if (Math.abs(D) < TINY) D = TINY;
    C = 1 + num / C; if (Math.abs(C) < TINY) C = TINY;
    D = 1 / D; f *= C * D;
    num = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    D = 1 + num * D; if (Math.abs(D) < TINY) D = TINY;
    C = 1 + num / C; if (Math.abs(C) < TINY) C = TINY;
    D = 1 / D;
    const delta = C * D; f *= delta;
    if (Math.abs(delta - 1) < EPS) break;
  }
  return front * f;
}

/** Série pour la fonction gamma incomplète inférieure régularisée P(a, x). */
function gammaLowerSeries(a: number, x: number): number {
  const lnP = a * Math.log(x) - x - logGamma(a + 1);
  let sum = 1, term = 1;
  for (let n = 1; n <= 300; n++) {
    term *= x / (a + n); sum += term;
    if (Math.abs(term) < Math.abs(sum) * 3e-14) break;
  }
  return Math.exp(lnP) * sum;
}

/** Fraction continue pour la fonction gamma incomplète supérieure régularisée Q(a, x). */
function gammaUpperCF(a: number, x: number): number {
  const lnP = a * Math.log(x) - x - logGamma(a);
  const TINY = 1e-30, EPS = 1e-10;
  let b = x + 1 - a, c = 1 / TINY;
  let d = 1 / b; let f = d;
  for (let i = 1; i <= 300; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c; f *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(lnP) * f;
}

/** Q(a, x) = gamma incomplète supérieure régularisée. */
function gammaUpperReg(a: number, x: number): number {
  if (x <= 0) return 1;
  if (a <= 0) return NaN;
  return x < a + 1 ? 1 - gammaLowerSeries(a, x) : gammaUpperCF(a, x);
}

/** p-value unilatérale supérieure pour F(df1, df2). */
function fPValue(F: number, df1: number, df2: number): number {
  if (F <= 0 || df1 <= 0 || df2 <= 0) return 1;
  return incompleteBeta(df2 / (df2 + df1 * F), df2 / 2, df1 / 2);
}

/** p-value unilatérale supérieure pour χ²(df). */
function chiSquaredPValue(chi2: number, df: number): number {
  if (chi2 <= 0 || df <= 0) return 1;
  return gammaUpperReg(df / 2, chi2 / 2);
}

/** p-value bilatérale pour t(df). */
function tDistPValue(t: number, df: number): number {
  if (df <= 0) return 1;
  return incompleteBeta(df / (df + t * t), df / 2, 0.5);
}

/**
 * P(Z > z) pour une loi normale standard.
 * Approximation A&S 26.2.17, erreur maximale ~7.5e-8.
 */
function normalSurvival(z: number): number {
  if (z < 0) return 1 - normalSurvival(-z);
  const t = 1 / (1 + 0.2316419 * z);
  const p =
    (0.319381530 * t - 0.356563782 * t ** 2 + 1.781477937 * t ** 3 -
      1.821255978 * t ** 4 + 1.330274429 * t ** 5) *
    Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  return Math.max(0, Math.min(1, p));
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1]! + s[m]!) / 2 : s[m]!;
}

/* ═══════════════════════════════════════════════════════════════════
   BLOC 3 — Tests statistiques
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Test de normalité de Jarque-Bera.
 * H0 : la distribution est normale.
 * Stat = n/6 * (γ1² + γ2²/4) ~ χ²(2) asymptotiquement.
 * Fiable uniquement pour n ≥ 20 (valeur indicative pour n < 20).
 */
function jarqueBera(values: number[]): { statistic: number; pValue: number; reliable: boolean } {
  const n = values.length;
  if (n < 8) return { statistic: 0, pValue: 1, reliable: false };
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const m2 = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const m3 = values.reduce((s, v) => s + (v - mean) ** 3, 0) / n;
  const m4 = values.reduce((s, v) => s + (v - mean) ** 4, 0) / n;
  const skew = m2 > 0 ? m3 / m2 ** 1.5 : 0;
  const exKurt = m2 > 0 ? m4 / m2 ** 2 - 3 : 0;
  const jb = (n / 6) * (skew ** 2 + exKurt ** 2 / 4);
  return { statistic: jb, pValue: chiSquaredPValue(jb, 2), reliable: n >= 20 };
}

/**
 * Test de Levene-Brown-Forsythe (variante médiane).
 * H0 : homogénéité des variances entre les groupes.
 * Plus robuste que Bartlett aux écarts à la normalité.
 */
function leveneTest(
  groups: number[][],
): { statistic: number; df1: number; df2: number; pValue: number } {
  const k = groups.length;
  const N = groups.reduce((s, g) => s + g.length, 0);
  const zGroups = groups.map((g) => {
    const med = median(g);
    return g.map((v) => Math.abs(v - med));
  });
  const zAll = zGroups.flat();
  const zGrandMean = zAll.reduce((s, v) => s + v, 0) / N;
  const ssBetween = zGroups.reduce((s, zg) => {
    const zm = zg.reduce((a, v) => a + v, 0) / zg.length;
    return s + zg.length * (zm - zGrandMean) ** 2;
  }, 0);
  let ssWithin = 0;
  for (const zg of zGroups) {
    const zm = zg.reduce((a, v) => a + v, 0) / zg.length;
    for (const z of zg) ssWithin += (z - zm) ** 2;
  }
  const df1 = k - 1, df2 = N - k;
  const W = df2 > 0 && ssWithin > 0 ? (ssBetween / df1) / (ssWithin / df2) : 0;
  return { statistic: Math.round(W * 100) / 100, df1, df2, pValue: fPValue(W, df1, df2) };
}

/**
 * Test de Kruskal-Wallis (correction pour les ex-aequo).
 * H0 : les distributions des k groupes sont identiques.
 * Stat H ~ χ²(k-1) sous H0 (bonne approximation pour n_j ≥ 5).
 */
function kruskalWallis(
  groups: number[][],
): { statistic: number; df: number; pValue: number } {
  const k = groups.length;
  const N = groups.reduce((s, g) => s + g.length, 0);
  const tagged = groups.flatMap((g, gi) => g.map((v) => ({ v, gi })));
  tagged.sort((a, b) => a.v - b.v);

  // Rangs moyens (ex-aequo → rang moyen)
  const ranks: number[] = new Array(tagged.length);
  let i = 0;
  while (i < tagged.length) {
    let j = i;
    while (j < tagged.length && tagged[j]!.v === tagged[i]!.v) j++;
    const avg = (i + 1 + j) / 2;
    for (let m = i; m < j; m++) ranks[m] = avg;
    i = j;
  }

  const rSums: number[] = new Array(k).fill(0);
  for (let idx = 0; idx < tagged.length; idx++) rSums[tagged[idx]!.gi] += ranks[idx]!;

  const H_raw =
    (12 / (N * (N + 1))) * groups.reduce((s, g, gi) => s + (rSums[gi]! ** 2) / g.length, 0) -
    3 * (N + 1);

  // Correction pour les ex-aequo
  const tieCounts = new Map<number, number>();
  for (const { v } of tagged) tieCounts.set(v, (tieCounts.get(v) ?? 0) + 1);
  let tieCorr = 0;
  for (const t of tieCounts.values()) tieCorr += t ** 3 - t;
  const C = 1 - tieCorr / (N ** 3 - N);
  const H = C > 0 ? H_raw / C : H_raw;

  return {
    statistic: Math.round(Math.max(0, H) * 100) / 100,
    df: k - 1,
    pValue: chiSquaredPValue(Math.max(0, H), k - 1),
  };
}

/**
 * Test post-hoc de Dunn avec correction de Bonferroni.
 * À utiliser après un Kruskal-Wallis significatif.
 */
function dunnBonferroni(
  groups: number[][],
  names: string[],
): PosthocPair[] {
  const k = groups.length;
  const N = groups.reduce((s, g) => s + g.length, 0);
  const tagged = groups.flatMap((g, gi) => g.map((v) => ({ v, gi })));
  tagged.sort((a, b) => a.v - b.v);

  const ranks: number[] = new Array(tagged.length);
  let i = 0;
  while (i < tagged.length) {
    let j = i;
    while (j < tagged.length && tagged[j]!.v === tagged[i]!.v) j++;
    const avg = (i + 1 + j) / 2;
    for (let m = i; m < j; m++) ranks[m] = avg;
    i = j;
  }

  const rSums: number[] = new Array(k).fill(0);
  const sizes = groups.map((g) => g.length);
  for (let idx = 0; idx < tagged.length; idx++) rSums[tagged[idx]!.gi] += ranks[idx]!;
  const meanRanks = rSums.map((s, gi) => s / sizes[gi]!);

  const tieCounts = new Map<number, number>();
  for (const { v } of tagged) tieCounts.set(v, (tieCounts.get(v) ?? 0) + 1);
  let tieSum = 0;
  for (const t of tieCounts.values()) tieSum += t ** 3 - t;
  const tieCorr = 1 - tieSum / (N ** 3 - N);
  const base = (tieCorr * N * (N + 1)) / 12;

  const numPairs = (k * (k - 1)) / 2;
  const pairs: PosthocPair[] = [];

  for (let a = 0; a < k; a++) {
    for (let b = a + 1; b < k; b++) {
      const se = Math.sqrt(base * (1 / sizes[a]! + 1 / sizes[b]!));
      const z = se > 0 ? (meanRanks[a]! - meanRanks[b]!) / se : 0;
      const pRaw = 2 * normalSurvival(Math.abs(z));
      const pAdj = Math.min(1, pRaw * numPairs);
      pairs.push({
        pair: [names[a]!, names[b]!],
        stat: Math.round(z * 100) / 100,
        statLabel: "z",
        pAdjusted: Math.round(pAdj * 10000) / 10000,
        significant: pAdj < 0.05,
      });
    }
  }
  return pairs.sort((a, b) => a.pAdjusted - b.pAdjusted);
}

/**
 * Post-hoc de Bonferroni-t (ANOVA homoscédastique).
 * Approximation conservatrice du Tukey HSD, sans nécessiter
 * la distribution q(k, df) (studentized range).
 */
function bonferroniTPosthoc(
  segments: SegmentStats[],
  msWithin: number,
  dfWithin: number,
): PosthocPair[] {
  const k = segments.length;
  const numPairs = (k * (k - 1)) / 2;
  const pairs: PosthocPair[] = [];
  for (let a = 0; a < k; a++) {
    for (let b = a + 1; b < k; b++) {
      const s1 = segments[a]!, s2 = segments[b]!;
      const se = Math.sqrt(msWithin * (1 / s1.count + 1 / s2.count));
      if (se === 0) continue;
      const t = (s1.avgRevenue - s2.avgRevenue) / se;
      const pRaw = tDistPValue(t, dfWithin);
      const pAdj = Math.min(1, pRaw * numPairs);
      pairs.push({
        pair: [s1.name, s2.name],
        stat: Math.round(t * 100) / 100,
        statLabel: "t",
        pAdjusted: Math.round(pAdj * 10000) / 10000,
        significant: pAdj < 0.05,
      });
    }
  }
  return pairs.sort((a, b) => a.pAdjusted - b.pAdjusted);
}

/**
 * Post-hoc Games-Howell (ANOVA hétéroscédastique).
 * Utilise les degrés de liberté de Welch-Satterthwaite et la distribution t.
 * Correction Bonferroni sur le nombre de paires (approximation conservative).
 */
function gamesHowellPosthoc(segments: SegmentStats[]): PosthocPair[] {
  const k = segments.length;
  const numPairs = (k * (k - 1)) / 2;
  const pairs: PosthocPair[] = [];
  for (let a = 0; a < k; a++) {
    for (let b = a + 1; b < k; b++) {
      const s1 = segments[a]!, s2 = segments[b]!;
      if (s1.count < 2 || s2.count < 2) continue;
      const v1 = s1.stdDevRevenue ** 2 / s1.count;
      const v2 = s2.stdDevRevenue ** 2 / s2.count;
      const se = Math.sqrt(v1 + v2);
      if (se === 0) continue;
      // Degrés de liberté de Welch-Satterthwaite
      const df = (v1 + v2) ** 2 / (v1 ** 2 / (s1.count - 1) + v2 ** 2 / (s2.count - 1));
      const t = (s1.avgRevenue - s2.avgRevenue) / se;
      const pRaw = tDistPValue(t, df);
      const pAdj = Math.min(1, pRaw * numPairs);
      pairs.push({
        pair: [s1.name, s2.name],
        stat: Math.round(t * 100) / 100,
        statLabel: "t_WS",
        pAdjusted: Math.round(pAdj * 10000) / 10000,
        significant: pAdj < 0.05,
      });
    }
  }
  return pairs.sort((a, b) => a.pAdjusted - b.pAdjusted);
}

/* ═══════════════════════════════════════════════════════════════════
   BLOC 4 — Types publics
   ═══════════════════════════════════════════════════════════════════ */

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
  /** Écart-type intra-segment (estimateur corrigé de Bessel, n-1). */
  stdDevRevenue: number;
}

export interface PosthocPair {
  pair: [string, string];
  /** Valeur de la statistique (t, t_WS ou z selon la méthode). */
  stat: number;
  statLabel: "t" | "t_WS" | "z";
  /** Valeur p ajustée par correction de Bonferroni. */
  pAdjusted: number;
  significant: boolean;
}

export interface NormalityResult {
  method: "jarque-bera" | "skipped";
  statistic: number;
  pValue: number;
  /** Indique si la taille d'échantillon est suffisante pour JB (n ≥ 20). */
  reliable: boolean;
  /** true = rejet H0 (normalité rejetée) à α = 5 %. */
  reject: boolean;
  note: string;
}

export interface HomoscedasticityResult {
  method: "levene-brown-forsythe" | "skipped";
  statistic: number;
  df1: number;
  df2: number;
  pValue: number;
  /** true = rejet H0 (homoscédasticité rejetée) à α = 5 %. */
  reject: boolean;
  note: string;
}

export interface AnovaResult {
  fStat: number;
  dfBetween: number;
  dfWithin: number;
  pValue: number;
  significant: boolean;
  posthocMethod: "bonferroni-t" | "games-howell" | "none";
  posthoc: PosthocPair[];
}

export interface KruskalWallisResult {
  statistic: number;
  df: number;
  pValue: number;
  significant: boolean;
  posthoc: PosthocPair[];
}

export interface SegmentComparisonResult {
  segments: SegmentStats[];
  normality: NormalityResult;
  homoscedasticity: HomoscedasticityResult;
  /**
   * Méthode retenue après vérification des hypothèses :
   * - "anova" si normalité validée (ou non testable mais N ≥ 15)
   * - "kruskal-wallis" si normalité rejetée
   */
  selectedMethod: "anova" | "kruskal-wallis";
  methodReason: string;
  anova: AnovaResult | null;
  kruskalWallis: KruskalWallisResult | null;
  /** true si la méthode retenue est significative à α = 5 %. */
  hasDifference: boolean;
  /**
   * La dimension M du segment RFM est construite à partir de totalRevenue,
   * qui est aussi la variable comparée ici — circularité exploratoire.
   * Pour une validation prospective, segmenter sur t0 et mesurer sur t1.
   */
  circularityNote: string;
}

/* ═══════════════════════════════════════════════════════════════════
   BLOC 5 — Fonctions exportées
   ═══════════════════════════════════════════════════════════════════ */

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
    .select("_id name").lean();
  const customerMap = new Map(customers.map((c) => [c._id.toString(), c.name]));

  const recencies = agg.map((r: { lastOrderDate: Date }) =>
    Math.floor((now.getTime() - new Date(r.lastOrderDate).getTime()) / 86400000));
  const frequencies = agg.map((r: { orderCount: number }) => r.orderCount);
  const monetaries = agg.map((r: { totalRevenue: number }) => r.totalRevenue);

  const [rT1, rT2] = tercile(recencies);
  const [fT1, fT2] = tercile(frequencies);
  const [mT1, mT2] = tercile(monetaries);

  return agg.map((r: { _id: Types.ObjectId; totalRevenue: number; orderCount: number; lastOrderDate: Date }, i: number) => {
    const scoreR = scoreDesc(recencies[i], rT1, rT2);
    const scoreF = scoreAsc(frequencies[i], fT1, fT2);
    const scoreM = scoreAsc(monetaries[i], mT1, mT2);
    const rfmKey = `${scoreR}${scoreF}${scoreM}`;
    let segment: string;
    if (rfmKey === "333") segment = "Champions";
    else if (scoreR + scoreF >= 5) segment = "Loyaux";
    else if (scoreR === 1) segment = "À risque";
    else if (scoreM === 1) segment = "Petits acheteurs";
    else segment = "Potentiels";
    return {
      clientId: r._id.toString(),
      name: customerMap.get(r._id.toString()) ?? "Client inconnu",
      scoreR, scoreF, scoreM, segment,
      totalRevenue: Math.round(r.totalRevenue * 100) / 100,
      orderCount: r.orderCount,
      lastOrderDate: new Date(r.lastOrderDate).toISOString(),
    };
  });
}

/**
 * Pipeline d'analyse statistique des segments RFM.
 *
 * Décision automatique :
 * 1. Calcul des stats intra-segment (moyenne, écart-type Bessel).
 * 2. Test de normalité sur les résidus poolés (Jarque-Bera, H0 : normal).
 * 3. Test d'homoscédasticité (Levene-Brown-Forsythe, H0 : variances égales).
 * 4. Si normalité rejetée → Kruskal-Wallis + Dunn-Bonferroni (post-hoc).
 *    Si normalité non rejetée + homoscédasticité rejetée
 *      → ANOVA + Games-Howell (post-hoc Welch-Satterthwaite).
 *    Si normalité non rejetée + homoscédasticité non rejetée
 *      → ANOVA + Bonferroni-t (post-hoc).
 *
 * AVERTISSEMENT DE CIRCULARITÉ : la dimension M est construite à partir du CA,
 * qui est aussi la variable comparée. Résultats exploratoires seulement.
 */
export function compareSegments(rfmData: RFMEntry[]): SegmentComparisonResult {
  const CIRCULARITY =
    "ANOVA exploratoire — la dimension M (monétaire) du segment est construite " +
    "à partir de totalRevenue, la même variable comparée ici. " +
    "Ne pas utiliser comme preuve prédictive sans séparation temporelle t0/t1.";

  // ── Groupes bruts par segment ─────────────────────────────
  const segMap = new Map<string, number[]>();
  for (const r of rfmData) {
    const arr = segMap.get(r.segment) ?? [];
    arr.push(r.totalRevenue);
    segMap.set(r.segment, arr);
  }

  const segNames = Array.from(segMap.keys());
  const groups = segNames.map((n) => segMap.get(n)!);
  const k = segNames.length;
  const N = rfmData.length;

  // ── Stats intra-segment ───────────────────────────────────
  const segments: SegmentStats[] = segNames.map((name, gi) => {
    const vals = groups[gi]!;
    const n = vals.length;
    const avg = n > 0 ? vals.reduce((s, v) => s + v, 0) / n : 0;
    const variance = n > 1 ? vals.reduce((s, v) => s + (v - avg) ** 2, 0) / (n - 1) : 0;
    return {
      name,
      count: n,
      avgRevenue: Math.round(avg * 100) / 100,
      stdDevRevenue: Math.round(Math.sqrt(variance) * 100) / 100,
    };
  });

  // ── Cas insuffisant ───────────────────────────────────────
  const empty: SegmentComparisonResult = {
    segments,
    normality: { method: "skipped", statistic: 0, pValue: 1, reliable: false, reject: false, note: "Données insuffisantes." },
    homoscedasticity: { method: "skipped", statistic: 0, df1: 0, df2: 0, pValue: 1, reject: false, note: "Données insuffisantes." },
    selectedMethod: "kruskal-wallis",
    methodReason: "Données insuffisantes pour l'analyse.",
    anova: null,
    kruskalWallis: null,
    hasDifference: false,
    circularityNote: CIRCULARITY,
  };
  if (k < 2 || N <= k || groups.some((g) => g.length < 2)) return empty;

  // ── Résidus poolés pour le test de normalité ──────────────
  const residuals: number[] = [];
  for (let gi = 0; gi < k; gi++) {
    const seg = segments[gi]!;
    for (const v of groups[gi]!) residuals.push(v - seg.avgRevenue);
  }

  // ── Test de normalité (Jarque-Bera sur résidus) ───────────
  const jb = jarqueBera(residuals);
  const normality: NormalityResult = {
    method: residuals.length >= 8 ? "jarque-bera" : "skipped",
    statistic: Math.round(jb.statistic * 100) / 100,
    pValue: Math.round(jb.pValue * 10000) / 10000,
    reliable: jb.reliable,
    reject: residuals.length >= 8 ? jb.pValue < 0.05 : false,
    note: residuals.length < 8
      ? "Résidus insuffisants (< 8) pour le test JB — hypothèse non vérifiable."
      : jb.reliable
        ? `JB(2) = ${(jb.statistic).toFixed(2)}, p = ${jb.pValue.toFixed(4)}`
        : `JB(2) = ${(jb.statistic).toFixed(2)}, p = ${jb.pValue.toFixed(4)} (n < 20 — faible puissance)`,
  };

  // ── Test d'homoscédasticité (Levene-Brown-Forsythe) ───────
  const lev = leveneTest(groups);
  const homoscedasticity: HomoscedasticityResult = {
    method: "levene-brown-forsythe",
    statistic: lev.statistic,
    df1: lev.df1,
    df2: lev.df2,
    pValue: Math.round(lev.pValue * 10000) / 10000,
    reject: lev.pValue < 0.05,
    note: `W(${lev.df1}, ${lev.df2}) = ${lev.statistic.toFixed(2)}, p = ${lev.pValue.toFixed(4)}`,
  };

  // ── Décision de méthode ───────────────────────────────────
  const useKW = normality.reject;

  if (useKW) {
    // ── Kruskal-Wallis ────────────────────────────────────
    const kw = kruskalWallis(groups);
    const posthoc = kw.pValue < 0.05 ? dunnBonferroni(groups, segNames) : [];
    return {
      segments,
      normality,
      homoscedasticity,
      selectedMethod: "kruskal-wallis",
      methodReason: "Normalité des résidus rejetée (JB p < 0,05) → test non paramétrique.",
      anova: null,
      kruskalWallis: {
        ...kw,
        significant: kw.pValue < 0.05,
        posthoc,
      },
      hasDifference: kw.pValue < 0.05,
      circularityNote: CIRCULARITY,
    };
  }

  // ── ANOVA paramétrique ────────────────────────────────────
  const grandMean = rfmData.reduce((s, r) => s + r.totalRevenue, 0) / N;
  const ssBetween = segments.reduce(
    (s, seg) => s + seg.count * (seg.avgRevenue - grandMean) ** 2, 0);
  let ssWithin = 0;
  for (let gi = 0; gi < k; gi++) {
    const seg = segments[gi]!;
    for (const v of groups[gi]!) ssWithin += (v - seg.avgRevenue) ** 2;
  }
  const dfBetween = k - 1, dfWithin = N - k;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;
  const fStat = msWithin > 0 ? (ssBetween / dfBetween) / msWithin : 0;
  const pValueAnova = Math.round(fPValue(fStat, dfBetween, dfWithin) * 10000) / 10000;
  const anovaSignificant = pValueAnova < 0.05;

  let posthocMethod: AnovaResult["posthocMethod"] = "none";
  let posthoc: PosthocPair[] = [];
  if (anovaSignificant) {
    if (homoscedasticity.reject) {
      posthocMethod = "games-howell";
      posthoc = gamesHowellPosthoc(segments);
    } else {
      posthocMethod = "bonferroni-t";
      posthoc = bonferroniTPosthoc(segments, msWithin, dfWithin);
    }
  }

  const methodReason = homoscedasticity.reject
    ? "Normalité non rejetée, mais hétéroscédasticité détectée → ANOVA + post-hoc Games-Howell."
    : "Normalité et homoscédasticité non rejetées → ANOVA paramétrique + post-hoc Bonferroni-t.";

  return {
    segments,
    normality,
    homoscedasticity,
    selectedMethod: "anova",
    methodReason,
    anova: {
      fStat: Math.round(fStat * 100) / 100,
      dfBetween,
      dfWithin,
      pValue: pValueAnova,
      significant: anovaSignificant,
      posthocMethod,
      posthoc,
    },
    kruskalWallis: null,
    hasDifference: anovaSignificant,
    circularityNote: CIRCULARITY,
  };
}

/**
 * Taille d'effet d de Cohen poolé (Hedges 1981) entre chaque paire de segments.
 * Formule : s_poolé = sqrt(((n1-1)*s1² + (n2-1)*s2²) / (n1+n2-2))
 * Requiert stdDevRevenue dans SegmentStats (écart-type intra, Bessel).
 */
export function getTopSegmentPairs(
  segments: SegmentStats[],
): { pair: [string, string]; cohenD: number; relative: string; detectable: boolean }[] {
  const pairs: { pair: [string, string]; cohenD: number; relative: string; detectable: boolean }[] = [];
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const s1 = segments[i]!, s2 = segments[j]!;
      const df = s1.count + s2.count - 2;
      const sPooled =
        df > 0
          ? Math.sqrt(
              ((s1.count - 1) * s1.stdDevRevenue ** 2 +
                (s2.count - 1) * s2.stdDevRevenue ** 2) / df,
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
