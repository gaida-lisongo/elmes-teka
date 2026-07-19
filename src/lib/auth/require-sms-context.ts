import { requireTenantSession } from "@/lib/auth/require-tenant";
import Promotion from "@/lib/models/Promotion";
import { Tenant } from "@/lib/models/User";

export async function requireSmsTestContext(promotionCode: string) {
  const session = await requireTenantSession();
  const code = promotionCode.trim().toUpperCase();
  if (!code) throw new Error("PROMOTION_CODE_REQUIRED");
  const [tenant, promotion] = await Promise.all([
    Tenant.findById(session.tenantId).select("slug").lean(),
    Promotion.findOne({ tenantId: session.tenantId, code, status: { $ne: "ARCHIVED" } }).select("code").lean(),
  ]);
  if (!tenant?.slug) throw new Error("TENANT_SLUG_REQUIRED");
  if (!promotion) throw new Error("PROMOTION_NOT_FOUND");
  return { ...session, tenantSlug: tenant.slug, promotionCode: promotion.code };
}
