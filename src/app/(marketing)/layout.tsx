import Image from "next/image";
import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-outfit">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo/logo.svg"
              alt="ELMES-TEKA"
              width={160}
              height={36}
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/#benefices"
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors"
            >
              Bénéfices
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors"
            >
              À propos
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-sm font-medium text-gray-700 hover:text-brand-500 transition-colors hidden sm:block"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-success-500 px-4 py-2 text-sm font-semibold text-white hover:bg-success-600 transition-colors"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">{children}</main>

      <footer className="bg-gray-900 text-white pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <Image
                src="/images/logo/auth-logo.svg"
                alt="ELMES-TEKA"
                width={140}
                height={32}
              />
              <p className="mt-3 text-sm text-gray-400 max-w-xs leading-6">
                CRM de gestion commerciale conçu pour les entrepreneurs
                congolais.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3">
              <Link
                href="/#benefices"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Bénéfices
              </Link>
              <Link
                href="/about"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                À propos
              </Link>
              <Link
                href="/signin"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Créer un compte
              </Link>
            </nav>
          </div>
          <div className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
            © 2026 ELMES. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
