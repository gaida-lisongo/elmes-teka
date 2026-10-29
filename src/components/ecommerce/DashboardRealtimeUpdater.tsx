"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { useAdminShell } from "@/context/AdminShellContext";

export default function DashboardRealtimeUpdater() {
  const { account } = useAdminShell();
  const router = useRouter();

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

    const channel = p.subscribe("private-tenant-" + account.tenantId + "-commandes");
    channel.bind("commande.created", () => {
      router.refresh();
    });

    return () => {
      p.disconnect();
    };
  }, [account.tenantId, router]);

  return null;
}
