"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { ExerciseBalance, ExerciseOption } from "@/lib/dashboard/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
const amounts = (
  values: Array<{
    currency: string;
    revenue?: number;
    expenses?: number;
    result?: number;
  }>,
  key: "revenue" | "expenses" | "result",
) =>
  values
    .map(
      (item) => `${item.currency} ${(item[key] ?? 0).toLocaleString("fr-FR")}`,
    )
    .join(" · ");

export default function MonthlyTarget({
  balances,
  exercises,
  selected,
}: {
  balances: ExerciseBalance[];
  exercises: ExerciseOption[];
  selected: string | null;
}) {
  const router = useRouter();
  const query = useSearchParams();
  const [pending, startTransition] = useTransition();
  const balance =
    balances.find((item) => item.anneeId === selected) ?? balances[0];
  const marginCurrency =
    balance?.currencies.find(
      (item) => item.currency === "USD" && item.revenue > 0,
    ) ?? balance?.currencies.find((item) => item.revenue > 0);
  const margin =
    marginCurrency && marginCurrency.revenue > 0
      ? Math.max(
          -100,
          Math.min(100, (marginCurrency.result / marginCurrency.revenue) * 100),
        )
      : 0;
  const options: ApexOptions = {
    colors: [margin >= 0 ? "#465FFF" : "#D92D20"],
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
    labels: ["Marge"],
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
              Marge opérationnelle estimée{" "}
              {marginCurrency ? `en ${marginCurrency.currency}` : ""}
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
        <div className="max-h-[330px]">
          <ReactApexChart
            options={options}
            series={[Math.abs(margin)]}
            type="radialBar"
            height={330}
          />
        </div>
        <p className="mx-auto mt-5 max-w-[380px] text-center text-sm text-gray-500">
          Résultat estimé à partir des recettes et charges enregistrées, sans
          conversion entre devises. Ce résultat ne constitue pas un bilan
          comptable légal.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 px-6 py-4 text-center sm:grid-cols-3">
        <Value
          label="Recettes"
          value={amounts(balance?.currencies ?? [], "revenue")}
        />
        <Value
          label="Charges"
          value={amounts(balance?.currencies ?? [], "expenses")}
        />
        <Value
          label="Résultat"
          value={amounts(balance?.currencies ?? [], "result")}
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
        {value || "USD 0 · CDF 0"}
      </p>
    </div>
  );
}
