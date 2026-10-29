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
            {stores.map((store) => (
              <tr
                key={store.storeId}
                className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3 font-medium text-gray-800 dark:text-white/90">
                  {store.designation}
                </td>
                <td className="px-5 py-3 font-semibold text-brand-600 dark:text-brand-400">
                  {formatRevenue(store.todayRevenue)}
                </td>
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                  {store.todayOrderCount}
                </td>
                <td className="px-5 py-3">
                  {store.activeSalersToday > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
                      {store.activeSalersToday} actif
                      {store.activeSalersToday > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      Aucun
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
