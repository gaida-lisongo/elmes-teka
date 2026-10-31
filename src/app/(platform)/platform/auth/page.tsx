import { signInWithMagicLink } from "@/actions/platform.actions";
import SubmitButton from "./SubmitButton";

/*
 * Le lien du mail arrive ici (GET) sans être consommé : certaines messageries
 * ouvrent les liens automatiquement. La connexion se fait au clic (POST).
 */
export default async function PlatformAuthPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        action={signInWithMagicLink}
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8"
      >
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Connexion administrateur</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Confirmez pour ouvrir le dashboard de la plateforme.</p>
        <input type="hidden" name="token" value={token} />
        <SubmitButton />
      </form>
    </div>
  );
}
