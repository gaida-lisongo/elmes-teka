import { notFound, redirect } from "next/navigation";

import { getPromotionAudience } from "@/actions/promotions.actions";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import PromotionAudienceClient from "./PromotionAudienceClient";

export default async function PromotionPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ page?: string; search?: string }> }) {
  try { await requireTenantSession(); } catch { redirect("/"); }
  const [{ code }, query] = await Promise.all([params, searchParams]);
  const data = await getPromotionAudience(decodeURIComponent(code), Number(query.page) || 1, query.search ?? "");
  if (!data) notFound();
  return <PromotionAudienceClient initialData={data} />;
}
