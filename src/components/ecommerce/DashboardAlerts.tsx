import { AlertIcon, TimeIcon, BoxIconLine } from "@/icons";
import type { DashboardAlert } from "@/lib/dashboard/types";

const typeConfig: Record<
  DashboardAlert["type"],
  { Icon: React.ElementType; label: string }
> = {
  pending_orders: { Icon: TimeIcon, label: "Commandes" },
  supply_requests: { Icon: BoxIconLine, label: "Approvisionnements" },
};

export function DashboardAlerts({ alerts }: { alerts: DashboardAlert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert, i) => {
        const { Icon } = typeConfig[alert.type];
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/30 dark:bg-warning-500/10"
          >
            <AlertIcon className="size-4 shrink-0 text-warning-600 dark:text-warning-400" />
            <Icon className="size-4 shrink-0 text-warning-600 dark:text-warning-400" />
            <p className="text-sm font-medium text-warning-700 dark:text-warning-300">
              {alert.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
