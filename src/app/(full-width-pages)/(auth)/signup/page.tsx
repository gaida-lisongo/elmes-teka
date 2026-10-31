import { isPlan } from "@/lib/payments/plans";
import SignUpForm from "@/components/auth/SignUpForm";
import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Inscription entrepreneur | ELMES-TEKA",
  description: "Creation d'un compte entrepreneur ELMES-TEKA.",
};

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; code?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const shell = await getAdminShellAccount();

  if (shell) {
    redirect(shell.account.type === "TENANT" && isPlan(params.plan) ? `/annees?plan=${params.plan}` : "/dashboard");
  }

  const initialCode = (params.ref ?? params.code ?? "").trim().toUpperCase().slice(0, 30);

  const initialPlan = isPlan(params.plan) ? params.plan : "STARTER";

  return <SignUpForm initialCode={initialCode} initialPlan={initialPlan} />;
}
