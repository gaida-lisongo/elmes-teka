import MarketingDock from "@/components/marketing/MarketingDock";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import PromoSpotlight from "@/components/marketing/PromoSpotlight";
import "./marketing.css";

// Les promotions sont lues à la requête : le build ne dépend pas de MongoDB.
export const dynamic = "force-dynamic";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="et-marketing min-h-screen flex flex-col">
      <MarketingDock />

      <main className="flex-1">{children}</main>

      <PromoSpotlight />

      <MarketingFooter />
    </div>
  );
}
