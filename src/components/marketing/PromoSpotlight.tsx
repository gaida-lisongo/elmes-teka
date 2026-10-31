import { getPublicPromos } from "@/lib/platform/data";
import PromoSpotlightCard from "./PromoSpotlightCard";

/** Carte de la promotion publique en cours, au-dessus du footer de toutes les pages du site. */
export default async function PromoSpotlight() {
  let promos: Awaited<ReturnType<typeof getPublicPromos>> = [];
  try {
    promos = await getPublicPromos();
  } catch (error) {
    console.error("[PROMO SPOTLIGHT] lecture impossible", error);
  }
  // La promo qui se termine le plus tôt est mise en avant
  const promo = promos[0];
  if (!promo) return null;
  return <PromoSpotlightCard promo={promo} />;
}
