import { redirect } from "next/navigation";
import {
  getWorkspaceHeader,
  listSales,
} from "@/actions/workspace.actions";
import SalesClient from "./SalesClient";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const [header, sales] = await Promise.all([
    getWorkspaceHeader(slug),
    listSales(slug, Number(sp.page) || 1, sp.search ?? "", sp.status ?? ""),
  ]);
  if (!header.success) redirect("/");
  const taux = Number(process.env.TAUX) || 0;
  const exchange = Number(process.env.EXCHANGE) || 0;
  return (
    <SalesClient
      slug={slug}
      header={header.data}
      initialSales={sales.success ? sales.data : null}
      taux={taux}
      exchange={exchange}
    />
  );
}
