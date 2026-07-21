"use client";

import { useEffect, useRef, useState } from "react";
import Input from "@/components/form/input/InputField";
import { getSaleProducts } from "@/actions/workspace.actions";
import { PlusIcon } from "@/icons";

export interface ProductResult {
  id: string;
  designation: string;
  code: string;
  price: Array<{ amount: number; currency: string }>;
  photo: string | null;
  quantity: number;
}

interface ProductSearchProps {
  slug: string;
  taux: number;
  exchange: number;
  selectedIds: string[];
  onAdd: (product: ProductResult) => void;
}

export default function ProductSearch({
  slug,
  taux,
  exchange,
  selectedIds,
  onAdd,
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState<"ORIGINAL" | "USD" | "CDF">("CDF");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      const r = await getSaleProducts(slug, query);
      if (r.success) {
        setResults(r.data.filter((p: ProductResult) => !selectedIds.includes(p.id)));
        setMessage(r.data.length ? "" : "Aucun produit trouve.");
      } else {
        setResults([]);
        setMessage(r.message);
      }
      setIsLoading(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, slug, selectedIds]);

  function convertPrice(price: { amount: number; currency: string }) {
    if (displayCurrency === "ORIGINAL") return price;
    if (displayCurrency === "USD" && price.currency === "CDF" && exchange > 0) {
      return { amount: Math.round((price.amount / exchange) * 100) / 100, currency: "USD" };
    }
    if (displayCurrency === "CDF" && price.currency === "USD" && taux > 0) {
      return { amount: Math.round(price.amount * taux), currency: "CDF" };
    }
    return price;
  }

  function formatPrice(price: { amount: number; currency: string }) {
    const p = convertPrice(price);
    if (p.currency === "USD") return `$${p.amount.toFixed(2)}`;
    return `${p.amount.toLocaleString("fr-FR")} FC`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Rechercher un produit par nom ou code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ...
            </span>
          )}
        </div>
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
          {(["ORIGINAL", "USD", "CDF"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setDisplayCurrency(c)}
              className={`px-2 py-2 text-xs font-medium first:rounded-l-lg last:rounded-r-lg ${
                displayCurrency === c
                  ? "bg-brand-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
              }`}
            >
              {c === "ORIGINAL" ? "Orig." : c}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700">
          {results.map((p) => {
            const price = p.price?.[0];
            const converted = price ? convertPrice(price) : null;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onAdd(p)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                  {p.photo ? (
                    <img src={p.photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{p.code?.slice(0, 2) || "PR"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {p.designation}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.code} — Stock: {p.quantity}
                  </p>
                </div>
                <div className="text-right">
                  {converted ? (
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {formatPrice(price!)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">—</p>
                  )}
                  {displayCurrency !== "ORIGINAL" && price && displayCurrency !== price.currency && (
                    <p className="text-xs text-gray-400">converti</p>
                  )}
                </div>
                <PlusIcon className="text-brand-500" />
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && message && query.trim().length >= 2 && results.length === 0 && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}