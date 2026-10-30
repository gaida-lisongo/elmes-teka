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
      <footer style={{ background: "#102B50" }}>
        {/* Top accent line */}
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(57,136,255,0.45) 40%, rgba(18,74,153,0.30) 70%, transparent 100%)",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          {/* ── Rangée principale ─────────────────────────────────── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            {/* Logo + tagline */}
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5">
                <Image
                  src="/images/logo/logo-icon.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
                <span
                  className="text-white font-bold text-sm tracking-tight"
                  style={{ fontFamily: "var(--font-poppins, Poppins, system-ui)" }}
                >
                  ELMES<span style={{ color: "#93C5FD" }}>-TEKA</span>
                </span>
              </Link>
              <p
                className="text-xs mt-2 max-w-[12rem] leading-5"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                CRM de gestion commerciale pour entrepreneurs congolais.
              </p>
            </div>

            {/* Liens nav */}
            <nav className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { href: "/", label: "Accueil" },
                { href: "/about", label: "Qui sommes-nous" },
                { href: "/contact", label: "Nous contacter" },
                { href: "/signin", label: "Se connecter" },
              ].map(({ href, label }) => (
                <Link
                  key={href + label}
                  href={href}
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.48)" }}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/signup"
                className="text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: "#3988FF" }}
              >
                Commencer
              </Link>
            </nav>
          </div>

          {/* ── Bottom bar ────────────────────────────────────────── */}
          <div
            className="mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.22)",
            }}
          >
            <span>© 2026 ELMES · Tous droits réservés</span>
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "rgba(57,136,255,0.6)" }}
              />
              Conçu et développé pour l&apos;Afrique
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
