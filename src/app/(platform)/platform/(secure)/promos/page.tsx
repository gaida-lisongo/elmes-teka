import { getPlatformPromos } from "@/lib/platform/data";
import PromosClient from "./PromosClient";

export const dynamic = "force-dynamic";

export default async function PlatformPromosPage() {
  const promos = await getPlatformPromos();
  return <PromosClient promos={promos} />;
}
