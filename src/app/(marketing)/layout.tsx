import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import "./marketing.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`et-marketing min-h-screen flex flex-col ${poppins.variable}`}>
      <MarketingHeader />

      <main className="flex-1 pt-16">{children}</main>

      <footer
        style={{ background: "#080A1A", borderTop: "1px solid rgba(255,255,255,0.07)" }}
        className="text-white pt-14 pb-8"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/images/logo/logo-icon.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <span
                  className="text-white font-bold text-base tracking-tight"
                  style={{ fontFamily: "var(--font-poppins, Poppins, system-ui)" }}
                >
                  ELMES<span style={{ color: "#93C5FD" }}>-TEKA</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                CRM de gestion commerciale conçu pour les entrepreneurs congolais formels et
                informels. Ventes, stocks, clients — tout en temps réel.
              </p>
              <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                Par ELMES · Kinshasa, RDC
              </p>
            </div>

            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Produit
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/#benefices" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Bénéfices
                  </Link>
                  <Link href="/#comment" className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Comment ça marche
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Compte
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/signin" className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Connexion
                  </Link>
                  <Link href="/signup" className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Créer un compte
                  </Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Société
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/about" className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                    À propos
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.25)" }}
          >
            <span>© 2026 ELMES · Tous droits réservés</span>
            <span>Conçu pour l&apos;Afrique</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
