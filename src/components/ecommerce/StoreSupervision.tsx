import type { StoreMetric } from "@/lib/dashboard/types";

function formatRevenue(totals: { currency: string; amount: number }[]) {
  if (!totals.length) return "—";
  return totals
    .map((t) =>
      t.currency === "USD"
        ? `$${t.amount.toFixed(2)}`
        : `${t.amount.toLocaleString("fr-FR")} FC`,
    )
    .join(" · ");
}

export function StoreSupervision({ stores }: { stores: StoreMetric[] }) {
  if (!stores.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Supervision des boutiques — aujourd&apos;hui
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Performance en temps réel par point de vente
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]">
            <tr>
              {["Boutique", "CA du jour", "Ventes", "Vendeurs actifs"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {stores.map((store, idx) => (
              <tr
                key={store.storeId}
                className={`transition-colors duration-150 hover:bg-brand-25 dark:hover:bg-white/[0.03] ${idx % 2 === 1 ? "bg-gray-50/50 dark:bg-white/[0.01]" : ""}`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      {store.designation.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {store.designation}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-semibold text-brand-600 dark:text-brand-400">
                  {formatRevenue(store.todayRevenue)}
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {store.todayOrderCount} vente{store.todayOrderCount !== 1 ? "s" : ""}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {store.activeSalersToday > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-500" />
                      {store.activeSalersToday} actif
                      {store.activeSalersToday > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Inactif
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
