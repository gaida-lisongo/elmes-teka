import { redirect } from "next/navigation";

import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import LiquiditesClient from "./LiquiditesClient";

// @ts-ignore – actions créées par Agent 2
import { getLiquidites } from "@/actions/liquidites.actions";

export default async function LiquiditesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const shell = await getAdminShellAccount();
  if (!shell) redirect("/signin");

  const { slug } = await params;

  let initialData = null;
  try {
    const result = await getLiquidites(slug);
    if (result.success) initialData = result.data;
    else redirect("/");
  } catch {
    /* actions pas encore disponibles – sera résolu après merge Agent 2 */
  }

  return <LiquiditesClient slug={slug} initialData={initialData} role={shell.account.type} />;
}
