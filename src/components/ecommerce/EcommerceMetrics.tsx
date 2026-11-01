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
        icon={<DollarLineIcon className="size-5 text-brand-500" />}
        iconGradient="from-brand-50 to-brand-100 dark:from-brand-500/10 dark:to-brand-400/5"
        label="CA du jour"
        value={formatAmount(todayRevenueCDF, "CDF")}
        sub={todayRevenueUSD > 0 ? formatAmount(todayRevenueUSD, "USD") : null}
        accentBorder="border-l-4 border-l-warning-400 dark:border-l-warning-500"
      />
      <KPICard
        icon={<BoxIconLine className="size-5 text-error-500" />}
        iconGradient="from-error-50 to-red-100 dark:from-error-500/10 dark:to-error-400/5"
        label="Dépenses du jour"
        value={formatAmount(todayExpenseCDF, "CDF")}
        sub={`${today.expenses.expenseCount} dépense(s)`}
      />
      <KPICard
        icon={
          netPositive ? (
            <ArrowUpIcon className="size-5 text-success-500" />
          ) : (
            <ArrowDownIcon className="size-5 text-error-500" />
          )
        }
        iconGradient={
          netPositive
            ? "from-success-50 to-green-100 dark:from-success-500/10 dark:to-success-400/5"
            : "from-error-50 to-red-100 dark:from-error-500/10 dark:to-error-400/5"
        }
        label="Résultat net du jour"
        value={formatAmount(Math.abs(todayNetCDF), "CDF")}
        valueColor={
          netPositive
            ? "text-success-600 dark:text-success-400"
            : "text-error-600 dark:text-error-400"
        }
        badge={
          netPositive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
              <ArrowUpIcon className="size-3" />
              Bénéfice
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium text-error-700 dark:bg-error-500/10 dark:text-error-400">
              <ArrowDownIcon className="size-3" />
              Déficit
            </span>
          )
        }
        sub={null}
      />
      <KPICard
        icon={<CheckLineIcon className="size-5 text-success-500" />}
        iconGradient="from-success-50 to-green-100 dark:from-success-500/10 dark:to-success-400/5"
        label="Ventes du jour"
        value={today.revenue.transactionCount.toString()}
        sub="transaction(s)"
      />
    </div>
  );
}

function KPICard({
  icon,
  iconGradient,
  label,
  value,
  valueColor,
  sub,
  badge,
  accentBorder,
}: {
  icon: ReactNode;
  iconGradient: string;
  label: string;
  value: string;
  valueColor?: string;
  sub: string | null;
  badge?: ReactNode;
  accentBorder?: string;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] dark:border-gray-700/50 dark:bg-white/[0.04] md:p-6 ${accentBorder ?? ""}`}>
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${iconGradient} shadow-sm`}
      >
        {icon}
      </div>
      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <h4
          className={`mt-1.5 tabular-nums font-bold text-title-sm ${valueColor ?? "text-gray-800 dark:text-white/90"}`}
        >
          {value}
        </h4>
        {badge && <div className="mt-2">{badge}</div>}
        {sub && !badge && (
          <p className="mt-1 tabular-nums text-xs text-gray-500 dark:text-gray-400">{sub}</p>
        )}
      </div>
    </div>
  );
}
