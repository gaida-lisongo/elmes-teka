import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ScrollRevealInit from "@/components/marketing/ScrollRevealInit";
import {
  CheckCircleIcon,
  BoltIcon,
  GroupIcon,
  CalenderIcon,
  BoxCubeIcon,
  DollarLineIcon,
  ArrowRightIcon,
} from "@/icons";

export const metadata: Metadata = {
  title: "À propos | ELMES-TEKA",
  description:
    "Construire l'infrastructure de données du commerce congolais — découvrez la mission d'ELMES-TEKA et d'ELectro MEcatronique Services.",
};

export default function AboutPage() {
  return (
    <>
      <ScrollRevealInit />

      {/* ── Section 1 : Hero vidéo ── */}
      <section
        className="relative overflow-hidden flex flex-col items-center justify-center"
        style={{ minHeight: "70vh" }}
      >
        {/* Vidéo de fond */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="https://videos.pexels.com/video-files/33646479/14298459_2560_1440_24fps.mp4"
          poster="https://images.pexels.com/videos/33646479/aerial-cape-town-drone-south-africa-33646479.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(16,43,80,0.85)" }}
          aria-hidden="true"
        />

        {/* Contenu centré */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center py-24">
          {/* Badge */}
          <div className="et-reveal inline-flex items-center gap-2 mb-6">
            <span
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase"
              style={{
                background: "rgba(57,136,255,0.15)",
                border: "1px solid rgba(57,136,255,0.30)",
                color: "#3988FF",
              }}
            >
              Qui sommes-nous
            </span>
          </div>

          {/* Titre */}
          <h1 className="et-reveal et-delay-1 text-3xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            Construire l'infrastructure de données du commerce congolais
          </h1>

          {/* Sous-titre */}
          <p className="et-reveal et-delay-2 mt-6 text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            ELMES-TEKA est né d'un constat simple : 99 % des entrepreneurs
            congolais gèrent leur activité sans outil. Nous changeons ça —
            un commerçant à la fois.
          </p>

          {/* CTA secondaire */}
          <div className="et-reveal et-delay-3 mt-10">
            <Link
              href="#elmes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "#fff",
              }}
            >
              Découvrir ELMES
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 2 : Mission ── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
            {/* Colonne gauche — texte */}
            <div>
              <p
                className="et-reveal text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: "#3988FF" }}
              >
                Pourquoi nous existons
              </p>
              <h2 className="et-reveal et-delay-1 text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: "#102B50" }}>
                Notre mission
              </h2>
              <p className="et-reveal et-delay-2 mt-5 text-lg leading-relaxed" style={{ color: "#5a6a80" }}>
                Permettre à tout entrepreneur congolais — formel ou informel —
                d'accéder aux outils de gestion des grandes entreprises, adaptés
                à sa réalité.
              </p>
              <p className="et-reveal et-delay-3 mt-4 text-base leading-relaxed" style={{ color: "#5a6a80" }}>
                Nous croyons que la digitalisation du commerce en République
                Démocratique du Congo commence par des outils simples, fiables
                et accessibles depuis n'importe quel téléphone — sans formation
                comptable, sans connexion stable requise.
              </p>
            </div>

            {/* Colonne droite — 3 piliers */}
            <div className="flex flex-col gap-5">
              {[
                {
                  Icon: CheckCircleIcon,
                  title: "Accessibilité",
                  body: "Un outil pensé pour fonctionner sur mobile avec une connexion instable. Pas de formation comptable requise.",
                  delay: "et-delay-1",
                },
                {
                  Icon: BoltIcon,
                  title: "Fiabilité",
                  body: "Données sécurisées, journaux de caisse non falsifiables, historique complet et exportable.",
                  delay: "et-delay-2",
                },
                {
                  Icon: GroupIcon,
                  title: "Pertinence locale",
                  body: "Prix en USD et CDF, workflows adaptés aux commerçants congolais, multi-boutiques dès le démarrage.",
                  delay: "et-delay-3",
                },
              ].map(({ Icon, title, body, delay }) => (
                <div
                  key={title}
                  className={`et-reveal ${delay} et-feature-card rounded-2xl p-6 flex gap-4`}
                  style={{
                    background: "#F2F6FC",
                    border: "1px solid #dce8f9",
                  }}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "#124A99" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold" style={{ color: "#102B50" }}>
                      {title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6" style={{ color: "#5a6a80" }}>
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 : À propos d'ELMES ── */}
      <section
        id="elmes"
        className="py-20 lg:py-28"
        style={{ background: "#F2F6FC", borderTop: "1px solid #dce8f9", borderBottom: "1px solid #dce8f9" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* En-tête section */}
          <div className="max-w-2xl mb-14">
            <p
              className="et-reveal text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "#3988FF" }}
            >
              Notre entreprise
            </p>
            <h2 className="et-reveal et-delay-1 text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: "#102B50" }}>
              Qui est ELMES ?
            </h2>
            <p className="et-reveal et-delay-2 mt-3 text-lg" style={{ color: "#5a6a80" }}>
              ELMES-TEKA est un produit d'ELectro MEcatronique Services.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Colonne gauche — description narrative */}
            <div className="et-reveal">
              <p className="text-base leading-relaxed mb-5" style={{ color: "#3a4a5c" }}>
                ELectro MEcatronique Services (ELMES) est une société congolaise
                basée à Kinshasa, spécialisée dans les services technologiques
                et informatiques. Depuis sa création, ELMES intervient dans les
                domaines de l'électrotechnique, des télécommunications, de
                l'informatique, et de l'ingénierie appliquée.
              </p>
              <p className="text-base leading-relaxed mb-8" style={{ color: "#3a4a5c" }}>
                ELMES-TEKA est notre réponse au problème de digitalisation du
                commerce congolais — une plateforme conçue, développée et
                maintenue en République Démocratique du Congo, pour les
                entrepreneurs congolais.
              </p>

              {/* Informations clés */}
              <ul className="space-y-4">
                {[
                  {
                    label: "Siège social",
                    value: "Kinshasa, République Démocratique du Congo",
                  },
                  {
                    label: "Téléphone",
                    value: "+243 85 310 24 26",
                  },
                  {
                    label: "Email",
                    value: "contact@elmes-solution.site",
                  },
                  {
                    label: "Direction",
                    value: "LISONGO BAÏTA Gaïda — Directeur Technico-Commercial",
                  },
                ].map(({ label, value }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: "#124A99" }}
                    >
                      <CheckCircleIcon className="w-3 h-3" style={{ color: "#fff" }} />
                    </span>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#3988FF" }}>
                        {label}
                      </span>
                      <p className="text-sm mt-0.5" style={{ color: "#3a4a5c" }}>
                        {value}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne droite — carte de visite */}
            <div
              className="et-reveal et-delay-2 et-feature-card rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: "#124A99" }}
            >
              {/* Overlay dégradé subtil */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 50% at 80% 20%, rgba(57,136,255,0.20) 0%, transparent 70%)",
                }}
                aria-hidden="true"
              />

              {/* Logo */}
              <div className="relative z-10 w-16 h-16 mb-4">
                <Image
                  src="/images/logo/logo-icon.svg"
                  alt="Logo ELMES-TEKA"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Nom */}
              <h3 className="relative z-10 text-2xl font-bold text-white mb-2">
                ELMES-TEKA
              </h3>

              {/* Badge Made in Congo */}
              <span
                className="relative z-10 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: "rgba(57,136,255,0.20)",
                  border: "1px solid rgba(57,136,255,0.35)",
                  color: "#a8c8ff",
                }}
              >
                Made in Congo
              </span>

              {/* Divider */}
              <div
                className="relative z-10 w-12 h-px mb-6"
                style={{ background: "rgba(255,255,255,0.20)" }}
                aria-hidden="true"
              />

              {/* Phrase */}
              <p
                className="relative z-10 text-base leading-relaxed font-medium"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                Un produit congolais,<br />pour les entrepreneurs congolais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4 : Modèle économique ── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* En-tête */}
          <div className="max-w-2xl mb-12">
            <p
              className="et-reveal text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "#3988FF" }}
            >
              Tarification
            </p>
            <h2 className="et-reveal et-delay-1 text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: "#102B50" }}>
              Notre modèle économique
            </h2>
            <p className="et-reveal et-delay-2 mt-3 text-lg" style={{ color: "#5a6a80" }}>
              Simple, transparent, aligné sur votre activité.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 — Abonnement annuel */}
            <div
              className="et-reveal et-delay-1 et-feature-card rounded-2xl p-7 flex flex-col"
              style={{ background: "#fff", border: "1px solid #dce8f9" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "#F2F6FC" }}
              >
                <CalenderIcon className="w-5 h-5" style={{ color: "#124A99" }} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold" style={{ color: "#102B50" }}>
                  50 $ / exercice comptable
                </h3>
              </div>
              <span
                className="inline-flex self-start px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: "#F2F6FC", color: "#124A99", border: "1px solid #dce8f9" }}
              >
                Offre de lancement
              </span>
              <p className="text-sm leading-6 flex-1" style={{ color: "#5a6a80" }}>
                Un exercice = une année fiscale complète. Payez une fois, gérez
                toute l'année sans interruption.
              </p>
            </div>

            {/* Card 2 — Multi-boutiques */}
            <div
              className="et-reveal et-delay-2 et-feature-card rounded-2xl p-7 flex flex-col"
              style={{ background: "#fff", border: "1px solid #dce8f9" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "#F2F6FC" }}
              >
                <BoxCubeIcon className="w-5 h-5" style={{ color: "#124A99" }} />
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: "#102B50" }}>
                Boutiques illimitées
              </h3>
              <p className="text-sm leading-6 flex-1" style={{ color: "#5a6a80" }}>
                Votre abonnement couvre toutes vos boutiques. Pas de surcoût par
                point de vente.
              </p>
            </div>

            {/* Card 3 — Pas de frais cachés */}
            <div
              className="et-reveal et-delay-3 et-feature-card rounded-2xl p-7 flex flex-col"
              style={{ background: "#fff", border: "1px solid #dce8f9" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "#F2F6FC" }}
              >
                <DollarLineIcon className="w-5 h-5" style={{ color: "#124A99" }} />
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ color: "#102B50" }}>
                Prix unique, tout inclus
              </h3>
              <p className="text-sm leading-6 flex-1" style={{ color: "#5a6a80" }}>
                Ventes, stocks, clients, exports PDF, vendeurs illimités. Un seul
                paiement par an.
              </p>
            </div>
          </div>

          {/* CTA sous les cards */}
          <div className="et-reveal et-delay-2 mt-10 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #3988FF 0%, #124A99 100%)",
                boxShadow: "0 4px 20px rgba(57,136,255,0.35)",
              }}
            >
              Commencer pour 50$/an
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 5 : CTA Final ── */}
      <section className="et-cta-bg py-24 lg:py-32">
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="et-reveal text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Prêt à rejoindre les entrepreneurs congolais qui digitalisent ?
          </h2>
          <p
            className="et-reveal et-delay-1 mt-5 text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            Créez votre compte en moins de 15 minutes. 50$/an, sans engagement.
          </p>
          <div className="et-reveal et-delay-2 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #3988FF 0%, #124A99 100%)",
                boxShadow: "0 4px 20px rgba(57,136,255,0.40)",
              }}
            >
              Créer mon compte
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="text-base font-semibold transition-colors"
              style={{ color: "rgba(255,255,255,0.70)" }}
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
