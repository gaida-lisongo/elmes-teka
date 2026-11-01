import { getTenants } from "@/lib/platform/data";
import TenantsClient from "./TenantsClient";

export const dynamic = "force-dynamic";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page = "1", q = "" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const { rows, total } = await getTenants(pageNum, q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Gestion des comptes</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total} entreprise{total !== 1 ? "s" : ""} inscrite{total !== 1 ? "s" : ""}
        </p>
      </div>
      <TenantsClient rows={rows} total={total} page={pageNum} search={q} perPage={20} />
    </div>
  );
}
