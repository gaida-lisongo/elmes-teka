import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/auth/platform-admin";
import PlatformLoginForm from "@/components/platform/PlatformLoginForm";

export default async function PlatformLoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await getPlatformAdmin()) redirect("/platform");
  const { expired } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Administration ELMES-TEKA</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Saisissez votre adresse administrateur : vous recevrez un lien de connexion par e-mail.
        </p>
        {expired && (
          <p className="mt-4 rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
            Ce lien a expire ou a deja ete utilise. Demandez-en un nouveau.
          </p>
        )}
        <PlatformLoginForm />
      </div>
    </div>
  );
}
