"use client";

import ResourcePageShell from "@/components/common/ResourcePageShell";

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

interface Props {
  anneeLabel: string | null;
  rows: StockRow[];
  totalValeur: number;
}

function stockStatus(qte: number, seuil: number): "critical" | "warning" | "ok" {
  if (seuil <= 0) return "ok";
  if (qte <= seuil) return "critical";
  if (qte <= seuil * 2) return "warning";
  return "ok";
}

const statusDot: Record<"critical" | "warning" | "ok", string> = {
  critical: "bg-error-500",
  warning: "bg-warning-400",
  ok: "bg-success-500",
};

export default function StocksOverviewClient({ anneeLabel, rows, totalValeur }: Props) {
  const criticalCount = rows.filter((r) => stockStatus(r.qte, r.seuilCritique) === "critical").length;
  return (
    <ResourcePageShell
      title="Stocks"
      description={
        anneeLabel
          ? `Vue consolidée des stocks — exercice ${anneeLabel}`
          : "Aucun exercice actif. Créez un exercice pour visualiser les stocks."
      }
      metrics={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Lignes de stock" value={rows.length} />
          <Metric
            label="Valorisation totale"
            value={totalValeur.toLocaleString()}
          />
          <Metric
            label="Boutiques concernées"
            value={new Set(rows.map((r) => r.storeId)).size}
          />
          <Metric
            label="Stock critique"
            value={criticalCount > 0 ? `${criticalCount} produit${criticalCount > 1 ? "s" : ""}` : "Aucun"}
            highlight={criticalCount > 0}
          />
        </div>
      }
      content={
        rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500 dark:border-gray-800">
            Aucun stock disponible pour l'exercice actif.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Boutique</th>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3 text-right">Prix unitaire</th>
                  <th className="px-4 py-3 text-right">Valeur totale</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row, i) => {
                  const status = stockStatus(row.qte, row.seuilCritique);
                  return (
                  <tr
                    key={`${row.storeId}-${row.productId}-${i}`}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {row.storeDesignation}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {row.productDesignation}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.qte.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.prixUnitaire.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {row.valeurTotale.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        title={status === "critical" ? "Stock critique" : status === "warning" ? "Stock faible" : "Stock suffisant"}
                        className={`inline-block h-3 w-3 rounded-full ${statusDot[status]}`}
                      />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-200 dark:border-gray-700">
                <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
                    Valorisation totale
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    {totalValeur.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      }
    />
  );
}

function Metric({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 dark:border-gray-800 ${highlight ? "border-error-200 bg-error-50 dark:bg-error-500/10" : "border-gray-100"}`}>
      <small className="text-gray-500">{label}</small>
      <strong className={`block ${highlight ? "text-error-600 dark:text-error-400" : "text-gray-900 dark:text-white"}`}>{value}</strong>
    </div>
  );
}
