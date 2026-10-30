import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import MarketingDock from "@/components/marketing/MarketingDock";
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
      <MarketingDock />

      <main className="flex-1">{children}</main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ background: "#070B18" }}>
        {/* Top accent line */}
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(70,95,255,0.35) 30%, rgba(245,158,11,0.25) 70%, transparent 100%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* ── Main grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 pt-16 pb-14">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
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
              </Link>

              <p
                className="text-sm leading-6 mb-6"
                style={{ color: "rgba(255,255,255,0.42)", maxWidth: "220px" }}
              >
                CRM de gestion commerciale pour les entrepreneurs congolais
                formels et informels. Ventes, stocks, clients — tout en temps
                réel.
              </p>

              <div
                className="flex items-start gap-2"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  aria-hidden="true"
                  className="mt-0.5 flex-shrink-0"
                >
                  <path
                    d="M6.5 1.5A3.5 3.5 0 0 1 10 5c0 2.8-3.5 6.5-3.5 6.5S3 7.8 3 5a3.5 3.5 0 0 1 3.5-3.5z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle cx="6.5" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
                </svg>
                <span className="text-xs leading-5">
                  Kinshasa, République
                  <br />
                  Démocratique du Congo
                </span>
              </div>
            </div>

            {/* Produit */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Produit
              </p>
              <div className="flex flex-col gap-3.5">
                {[
                  { href: "/#benefices", label: "Bénéfices" },
                  { href: "/#comment", label: "Comment ça marche" },
                  { href: "/signup", label: "Essai gratuit" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Compte */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Compte
              </p>
              <div className="flex flex-col gap-3.5">
                {[
                  { href: "/signin", label: "Connexion" },
                  { href: "/signup", label: "Créer un compte" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Société */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Société
              </p>
              <div className="flex flex-col gap-3.5">
                {[
                  { href: "/about", label: "À propos" },
                  { href: "/about", label: "ELMES" },
                ].map(({ href, label }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Ghost watermark ──────────────────────────────────── */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
            className="pt-3"
          >
            <p
              className="text-center font-black uppercase tracking-tighter leading-none select-none"
              style={{
                fontSize: "clamp(2.5rem, 10vw, 7.5rem)",
                color: "rgba(255,255,255,0.025)",
                letterSpacing: "-0.04em",
              }}
            >
              ELMES-TEKA
            </p>
          </div>

          {/* ── Bottom bar ────────────────────────────────────────── */}
          <div
            className="py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.22)",
            }}
          >
            <span>© 2026 ELMES · Tous droits réservés</span>
            <span
              className="flex items-center gap-2"
              style={{ color: "rgba(255,255,255,0.20)" }}
            >
              <span
                className="inline-block rounded-full"
                style={{
                  width: "6px",
                  height: "6px",
                  background: "rgba(70,95,255,0.5)",
                }}
              />
              Conçu et développé pour l&apos;Afrique
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
