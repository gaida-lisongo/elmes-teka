import Image from "next/image";
import Link from "next/link";
import PlatformLoginForm from "@/components/platform/PlatformLoginForm";
import { GUIDE_TOPICS } from "@/content/guide";
import { LockIcon } from "@/icons";

const QUICK_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/guide", label: "Guide et formation" },
  { href: "/about", label: "Qui sommes-nous" },
  { href: "/contact", label: "Nous contacter" },
  { href: "/signup", label: "Créer un compte" },
  { href: "/signin", label: "Se connecter" },
];

const FEATURES = [
  "ventes",
  "stocks",
  "tableau-de-bord",
  "tresorerie",
  "clients-et-promotions",
  "comptabilite-et-cloture",
]
  .map((slug) => GUIDE_TOPICS.find((topic) => topic.slug === slug))
  .filter((topic) => topic !== undefined);

const heading = "mb-4 text-sm font-semibold uppercase tracking-wider text-white";
const linkClass = "text-sm transition hover:text-white";
const muted = { color: "rgba(255,255,255,0.6)" };

export default function MarketingFooter() {
  return (
    <footer style={{ background: "#102B50" }}>
      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(57,136,255,0.45) 40%, rgba(18,74,153,0.30) 70%, transparent 100%)",
        }}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Marque */}
        <div>
          <Link href="/" aria-label="ELMES-TEKA">
            <Image src="/images/logo/logo-horizontal-blanc.svg" alt="ELMES-TEKA" width={180} height={40} className="h-10 w-auto" />
          </Link>
          <p className="mt-5 text-base font-semibold text-white">Votre activité, en temps réel.</p>
          <p className="mt-2 text-sm leading-6" style={muted}>
            La gestion commerciale pensée pour l&apos;entrepreneur congolais : boutiques, ventes, stocks et finances, depuis votre téléphone.
          </p>
        </div>

        {/* Accès rapide */}
        <nav aria-label="Accès rapide">
          <h2 className={heading}>Accès rapide</h2>
          <ul className="space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass} style={muted}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Fonctionnalités */}
        <nav aria-label="Fonctionnalités">
          <h2 className={heading}>Fonctionnalités</h2>
          <ul className="space-y-2.5">
            {FEATURES.map((topic) => (
              <li key={topic.slug}>
                <Link href={`/guide/${topic.slug}`} className={linkClass} style={muted}>{topic.title}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Connexion gestionnaire */}
        <div>
          <h2 className={`${heading} flex items-center gap-2`}>
            <LockIcon className="h-4 w-4 [&_path]:fill-current" /> Espace gestionnaire
          </h2>
          <p className="mb-4 text-sm" style={muted}>Recevez votre lien de connexion sécurisé par e-mail.</p>
          <PlatformLoginForm tone="dark" />
        </div>
      </div>

      <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs sm:flex-row lg:px-8" style={{ color: "rgba(255,255,255,0.35)" }}>
          <span>© 2026 ELMES · Tous droits réservés</span>
          <span>Conçu et développé pour l&apos;Afrique</span>
        </div>
      </div>
    </footer>
  );
}
