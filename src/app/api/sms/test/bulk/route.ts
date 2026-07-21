import { NextRequest, NextResponse } from "next/server";

import { requireSmsTestContext } from "@/lib/auth/require-sms-context";
import { smsNotifier } from "@/lib/utils/sms";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = await requireSmsTestContext(String(body.promotionCode ?? ""));
    if (!body.name || !body.message || !Array.isArray(body.contacts) || !body.contacts.length) return NextResponse.json({ success: false, message: "name, message et contacts sont obligatoires." }, { status: 400 });
    if (body.contacts.length > 500) return NextResponse.json({ success: false, message: "Le test bulk est limite a 500 contacts." }, { status: 400 });
    const contacts = body.contacts.map((contact: any) => ({ name: contact.name ? String(contact.name) : undefined, phone: String(contact.phone ?? "") }));
    if (contacts.some((contact: { phone: string }) => !contact.phone)) return NextResponse.json({ success: false, message: "Chaque contact doit posseder un telephone." }, { status: 400 });
    const result = await smsNotifier.send_bulk({ name: String(body.name), message: String(body.message), contacts, tenantSlug: context.tenantSlug, promotionCode: context.promotionCode, scheduledAt: body.scheduledAt ? String(body.scheduledAt) : null });
    const status = result.success ? 201 : result.campaign?.status || 502;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Envoi bulk impossible." }, { status: 400 });
  }
}
