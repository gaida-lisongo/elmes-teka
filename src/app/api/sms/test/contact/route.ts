import { NextRequest, NextResponse } from "next/server";

import { requireSmsTestContext } from "@/lib/auth/require-sms-context";
import { smsNotifier } from "@/lib/utils/sms";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const context = await requireSmsTestContext(String(body.promotionCode ?? ""));
    if (!body.phone) return NextResponse.json({ success: false, message: "phone est obligatoire." }, { status: 400 });
    const result = await smsNotifier.create_contact({ name: body.name ? String(body.name) : undefined, phone: String(body.phone), tenantSlug: context.tenantSlug, promotionCode: context.promotionCode });
    return NextResponse.json(result, { status: result.success ? 200 : result.status || 502 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Creation du contact impossible." }, { status: 400 });
  }
}
