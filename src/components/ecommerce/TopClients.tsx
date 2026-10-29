import type { TopClientItem } from "@/lib/dashboard/types";

function formatRevenue(amount: number, currency: string) {
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toLocaleString("fr-FR")} FC`;
}

export function TopClients({ clients }: { clients: TopClientItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Top clients par chiffre d&apos;affaires
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">5 meilleurs clients</p>
      </div>
      {!clients.length ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Aucune transaction client enregistrée.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {clients.map((client, i) => (
            <li
              key={`${client.clientId}-${i}`}
              className="flex items-center gap-4 px-6 py-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                #{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800 dark:text-white/90">
                  {client.name}
                </p>
                <p className="text-xs text-gray-500">
                  {client.phone || "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800 dark:text-white/90">
                  {formatRevenue(client.totalRevenue, client.currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {client.orderCount} commande(s)
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
