import { Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import MarketingDock from "@/components/marketing/MarketingDock";
import PromoSpotlight from "@/components/marketing/PromoSpotlight";
import { LockIcon } from "@/icons";
import "./marketing.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

// La carte promo est relue toutes les 5 minutes (et à chaque modification depuis /platform).
export const revalidate = 300;

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`et-marketing min-h-screen flex flex-col ${poppins.variable}`}>
      <MarketingDock />

      <main className="flex-1">{children}</main>

      <PromoSpotlight />

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ background: "#102B50" }}>
        <div
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(57,136,255,0.45) 40%, rgba(18,74,153,0.30) 70%, transparent 100%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col-reverse gap-4 sm:flex-row items-center justify-between">
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            <span>© 2026 ELMES · Tous droits réservés</span>
            <span className="mx-2 opacity-40">·</span>
            <span>Conçu et développé pour l&apos;Afrique</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/platform/login"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <LockIcon className="h-3.5 w-3.5 [&_path]:fill-current" />
              Espace gestionnaire
            </Link>
            <Link href="/" aria-label="ELMES-TEKA">
              <Image
                src="/images/logo/logo-icon.svg"
                alt=""
                width={22}
                height={22}
                className="h-5.5 w-5.5 opacity-50 hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
