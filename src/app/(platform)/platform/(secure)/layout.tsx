import Link from "next/link";
import { logoutPlatformAdmin } from "@/actions/platform.actions";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";

export default async function PlatformSecureLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformAdmin();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="text-base font-semibold text-gray-800 dark:text-white/90">ELMES-TEKA · Plateforme</span>
            <nav className="flex gap-1 text-sm">
              <Link href="/platform" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                Supervision
              </Link>
              <Link href="/platform/promos" className="rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                Codes promo
              </Link>
            </nav>
          </div>
          <form action={logoutPlatformAdmin} className="flex items-center gap-3 text-sm text-gray-500">
            <span className="hidden sm:inline">{admin.email}</span>
            <button type="submit" className="rounded-lg px-3 py-1.5 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700">
              Deconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}
