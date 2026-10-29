import { redirect } from "next/navigation";

import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import CreancesClient from "./CreancesClient";

// @ts-ignore – actions créées par Agent 2
import { getCreances } from "@/actions/creances.actions";

export default async function CreancesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const shell = await getAdminShellAccount();
  if (!shell) redirect("/signin");

  const { slug } = await params;

  let initialData = null;
  try {
    const result = await getCreances(slug);
    if (result.success) initialData = result.data;
    else redirect("/");
  } catch {
    /* actions pas encore disponibles – sera résolu après merge Agent 2 */
  }

  return <CreancesClient slug={slug} initialData={initialData} role={shell.account.type} />;
}
