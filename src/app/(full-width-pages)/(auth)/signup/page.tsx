import SignUpForm from "@/components/auth/SignUpForm";
import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Inscription entrepreneur | ELMES-TEKA",
  description: "Creation d'un compte entrepreneur ELMES-TEKA.",
};

export default async function SignUp() {
  const shell = await getAdminShellAccount();

  if (shell) {
    redirect("/");
  }

  return <SignUpForm />;
}
