"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useTheme } from "@/context/ThemeContext";
import type {
  ExerciseBalance,
  ExerciseOption,
  ProductRankingItem,
} from "@/lib/dashboard/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

function formatCurrency(amount: number, currency: string) {
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toLocaleString("fr-FR")} FC`;
}

function truncate(str: string, max = 22) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function MonthlyTarget({
  balances,
  exercises,
  selected,
  taux,
  exchange,
  ranking,
  scope,
}: {
  balances: ExerciseBalance[];
  exercises: ExerciseOption[];
  selected: string | null;
  taux: number;
  exchange: number;
  ranking: { items: ProductRankingItem[] };
  scope: "TENANT" | "SALER";
}) {
  const router = useRouter();
  const query = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "CDF">("CDF");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const reducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  /* ── Bilan calculations ── */
  const balance =
    balances.find((item) => item.anneeId === selected) ?? balances[0];

  const revenueTotal = (balance?.currencies ?? []).reduce((sum, c) => {
    if (displayCurrency === "USD") {
      if (c.currency === "USD") return sum + c.revenue;
      if (c.currency === "CDF" && exchange > 0)
        return sum + Math.round((c.revenue / exchange) * 100) / 100;
    } else {
      if (c.currency === "CDF") return sum + c.revenue;
      if (c.currency === "USD" && taux > 0)
        return sum + Math.round(c.revenue * taux);
    }
    return sum;
  }, 0);

  const expensesTotal = (balance?.currencies ?? []).reduce((sum, c) => {
    if (displayCurrency === "USD") {
      if (c.currency === "USD") return sum + c.expenses;
      if (c.currency === "CDF" && exchange > 0)
        return sum + Math.round((c.expenses / exchange) * 100) / 100;
    } else {
      if (c.currency === "CDF") return sum + c.expenses;
      if (c.currency === "USD" && taux > 0)
        return sum + Math.round(c.expenses * taux);
    }
    return sum;
  }, 0);

  const resultTotal = revenueTotal - expensesTotal;

  /* ── Product bar chart ── */
  const currencyCount: Record<string, number> = {};
  for (const p of ranking.items) {
    currencyCount[p.currency] = (currencyCount[p.currency] ?? 0) + 1;
  }
  const primaryCurrency =
    Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "CDF";

  const topProducts = ranking.items
    .filter((p) => p.currency === primaryCurrency)
    .slice(0, 10);

  const barCategories = topProducts.map((p) => truncate(p.designation));
  const barData = topProducts.map((p) => p.revenue);

  const barOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: Math.max(220, topProducts.length * 44),
      toolbar: { show: false },
      background: "transparent",
      animations: {
        enabled: !reducedMotion.current,
        speed: 500,
        animateGradually: { enabled: true, delay: 60 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
      fontFamily: "Fira Sans, Outfit, sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        borderRadiusApplication: "end",
        barHeight: "58%",
        dataLabels: { position: "top" },
      },
    },
    colors: ["#124A99"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "horizontal",
        shadeIntensity: 0.25,
        opacityFrom: 1,
        opacityTo: 0.75,
        stops: [0, 100],
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 6,
      style: {
        fontSize: "11px",
        fontWeight: "600",
        colors: [isDark ? "#d1d5db" : "#374151"],
      },
      formatter: (val: number) =>
        primaryCurrency === "USD"
          ? `$${val.toFixed(0)}`
          : `${val.toLocaleString("fr-FR")} FC`,
    },
    stroke: { show: false },
    xaxis: {
      categories: barCategories,
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: "500",
          colors: isDark ? "#9ca3af" : "#4b5563",
        },
      },
    },
    grid: {
      borderColor: isDark ? "#1f2937" : "#f3f4f6",
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: { left: 0, right: 24 },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "13px" },
      y: {
        formatter: (val: number) =>
          primaryCurrency === "USD"
            ? `$${val.toFixed(2)}`
            : `${val.toLocaleString("fr-FR")} FC`,
      },
    },
    legend: { show: false },
  };

  const change = (value: string) => {
    const params = new URLSearchParams(query.toString());
    params.set("targetAnnee", value);
    startTransition(() => router.push(`/?${params.toString()}`));
  };

  const chartTitle =
    scope === "TENANT"
      ? "Performance des produits — toutes boutiques"
      : "Performance des produits — ma boutique";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Bilan par exercice
          </h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
            Recettes · Charges · Résultat en {displayCurrency}
          </p>
          {pending && (
            <p className="mt-0.5 text-xs text-brand-500">Chargement…</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {(["CDF", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDisplayCurrency(c)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
                  displayCurrency === c
                    ? "bg-brand-500 text-white"
                    : "bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <select
            value={selected ?? ""}
            onChange={(e) => change(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-transparent px-2 text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300"
          >
            {exercises.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Bilan KPI row ── */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        <BudgetCell
          label="Recettes"
          value={formatCurrency(revenueTotal, displayCurrency)}
          color="text-brand-600 dark:text-brand-400"
        />
        <BudgetCell
          label="Charges"
          value={formatCurrency(expensesTotal, displayCurrency)}
          color="text-error-600 dark:text-error-400"
        />
        <BudgetCell
          label="Résultat"
          value={formatCurrency(Math.abs(resultTotal), displayCurrency)}
          color={
            resultTotal >= 0
              ? "text-success-600 dark:text-success-400"
              : "text-error-600 dark:text-error-400"
          }
          prefix={resultTotal < 0 ? "−" : "+"}
        />
      </div>

      {/* ── Product bar chart ── */}
      <div className="px-5 pt-5 pb-2 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {chartTitle}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Classement par chiffre d&apos;affaires · mis à jour en temps réel
            </p>
          </div>
          {topProducts.length > 0 && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Top {topProducts.length}
            </span>
          )}
        </div>

        {topProducts.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Aucune vente enregistrée pour cet exercice.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <ReactApexChart
              key={`${isDark}-${topProducts.length}`}
              options={barOptions}
              series={[{ name: "CA", data: barData }]}
              type="bar"
              height={Math.max(220, topProducts.length * 44)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetCell({
  label,
  value,
  color,
  prefix,
}: {
  label: string;
  value: string;
  color: string;
  prefix?: string;
}) {
  return (
    <div className="py-4 text-center">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className={`mt-0.5 tabular-nums text-sm font-semibold ${color}`}>
        {prefix}
        {value || "—"}
      </p>
    </div>
  );
}
