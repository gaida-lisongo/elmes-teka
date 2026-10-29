import { redirect } from "next/navigation";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import JournalClient from "./JournalClient";

// @ts-ignore – actions créées par Agent 2
import { getJournalOperations } from "@/actions/comptabilite.actions";

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  try {
    await requireTenantSession();
  } catch {
    redirect("/");
  }

  const sp = await searchParams;

  let initialData = null;
  try {
    const result = await getJournalOperations(
      Number(sp.page) || 1,
      sp.type ?? ""
    );
    if (result.success) initialData = result.data;
  } catch {
    /* actions pas encore disponibles – sera résolu après merge Agent 2 */
  }

  return <JournalClient initialData={initialData} />;
}
