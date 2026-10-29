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
}

interface Props {
  anneeLabel: string | null;
  rows: StockRow[];
  totalValeur: number;
}

export default function StocksOverviewClient({ anneeLabel, rows, totalValeur }: Props) {
  return (
    <ResourcePageShell
      title="Stocks"
      description={
        anneeLabel
          ? `Vue consolidée des stocks — exercice ${anneeLabel}`
          : "Aucun exercice actif. Créez un exercice pour visualiser les stocks."
      }
      metrics={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Lignes de stock" value={rows.length} />
          <Metric
            label="Valorisation totale"
            value={totalValeur.toLocaleString()}
          />
          <Metric
            label="Boutiques concernées"
            value={new Set(rows.map((r) => r.storeId)).size}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row, i) => (
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
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200 dark:border-gray-700">
                <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
                  <td colSpan={4} className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
      <small className="text-gray-500">{label}</small>
      <strong className="block text-gray-900 dark:text-white">{value}</strong>
    </div>
  );
}
