"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { AngleLeftIcon, AngleRightIcon } from "@/icons";
import type { DashboardData, ExerciseOption } from "@/lib/dashboard/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

const RANK_STYLES: Record<number, { badge: string; text: string }> = {
  1: {
    badge:
      "bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    text: "font-bold",
  },
  2: {
    badge:
      "bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600",
    text: "font-semibold",
  },
  3: {
    badge:
      "bg-orange-50 text-orange-600 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    text: "font-semibold",
  },
};

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];
  if (style) {
    return (
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${style.badge} ${style.text}`}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className="tabular-nums text-sm text-gray-400 dark:text-gray-500">
      #{rank}
    </span>
  );
}

export default function RecentOrders({
  ranking,
  exercises,
  selected,
}: {
  ranking: DashboardData["ranking"];
  exercises: ExerciseOption[];
  selected: string | null;
}) {
  const router = useRouter();
  const query = useSearchParams();
  const [search, setSearch] = useState(ranking.search);
  const [pending, startTransition] = useTransition();

  const navigate = (changes: Record<string, string>) => {
    const params = new URLSearchParams(query.toString());
    Object.entries(changes).forEach(([key, value]) =>
      value ? params.set(key, value) : params.delete(key),
    );
    startTransition(() => router.push(`/?${params.toString()}`));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ productSearch: search, productsPage: "1" });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between sm:px-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Classement des produits par chiffre d&apos;affaires
          </h3>
          {pending && (
            <p className="mt-0.5 text-xs text-brand-500">Actualisation…</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={submit}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Produit ou code…"
              className="h-9 w-full rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:text-gray-300 dark:placeholder:text-gray-600 dark:focus:border-brand-700 dark:focus:ring-brand-900/30 sm:w-48"
            />
          </form>
          <select
            value={selected ?? "all"}
            onChange={(e) =>
              navigate({ rankingAnnee: e.target.value, productsPage: "1" })
            }
            className="h-9 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="all">Toutes les périodes</option>
            {exercises.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-white/[0.02]">
            <TableRow>
              {[
                "Place",
                "Produit",
                "Catégorie",
                "Quantité",
                "Commandes",
                "Chiffre d'affaires",
              ].map((label) => (
                <TableCell
                  key={label}
                  isHeader
                  className="border-b border-gray-100 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400"
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {ranking.items.map((product) => (
              <TableRow
                key={`${product.productId}-${product.currency}`}
                className="transition-colors duration-150 hover:bg-brand-25 dark:hover:bg-white/[0.02]"
              >
                <TableCell className="py-3 pl-5">
                  <RankBadge rank={product.rank} />
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    {product.photo ? (
                      <Image
                        width={40}
                        height={40}
                        src={product.photo}
                        alt={product.designation}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800 dark:text-white/90">
                        {product.designation}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {product.code}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-500 dark:text-gray-400">
                  {product.category || "—"}
                </TableCell>
                <TableCell className="tabular-nums py-3 text-sm text-gray-700 dark:text-gray-300">
                  {product.quantitySold.toLocaleString("fr-FR")}
                </TableCell>
                <TableCell className="tabular-nums py-3 text-sm text-gray-700 dark:text-gray-300">
                  {product.orderCount.toLocaleString("fr-FR")}
                </TableCell>
                <TableCell className="tabular-nums py-3 text-sm font-semibold text-brand-600 dark:text-brand-400">
                  {product.currency}{" "}
                  {product.revenue.toLocaleString("fr-FR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty state */}
      {!ranking.items.length && (
        <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          Aucun produit vendu pour cette période.
        </p>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-gray-800 sm:px-6">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Page {ranking.page} / {ranking.totalPages} —{" "}
          <span className="tabular-nums">{ranking.totalItems}</span> produit(s)
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={ranking.page <= 1 || pending}
            onClick={() => navigate({ productsPage: String(ranking.page - 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.05]"
            aria-label="Page précédente"
          >
            <AngleLeftIcon className="size-4" />
          </button>
          <button
            disabled={ranking.page >= ranking.totalPages || pending}
            onClick={() => navigate({ productsPage: String(ranking.page + 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.05]"
            aria-label="Page suivante"
          >
            <AngleRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
