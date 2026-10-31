"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Promo = { code: string; label: string; reduction: number; endsAt: string; remaining: number | null };

const MARKET_PHOTO =
  "https://images.pexels.com/videos/37080143/counting-money-lagos-market-marina-market-market-woman-37080143.jpeg?auto=compress&cs=tinysrgb&w=900&h=900";

function remainingParts(endsAt: string, now: number) {
  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  return {
    done: diff === 0,
    parts: [
      { label: "Jours", value: Math.floor(diff / 86_400_000) },
      { label: "Heures", value: Math.floor(diff / 3_600_000) % 24 },
      { label: "Min", value: Math.floor(diff / 60_000) % 60 },
      { label: "Sec", value: Math.floor(diff / 1000) % 60 },
    ],
  };
}

export default function PromoSpotlightCard({ promo }: { promo: Promo }) {
  // Pas d'heure côté serveur : le compte à rebours démarre après hydratation.
  const [now, setNow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const countdown = now === null ? null : remainingParts(promo.endsAt, now);
  if (countdown?.done) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-label="Promotion en cours">
      {/* La carte déborde (marge négative) sur la bande unie, qui se prolonge dans le footer */}
      <div className="px-4 pt-12 sm:px-6 lg:pt-16" style={{ background: "#F2F6FC" }}>
      <div className="et-promo-card et-promo-extrude relative z-10 mx-auto -mb-28 grid max-w-6xl overflow-hidden rounded-3xl md:-mb-36 md:grid-cols-5" style={{ background: "linear-gradient(135deg, #1B4A8C 0%, #133766 55%, #102B50 100%)" }}>
        {/* Halo animé */}
        <div className="et-promo-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full" />

        <div className="relative z-10 flex flex-col justify-center gap-6 p-7 sm:p-10 md:col-span-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="et-promo-pulse inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "rgba(34,197,94,0.15)", color: "#4ADE80" }}>
              <span className="h-2 w-2 rounded-full" style={{ background: "#22C55E" }} />
              Offre limitee
            </span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{promo.label}</span>
          </div>

          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            <span className="et-promo-shine">-{promo.reduction} %</span> sur votre abonnement ELMES-TEKA
          </h2>

          <div className="flex gap-2 sm:gap-3" aria-live="off">
            {(countdown?.parts ?? [
              { label: "Jours", value: null },
              { label: "Heures", value: null },
              { label: "Min", value: null },
              { label: "Sec", value: null },
            ]).map((part) => (
              <div key={part.label} className="flex min-w-[64px] flex-col items-center rounded-2xl px-3 py-2.5 sm:min-w-[76px]" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span key={part.value ?? "x"} className="et-promo-tick text-2xl font-bold tabular-nums text-white sm:text-3xl">
                  {part.value === null ? "--" : String(part.value).padStart(2, "0")}
                </span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>{part.label}</span>
              </div>
            ))}
          </div>

          {promo.remaining !== null && (
            <p className="text-sm font-medium" style={{ color: "#FBBF24" }}>
              Plus que {promo.remaining} place{promo.remaining > 1 ? "s" : ""} a ce tarif
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed px-5 py-3 font-mono text-lg font-bold tracking-widest text-white transition hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.35)" }}
              aria-label={`Copier le code ${promo.code}`}
            >
              {promo.code}
              <span className="font-sans text-xs font-medium tracking-normal" style={{ color: "rgba(255,255,255,0.6)" }}>
                {copied ? "Copie !" : "Copier"}
              </span>
            </button>
            <Link
              href={`/signup?code=${encodeURIComponent(promo.code)}`}
              className="et-promo-cta inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-white transition hover:brightness-110"
              style={{ background: "#22C55E" }}
            >
              J&apos;en profite maintenant
            </Link>
          </div>
        </div>

        <div className="relative min-h-[220px] md:col-span-2 md:min-h-full">
          <Image src={MARKET_PHOTO} alt="Commercante comptant sa recette au marche" fill sizes="(min-width: 768px) 40vw, 100vw" className="et-promo-photo object-cover" />
          <div className="et-promo-fade absolute inset-0" />
          <div className="et-promo-float absolute bottom-6 right-6 flex h-24 w-24 flex-col items-center justify-center rounded-full text-white shadow-xl" style={{ background: "#22C55E" }}>
            <span className="text-2xl font-extrabold leading-none">-{promo.reduction}%</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">Promo</span>
          </div>
        </div>
      </div>
      </div>
      <div className="h-40 md:h-52" style={{ background: "#102B50" }} />
    </section>
  );
}
