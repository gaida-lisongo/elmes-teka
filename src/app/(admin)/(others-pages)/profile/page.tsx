import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profil | ELMES-TEKA",
  description: "Gerer votre profil ELMES-TEKA",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/signin");

  return <ProfileClient session={session} />;
}
