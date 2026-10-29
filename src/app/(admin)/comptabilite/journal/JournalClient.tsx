"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import ResourcePageShell from "@/components/common/ResourcePageShell";

/* ── Types locaux ─────────────────────────────────────────── */

type OperationType =
  | "COMMANDE"
  | "DEPENSE"
  | "LIQUIDITE"
  | "CREANCE"
  | "DETTE"
  | "FONDS"
  | "IMMOBILISATION";

interface JournalEntry {
  _id: string;
  date: string;
  type: OperationType;
  libelle: string;
  montant: number;
  currency: string;
  reference: string;
  shopDesignation?: string;
}

interface JournalData {
  items: JournalEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Tous les types" },
  { value: "COMMANDE", label: "Commandes" },
  { value: "DEPENSE", label: "Dépenses" },
  { value: "LIQUIDITE", label: "Liquidités" },
  { value: "CREANCE", label: "Créances" },
  { value: "DETTE", label: "Dettes" },
  { value: "FONDS", label: "Fonds" },
  { value: "IMMOBILISATION", label: "Immobilisations" },
];

const typeColor: Record<OperationType, string> = {
  COMMANDE: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  DEPENSE: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  LIQUIDITE: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  CREANCE: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  DETTE: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  FONDS: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  IMMOBILISATION: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

/* ── Composant ────────────────────────────────────────────── */

export default function JournalClient({
  initialData,
}: {
  initialData: JournalData | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentType = searchParams.get("type") ?? "";
  const currentPage = Number(searchParams.get("page") ?? "1");

  const items: JournalEntry[] = initialData?.items ?? [];
  const totalPages = initialData?.totalPages ?? 1;

  const navigate = (type: string, page: number) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (page > 1) params.set("page", String(page));
    startTransition(() => {
      router.push(`/comptabilite/journal?${params.toString()}`);
    });
  };

  return (
    <ResourcePageShell
      title="Journal comptable"
      description="Vue chronologique de toutes les opérations financières."
      filters={
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Filtrer :</label>
          <select
            value={currentType}
            onChange={(e) => navigate(e.target.value, 1)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {initialData && (
            <span className="text-xs text-gray-400">
              {initialData.total} opération{initialData.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      }
      content={
        items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500 dark:border-gray-800">
            Aucune opération dans le journal.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Libellé / Désignation</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Devise</th>
                  <th className="px-4 py-3">Référence</th>
                  <th className="px-4 py-3">Boutique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((entry) => (
                  <tr
                    key={entry._id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(entry.date).toLocaleDateString("fr-CD")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[entry.type] ?? ""}`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {entry.libelle}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {entry.montant.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{entry.currency}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {entry.reference}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {entry.shopDesignation ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      pagination={
        totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => navigate(currentType, currentPage - 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-500">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => navigate(currentType, currentPage + 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-700"
            >
              Suivant
            </button>
          </div>
        ) : undefined
      }
    />
  );
}
