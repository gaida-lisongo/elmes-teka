import {
  DollarLineIcon,
  BoxIconLine,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckLineIcon,
} from "@/icons";
import type { DashboardData } from "@/lib/dashboard/types";
import type { ReactNode } from "react";

function formatAmount(amount: number, currency: string) {
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toLocaleString("fr-FR")} FC`;
}

export function EcommerceMetrics({
  today,
}: {
  today: DashboardData["today"];
}) {
  const todayRevenueCDF =
    today.revenue.totals.find((t) => t.currency === "CDF")?.amount ?? 0;
  const todayRevenueUSD =
    today.revenue.totals.find((t) => t.currency === "USD")?.amount ?? 0;
  const todayExpenseCDF =
    today.expenses.totals.find((t) => t.currency === "CDF")?.amount ?? 0;
  const todayNetCDF = todayRevenueCDF - todayExpenseCDF;
  const netPositive = todayNetCDF >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      <KPICard
        icon={<DollarLineIcon className="size-6 text-brand-500" />}
        iconBg="bg-brand-50 dark:bg-brand-500/10"
        label="CA du jour"
        value={formatAmount(todayRevenueCDF, "CDF")}
        sub={todayRevenueUSD > 0 ? formatAmount(todayRevenueUSD, "USD") : null}
      />
      <KPICard
        icon={<BoxIconLine className="size-6 text-error-500" />}
        iconBg="bg-error-50 dark:bg-error-500/10"
        label="Dépenses du jour"
        value={formatAmount(todayExpenseCDF, "CDF")}
        sub={`${today.expenses.expenseCount} dépense(s)`}
      />
      <KPICard
        icon={
          netPositive ? (
            <ArrowUpIcon className="size-6 text-success-500" />
          ) : (
            <ArrowDownIcon className="size-6 text-error-500" />
          )
        }
        iconBg={
          netPositive
            ? "bg-success-50 dark:bg-success-500/10"
            : "bg-error-50 dark:bg-error-500/10"
        }
        label="Résultat net du jour"
        value={formatAmount(Math.abs(todayNetCDF), "CDF")}
        valueColor={
          netPositive
            ? "text-success-600 dark:text-success-400"
            : "text-error-600 dark:text-error-400"
        }
        sub={netPositive ? "Bénéfice" : "Déficit"}
      />
      <KPICard
        icon={<CheckLineIcon className="size-6 text-success-500" />}
        iconBg="bg-success-50 dark:bg-success-500/10"
        label="Ventes du jour"
        value={today.revenue.transactionCount.toString()}
        sub="transaction(s)"
      />
    </div>
  );
}

function KPICard({
  icon,
  iconBg,
  label,
  value,
  valueColor,
  sub,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
  sub: string | null;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <h4
          className={`mt-2 font-bold text-title-sm ${valueColor ?? "text-gray-800 dark:text-white/90"}`}
        >
          {value}
        </h4>
        {sub && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>
        )}
      </div>
    </div>
  );
}
