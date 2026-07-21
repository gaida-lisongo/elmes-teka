import { redirect } from "next/navigation";
import {
  getWorkspaceHeader,
  listSupplyRequests,
  getSaleProducts,
} from "@/actions/workspace.actions";
import StocksClient from "./StocksClient";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const [h, d, p] = await Promise.all([
    getWorkspaceHeader(slug),
    listSupplyRequests(slug, Number(sp.page) || 1),
    getSaleProducts(slug),
  ]);
  if (!h.success) redirect("/");
  const taux = Number(process.env.TAUX) || 0;
  const exchange = Number(process.env.EXCHANGE) || 0;
  return (
    <StocksClient
      slug={slug}
      header={h.data}
      initialData={d.success ? d.data : null}
      products={p.success ? p.data : []}
      taux={taux}
      exchange={exchange}
    />
  );
}
