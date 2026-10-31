import { CheckLineIcon } from "@/icons";
import { PLANS } from "@/lib/payments/plans";
import type { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/marketing/HeroSection";
import PromoBanner from "@/components/marketing/PromoBanner";
import ScrollRevealInit from "@/components/marketing/ScrollRevealInit";

// Le bandeau des codes promo publics est rafraîchi toutes les 5 minutes (et à chaque modification admin).
export const revalidate = 300;

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
  { value: "3", label: "packs pour accompagner votre activité", source: "Starter, Business et Premium" },
  { value: "2", label: "devises pour vos opérations", source: "USD et CDF" },
  { value: `${PLANS.STARTER.annualUsd} $`, label: "par an pour démarrer avec Starter", source: "Par entreprise et exercice comptable" },
  { value: "1", label: "espace pour suivre votre activité", source: "Ventes, stocks, clients et charges" },
];

const BENEFIT_CARDS = [
  {
    tag: "Supervision",
    tagColor: "#124A99",
    metric: "En direct",
    metricLabel: "vos opérations commerciales",
    title: "Vos boutiques, un seul regard depuis votre téléphone",
    body: "Suivez vos ventes en temps réel. Avec Business et Premium, supervisez plusieurs boutiques depuis un même espace.",
    delay: "",
  },
  {
    tag: "Fidélisation",
    tagColor: "#10B981",
    metric: "Historique",
    metricLabel: "des achats de vos clients",
    title: "Vos meilleurs clients reviennent — parce que vous les connaissez",
    body: "Retrouvez vos clients et leurs achats pour préparer vos promotions et entretenir la relation commerciale.",
    delay: "et-delay-1",
  },
  {
    tag: "Pilotage",
    tagColor: "#F59E0B",
    metric: "USD / CDF",
    metricLabel: "des montants clairement suivis",
    title: "Décidez sur des faits, pas sur des impressions",
    body: "Suivez les ventes, les dépenses et les charges fixes ou variables. Consultez les rapports avancés avec Business et Premium.",
    delay: "et-delay-2",
  },
  {
    tag: "Financement",
    tagColor: "#38bdf8",
    metric: "Premium",
    metricLabel: "l’accompagnement IA en préparation",
    title: "Construisez progressivement votre historique financier",
    body: "Les rapports Business et Premium documentent votre activité. Les recommandations IA et la préparation du financement sont à venir dans Premium.",
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
    body: "Starter, Business ou Premium : choisissez le pack adapté à votre activité, puis activez-le pour l’exercice comptable.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const doublePills = [...MARQUEE_PILLS, ...MARQUEE_PILLS];

  return (
    <>
      <ScrollRevealInit />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <HeroSection />

      <PromoBanner />

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
                    className="text-3xl font-bold leading-tight"
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

        </div>
      </section>

      <section id="pricing" aria-labelledby="pricing-heading" className="bg-brand-800 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-200">Nos packs</p>
            <h2 id="pricing-heading" className="mb-4 text-3xl font-bold text-white lg:text-4xl">Une formule pour chaque étape de votre activité</h2>
            <p className="leading-7 text-white/80">Tarifs annuels par entreprise et exercice comptable. Choisissez votre pack ; vos codes promo et avantages de parrainage restent disponibles.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(PLANS).map(([id, plan]) => (
              <article key={id} className={`flex flex-col rounded-2xl border p-6 text-white lg:p-8 ${id === "BUSINESS" ? "border-brand-300 bg-brand-500" : "border-white/20 bg-white/5"}`}>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-white/80">{id === "STARTER" ? "Les essentiels pour gérer une boutique." : id === "BUSINESS" ? "Le pilotage de vos boutiques et les rapports avancés." : "Les fonctions Business et les futurs outils d’accompagnement IA."}</p>
                <p className="my-6"><strong className="text-4xl font-bold">{plan.annualUsd} $</strong><span className="ml-2 text-white/80">/ an</span></p>
                <ul className="mb-8 flex-1 space-y-4">{plan.features.map(feature => <li key={feature} className="flex items-start gap-3 text-sm leading-6"><CheckLineIcon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" />{feature}</li>)}</ul>
                <Link href={`/signup?plan=${id}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-center font-bold text-brand-500 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800">Choisir {plan.name}</Link>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-3xl space-y-3 text-center text-sm leading-6 text-white/80">
            <p>L’abonnement couvre l’exercice comptable choisi, jusqu’au 31 décembre. Le montant final et la réduction applicable sont confirmés avant le paiement.</p>
            <p>Passez à un pack supérieur en payant la différence au prorata du temps restant, sans changer l’échéance.</p>
            <p>Les fonctions IA de Premium sont en préparation. Elles ne sont pas encore disponibles et ne garantissent pas l’obtention d’un crédit.</p>
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
            Créez votre compte, choisissez votre pack et activez votre exercice comptable.
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
              Créer mon compte
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
            Starter {PLANS.STARTER.annualUsd} $ · Business {PLANS.BUSINESS.annualUsd} $ · Premium {PLANS.PREMIUM.annualUsd} $ par an
          </p>
        </div>
      </section>
    </>
  );
}
