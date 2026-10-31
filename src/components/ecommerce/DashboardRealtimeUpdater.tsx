"use client";

import { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { useAdminShell } from "@/context/AdminShellContext";

/** Rafraîchit la page (ou appelle onEvent) quand l'événement Pusher du tenant arrive. */
export default function DashboardRealtimeUpdater({
  resource = "commandes",
  event = "commande.created",
  onEvent,
}: {
  resource?: string;
  event?: string;
  onEvent?: () => void;
} = {}) {
  const { account } = useAdminShell();
  const router = useRouter();
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
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

    const channel = p.subscribe("private-tenant-" + account.tenantId + "-" + resource);
    channel.bind(event, () => {
      if (onEventRef.current) onEventRef.current();
      else router.refresh();
    });

    return () => {
      p.disconnect();
    };
  }, [account.tenantId, router, resource, event]);

  return null;
}
