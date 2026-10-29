import { redirect } from "next/navigation";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import ImmobilisationsClient from "./ImmobilisationsClient";

// @ts-ignore – actions créées par Agent 2
import { getImmobilisations } from "@/actions/immobilisations.actions";

export default async function ImmobilisationsPage() {
  try {
    await requireTenantSession();
  } catch {
    redirect("/");
  }

  let initialData = null;
  try {
    const result = await getImmobilisations();
    if (result.success) initialData = result.data;
  } catch {
    /* actions pas encore disponibles – sera résolu après merge Agent 2 */
  }

  return <ImmobilisationsClient initialData={initialData} />;
}
