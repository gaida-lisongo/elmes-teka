import { redirect } from "next/navigation";

import { getTenantPromotionWorkspace } from "@/actions/promotions.actions";
import { requireTenantSession } from "@/lib/auth/require-tenant";
import ClientsClient from "./ClientsClient";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string }> }) {
  try { await requireTenantSession(); } catch { redirect("/"); }
  const params = await searchParams;
  const data = await getTenantPromotionWorkspace(Number(params.page) || 1, params.search ?? "");
  return <ClientsClient initialData={data} />;
}
