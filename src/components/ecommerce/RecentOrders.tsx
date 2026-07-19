"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import type { DashboardData, ExerciseOption } from "@/lib/dashboard/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Classement des produits par chiffre d’affaires
          </h3>
          {pending && (
            <p className="text-xs text-brand-500">Actualisation...</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form onSubmit={submit}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Produit ou code..."
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </form>
          <select
            value={selected ?? "all"}
            onChange={(event) =>
              navigate({ rankingAnnee: event.target.value, productsPage: "1" })
            }
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
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
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              {[
                "Place",
                "Produit",
                "Catégorie",
                "Quantité",
                "Commandes",
                "Chiffre d’affaires",
              ].map((label) => (
                <TableCell
                  key={label}
                  isHeader
                  className="py-3 text-start text-xs font-medium text-gray-500"
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {ranking.items.map((product) => (
              <TableRow key={`${product.productId}-${product.currency}`}>
                <TableCell className="py-3 font-semibold">
                  #{product.rank}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    {product.photo ? (
                      <Image
                        width={42}
                        height={42}
                        src={product.photo}
                        alt={product.designation}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-gray-800" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {product.designation}
                      </p>
                      <span className="text-xs text-gray-500">
                        {product.code}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-500">
                  {product.category}
                </TableCell>
                <TableCell className="py-3 text-sm">
                  {product.quantitySold}
                </TableCell>
                <TableCell className="py-3 text-sm">
                  {product.orderCount}
                </TableCell>
                <TableCell className="py-3 text-sm font-medium">
                  {product.currency} {product.revenue.toLocaleString("fr-FR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!ranking.items.length && (
        <p className="py-10 text-center text-sm text-gray-500">
          Aucun produit vendu pour cette période.
        </p>
      )}
      <div className="flex items-center justify-between border-t border-gray-100 py-4 text-sm dark:border-gray-800">
        <span>
          Page {ranking.page} sur {ranking.totalPages} · {ranking.totalItems}{" "}
          produit(s)/devise
        </span>
        <div className="flex gap-2">
          <button
            disabled={ranking.page <= 1 || pending}
            onClick={() => navigate({ productsPage: String(ranking.page - 1) })}
            className="rounded-lg border px-3 py-2 disabled:opacity-40 dark:border-gray-700"
          >
            Précédent
          </button>
          <button
            disabled={ranking.page >= ranking.totalPages || pending}
            onClick={() => navigate({ productsPage: String(ranking.page + 1) })}
            className="rounded-lg border px-3 py-2 disabled:opacity-40 dark:border-gray-700"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
