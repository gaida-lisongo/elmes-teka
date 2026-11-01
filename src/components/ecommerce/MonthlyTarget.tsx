"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { ExerciseBalance, ExerciseOption } from "@/lib/dashboard/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

function formatCurrency(amount: number, currency: string) {
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toLocaleString("fr-FR")} FC`;
}

export default function MonthlyTarget({
  balances,
  exercises,
  selected,
  taux,
  exchange,
}: {
  balances: ExerciseBalance[];
  exercises: ExerciseOption[];
  selected: string | null;
  taux: number;
  exchange: number;
}) {
  const router = useRouter();
  const query = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "CDF">("USD");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const reducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

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
  const ratio =
    revenueTotal > 0
      ? Math.max(0, Math.min(100, (expensesTotal / revenueTotal) * 100))
      : 0;

  const barColor =
    ratio <= 70 ? "#124A99" : ratio <= 90 ? "#F59E0B" : "#D92D20";

  const options: ApexOptions = {
    colors: [barColor],
    chart: {
      fontFamily: "Fira Sans, Outfit, sans-serif",
      type: "radialBar",
      height: 260,
      sparkline: { enabled: true },
      background: "transparent",
      animations: { enabled: !reducedMotion.current },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "72%" },
        track: {
          background: isDark ? "#1f2937" : "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "30px",
            fontWeight: "700",
            offsetY: -18,
            color: isDark ? "#f9fafb" : "#111827",
            formatter: (value) => `${value.toFixed(1)}%`,
          },
        },
      },
    },
    stroke: { lineCap: "round" },
    labels: ["Ratio"],
  };

  const change = (value: string) => {
    const params = new URLSearchParams(query.toString());
    params.set("targetAnnee", value);
    startTransition(() => router.push(`/?${params.toString()}`));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Bilan par exercice
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Ratio charges / recettes en {displayCurrency}
          </p>
          {pending && (
            <p className="mt-0.5 text-xs text-brand-500">Chargement…</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            {(["USD", "CDF"] as const).map((c) => (
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

      {/* Chart */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-0 pt-2">
        <div className="w-full">
          <ReactApexChart
            options={options}
            series={[ratio]}
            type="radialBar"
            height={260}
          />
        </div>
        <p className="-mt-4 mb-4 text-center text-xs text-gray-400 dark:text-gray-500">
          {ratio <= 70
            ? "Bonne marge — charges < 70 % des recettes"
            : ratio <= 90
              ? "Attention — charges > 70 % des recettes"
              : "Alerte — charges > 90 % des recettes"}
        </p>
      </div>

      {/* Summary footer */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
        <SummaryCell
          label="Recettes"
          value={formatCurrency(revenueTotal, displayCurrency)}
          color="text-brand-600 dark:text-brand-400"
        />
        <SummaryCell
          label="Charges"
          value={formatCurrency(expensesTotal, displayCurrency)}
          color="text-error-600 dark:text-error-400"
        />
        <SummaryCell
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
    </div>
  );
}

function SummaryCell({
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
