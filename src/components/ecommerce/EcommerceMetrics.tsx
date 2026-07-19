import { BoxIconLine, DollarLineIcon } from "@/icons";
import type { DashboardData } from "@/lib/dashboard/types";
import type { ReactNode } from "react";

function formatAmount(amount: number, currency: string) {
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toLocaleString("fr-FR")} FC`;
}

export function EcommerceMetrics({
  metrics,
}: {
  metrics: DashboardData["metrics"];
}) {
  const revenueUSD =
    metrics.revenue.totals.find((t) => t.currency === "USD")?.amount ?? 0;
  const revenueCDF =
    metrics.revenue.totals.find((t) => t.currency === "CDF")?.amount ?? 0;
  const expensesCDF =
    metrics.expenses.totals.find((t) => t.currency === "CDF")?.amount ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      <Metric
        icon={
          <DollarLineIcon className="size-6 text-gray-800 dark:text-white/90" />
        }
        label="Chiffre d'affaires (CDF)"
        value={formatAmount(revenueCDF, "CDF")}
        detail={`${metrics.revenue.transactionCount} transaction(s)`}
      />
      <Metric
        icon={
          <DollarLineIcon className="size-6 text-gray-800 dark:text-white/90" />
        }
        label="Chiffre d'affaires (USD)"
        value={formatAmount(revenueUSD, "USD")}
        detail={`${metrics.revenue.transactionCount} transaction(s)`}
      />
      <Metric
        icon={
          <BoxIconLine className="size-6 text-gray-800 dark:text-white/90" />
        }
        label="Depenses (CDF)"
        value={formatAmount(expensesCDF, "CDF")}
        detail={`${metrics.expenses.expenseCount} depense(s)`}
      />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
        {icon}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {value}
        </h4>
        <p className="mt-2 text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  );
}
