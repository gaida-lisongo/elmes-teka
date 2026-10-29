"use client";

import { useState } from "react";
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

function getQteLevel(qte: number): "critical" | "low" | "ok" {
  if (qte === 0) return "critical";
  if (qte <= 5) return "low";
  return "ok";
}

function QteBadge({ qte }: { qte: number }) {
  const level = getQteLevel(qte);
  if (level === "critical") {
    return (
      <span className="inline-flex items-center rounded-full bg-error-50 px-2.5 py-0.5 text-xs font-semibold text-error-700 tabular-nums dark:bg-error-500/10 dark:text-error-400">
        {qte.toLocaleString()} — Rupture
      </span>
    );
  }
  if (level === "low") {
    return (
      <span className="inline-flex items-center rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-semibold text-warning-700 tabular-nums dark:bg-warning-500/10 dark:text-warning-400">
        {qte.toLocaleString()} — Faible
      </span>
    );
  }
  return (
    <span className="tabular-nums text-gray-800 dark:text-white/90">
      {qte.toLocaleString()}
    </span>
  );
}

export default function StocksOverviewClient({
  anneeLabel,
  rows,
  totalValeur,
}: Props) {
  const stores = Array.from(
    new Map(rows.map((r) => [r.storeId, r.storeDesignation])).entries(),
  ).map(([id, name]) => ({ id, name }));

  const [selectedStore, setSelectedStore] = useState<string>("all");

  const filtered =
    selectedStore === "all"
      ? rows
      : rows.filter((r) => r.storeId === selectedStore);

  const criticalCount = filtered.filter((r) => r.qte === 0).length;
  const lowCount = filtered.filter((r) => r.qte > 0 && r.qte <= 5).length;
  const filteredValeur = filtered.reduce((sum, r) => sum + r.valeurTotale, 0);

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
          <Metric label="Lignes de stock" value={filtered.length} />
          <Metric
            label="Valorisation totale"
            value={filteredValeur.toLocaleString()}
          />
          <Metric
            label="Boutiques"
            value={new Set(filtered.map((r) => r.storeId)).size}
          />
          {criticalCount > 0 ? (
            <div className="rounded-xl border border-error-200 bg-error-50 p-3 dark:border-error-500/30 dark:bg-error-500/10">
              <small className="text-error-600 dark:text-error-400">
                Ruptures de stock
              </small>
              <strong className="block text-error-700 dark:text-error-300">
                {criticalCount} produit(s)
              </strong>
            </div>
          ) : lowCount > 0 ? (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 dark:border-warning-500/30 dark:bg-warning-500/10">
              <small className="text-warning-600 dark:text-warning-400">
                Stock faible
              </small>
              <strong className="block text-warning-700 dark:text-warning-300">
                {lowCount} produit(s)
              </strong>
            </div>
          ) : (
            <div className="rounded-xl border border-success-200 bg-success-50 p-3 dark:border-success-500/30 dark:bg-success-500/10">
              <small className="text-success-600 dark:text-success-400">
                Niveaux OK
              </small>
              <strong className="block text-success-700 dark:text-success-300">
                Tous les stocks
              </strong>
            </div>
          )}
        </div>
      }
      toolbar={
        stores.length > 1 ? (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Boutique :
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="all">Toutes les boutiques</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : undefined
      }
      content={
        filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500 dark:border-gray-800">
            Aucun stock disponible pour les critères sélectionnés.
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
                {filtered.map((row, i) => (
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
                    <td className="px-4 py-3 text-right">
                      <QteBadge qte={row.qte} />
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
                <tr className="bg-gray-50 font-semibold dark:bg-gray-800">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right text-gray-700 dark:text-gray-200"
                  >
                    Valorisation totale
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">
                    {filteredValeur.toLocaleString()}
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
