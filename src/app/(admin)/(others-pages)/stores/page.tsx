import { redirect } from "next/navigation";
import { getTenantSession } from "@/lib/auth/require-tenant";
import { getStores, getStoreMetrics } from "@/actions/stores.actions";
import StoresClient from "./StoresClient";

export const metadata = {
  title: "Points de vente | ELMES-TEKA",
  description: "Gestion des points de vente",
};

export default async function StoresPage(props: {
  searchParams?: Promise<{ page?: string; limit?: string; search?: string; status?: string }>;
}) {
  const session = await getTenantSession();
  if (!session) redirect("/signin");

  const sp = await props.searchParams;
  const page = parseInt(sp?.page ?? "1", 10) || 1;
  const limit = parseInt(sp?.limit ?? "12", 10) || 12;
  const search = sp?.search ?? "";
  const status = sp?.status ?? "";

  const [metricsResult, storesResult] = await Promise.all([
    getStoreMetrics(),
    getStores(page, limit, search, status),
  ]);

  return (
    <StoresClient
      initialData={storesResult.success ? storesResult.data : null}
      initialMetrics={metricsResult.success ? metricsResult.data : null}
      currentPage={page}
      currentLimit={limit}
      currentSearch={search}
      currentStatus={status}
    />
  );
}