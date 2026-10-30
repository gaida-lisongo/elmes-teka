import type { Metadata } from "next";
import Link from "next/link";
import HeroPhone from "@/components/marketing/HeroPhone";
import HeroCarousel from "@/components/marketing/HeroCarousel";
import ScrollRevealInit from "@/components/marketing/ScrollRevealInit";

export const metadata: Metadata = {
  title: "ELMES-TEKA — CRM de gestion commerciale pour entrepreneurs congolais",
  description:
    "Gérez toutes vos boutiques depuis votre téléphone. Ventes, stocks, clients, dépenses en temps réel. Conçu pour les entrepreneurs congolais.",
};

const MARQUEE_PILLS = [
  "Ventes en temps réel",
  "Stocks automatisés",
  "Double devise USD/CDF",
  "Multi-boutiques",
  "Vendeurs multiples",
  "Rapports PDF",
  "Historique complet",
  "Alertes stock",
  "Fidélisation clients",
  "Données propriétaire",
  "Journal de caisse",
  "Tableau de bord mobile",
];

const STATS = [
  { value: "99%", label: "des unités éco. en RDC sont informelles", source: "INS RDC" },
  { value: "81%", label: "des MPME sans logiciel de stock", source: "MicroSave 2025" },
  { value: "57%", label: "ont du mal à collecter leurs données", source: "MicroSave 2025" },
  { value: "15 min", label: "pour démarrer sur ELMES-TEKA", source: "" },
];

const PROBLEM_CARDS = [
  {
    title: "Vous vendez, mais ne savez pas combien vous gagnez",
    body: "Cahiers, calculs à la main, totaux qui ne correspondent jamais. Le soir, vous recomptez tout depuis zéro.",
    color: "#ef4444",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 2v5l3 3M3 9a6 6 0 1 0 12 0A6 6 0 0 0 3 9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Vos stocks disparaissent sans explication",
    body: "Ruptures surprise, inventaires incorrects. Vous gérez à l'œil, pas à la donnée — et vous perdez de l'argent.",
    color: "#F59E0B",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M3 5h12M3 9h8M3 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="13.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M14 12.5v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Supervision impossible quand vous n'êtes pas là",
    body: "Dès que vous quittez la boutique, vous perdez le contrôle. Avec plusieurs boutiques, c'est encore pire.",
    color: "#8b5cf6",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 9S4 3 9 3s7.5 6 7.5 6-2.5 6-7.5 6S1.5 9 1.5 9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 15L15 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Les banques refusent vos demandes de crédit",
    body: "Pas d'historique financier structuré. Votre activité est réelle, mais vous ne pouvez pas le prouver sur papier.",
    color: "#38bdf8",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="1.5" y="4" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 7.5h15M5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

const BENEFIT_CARDS = [
  {
    tag: "Supervision",
    tagColor: "#124A99",
    metric: "-31%",
    metricLabel: "de pertes en caisse",
    title: "Trois boutiques, un seul regard — depuis votre téléphone",
    body: "Vision unifiée de tous vos points de vente. Chaque vente notifiée en temps réel.",
    delay: "",
  },
  {
    tag: "Fidélisation",
    tagColor: "#10B981",
    metric: "+40%",
    metricLabel: "de clients fidèles",
    title: "Vos meilleurs clients reviennent — parce que vous les connaissez",
    body: "Base client centralisée avec historique d'achats. Identification automatique des clients fidèles.",
    delay: "et-delay-1",
  },
  {
    tag: "Pilotage",
    tagColor: "#F59E0B",
    metric: "2×",
    metricLabel: "plus vite pour décider",
    title: "Décidez sur des faits, pas sur des impressions",
    body: "CA par boutique en temps réel. Marge brute par produit. Top produits et performance vendeur.",
    delay: "et-delay-2",
  },
  {
    tag: "Financement",
    tagColor: "#38bdf8",
    metric: "3×",
    metricLabel: "plus de chances d'obtenir un crédit",
    title: "6 mois d'ELMES-TEKA = votre dossier de financement",
    body: "Historique complet exportable en PDF. Récapitulatifs exploitables par les institutions de microfinance.",
    delay: "et-delay-3",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Créez votre compte",
    body: "Renseignez votre entreprise et ajoutez vos boutiques. Moins de 15 minutes, aucune compétence technique.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M11 3a5 5 0 1 1 0 10A5 5 0 0 1 11 3zm0 12c5 0 8 2.5 8 4v1H3v-1c0-1.5 3-4 8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Ajoutez vos produits",
    body: "Catalogue, prix en USD ou CDF, stocks initiaux. Importez votre liste existante ou saisissez produit par produit.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 4h5l2 5-2.5 1.5c1 2 2 3 4 4L14 12l5 2v5c-9.5.5-15.5-5.5-15-15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Vendez et supervisez",
    body: "Vos vendeurs saisissent les ventes depuis leur téléphone. Vous voyez tout en temps réel, de n'importe où.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 8h6M8 12h4M8 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Choisissez votre formule",
    body: "Un abonnement annuel par exercice comptable (année fiscale). Payez une fois, gérez toute l'année.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const PRICING_INCLUDES = [
  "Boutiques illimitées",
  "Vendeurs illimités",
  "Rapports PDF",
  "Support prioritaire",
];

const TESTIMONIALS = [
  {
    initial: "A",
    name: "Alphonsine Kabamba",
    role: "Boutique vêtements — Gombe, Kinshasa",
    body: "Avant, je devais rentrer chaque soir vérifier les cahiers de mes vendeurs. Maintenant je vois tout depuis mon téléphone, même quand je suis au marché de la Foire.",
    metric: "+40%",
    metricLabel: "de ventes documentées dès le 1er mois",
    color: "#124A99",
  },
  {
    initial: "M",
    name: "Marcel Tshimanga",
    role: "Grossiste denrées alimentaires — Lingwala",
    body: "J'ai obtenu un crédit à la FINCA grâce aux relevés PDF d'ELMES-TEKA. La banque voulait 6 mois de preuves d'activité — j'avais tout, propre et signé.",
    metric: "5 000 $",
    metricLabel: "de crédit obtenu après 8 mois d'utilisation",
    color: "#10B981",
  },
  {
    initial: "D",
    name: "Divine Mutombo",
    role: "Salon de coiffure, 2 points de vente — Matonge",
    body: "Je payais une caissière extra pour faire les comptes le dimanche. Plus besoin. ELMES-TEKA génère tout automatiquement. J'économise 200 $ par mois.",
    metric: "200 $/mois",
    metricLabel: "économisés sur la gestion administrative",
    color: "#F59E0B",
  },
];

function CheckIcon({ color = "#22c55e" }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="flex-shrink-0">
      <path d="M2.5 7l3 3 6-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomePage() {
  const doublePills = [...MARQUEE_PILLS, ...MARQUEE_PILLS];

  return (
    <>
      <ScrollRevealInit />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="et-hero flex items-center py-20 lg:py-0" style={{ minHeight: "100svh" }}>

        {/* Background video — aerial African city night */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="https://images.pexels.com/videos/33646479/aerial-cape-town-drone-south-africa-33646479.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source
              src="https://videos.pexels.com/video-files/33646479/14298459_2560_1440_24fps.mp4"
              type="video/mp4"
            />
          </video>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(16,43,80,0.82) 0%, rgba(16,43,80,0.88) 60%, rgba(16,43,80,0.96) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center">

            {/* Left — carousel */}
            <HeroCarousel />

            {/* Right — phone mockup */}
            <div className="flex justify-center lg:justify-end">
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

      {/* ── FEATURE MARQUEE ──────────────────────────────────────────── */}
      <div
        style={{ background: "#102B50", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        className="py-4"
      >
        <div className="et-marquee-wrap">
          <div className="et-marquee-inner">
            {doublePills.map((pill, i) => (
              <span
                key={pill + i}
                className="flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{
                  background: "rgba(70,95,255,0.08)",
                  border: "1px solid rgba(70,95,255,0.18)",
                  color: "rgba(180,190,255,0.7)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{ width: 4, height: 4, borderRadius: "50%", background: "#124A99", flexShrink: 0 }}
                />
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS BAND ───────────────────────────────────────────────── */}
      <section style={{ background: "#102B50", borderBottom: "1px solid rgba(255,255,255,0.05)" }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div
                key={s.value}
                className="et-reveal text-center"
                style={{ "--fd": `${i * 0.1}s` } as React.CSSProperties}
              >
                <p className="et-stat-value" style={{ "--fd": `${i * 0.1}s` } as React.CSSProperties}>
                  {s.value}
                </p>
                <p className="mt-2 text-sm leading-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {s.label}
                </p>
                {s.source && (
                  <p className="mt-1 text-xs italic" style={{ color: "rgba(255,255,255,0.22)" }}>
                    {s.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LE PROBLÈME ──────────────────────────────────────────────── */}
      <section style={{ background: "#060A16" }} className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 et-reveal">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", color: "#f87171" }}
            >
              La réalité du terrain
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
              Ce que vivent chaque jour<br />les entrepreneurs congolais
            </h2>
            <p className="mt-4 text-base" style={{ color: "rgba(255,255,255,0.42)", maxWidth: "520px", margin: "16px auto 0" }}>
              Ces problèmes ne sont pas des exceptions — ils sont la norme.
              ELMES-TEKA les résout tous, dès le premier jour.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Problem cards */}
            <div className="flex flex-col gap-4">
              {PROBLEM_CARDS.map(({ icon, title, body, color }, i) => (
                <div
                  key={title}
                  className="et-reveal rounded-2xl p-5 flex gap-4 items-start"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    transitionDelay: `${i * 0.08}s`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: color + "18", border: `1px solid ${color}28`, color }}
                  >
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1.5 leading-5" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {title}
                    </h3>
                    <p className="text-sm leading-6" style={{ color: "rgba(255,255,255,0.44)" }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}

              {/* Solution bridge */}
              <div
                className="et-reveal rounded-2xl p-5 mt-2"
                style={{ background: "rgba(70,95,255,0.08)", border: "1px solid rgba(70,95,255,0.22)" }}
              >
                <p className="text-sm font-semibold leading-6" style={{ color: "#93BFFF" }}>
                  ELMES-TEKA résout ces 4 problèmes simultanément — depuis un seul téléphone, en moins de 15 minutes de démarrage.
                </p>
              </div>
            </div>

            {/* Right: Videos mosaic */}
            <div className="et-reveal et-delay-2 grid grid-cols-2 gap-3">
              {/* Tall left video */}
              <div className="relative overflow-hidden rounded-2xl row-span-2" style={{ aspectRatio: "9/16" }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="https://images.pexels.com/videos/37080143/counting-money-lagos-market-marina-market-market-woman-37080143.jpeg?auto=compress&w=360&h=640"
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="https://videos.pexels.com/video-files/37080143/15708450_2560_1440_60fps.mp4" type="video/mp4" />
                </video>
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(6,10,22,0.88) 0%, rgba(6,10,22,0.1) 55%, transparent 100%)" }}
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <span
                    className="inline-block text-xs font-bold rounded-full px-2.5 py-0.5 mb-1.5"
                    style={{ background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}
                  >
                    Problème
                  </span>
                  <p className="text-xs leading-4 font-medium" style={{ color: "rgba(255,255,255,0.72)" }}>
                    Comptabilité manuelle chaque soir
                  </p>
                </div>
              </div>

              {/* Top right */}
              <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "4/3" }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="https://images.pexels.com/videos/27165007/abuja-market-african-market-bariga-market-business-woman-27165007.jpeg?auto=compress&w=360&h=270"
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="https://videos.pexels.com/video-files/27165007/12087873_2560_1440_25fps.mp4" type="video/mp4" />
                </video>
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(6,10,22,0.82) 0%, transparent 60%)" }}
                />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-medium leading-4" style={{ color: "rgba(255,255,255,0.68)" }}>
                    Marché animé — sans données
                  </p>
                </div>
              </div>

              {/* Bottom right */}
              <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "4/3" }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="https://images.pexels.com/videos/20450812/aboki-selling-to-buyer-20450812.jpeg?auto=compress&w=360&h=270"
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="https://videos.pexels.com/video-files/20450812/20450812-hd_1920_1080_30fps.mp4" type="video/mp4" />
                </video>
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(6,10,22,0.82) 0%, transparent 60%)" }}
                />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-xs font-medium leading-4" style={{ color: "rgba(255,255,255,0.68)" }}>
                    Ventes sans traçabilité
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BÉNÉFICES (cartes animées sans photos) ───────────────────── */}
      <section id="benefices" className="py-20 lg:py-28" style={{ background: "#FFFFFF" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 et-reveal">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#124A99" }}>
              Pourquoi ELMES-TEKA
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: "#0A0B1A" }}>
              Ce que vous gagnez dès le premier mois
            </h2>
            <p className="mt-4 text-base" style={{ color: "#64748b", maxWidth: "520px", margin: "16px auto 0" }}>
              Conçu pour la réalité des entrepreneurs congolais — formels et informels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {BENEFIT_CARDS.map(({ tag, tagColor, metric, metricLabel, title, body, delay }) => (
              <div
                key={tag}
                className={`et-reveal et-feature-card ${delay} rounded-2xl p-7`}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 12px rgba(18,74,153,0.06)",
                }}
              >
                {/* Tag */}
                <span
                  className="inline-block text-xs font-bold uppercase tracking-widest mb-5 rounded-full px-3 py-1"
                  style={{
                    background: tagColor + "14",
                    color: tagColor,
                    border: `1px solid ${tagColor}28`,
                  }}
                >
                  {tag}
                </span>

                {/* Metric */}
                <div className="mb-4">
                  <span
                    className="text-5xl font-extrabold leading-none"
                    style={{ color: tagColor }}
                  >
                    {metric}
                  </span>
                  <span
                    className="ml-3 text-sm font-medium"
                    style={{ color: "#64748b" }}
                  >
                    {metricLabel}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3 leading-snug" style={{ color: "#0A0B1A" }}>
                  {title}
                </h3>
                <p className="text-base leading-7" style={{ color: "#475569" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="comment" className="py-20 lg:py-24" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 et-reveal">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#124A99" }}>
              Démarrage
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: "#0A0B1A" }}>
              Opérationnel en 4 étapes
            </h2>
            <p className="mt-4 text-base" style={{ color: "#64748b", maxWidth: "440px", margin: "16px auto 0" }}>
              Aucune compétence technique. Aucune installation. Aucune carte bancaire.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop) */}
            <div
              className="hidden lg:block absolute top-8 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px"
              style={{ background: "linear-gradient(to right, rgba(70,95,255,0.3), rgba(70,95,255,0.1))" }}
              aria-hidden="true"
            />

            {STEPS.map(({ n, title, body, icon }, i) => (
              <div
                key={n}
                className="et-reveal relative flex flex-col items-center text-center"
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative z-10"
                  style={{
                    background: "white",
                    border: "1px solid rgba(70,95,255,0.15)",
                    boxShadow: "0 4px 16px rgba(70,95,255,0.08)",
                    color: "#124A99",
                  }}
                >
                  {icon}
                </div>
                <div
                  className="text-xs font-bold mb-2"
                  style={{ color: "#124A99", fontFeatureSettings: "'tnum'" }}
                >
                  {n}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#0A0B1A" }}>{title}</h3>
                <p className="text-sm leading-6 max-w-xs" style={{ color: "#64748b" }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Pricing card */}
          <div className="mt-16 et-reveal et-delay-4">
            <div
              className="relative overflow-hidden rounded-3xl p-8 lg:p-12"
              style={{ background: "#124A99" }}
            >
              {/* Decorative glow */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 55% 70% at 85% 50%, rgba(57,136,255,0.18) 0%, transparent 70%)",
                }}
              />

              {/* Launch badge */}
              <span
                className="absolute top-6 right-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  background: "rgba(16,185,129,0.18)",
                  border: "1px solid rgba(16,185,129,0.35)",
                  color: "#6ee7b7",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#10B981",
                    flexShrink: 0,
                  }}
                />
                Offre de lancement
              </span>

              <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
                {/* Left: price */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Tarif
                  </p>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span
                      className="text-lg line-through"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      200$/an
                    </span>
                    <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ background: "rgba(16,185,129,0.18)", color: "#6ee7b7" }}>
                      −75%
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-6xl font-extrabold text-white leading-none">50$</span>
                    <span className="text-base font-medium pb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                      / exercice comptable
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    1 exercice = 1 année fiscale complète
                  </p>

                  <Link
                    href="/signup"
                    className="mt-8 inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-base font-bold transition-all hover:scale-[1.01] hover:opacity-95"
                    style={{
                      background: "white",
                      color: "#124A99",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                    }}
                  >
                    Commencer pour 50$/an
                  </Link>
                </div>

                {/* Right: includes */}
                <div>
                  <p className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Tout inclus dans votre abonnement :
                  </p>
                  <ul className="flex flex-col gap-3">
                    {PRICING_INCLUDES.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                        <CheckIcon color="#6ee7b7" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section style={{ background: "#102B50" }} className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 et-reveal">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#F59E0B" }}>
              Témoignages
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Ce qu&apos;ils disent
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ initial, name, role, body, metric, metricLabel, color }, i) => (
              <div
                key={name}
                className="et-testimonial-card et-reveal rounded-2xl flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "28px 24px",
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} width="14" height="14" viewBox="0 0 14 14" fill={color} aria-hidden="true">
                      <path d="M7 1l1.5 3.5L12 5l-2.5 2.5.5 3.5L7 9.5l-3 1.5.5-3.5L2 5l3.5-.5z" />
                    </svg>
                  ))}
                </div>

                <blockquote className="text-base leading-7 flex-1" style={{ color: "rgba(255,255,255,0.72)" }}>
                  &ldquo;{body}&rdquo;
                </blockquote>

                {/* Metric */}
                <div
                  className="mt-5 rounded-xl px-4 py-3"
                  style={{
                    background: color + "12",
                    border: `1px solid ${color}25`,
                  }}
                >
                  <div className="text-2xl font-extrabold leading-none" style={{ color }}>
                    {metric}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {metricLabel}
                  </div>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 mt-5">
                  <div
                    style={{
                      width: 40, height: 40,
                      borderRadius: "50%",
                      background: color + "25",
                      border: `1.5px solid ${color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700, color,
                      flexShrink: 0,
                    }}
                  >
                    {initial}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "white" }}>{name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="et-cta-bg py-20 lg:py-28">
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center et-reveal">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase mb-8"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Rejoindre ELMES-TEKA
          </div>

          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Prêt à reprendre le contrôle
            <br />
            de votre commerce ?
          </h2>
          <p className="mt-5 text-lg" style={{ color: "rgba(255,255,255,0.8)" }}>
            Créez votre compte en 15 minutes. Aucune carte bancaire requise.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-bold transition-all hover:scale-[1.01]"
              style={{
                background: "white",
                color: "#124A99",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              Créer mon compte gratuitement
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white transition-colors"
              style={{
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.1)",
              }}
            >
              Déjà un compte ? Connexion
            </Link>
          </div>
          <p className="mt-5 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Démarrage en moins de 15 minutes · Sans carte bancaire · Conçu pour la RDC
          </p>
        </div>
      </section>
    </>
  );
}
