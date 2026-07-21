"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { ExerciseBalance, ExerciseOption } from "@/lib/dashboard/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

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

  const balance =
    balances.find((item) => item.anneeId === selected) ?? balances[0];

  // Merge all currencies into one by converting
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

  // Ratio: expenses / revenue
  const ratio =
    revenueTotal > 0
      ? Math.max(0, Math.min(100, (expensesTotal / revenueTotal) * 100))
      : 0;

  const options: ApexOptions = {
    colors: [ratio <= 70 ? "#465FFF" : ratio <= 90 ? "#F59E0B" : "#D92D20"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: "80%" },
        track: { background: "#E4E7EC", strokeWidth: "100%", margin: 5 },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
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
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="rounded-2xl bg-white px-5 pb-11 pt-5 shadow-default dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Bilan par exercice
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Ratio charges / recettes en {displayCurrency}
            </p>
            {pending && <p className="text-xs text-brand-500">Chargement...</p>}
          </div>
          <select
            value={selected ?? ""}
            onChange={(event) => change(event.target.value)}
            className="h-10 rounded-lg border px-2 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            {exercises.map((year) => (
              <option key={year.id} value={year.id}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        {/* Currency toggle */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Monnaie :</span>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
            {(["USD", "CDF"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDisplayCurrency(c)}
                className={`px-3 py-1 text-xs font-medium first:rounded-l-lg last:rounded-r-lg ${
                  displayCurrency === c
                    ? "bg-brand-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[330px]">
          <ReactApexChart
            options={options}
            series={[ratio]}
            type="radialBar"
            height={330}
          />
        </div>
        <p className="mx-auto mt-5 max-w-[380px] text-center text-sm text-gray-500">
          {ratio <= 70
            ? "Bonne marge : les charges representent moins de 70% des recettes."
            : ratio <= 90
              ? "Attention : les charges depassent 70% des recettes."
              : "Alerte : les charges depassent 90% des recettes."}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 px-6 py-4 text-center sm:grid-cols-3">
        <Value
          label="Recettes"
          value={formatCurrency(revenueTotal, displayCurrency)}
        />
        <Value
          label="Charges"
          value={formatCurrency(expensesTotal, displayCurrency)}
        />
        <Value
          label="Resultat"
          value={formatCurrency(resultTotal, displayCurrency)}
        />
      </div>
    </div>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-white/90">
        {value || "—"}
      </p>
    </div>
  );
}
