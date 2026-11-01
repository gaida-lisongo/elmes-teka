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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* CA du jour — accent warning */}
      <KPICard
        icon={<DollarLineIcon className="size-4 text-warning-600 dark:text-warning-400" />}
        iconBg="bg-warning-50 dark:bg-warning-500/10"
        label="CA du jour"
        value={formatAmount(todayRevenueCDF, "CDF")}
        valueColor="text-gray-900 dark:text-white"
        sub={todayRevenueUSD > 0 ? `≈ ${formatAmount(todayRevenueUSD, "USD")}` : null}
        accent="border-l-[3px] border-l-warning-400 dark:border-l-warning-500"
      />

      {/* Dépenses */}
      <KPICard
        icon={<BoxIconLine className="size-4 text-error-500 dark:text-error-400" />}
        iconBg="bg-error-50 dark:bg-error-500/10"
        label="Dépenses du jour"
        value={formatAmount(todayExpenseCDF, "CDF")}
        valueColor="text-gray-900 dark:text-white"
        sub={`${today.expenses.expenseCount} dépense(s)`}
      />

      {/* Résultat net */}
      <KPICard
        icon={
          netPositive
            ? <ArrowUpIcon className="size-4 text-success-600 dark:text-success-400" />
            : <ArrowDownIcon className="size-4 text-error-500 dark:text-error-400" />
        }
        iconBg={
          netPositive
            ? "bg-success-50 dark:bg-success-500/10"
            : "bg-error-50 dark:bg-error-500/10"
        }
        label="Résultat net"
        value={formatAmount(Math.abs(todayNetCDF), "CDF")}
        valueColor={
          netPositive
            ? "text-success-700 dark:text-success-400"
            : "text-error-600 dark:text-error-400"
        }
        badge={
          netPositive ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-1.5 py-0.5 text-[11px] font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
              Bénéfice
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-error-50 px-1.5 py-0.5 text-[11px] font-medium text-error-700 dark:bg-error-500/10 dark:text-error-400">
              <span className="h-1.5 w-1.5 rounded-full bg-error-500" />
              Déficit
            </span>
          )
        }
        sub={null}
      />

      {/* Ventes */}
      <KPICard
        icon={<CheckLineIcon className="size-4 text-brand-500 dark:text-brand-400" />}
        iconBg="bg-brand-50 dark:bg-brand-500/10"
        label="Ventes du jour"
        value={today.revenue.transactionCount.toString()}
        valueColor="text-gray-900 dark:text-white"
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
  badge,
  accent,
}: {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor: string;
  sub: string | null;
  badge?: ReactNode;
  accent?: string;
}) {
  return (
    <div
      className={[
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-5",
        "transition-shadow duration-200 hover:shadow-sm",
        "dark:border-gray-800 dark:bg-white/[0.03]",
        accent ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </span>
      </div>

      {/* Value */}
      <div>
        <p
          className={`tabular-nums text-2xl font-bold leading-none tracking-tight ${valueColor}`}
        >
          {value}
        </p>
        {badge && <div className="mt-2">{badge}</div>}
        {sub && !badge && (
          <p className="mt-1.5 tabular-nums text-xs text-gray-400 dark:text-gray-500">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
