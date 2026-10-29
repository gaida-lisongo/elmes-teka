import { redirect } from "next/navigation";

/**
 * Ce fichier crée un conflit de route avec (marketing)/page.tsx.
 * Supprimez ce fichier après avoir vérifié que le tableau de bord
 * fonctionne bien à /dashboard.
 */
export default function RootAdminRedirect() {
  redirect("/dashboard");
}
