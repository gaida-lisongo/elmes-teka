"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { useTheme } from "@/context/ThemeContext";
import type {
  DashboardChartSeries,
  ExerciseOption,
} from "@/lib/dashboard/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function MonthlySalesChart({
  series,
  exercises,
  selected,
}: {
  series: DashboardChartSeries[];
  exercises: ExerciseOption[];
  selected: string | null;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const reducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  const change = (value: string) => {
    const params = new URLSearchParams(search.toString());
    params.set("chartAnnee", value);
    startTransition(() => router.push(`/?${params.toString()}`));
  };
  const options: ApexOptions = {
    colors: ["#124A99", "#12b76a"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
      background: "transparent",
      animations: { enabled: !reducedMotion.current },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.3,
        opacityFrom: 0.9,
        opacityTo: 0.6,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ["transparent"] },
    xaxis: {
      categories: [
        "Jan",
        "Fév",
        "Mar",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Août",
        "Sep",
        "Oct",
        "Nov",
        "Déc",
      ],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: "12px", colors: isDark ? "#6b7280" : "#9ca3af" },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: isDark ? "#6b7280" : "#9ca3af" },
        formatter: (value: number) =>
          value >= 1000
            ? `${(value / 1000).toFixed(0)}k`
            : value.toString(),
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontSize: "13px",
      markers: { size: 8 },
      labels: { colors: isDark ? "#d1d5db" : "#374151" },
    },
    grid: {
      borderColor: isDark ? "#1f2937" : "#f3f4f6",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "13px" },
      y: {
        formatter: (value: number, context) =>
          `${value.toLocaleString("fr-FR")} ${series[context.seriesIndex]?.currency ?? ""}`,
      },
    },
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Évolution mensuelle du chiffre d'affaires
          </h3>
          {pending && <p className="text-xs text-brand-500">Chargement...</p>}
        </div>
        <select
          value={selected ?? ""}
          onChange={(event) => change(event.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          {exercises.map((year) => (
            <option key={year.id} value={year.id}>
              {year.label}
            </option>
          ))}
        </select>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] pl-2 xl:min-w-full">
          <ReactApexChart
            options={options}
            series={series.map((item) => ({
              name: item.name,
              data: item.data,
            }))}
            type="bar"
            height={180}
          />
        </div>
      </div>
    </div>
  );
}
