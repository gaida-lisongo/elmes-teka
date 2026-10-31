"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/payments/plans";
import { CheckLineIcon } from "@/icons";
import HeroPhone from "@/components/marketing/HeroPhone";

const SLIDES = [
  {
    tag: "Supervision",
    problem: "Vous vendez, mais ne savez pas combien vous gagnez",
    consequence: "Cahiers, calculs à la main, totaux qui ne correspondent jamais. Le soir, vous recomptez tout depuis zéro.",
    cta_text: "Voir mes ventes en temps réel",
    cta_href: "/signup",
    videoSrc: "https://videos.pexels.com/video-files/33646479/14298459_2560_1440_24fps.mp4",
    videoPoster: "https://images.pexels.com/videos/33646479/aerial-cape-town-drone-south-africa-33646479.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080",
  },
  {
    tag: "Stocks",
    problem: "Vos stocks disparaissent sans explication",
    consequence: "Ruptures surprises, inventaires incorrects. Vous gérez à l'œil, pas à la donnée — et vous perdez de l'argent.",
    cta_text: "Contrôler mon stock",
    cta_href: "/signup",
    videoSrc: "https://videos.pexels.com/video-files/37080143/15708450_2560_1440_60fps.mp4",
    videoPoster: "https://images.pexels.com/videos/37080143/counting-money-lagos-market-marina-market-market-woman-37080143.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080",
  },
  {
    tag: "Multi-boutiques",
    problem: "Impossible de superviser quand vous n'êtes pas là",
    consequence: "Dès que vous quittez, vous perdez le contrôle. Avec plusieurs boutiques, c'est encore pire.",
    cta_text: "Découvrir Business",
    cta_href: "/signup?plan=BUSINESS",
    videoSrc: "https://videos.pexels.com/video-files/27165007/12087873_2560_1440_25fps.mp4",
    videoPoster: "https://images.pexels.com/videos/27165007/abuja-market-african-market-bariga-market-business-woman-27165007.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080",
  },
  {
    tag: "Financement",
    problem: "Les banques refusent vos dossiers de crédit",
    consequence: "Votre activité est réelle mais vous ne pouvez pas le prouver sur papier.",
    cta_text: "Découvrir les packs",
    cta_href: "/#pricing",
    videoSrc: "https://videos.pexels.com/video-files/20450812/20450812-hd_1920_1080_30fps.mp4",
    videoPoster: "https://images.pexels.com/videos/20450812/aboki-selling-to-buyer-20450812.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080",
  },
];

export default function HeroSection() {
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
      }, 350);
    },
    [activeIndex, isAnimating]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((activeIndex + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [activeIndex, goToSlide]);

  const slide = SLIDES[displayIndex];

  return (
    <section className="et-hero flex items-center py-20 lg:py-0" style={{ minHeight: "100svh" }}>

      {/* ── Video backgrounds — one per slide, crossfade ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {SLIDES.map((s, i) => (
          <video
            key={s.tag}
            autoPlay
            muted
            loop
            playsInline
            preload={i === 0 ? "auto" : "none"}
            poster={s.videoPoster}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: i === activeIndex ? 1 : 0,
              transition: "opacity 0.8s ease",
            }}
            aria-hidden="true"
          >
            <source src={s.videoSrc} type="video/mp4" />
          </video>
        ))}
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,43,80,0.80) 0%, rgba(16,43,80,0.86) 60%, rgba(16,43,80,0.96) 100%)",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">

          {/* Left — carousel text */}
          <div className="flex flex-col" style={{ minHeight: 360 }}>
            {/* Trust badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase mb-8 self-start"
              style={{
                background: "rgba(70,95,255,0.12)",
                border: "1px solid rgba(70,95,255,0.28)",
                color: "rgba(180,190,255,0.9)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M4 6l1.5 1.5L8 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              CRM Made in Congo · ELMES
            </div>

            {/* Slide content */}
            <div
              style={{
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating ? "translateY(10px)" : "translateY(0)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
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
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3988FF", flexShrink: 0 }} />
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
                    boxShadow: "0 0 0 1px rgba(245,158,11,0.4), 0 8px 24px rgba(245,158,11,0.25)",
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
                  Comment ça marche
                </Link>
              </div>

              {/* Trust points */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
                {[`Packs dès ${PLANS.STARTER.annualUsd} $/an`, "USD & CDF natifs", "Multi-boutiques dès Business"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckLineIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-200" />
                    {t}
                  </span>
                ))}
              </div>

              <p className="mt-7 border-t border-white/10 pt-4 text-sm leading-6 text-white/70">
                Une boutique avec Starter. Plusieurs boutiques et rapports avancés avec Business et Premium.
              </p>
            </div>

            {/* Dots navigation */}
            <div className="flex items-center gap-3 mt-8" role="tablist" aria-label="Slides">
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
                    background: i === activeIndex ? "#F59E0B" : "rgba(255,255,255,0.22)",
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

          {/* Right — phone mockup */}
          <div className="hidden lg:flex justify-end">
            <HeroPhone />
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        style={{ opacity: 0.35 }}
        aria-hidden="true"
      >
        <span className="text-xs text-white/50 tracking-widest uppercase">Défiler</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 4v10M4 9l5 5 5-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
