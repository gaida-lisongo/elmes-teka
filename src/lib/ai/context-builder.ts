import { Types } from "mongoose";

import Annee from "@/lib/models/Annee";
import Commande from "@/lib/models/Commande";
import Creance from "@/lib/models/Creance";
import Depense from "@/lib/models/Depense";
import Dette from "@/lib/models/Dette";
import Liquidite from "@/lib/models/Liquidite";
import { Tenant } from "@/lib/models/User";
import connectToDb from "@/lib/utils/db";
import { getProductVelocity } from "@/lib/mining/product-analysis";
import { computeRFM, compareSegments } from "@/lib/mining/customer-rfm";
import { benchmarkStores } from "@/lib/mining/store-benchmark";
import { detectRisks } from "@/lib/mining/risk-detector";
import { computeSolvabilityScore, type SolvabilityScore } from "@/lib/mining/financial-solver";

// Limite texte brute ~1000 tokens ≈ 4000 chars
const MAX_CHARS = 4000;

function truncate(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + "…" : text;
}

export interface BusinessContext {
  entreprise: string;
  exercice: string;
  pack: string;
  /** Lignes de données chiffrées, déjà formatées pour le prompt. */
  lignes: string[];
  /** Score de solvabilité déterministe (null si non calculable). */
  solvabilite: SolvabilityScore | null;
}

type CurrencyTotals = Record<string, number>;

function fmt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ");
}

function byCurrency(totals: CurrencyTotals): string {
  const parts = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([cur, v]) => `${fmt(v)} ${cur === "CDF" ? "FC" : cur}`);
  return parts.length ? parts.join(" + ") : "0";
}

async function sumByCurrency(
  model: { aggregate: (p: object[]) => { exec: () => Promise<Array<{ _id: string; total: number; count: number }>> } },
  match: Record<string, unknown>,
  amountField: string,
): Promise<{ totals: CurrencyTotals; count: number }> {
  const rows = await model
    .aggregate([
      { $match: match },
      { $group: { _id: "$currency", total: { $sum: `$${amountField}` }, count: { $sum: 1 } } },
    ])
    .exec();
  const totals: CurrencyTotals = {};
  let count = 0;
  for (const r of rows) {
    totals[(r._id ?? "CDF").toUpperCase()] = r.total;
    count += r.count;
  }
  return { totals, count };
}

/**
 * Construit le contexte métier réel de l'exercice (chiffres agrégés, jamais de
 * données d'un autre tenant). Toutes les requêtes filtrent sur tenantId + anneeId.
 */
export async function buildBusinessContext(
  tenantId: string,
  anneeId: string,
): Promise<BusinessContext> {
  await connectToDb();

  const tid = new Types.ObjectId(tenantId);
  const aid = new Types.ObjectId(anneeId);

  const annee = await Annee.findOne({ _id: aid, tenantId: tid }).select("debut fin plan status").lean();
  if (!annee) throw new Error("Exercice introuvable.");

  const tenant = await Tenant.findById(tid).select("designation").lean();
  const scope = { tenantId: tid, anneeId: aid };

  const [ventes, depenses, entrees, sorties, creances, dettes, velocities, rfm, stores, risks, solvabilite] =
    await Promise.all([
      sumByCurrency(Commande as never, { ...scope, status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] } }, "totalAmount"),
      sumByCurrency(Depense as never, { ...scope, status: "APPROVED" }, "totalAmount"),
      sumByCurrency(Liquidite as never, { ...scope, type: "ENTREE", status: "VALIDE" }, "montant"),
      sumByCurrency(Liquidite as never, { ...scope, type: "SORTIE", status: "VALIDE" }, "montant"),
      sumByCurrency(Creance as never, { ...scope, status: { $in: ["EN_COURS", "CONTENTIEUX"] } }, "montant"),
      sumByCurrency(Dette as never, { ...scope, status: { $in: ["EN_COURS", "LITIGIEUSE"] } }, "montant"),
      getProductVelocity(tenantId, anneeId).catch(() => []),
      computeRFM(tenantId, anneeId).catch(() => []),
      benchmarkStores(tenantId, anneeId).catch(() => []),
      detectRisks(tenantId, anneeId).catch(() => []),
      computeSolvabilityScore(tenantId, anneeId).catch(() => null),
    ]);

  const lignes: string[] = [];
  lignes.push(`Ventes validées : ${ventes.count} vente(s), chiffre d'affaires ${byCurrency(ventes.totals)}`);
  lignes.push(`Dépenses approuvées : ${depenses.count} dépense(s), ${byCurrency(depenses.totals)}`);
  const soldes: CurrencyTotals = {};
  for (const cur of new Set([...Object.keys(entrees.totals), ...Object.keys(sorties.totals)])) {
    soldes[cur] = (entrees.totals[cur] ?? 0) - (sorties.totals[cur] ?? 0);
  }
  lignes.push(
    `Liquidités hors ventes : entrées ${byCurrency(entrees.totals)}, sorties ${byCurrency(sorties.totals)}, solde ${
      Object.entries(soldes).map(([c, v]) => `${v < 0 ? "-" : ""}${fmt(Math.abs(v))} ${c === "CDF" ? "FC" : c}`).join(" + ") || "0"
    }`,
  );
  lignes.push(`Créances clients non recouvrées : ${creances.count}, ${byCurrency(creances.totals)}`);
  lignes.push(`Dettes fournisseurs non remboursées : ${dettes.count}, ${byCurrency(dettes.totals)}`);

  const topProduits = velocities
    .map((v) => ({ name: v.name, ca: v.weeklySeries.reduce((s, x) => s + x, 0), last: v.weeklySeries[7] ?? 0, prev: v.weeklySeries[6] ?? 0 }))
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 5);
  if (topProduits.length) {
    lignes.push(
      `Produits les plus vendus (8 dernières semaines, FC) : ${topProduits.map((p) => `${p.name} ${fmt(p.ca)}`).join(" ; ")}`,
    );
  }

  if (stores.length) {
    lignes.push(
      `Boutiques : ${stores
        .slice(0, 5)
        .map((s) => `${s.designation} CA ${fmt(s.caTotal)} FC, tendance ${s.tendance >= 0 ? "+" : "-"}${fmt(Math.abs(s.tendance))} FC/semaine`)
        .join(" ; ")}`,
    );
  }

  if (rfm.length) {
    const seg = compareSegments(rfm);
    const segText = seg.segments
      .filter((s) => s.count > 0)
      .map((s) => `${s.name} ${s.count} client(s), CA moyen ${fmt(s.avgRevenue)} FC`)
      .join(" ; ");
    lignes.push(`Clients : ${rfm.length} client(s) actifs. Segments : ${segText || "non disponibles"}`);
    const topClients = [...rfm].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 3);
    lignes.push(
      `Meilleurs clients : ${topClients.map((c) => `${c.name} (${c.orderCount} commande(s), ${fmt(c.totalRevenue)} FC)`).join(" ; ")}`,
    );
  } else {
    lignes.push("Clients : aucun client identifié sur les ventes de l'exercice.");
  }

  lignes.push(
    risks.length
      ? `Alertes : ${risks.slice(0, 5).map((r) => `[${r.severity}] ${r.message}`).join(" ; ")}`
      : "Alertes : aucune alerte détectée.",
  );

  if (solvabilite) {
    const c = solvabilite.components;
    lignes.push(
      `Score de solvabilité indicatif : ${solvabilite.score}/100 (régularité ${c.regularite}, croissance ${c.croissance}, diversification ${c.diversification}, marge ${c.marge}) — ${solvabilite.interpretation}`,
    );
  }

  return {
    entreprise: tenant?.designation ?? "Entreprise",
    exercice: `${new Date(annee.debut).getFullYear()}`,
    pack: annee.plan,
    lignes,
    solvabilite,
  };
}

export function formatContextForPrompt(ctx: BusinessContext): string {
  const raw = `Entreprise : ${ctx.entreprise} | Exercice : ${ctx.exercice} | Pack : ${ctx.pack}
${ctx.lignes.map((l) => `- ${l}`).join("\n")}`;
  return truncate(raw);
}
