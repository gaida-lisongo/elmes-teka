import SignInForm from "@/components/auth/SignInForm";
import { getAdminShellAccount } from "@/lib/auth/admin-shell";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Connexion | ELMES-TEKA",
  description: "Connexion a ELMES-TEKA.",
};

export default async function SignIn() {
  const shell = await getAdminShellAccount();

  if (shell) {
    redirect("/");
  }

  return <SignInForm />;
}
