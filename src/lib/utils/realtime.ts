import Pusher from "pusher";

let client: Pusher | null = null;

function getPusher() {
  if (client) return client;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) return null;
  client = new Pusher({ appId: PUSHER_APP_ID, key: PUSHER_KEY, secret: PUSHER_SECRET, cluster: PUSHER_CLUSTER, useTLS: true });
  return client;
}

export async function publishTenantEvent(tenantId: string, resource: "commandes" | "depenses" | "stocks", event: string, payload: Record<string, unknown>) {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    await pusher.trigger(`private-tenant-${tenantId}-${resource}`, event, payload);
  } catch (error) {
    console.error("PUSHER_EVENT_ERROR", { resource, event, error });
  }
}
