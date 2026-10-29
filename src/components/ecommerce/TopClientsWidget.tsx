import type { TopClientItem } from "@/lib/dashboard/types";

export default function TopClientsWidget({ topClients }: { topClients: TopClientItem[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white">
        Top 5 Clients
      </h3>
      {topClients.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune donnée client disponible.</p>
      ) : (
        <ul className="space-y-3">
          {topClients.map((client, index) => (
            <li key={client.clientId} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{client.name}</p>
                  <p className="text-xs text-gray-400">{client.phone} · {client.orderCount} commande{client.orderCount > 1 ? "s" : ""}</p>
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                {client.totalRevenue.toLocaleString("fr-FR")} {client.currency}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
