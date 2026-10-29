import type { Metadata } from "next";
import Link from "next/link";
import {
  BoltIcon,
  GroupIcon,
  PieChartIcon,
  DollarLineIcon,
} from "@/icons";
import HeroDemo from "@/components/marketing/HeroDemo";
import ScrollRevealInit from "@/components/marketing/ScrollRevealInit";

export const metadata: Metadata = {
  title: "ELMES-TEKA — CRM de gestion commerciale pour entrepreneurs congolais",
  description:
    "Gérez toutes vos boutiques depuis votre téléphone. Ventes, stocks, clients, dépenses en temps réel. Conçu pour les entrepreneurs congolais.",
};

const features = [
  {
    Icon: BoltIcon,
    color: "#465fff",
    bg: "rgba(70,95,255,0.1)",
    border: "rgba(70,95,255,0.2)",
    tag: "Supervision",
    title: "Trois boutiques, un seul regard — depuis votre téléphone",
    body: "Vision unifiée de tous vos points de vente. Chaque vente notifiée en temps réel. Stock visible à tout moment. Journal de caisse non modifiable par le vendeur.",
    quote:
      "« 99 % des unités économiques en RDC sont informelles. Le vol en caisse est la première source de perte documentée. »",
    source: "MicroSave 2025",
    quoteBg: "rgba(70,95,255,0.06)",
    quoteBorder: "rgba(70,95,255,0.3)",
    quoteColor: "rgba(150,160,255,0.9)",
  },
  {
    Icon: GroupIcon,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.2)",
    tag: "Fidélisation",
    title: "Vos meilleurs clients reviennent — parce que vous les connaissez",
    body: "Base client centralisée avec historique d'achats. Identification automatique des clients fidèles et des clients à risque. Ciblage de promotions sur les clients inactifs.",
    quote:
      "« 71 % des MPME digitalisées utilisent les données clients pour adapter leurs offres. Seuls 6 % ont les outils pour le faire. »",
    source: "MicroSave 2025",
    quoteBg: "rgba(34,197,94,0.06)",
    quoteBorder: "rgba(34,197,94,0.3)",
    quoteColor: "rgba(134,239,172,0.9)",
  },
  {
    Icon: PieChartIcon,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
    tag: "Pilotage",
    title: "Décidez sur des faits, pas sur des impressions",
    body: "Chiffre d'affaires global et par boutique en temps réel. Marge brute par produit. Performance par vendeur. Top produits, top clients, comparaison avec la période précédente.",
    quote:
      "« 57 % des MPME ont du mal à collecter leurs données. 33 % ne savent pas les analyser. »",
    source: "MicroSave 2025",
    quoteBg: "rgba(245,158,11,0.06)",
    quoteBorder: "rgba(245,158,11,0.3)",
    quoteColor: "rgba(253,230,138,0.9)",
  },
  {
    Icon: DollarLineIcon,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.1)",
    border: "rgba(56,189,248,0.2)",
    tag: "Financement",
    title: "6 mois d'ELMES-TEKA = votre dossier de financement",
    body: "Historique complet de toutes vos transactions. États financiers exportables en PDF. Récapitulatifs mensuels exploitables par les institutions de microfinance.",
    quote:
      "« L'accès au crédit est le défi n°1 des PME congolaises. Les banques refusent faute de preuves d'activité. »",
    source: "Banque Mondiale RDC, 2020",
    quoteBg: "rgba(56,189,248,0.06)",
    quoteBorder: "rgba(56,189,248,0.3)",
    quoteColor: "rgba(147,219,248,0.9)",
  },
];

const steps = [
  {
    n: "01",
    title: "Créez votre compte",
    body: "Renseignez votre entreprise et ajoutez vos boutiques. Moins de 15 minutes.",
  },
  {
    n: "02",
    title: "Ajoutez vos produits",
    body: "Catalogue, prix en USD ou CDF, stocks initiaux. Tout prêt en quelques clics.",
  },
  {
    n: "03",
    title: "Vendez et supervisez",
    body: "Vos vendeurs saisissent les ventes. Vous voyez tout en temps réel, depuis n'importe où.",
  },
];

const stats = [
  { value: "99 %", label: "des unités économiques en RDC sont informelles", source: "INS RDC" },
  { value: "81 %", label: "des MPME n'ont pas de logiciel de gestion des stocks", source: "MicroSave 2025" },
  { value: "57 %", label: "des MPME ont du mal à collecter leurs données", source: "MicroSave 2025" },
  { value: "15 min", label: "pour démarrer sur ELMES-TEKA", source: "" },
];

export default function HomePage() {
  return (
    <>
      <ScrollRevealInit />

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="et-aurora relative min-h-screen flex items-center py-20 lg:py-0">
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">

            {/* Left — copy */}
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase mb-6"
                style={{
                  background: "rgba(70,95,255,0.15)",
                  border: "1px solid rgba(70,95,255,0.3)",
                  color: "rgba(180,190,255,0.9)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#465fff" }}
                />
                CRM Made in Congo
              </div>

              <h1
                className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight"
              >
                Ventes, stocks, clients.
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #465fff 50%, #38bdf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Tout visible.
                </span>{" "}
                <span className="text-white">Tout maintenant.</span>
              </h1>

              <p
                className="mt-6 text-base lg:text-lg leading-relaxed"
                style={{ color: "rgba(255,255,255,0.65)", maxWidth: "480px" }}
              >
                ELMES-TEKA est la plateforme CRM conçue pour les entrepreneurs
                congolais. Gérez toutes vos boutiques en temps réel, depuis
                Kinshasa jusqu'à Lubumbashi — depuis n'importe quel téléphone.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="et-badge-shine inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #F59E0B, #D97706)",
                    boxShadow: "0 4px 24px rgba(245,158,11,0.35)",
                  }}
                >
                  Créer mon compte gratuitement
                </Link>
                <Link
                  href="/#comment"
                  className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-base font-semibold text-white/80 transition-colors hover:text-white"
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  Voir comment ça marche
                </Link>
              </div>

              <div
                className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {[
                  "Démarrage en 15 minutes",
                  "USD & CDF natifs",
                  "Multi-boutiques inclus",
                ].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — demo */}
            <div className="w-full">
              <HeroDemo />
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40"
          aria-hidden="true"
        >
          <span className="text-xs text-white/60 tracking-widest uppercase">Défiler</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10l6 6 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAND ──────────────────────────────────────────────── */}
      <section style={{ background: "#0D0F24", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div
                key={s.value}
                className="et-reveal text-center"
                style={{ "--fd": `${i * 0.12}s` } as React.CSSProperties}
              >
                <p
                  className="et-stat-value"
                  style={{ "--fd": `${i * 0.12}s` } as React.CSSProperties}
                >
                  {s.value}
                </p>
                <p className="mt-2 text-sm leading-5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {s.label}
                </p>
                {s.source && (
                  <p className="mt-1 text-xs italic" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {s.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section id="benefices" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 et-reveal">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#465fff" }}
            >
              Pourquoi ELMES-TEKA
            </p>
            <h2
              className="text-3xl lg:text-4xl font-bold tracking-tight"
              style={{ color: "#0A0B1A" }}
            >
              Ce que vous gagnez dès le premier mois
            </h2>
            <p className="mt-4 text-base" style={{ color: "#64748b", maxWidth: "560px", margin: "16px auto 0" }}>
              Conçu pour la réalité des entrepreneurs congolais — formels et informels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map(({ Icon, color, bg, border, tag, title, body, quote, source, quoteBg, quoteBorder, quoteColor }, i) => (
              <div
                key={tag}
                className="et-feature-card et-reveal rounded-2xl border p-8"
                style={{
                  borderColor: "rgba(0,0,0,0.07)",
                  background: "white",
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color }}
                >
                  {tag}
                </p>
                <h3
                  className="text-xl font-bold leading-snug mb-3"
                  style={{ color: "#0A0B1A" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-6" style={{ color: "#64748b" }}>
                  {body}
                </p>
                <blockquote
                  className="mt-5 rounded-xl px-4 py-3 text-sm italic leading-6"
                  style={{
                    background: quoteBg,
                    borderLeft: `3px solid ${quoteBorder}`,
                    color: quoteColor,
                  }}
                >
                  {quote}
                  <cite className="block text-xs not-italic mt-1 opacity-60">
                    {source}
                  </cite>
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section
        id="comment"
        className="py-20 lg:py-28"
        style={{ background: "#080A1A" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14 et-reveal">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#F59E0B" }}
            >
              Démarrage
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Opérationnel en 3 étapes
            </h2>
            <p className="mt-4 text-base" style={{ color: "rgba(255,255,255,0.5)", maxWidth: "480px", margin: "16px auto 0" }}>
              Aucune compétence technique requise. Aucune installation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

            {steps.map(({ n, title, body }, i) => (
              <div
                key={n}
                className="et-reveal relative flex flex-col items-center text-center"
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                {/* Step number circle */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative z-10"
                  style={{
                    background: "rgba(70,95,255,0.1)",
                    border: "1px solid rgba(70,95,255,0.25)",
                  }}
                >
                  <span
                    className="text-2xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #465fff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {n}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p
                  className="text-sm leading-6 max-w-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="et-cta-section py-20 lg:py-28">
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center et-reveal">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Rejoignez ELMES-TEKA
          </p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Prêt à reprendre le contrôle
            <br />
            de votre commerce ?
          </h2>
          <p
            className="mt-5 text-base lg:text-lg"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            Rejoignez les entrepreneurs congolais qui digitalisent leur activité
            avec ELMES-TEKA.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-bold text-amber-900 transition-all hover:scale-[1.02]"
              style={{
                background: "white",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              Créer mon compte gratuitement
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-xl px-10 py-4 text-base font-semibold text-white transition-colors"
              style={{
                border: "1px solid rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.1)",
              }}
            >
              Déjà un compte ? Se connecter
            </Link>
          </div>
          <p
            className="mt-5 text-sm"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Démarrage en moins de 15 minutes · Aucune carte bancaire requise
          </p>
        </div>
      </section>
    </>
  );
}
