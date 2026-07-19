import { NextResponse } from "next/server";
import Pusher from "pusher";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channelName = String(form.get("channel_name") ?? "");
  if (!channelName.startsWith(`private-tenant-${session.tenantId}-`)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const pusher = new Pusher({ appId: process.env.PUSHER_APP_ID!, key: process.env.PUSHER_KEY!, secret: process.env.PUSHER_SECRET!, cluster: process.env.PUSHER_CLUSTER!, useTLS: true });
  return NextResponse.json(pusher.authorizeChannel(socketId, channelName));
}
