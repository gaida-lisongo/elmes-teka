import { Poppins } from "next/font/google";
import MarketingDock from "@/components/marketing/MarketingDock";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import PromoSpotlight from "@/components/marketing/PromoSpotlight";
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

      <MarketingFooter />
    </div>
  );
}
