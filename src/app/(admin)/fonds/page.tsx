import { redirect } from "next/navigation";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import FondsClient from "./FondsClient";

// @ts-ignore – actions créées par Agent 2
import { getFonds } from "@/actions/fonds.actions";

export default async function FondsPage() {
  try {
    await requireTenantSession();
  } catch {
    redirect("/");
  }

  let initialData = null;
  try {
    const result = await getFonds();
    if (result.success) initialData = result.data;
  } catch {
    /* actions pas encore disponibles – sera résolu après merge Agent 2 */
  }

  return <FondsClient initialData={initialData} />;
}
