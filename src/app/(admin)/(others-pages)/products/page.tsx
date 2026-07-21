import { redirect } from "next/navigation";
import { getTenantSession } from "@/lib/auth/require-tenant";
import { getProducts, getProductMetrics } from "@/actions/products.actions";
import ProductsClient from "./ProductsClient";

export const metadata = {
  title: "Produits | ELMES-TEKA",
  description: "Gestion des produits et services",
};

export default async function ProductsPage(props: {
  searchParams?: Promise<{ page?: string; limit?: string; search?: string; status?: string }>;
}) {
  const session = await getTenantSession();
  if (!session) redirect("/signin");

  const sp = await props.searchParams;
  const page = parseInt(sp?.page ?? "1", 10) || 1;
  const limit = parseInt(sp?.limit ?? "12", 10) || 12;
  const search = sp?.search ?? "";
  const status = sp?.status ?? "";

  const [metricsResult, productsResult] = await Promise.all([
    getProductMetrics(),
    getProducts(page, limit, search, status),
  ]);

  return (
    <ProductsClient
      initialData={productsResult.success ? productsResult.data : null}
      initialMetrics={metricsResult.success ? metricsResult.data : null}
      currentPage={page}
      currentLimit={limit}
      currentSearch={search}
      currentStatus={status}
    />
  );
}