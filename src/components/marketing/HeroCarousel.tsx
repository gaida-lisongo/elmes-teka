"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Slide {
  tag: string;
  problem: string;
  consequence: string;
  cta_text: string;
  cta_href: string;
}

const SLIDES: Slide[] = [
  {
    tag: "Supervision",
    problem: "Vous vendez, mais ne savez pas combien vous gagnez",
    consequence:
      "Cahiers, calculs à la main, totaux qui ne correspondent jamais.",
    cta_text: "Voir mes ventes en temps réel",
    cta_href: "/signup",
  },
  {
    tag: "Stocks",
    problem: "Vos stocks disparaissent sans explication",
    consequence:
      "Ruptures surprises, inventaires incorrects. Vous perdez de l'argent en silence.",
    cta_text: "Contrôler mon stock",
    cta_href: "/signup",
  },
  {
    tag: "Multi-boutiques",
    problem: "Impossible de superviser quand vous n'êtes pas là",
    consequence:
      "Dès que vous quittez, vous perdez le contrôle. Avec plusieurs boutiques, c'est pire.",
    cta_text: "Surveiller mes boutiques",
    cta_href: "/signup",
  },
  {
    tag: "Financement",
    problem: "Les banques refusent vos dossiers de crédit",
    consequence:
      "Votre activité est réelle mais vous ne pouvez pas le prouver sur papier.",
    cta_text: "Construire mon dossier",
    cta_href: "/signup",
  },
];

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path
        d="M2.5 7l3 3 6-6"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating || index === activeIndex) return;
      setIsAnimating(true);
      setTimeout(() => {
        setDisplayIndex(index);
        setActiveIndex(index);
        setIsAnimating(false);
      }, 300);
    },
    [activeIndex, isAnimating]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % SLIDES.length;
      goToSlide(next);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIndex, goToSlide]);

  const slide = SLIDES[displayIndex];

  return (
    <div className="flex flex-col" style={{ minHeight: 360 }}>
      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase mb-8 self-start"
        style={{
          background: "rgba(70,95,255,0.12)",
          border: "1px solid rgba(70,95,255,0.28)",
          color: "rgba(180,190,255,0.9)",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M4 6l1.5 1.5L8 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        CRM Made in Congo · ELMES
      </div>

      {/* Slide content */}
      <div
        style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
          flex: 1,
        }}
      >
        {/* Tag badge */}
        <div className="mb-5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{
              background: "rgba(57,136,255,0.15)",
              border: "1px solid rgba(57,136,255,0.3)",
              color: "#93BFFF",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#3988FF",
                flexShrink: 0,
              }}
            />
            {slide.tag}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-4xl lg:text-5xl xl:text-[58px] font-extrabold text-white leading-[1.06] tracking-tight"
          style={{ maxWidth: 560 }}
        >
          {slide.problem}
        </h1>

        {/* Consequence */}
        <p
          className="mt-5 text-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.55)", maxWidth: 460 }}
        >
          {slide.consequence}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href={slide.cta_href}
            className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-base font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{
              background: "#F59E0B",
              boxShadow:
                "0 0 0 1px rgba(245,158,11,0.4), 0 8px 24px rgba(245,158,11,0.25)",
            }}
          >
            {slide.cta_text}
          </Link>
          <Link
            href="/#comment"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-colors hover:text-white"
            style={{
              border: "1px solid rgba(255,255,255,0.16)",
              color: "rgba(255,255,255,0.72)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8 3v5l3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            Voir la démo
          </Link>
        </div>

        {/* Trust points */}
        <div
          className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm"
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
          {["Démarrage en 15 minutes", "USD & CDF natifs", "Multi-boutiques inclus"].map(
            (t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckIcon />
                {t}
              </span>
            )
          )}
        </div>

        {/* Social proof */}
        <div
          className="mt-7 flex items-center gap-3"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 18,
          }}
        >
          <div className="flex -space-x-2">
            {(
              [
                ["A", "#124A99"],
                ["M", "#10B981"],
                ["D", "#F59E0B"],
                ["F", "#7C3AED"],
              ] as [string, string][]
            ).map(([initial, bg]) => (
              <div
                key={initial}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: bg,
                  border: "2px solid #102B50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {initial}
              </div>
            ))}
          </div>
          <div>
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              Découvrez{" "}
              <span style={{ color: "#93BFFF" }}>la gestion commerciale ELMES-TEKA</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>
              pour les entrepreneurs congolais
            </div>
          </div>
        </div>
      </div>

      {/* Dots navigation */}
      <div
        className="flex items-center gap-3 mt-8"
        role="tablist"
        aria-label="Slides"
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.tag}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={s.tag}
            onClick={() => goToSlide(i)}
            style={{
              width: i === activeIndex ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background:
                i === activeIndex ? "#F59E0B" : "rgba(255,255,255,0.22)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "width 0.3s ease, background 0.3s ease",
              flexShrink: 0,
            }}
          />
        ))}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>
          {activeIndex + 1} / {SLIDES.length}
        </span>
      </div>
    </div>
  );
}
