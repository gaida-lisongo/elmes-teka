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
          {clients.map((client, i) => {
            const initials = client.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w.charAt(0).toUpperCase())
              .join("");
            const rankColors = [
              "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
              "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
              "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
            ];
            const rankColor = rankColors[i] ?? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400";
            return (
              <li
                key={`${client.clientId}-${i}`}
                className="flex items-center gap-3 px-6 py-3.5 transition-colors duration-150 hover:bg-brand-25 dark:hover:bg-white/[0.02]"
              >
                <div className="relative shrink-0">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-sm font-bold text-brand-700 dark:from-brand-500/20 dark:to-brand-400/10 dark:text-brand-300">
                    {initials || "?"}
                  </span>
                  <span className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${rankColor}`}>
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-800 dark:text-white/90">
                    {client.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {client.phone || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums font-semibold text-gray-800 dark:text-white/90">
                    {formatRevenue(client.totalRevenue, client.currency)}
                  </p>
                  <p className="tabular-nums text-xs text-gray-500">
                    {client.orderCount} commande{client.orderCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
