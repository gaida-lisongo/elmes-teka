import { redirect } from "next/navigation";
import { getTenantSession } from "@/lib/auth/require-tenant";
import { getSalers, getSalerMetrics } from "@/actions/agents.actions";
import { getTenantStoresForSelect } from "@/actions/agents.actions";
import AgentsClient from "./AgentsClient";

export const metadata = {
  title: "Agents | ELMES-TEKA",
  description: "Gestion des agents commerciaux",
};

export default async function AgentsPage(props: {
  searchParams?: Promise<{ page?: string; limit?: string; search?: string; status?: string }>;
}) {
  const session = await getTenantSession();
  if (!session) redirect("/signin");

  const sp = await props.searchParams;
  const page = parseInt(sp?.page ?? "1", 10) || 1;
  const limit = parseInt(sp?.limit ?? "12", 10) || 12;
  const search = sp?.search ?? "";
  const status = sp?.status ?? "";

  const [metricsResult, salersResult, storesResult] = await Promise.all([
    getSalerMetrics(),
    getSalers(page, limit, search, status),
    getTenantStoresForSelect(),
  ]);

  return (
    <AgentsClient
      initialData={salersResult.success ? salersResult.data : null}
      initialMetrics={metricsResult.success ? metricsResult.data : null}
      stores={storesResult.success ? storesResult.data : []}
      currentPage={page}
      currentLimit={limit}
      currentSearch={search}
      currentStatus={status}
    />
  );
}