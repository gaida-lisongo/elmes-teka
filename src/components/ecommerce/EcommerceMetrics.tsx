import { BoxIconLine, DollarLineIcon } from "@/icons";
import type { DashboardData } from "@/lib/dashboard/types";
import type { ReactNode } from "react";

const format = (totals: Array<{ currency: string; amount: number }>) =>
  totals.length
    ? totals
        .map(
          (item) => `${item.currency} ${item.amount.toLocaleString("fr-FR")}`,
        )
        .join(" · ")
    : "USD 0 · CDF 0";

export function EcommerceMetrics({
  metrics,
}: {
  metrics: DashboardData["metrics"];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      <Metric
        icon={
          <DollarLineIcon className="size-6 text-gray-800 dark:text-white/90" />
        }
        label="Chiffre d’affaires"
        value={format(metrics.revenue.totals)}
        detail={`${metrics.revenue.transactionCount} transaction(s) valide(s)`}
      />
      <Metric
        icon={
          <BoxIconLine className="size-6 text-gray-800 dark:text-white/90" />
        }
        label="Charges"
        value={format(metrics.expenses.totals)}
        detail={`${metrics.expenses.expenseCount} dépense(s) approuvée(s)`}
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
