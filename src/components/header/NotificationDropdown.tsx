"use client";

import { useEffect, useState, useCallback } from "react";
import Pusher from "pusher-js";
import { BellIcon, CloseIcon, CheckCircleIcon, CloseLineIcon } from "@/icons";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { useAdminShell } from "@/context/AdminShellContext";
import {
  getTenantSupplyRequests,
  reviewSupplyRequest,
  getTenantExpenses,
  reviewExpense,
} from "@/actions/workspace.actions";

interface NotificationItem {
  id: string;
  type: "supply" | "expense";
  reference: string;
  store: string;
  detail: string;
  createdAt: string;
}

export default function NotificationDropdown() {
  const { account } = useAdminShell();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (account.type !== "TENANT") return;
    setLoading(true);
    const [supplyRes, expenseRes] = await Promise.all([
      getTenantSupplyRequests(),
      getTenantExpenses(),
    ]);
    const merged: NotificationItem[] = [
      ...(supplyRes.success
        ? supplyRes.data.map((s: any) => ({
            id: s.id,
            type: "supply" as const,
            reference: s.reference,
            store: s.store,
            detail: s.productCount + " produit(s)",
            createdAt: s.createdAt,
          }))
        : []),
      ...(expenseRes.success
        ? expenseRes.data.map((e: any) => ({
            id: e.id,
            type: "expense" as const,
            reference: e.reference,
            store: e.store,
            detail: e.totalAmount + " " + e.currency + " - " + e.lineCount + " ligne(s)",
            createdAt: e.createdAt,
          }))
        : []),
    ];
    merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setItems(merged);
    setLoading(false);
  }, [account.type]);

  useEffect(() => {
    load();
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster || !account.tenantId) return;
    const p = new Pusher(key, {
      cluster,
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
    });
    const channels = ["stocks", "commandes", "depenses"].map((resource) =>
      p.subscribe("private-tenant-" + account.tenantId + "-" + resource),
    );
    channels.forEach((channel) => channel.bind_global(() => load()));
    return () => {
      p.disconnect();
    };
  }, [account.tenantId, account.type, load]);

  const decideSupply = async (id: string, decision: "APPROVED" | "REJECTED") => {
    await reviewSupplyRequest(id, decision);
    await load();
  };

  const decideExpense = async (id: string, decision: "APPROVED" | "REJECTED") => {
    await reviewExpense(id, decision);
    await load();
  };

  if (account.type !== "TENANT") return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-white/[0.05]"
      >
        <BellIcon />
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      <Dropdown
        isOpen={open}
        onClose={() => setOpen(false)}
        className="absolute right-0 mt-3 flex max-h-[520px] w-[400px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h5 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Notifications
            </h5>
            <p className="mt-0.5 text-xs text-gray-500">
              Demandes en attente de validation
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto">
          {loading && (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              Chargement...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <BellIcon className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune demande en attente.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Les nouvelles demandes apparaitront ici.
              </p>
            </div>
          )}

          {!loading &&
            items.map((item) => (
              <div
                key={item.type + "-" + item.id}
                className="border-b border-gray-50 px-5 py-4 last:border-b-0 dark:border-gray-800/50"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                      (item.type === "supply"
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400")
                    }
                  >
                    {item.type === "supply"
                      ? "Approvisionnement"
                      : "Depense"}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {item.reference}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {item.store} - {item.detail}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      item.type === "supply"
                        ? decideSupply(item.id, "APPROVED")
                        : decideExpense(item.id, "APPROVED")
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-success-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-success-600"
                  >
                    <CheckCircleIcon className="h-3 w-3" />
                    Valider
                  </button>
                  <button
                    onClick={() =>
                      item.type === "supply"
                        ? decideSupply(item.id, "REJECTED")
                        : decideExpense(item.id, "REJECTED")
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-error-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-error-600"
                  >
                    <CloseLineIcon className="h-3 w-3" />
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
        </div>
      </Dropdown>
    </div>
  );
}