import { redirect } from "next/navigation";

import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import DettesClient from "./DettesClient";

// @ts-ignore – actions créées par Agent 2
import { getDettes } from "@/actions/dettes.actions";

export default async function DettesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const shell = await getAdminShellAccount();
  if (!shell) redirect("/signin");

  const { slug } = await params;

  let initialData = null;
  try {
    const result = await getDettes(slug);
    if (result.success) initialData = result.data;
    else redirect("/");
  } catch {
    /* actions pas encore disponibles – sera résolu après merge Agent 2 */
  }

  return <DettesClient slug={slug} initialData={initialData} role={shell.account.type} />;
}
