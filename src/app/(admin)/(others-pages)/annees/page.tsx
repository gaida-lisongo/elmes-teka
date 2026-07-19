import { redirect } from "next/navigation";
import { getTenantSession } from "@/lib/auth/require-tenant";
import { getAnnees, getAnneeMetrics } from "@/actions/annees.actions";
import AnneesClient from "./AnneesClient";

export const metadata = {
  title: "Exercices | ELMES-TEKA",
  description: "Gestion des exercices comptables",
};

export default async function AnneesPage(props: {
  searchParams?: Promise<{ page?: string; limit?: string }>;
}) {
  const session = await getTenantSession();
  if (!session) redirect("/signin");

  const sp = await props.searchParams;
  const page = parseInt(sp?.page ?? "1", 10) || 1;
  const limit = parseInt(sp?.limit ?? "12", 10) || 12;

  const [metricsResult, anneesResult] = await Promise.all([
    getAnneeMetrics(),
    getAnnees(page, limit),
  ]);

  return (
    <AnneesClient
      initialData={anneesResult.success ? anneesResult.data : null}
      initialMetrics={metricsResult.success ? metricsResult.data : null}
      currentPage={page}
      currentLimit={limit}
    />
  );
}