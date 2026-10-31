import Link from "next/link";
import { getPublicPromos } from "@/lib/platform/data";

/** Codes promo publics en cours (ex. offre conférence), affichés sous le hero. */
export default async function PromoBanner() {
  let promos: Awaited<ReturnType<typeof getPublicPromos>> = [];
  try {
    promos = await getPublicPromos();
  } catch (error) {
    console.error("[PROMO BANNER] lecture impossible", error);
  }
  if (!promos.length) return null;

  return (
    <section style={{ background: "#22C55E" }} className="py-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:px-6">
        {promos.map((promo) => (
          <div key={promo.code} className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-sm font-medium text-white sm:text-base">
              <span className="font-bold">{promo.label}</span> : -{promo.reduction} % sur votre abonnement avec le code{" "}
              <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono font-bold">{promo.code}</span>
              <span className="opacity-80"> · jusqu&apos;au {new Date(promo.endsAt).toLocaleDateString("fr-FR", { timeZone: "Africa/Kinshasa" })}</span>
            </p>
            <Link
              href={`/signup?code=${encodeURIComponent(promo.code)}`}
              className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold"
              style={{ color: "#1C2B4B" }}
            >
              J&apos;en profite
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
