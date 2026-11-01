import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import { Tenant } from "@/lib/models/User";
import Annee from "@/lib/models/Annee";
import connectToDb from "@/lib/utils/db";
import { getProductVelocity, forecastNextWeek } from "@/lib/mining/product-analysis";
import { computeRFM, compareSegments } from "@/lib/mining/customer-rfm";
import { benchmarkStores } from "@/lib/mining/store-benchmark";
import { detectRisks } from "@/lib/mining/risk-detector";
import { computeSolvabilityScore } from "@/lib/mining/financial-solver";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";

export const metadata: Metadata = {
  title: "Intelligence commerciale | ELMES-TEKA",
  description: "Analyses statistiques avancées",
};

function formatCA(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M FC`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} k FC`;
  return `${amount.toLocaleString("fr-FR")} FC`;
}

export default async function IntelligencePage() {
  const shell = await getAdminShellAccount();
  if (!shell) redirect("/signin");
  if (shell.account.type !== "TENANT") redirect("/dashboard");

  await connectToDb();

  if (!shell.account.tenantId) redirect("/dashboard");
  const tenantId: string = shell.account.tenantId;

  // Résoudre l'exercice actif
  const tenantDoc = await Tenant.findById(tenantId)
    .select("activeAnneeId")
    .lean();

  type AnneeSlim = { _id: Types.ObjectId; plan: string; debut: Date; fin: Date };
  let anneeDoc: AnneeSlim | null = null;
  if (tenantDoc?.activeAnneeId) {
    anneeDoc = await Annee.findById(tenantDoc.activeAnneeId)
      .select("_id plan debut fin")
      .lean() as AnneeSlim | null;
  }
  if (!anneeDoc) {
    anneeDoc = await Annee.findOne({
      tenantId: new Types.ObjectId(tenantId),
      status: "ACTIVE",
      "provider.status": "PAID",
    })
      .select("_id plan debut fin")
      .sort({ fin: -1 })
      .lean() as AnneeSlim | null;
  }

  if (!anneeDoc) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Aucun exercice actif</h2>
        <p className="text-gray-500">Créez et payez un exercice pour accéder aux analyses.</p>
      </div>
    );
  }

  if (anneeDoc.plan === "STARTER") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
          <svg className="h-8 w-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pack Business ou Premium requis</h2>
        <p className="max-w-md text-gray-500">
          Cette fonctionnalité nécessite le pack Business ou Premium. Mettez à niveau votre exercice
          depuis la page Exercices.
        </p>
      </div>
    );
  }

  const anneeId: string = anneeDoc._id.toString();

  // Charger toutes les données en parallèle
  const [velocities, rfmData, stores, risks, solvabilityScore] = await Promise.all([
    getProductVelocity(tenantId, anneeId).catch(() => []),
    computeRFM(tenantId, anneeId).catch(() => []),
    benchmarkStores(tenantId, anneeId).catch(() => []),
    detectRisks(tenantId, anneeId).catch(() => []),
    computeSolvabilityScore(tenantId, anneeId).catch(() => null),
  ]);

  const segmentAnalysis = compareSegments(rfmData);

  // Forecasting pour le premier produit
  const firstProduct = velocities[0] ?? null;
  const forecast = firstProduct ? forecastNextWeek(firstProduct.weeklySeries) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Intelligence commerciale</h1>
        <p className="mt-1 text-sm text-gray-500">
          Analyses statistiques de l&apos;exercice {new Date(anneeDoc.debut).getFullYear()}–{new Date(anneeDoc.fin).getFullYear()}
        </p>
      </div>

      {/* ── Forecasting ───────────────────────────────────── */}
      <Section title="Prévision des ventes" subtitle="Régression OLS sur 8 semaines glissantes">
        {!firstProduct ? (
          <Empty text="Aucune donnée de vente disponible." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Produit analysé" value={firstProduct.name} />
            {forecast && (
              <>
                <KpiTile
                  label="Prévision S+1"
                  value={formatCA(forecast.forecast)}
                  sub={`Intervalle : [${formatCA(forecast.low)} – ${formatCA(forecast.high)}]`}
                />
                <KpiTile
                  label="R²"
                  value={(forecast.r2 * 100).toFixed(1) + "%"}
                  sub={forecast.r2 >= 0.3 ? "Modèle OLS" : "Moy. mobile pond."}
                />
                <KpiTile
                  label="RMSE"
                  value={formatCA(forecast.rmse)}
                  sub="Erreur quadratique"
                />
              </>
            )}
          </div>
        )}
        {velocities.length > 1 && (
          <p className="mt-3 text-xs text-gray-400">
            {velocities.length} produits analysés au total.
          </p>
        )}
      </Section>

      {/* ── RFM ───────────────────────────────────────────── */}
      <Section
        title="Segmentation clients RFM"
        subtitle="Recency · Frequency · Monetary"
        badge={segmentAnalysis.hasDifference ? "Différence détectée" : undefined}
      >
        {!segmentAnalysis.segments.length ? (
          <Empty text="Aucune transaction client." />
        ) : (
          <>
            {segmentAnalysis.hasDifference && (
              <p className="mb-3 text-sm text-success-600 dark:text-success-400">
                F = {segmentAnalysis.fStat} — différence statistiquement significative entre les segments.
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Segment", "Clients", "CA moyen"].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {segmentAnalysis.segments.map((seg) => (
                    <tr key={seg.name} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white/90">{seg.name}</td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{seg.count}</td>
                      <td className="px-4 py-2.5 font-semibold text-brand-600 dark:text-brand-400">
                        {formatCA(seg.avgRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      {/* ── Benchmark boutiques ───────────────────────────── */}
      <Section title="Benchmark des boutiques" subtitle="Performance comparative par point de vente">
        {!stores.length ? (
          <Empty text="Aucune boutique avec des données." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Boutique", "CA total", "CA moyen/jour", "Tendance"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {stores.map((s) => (
                  <tr key={s.storeId} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-white/90">{s.designation}</td>
                    <td className="px-4 py-2.5 font-semibold text-brand-600 dark:text-brand-400">{formatCA(s.caTotal)}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{formatCA(s.caMoyenJour)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${s.tendance >= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                        {s.tendance >= 0 ? <ArrowUpIcon className="size-3.5" /> : <ArrowDownIcon className="size-3.5" />}
                        {formatCA(Math.abs(s.tendance))}/sem
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── Alertes risques ───────────────────────────────── */}
      <Section title="Alertes et risques" subtitle="Détection automatique des signaux faibles">
        {!risks.length ? (
          <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
            <span className="h-2 w-2 rounded-full bg-success-500" />
            Aucun risque détecté sur cet exercice.
          </div>
        ) : (
          <div className="space-y-3">
            {risks.map((risk, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  risk.severity === "HIGH"
                    ? "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-500/5"
                    : risk.severity === "MEDIUM"
                    ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-500/5"
                    : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-500/5"
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                    risk.severity === "HIGH"
                      ? "bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400"
                      : risk.severity === "MEDIUM"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                  }`}
                >
                  {risk.severity}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">{risk.message}</p>
                  {risk.affectedItems.length > 0 && (
                    <p className="mt-0.5 text-xs text-gray-500">{risk.affectedItems.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Score solvabilité ─────────────────────────────── */}
      <Section title="Score de solvabilité indicatif" subtitle="Analyse déterministe — aucune IA">
        {!solvabilityScore ? (
          <Empty text="Données insuffisantes pour calculer le score." />
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score global</span>
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{solvabilityScore.score}/100</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    solvabilityScore.score >= 75
                      ? "bg-success-500"
                      : solvabilityScore.score >= 50
                      ? "bg-brand-500"
                      : solvabilityScore.score >= 25
                      ? "bg-amber-500"
                      : "bg-error-500"
                  }`}
                  style={{ width: `${solvabilityScore.score}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{solvabilityScore.interpretation}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.entries(solvabilityScore.components) as [string, number][]).map(([key, val]) => (
                <div key={key} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-white/[0.02]">
                  <p className="text-xs capitalize text-gray-500">{key}</p>
                  <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">{val}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-brand-400"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs italic text-gray-400">{solvabilityScore.disclaimer}</p>
          </div>
        )}
      </Section>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function Section({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {badge && (
            <span className="ml-auto rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-sm text-gray-500">{text}</p>
  );
}
