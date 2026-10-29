import type { Metadata } from "next";
import Link from "next/link";
import {
  BoltIcon,
  GroupIcon,
  PieChartIcon,
  DollarLineIcon,
  CheckLineIcon,
  BoxCubeIcon,
  ShootingStarIcon,
} from "@/icons";

export const metadata: Metadata = {
  title: "ELMES-TEKA — CRM de gestion commerciale pour entrepreneurs congolais",
  description:
    "Gérez toutes vos boutiques depuis votre téléphone. Ventes, stocks, clients, dépenses en temps réel.",
};

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden bg-brand-950 py-24 lg:py-36"
        style={{
          background:
            "radial-gradient(ellipse at 50% -10%, #262e89 0%, #161950 65%)",
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <span className="inline-block rounded-full border border-brand-300/30 bg-brand-800/40 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-200 mb-6">
            CRM Made in Congo
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Gérez toutes vos boutiques
            <br />
            depuis votre téléphone
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            ELMES-TEKA est la plateforme de gestion commerciale conçue pour les
            entrepreneurs congolais. Ventes, stocks, clients, dépenses — tout en
            temps réel, depuis n'importe où.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="rounded-xl bg-success-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-success-600 transition-colors"
            >
              Créer mon compte gratuitement
            </Link>
            <Link
              href="/signin"
              className="rounded-xl border border-white/30 bg-white/5 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Se connecter
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            Démarrage en moins de 15 minutes · Aucune installation requise ·
            Disponible sur mobile
          </p>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="bg-gray-50 py-14 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                value: "99 %",
                label: "des unités économiques en RDC sont informelles",
                source: "INS RDC",
              },
              {
                value: "81 %",
                label: "des MPME n'ont pas de logiciel de gestion des stocks",
                source: "MicroSave 2025",
              },
              {
                value: "57 %",
                label: "des MPME ont du mal à collecter leurs données",
                source: "MicroSave 2025",
              },
              {
                value: "15 min",
                label: "pour démarrer sur ELMES-TEKA",
                source: "",
              },
            ].map((stat) => (
              <div key={stat.value} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-brand-500">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-gray-600 leading-5">
                  {stat.label}
                </p>
                {stat.source && (
                  <p className="mt-1 text-xs text-gray-400 italic">
                    {stat.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="benefices" className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Ce que vous gagnez dès le premier mois
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 4.1 — Superviser */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
                <BoltIcon className="w-6 h-6 text-brand-500" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-500">
                Supervision
              </span>
              <h3 className="mt-2 text-xl font-bold text-gray-900 leading-snug">
                Trois boutiques, un seul regard — depuis votre téléphone
              </h3>
              <p className="mt-3 text-sm text-gray-500 leading-6">
                Vision unifiée de tous vos points de vente depuis un seul
                dashboard. Chaque vente notifiée en temps réel. Stock visible à
                tout moment. Journal de caisse non modifiable par le vendeur.
              </p>
              <blockquote className="mt-5 rounded-xl bg-brand-25 border-l-4 border-brand-300 px-4 py-3 text-sm italic text-brand-700">
                "99 % des unités économiques en RDC sont informelles. Le vol en
                caisse est la première source de perte documentée."
                <span className="block text-xs not-italic text-brand-400 mt-1">
                  MicroSave 2025
                </span>
              </blockquote>
            </div>

            {/* Card 4.2 — Fidéliser */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center mb-5">
                <GroupIcon className="w-6 h-6 text-success-500" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-success-600">
                Fidélisation
              </span>
              <h3 className="mt-2 text-xl font-bold text-gray-900 leading-snug">
                Vos meilleurs clients reviennent — parce que vous les connaissez
              </h3>
              <p className="mt-3 text-sm text-gray-500 leading-6">
                Base client centralisée avec historique d'achats. Identification
                automatique des clients fidèles et des clients à risque. Ciblage
                de promotions sur les clients inactifs.
              </p>
              <blockquote className="mt-5 rounded-xl bg-success-50 border-l-4 border-success-300 px-4 py-3 text-sm italic text-success-700">
                "71 % des MPME digitalisées utilisent les données clients pour
                adapter leurs offres. Seuls 6 % ont les outils pour le faire."
                <span className="block text-xs not-italic text-success-500 mt-1">
                  MicroSave 2025
                </span>
              </blockquote>
            </div>

            {/* Card 4.3 — Chiffres */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-5">
                <PieChartIcon className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                Pilotage
              </span>
              <h3 className="mt-2 text-xl font-bold text-gray-900 leading-snug">
                Décidez sur des faits, pas sur des impressions
              </h3>
              <p className="mt-3 text-sm text-gray-500 leading-6">
                Chiffre d'affaires global et par boutique en temps réel. Marge
                brute par produit. Performance par vendeur. Top produits, top
                clients, comparaison avec la période précédente.
              </p>
              <blockquote className="mt-5 rounded-xl bg-orange-50 border-l-4 border-orange-300 px-4 py-3 text-sm italic text-orange-700">
                "57 % des MPME ont du mal à collecter leurs données. 33 % ne
                savent pas les analyser."
                <span className="block text-xs not-italic text-orange-400 mt-1">
                  MicroSave 2025
                </span>
              </blockquote>
            </div>

            {/* Card 4.4 — Crédit */}
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-light-50 flex items-center justify-center mb-5">
                <DollarLineIcon className="w-6 h-6 text-blue-light-500" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-light-500">
                Financement
              </span>
              <h3 className="mt-2 text-xl font-bold text-gray-900 leading-snug">
                6 mois d'ELMES-TEKA = votre dossier de financement
              </h3>
              <p className="mt-3 text-sm text-gray-500 leading-6">
                Historique complet de toutes vos transactions. États financiers
                simplifiés exportables en PDF. Récapitulatifs mensuels et
                trimestriels exploitables par les institutions de microfinance.
              </p>
              <blockquote className="mt-5 rounded-xl bg-blue-light-50 border-l-4 border-blue-light-300 px-4 py-3 text-sm italic text-blue-light-700">
                "L'accès au crédit est le défi n°1 des PME congolaises. Les
                banques refusent faute de preuves d'activité."
                <span className="block text-xs not-italic text-blue-light-400 mt-1">
                  Banque Mondiale RDC, 2020
                </span>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 py-20 lg:py-28 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Comment ça marche
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Trois étapes pour prendre le contrôle de votre commerce.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                Icon: CheckLineIcon,
                iconBg: "bg-brand-50",
                iconColor: "text-brand-500",
                title: "Créez votre compte",
                body: "Renseignez votre entreprise et ajoutez vos boutiques. Moins de 15 minutes.",
              },
              {
                step: "02",
                Icon: BoxCubeIcon,
                iconBg: "bg-success-50",
                iconColor: "text-success-500",
                title: "Ajoutez vos produits",
                body: "Catalogue, prix en USD ou CDF, stocks initiaux.",
              },
              {
                step: "03",
                Icon: ShootingStarIcon,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-500",
                title: "Vendez et supervisez",
                body: "Vos vendeurs saisissent les ventes. Vous voyez tout en temps réel.",
              },
            ].map(({ step, Icon, iconBg, iconColor, title, body }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <span className="text-6xl font-black text-gray-100 leading-none select-none absolute -top-4 left-1/2 -translate-x-1/2">
                  {step}
                </span>
                <div
                  className={`relative z-10 w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-5`}
                >
                  <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-6 max-w-xs">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="py-24 lg:py-32"
        style={{
          background:
            "radial-gradient(ellipse at 50% -10%, #262e89 0%, #161950 65%)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Prêt à reprendre le contrôle de votre commerce ?
          </h2>
          <p className="mt-5 text-lg text-gray-300">
            Rejoignez les entrepreneurs congolais qui digitalisent leur activité.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-success-500 px-10 py-4 text-base font-semibold text-white hover:bg-success-600 transition-colors"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
