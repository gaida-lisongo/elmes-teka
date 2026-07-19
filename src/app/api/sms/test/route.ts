import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import { smsNotifier } from "@/lib/utils/sms";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenantSession();
    const phone = request.nextUrl.searchParams.get("phone")?.trim() ?? "";
    if (!phone) return NextResponse.json({ success: false, message: "Le parametre query phone est obligatoire." }, { status: 400 });

    const result = await smsNotifier.send_simple({
      phone,
      message: "ELMES-TEKA : votre service de notification SMS est correctement configure.",
      clientReference: `sms-test-${session.tenantId}-${Date.now()}`,
    });
    return NextResponse.json(result, { status: result.success ? 202 : result.status || 502 });
  } catch (error: any) {
    const forbidden = ["SESSION_REQUIRED", "FORBIDDEN_TENANT_ONLY", "INVALID_TENANT", "TENANT_INACTIVE"].includes(error.message);
    return NextResponse.json({ success: false, message: forbidden ? "Acces reserve au tenant actif." : error.message || "Test SMS impossible." }, { status: forbidden ? 403 : 500 });
  }
}
