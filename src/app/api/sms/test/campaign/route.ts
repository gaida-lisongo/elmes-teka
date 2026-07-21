import { NextRequest, NextResponse } from "next/server";

import { requireSmsTestContext } from "@/lib/auth/require-sms-context";
import { smsNotifier } from "@/lib/utils/sms";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = await requireSmsTestContext(String(body.promotionCode ?? ""));
    if (!body.name || !body.message) return NextResponse.json({ success: false, message: "name et message sont obligatoires." }, { status: 400 });
    const result = await smsNotifier.create_campaign({ name: String(body.name), message: String(body.message), tenantSlug: context.tenantSlug, promotionCode: context.promotionCode, totalRecipients: Number(body.totalRecipients) || 0, scheduledAt: body.scheduledAt ? String(body.scheduledAt) : null });
    return NextResponse.json(result, { status: result.success ? 201 : result.status || 502 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Creation de la campagne impossible." }, { status: 400 });
  }
}
