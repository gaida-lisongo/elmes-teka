import type { Metadata } from "next";
import Link from "next/link";
import {
  BoltIcon,
  BoxCubeIcon,
  PieChartIcon,
  DollarLineIcon,
  CheckCircleIcon,
  GroupIcon,
  ArrowRightIcon,
} from "@/icons";

export const metadata: Metadata = {
  title: "À propos | ELMES-TEKA",
  description:
    "Construire l'infrastructure de données du commerce congolais — découvrez la mission d'ELMES-TEKA.",
};

export default function AboutPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-24 lg:py-36"
        style={{
          background:
            "radial-gradient(ellipse at 50% -10%, #262e89 0%, #161950 65%)",
        }}
      >
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            Construire l'infrastructure de données du commerce congolais
          </h1>
          <p className="mt-6 text-lg text-gray-300 leading-relaxed">
            ELMES-TEKA est né d'un constat simple : 99 % des entrepreneurs
            congolais gèrent leur activité sans outil. Nous changeons ça.
          </p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Notre mission
            </h2>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Permettre à tout entrepreneur congolais — qu'il soit formel ou
              informel — d'accéder aux outils de gestion qu'utilisent les grandes
              entreprises, adaptés à sa réalité.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: CheckCircleIcon,
                iconBg: "bg-brand-50",
                iconColor: "text-brand-500",
                title: "Accessibilité",
                body: "Un outil pensé pour fonctionner sur mobile avec une connexion instable. Pas de formation comptable requise.",
              },
              {
                Icon: BoltIcon,
                iconBg: "bg-success-50",
                iconColor: "text-success-500",
                title: "Fiabilité",
                body: "Données sécurisées, journaux de caisse non falsifiables, historique complet et exportable.",
              },
              {
                Icon: GroupIcon,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-500",
                title: "Pertinence locale",
                body: "Prix en USD et CDF, workflows adaptés aux commerçants congolais, multi-boutiques.",
              },
            ].map(({ Icon, iconBg, iconColor, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-7"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center mb-4`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-6">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problème résolu ── */}
      <section className="bg-gray-50 py-20 lg:py-28 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Le problème que nous résolvons
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                Icon: BoltIcon,
                iconBg: "bg-brand-50",
                iconColor: "text-brand-500",
                stat: "99 %",
                label: "des unités économiques en RDC sont informelles",
                source: "INS RDC",
              },
              {
                Icon: BoxCubeIcon,
                iconBg: "bg-success-50",
                iconColor: "text-success-500",
                stat: "81 %",
                label: "des MPME n'ont pas de logiciel de gestion des stocks",
                source: "MicroSave 2025",
              },
              {
                Icon: PieChartIcon,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-500",
                stat: "57 %",
                label: "des MPME ont du mal à collecter et organiser leurs données",
                source: "MicroSave 2025",
              },
              {
                Icon: DollarLineIcon,
                iconBg: "bg-blue-light-50",
                iconColor: "text-blue-light-500",
                stat: "#1",
                label: "L'accès au crédit est le défi principal des PME congolaises",
                source: "Banque Mondiale 2020",
              },
            ].map(({ Icon, iconBg, iconColor, stat, label, source }) => (
              <div
                key={stat}
                className="rounded-2xl bg-white border border-gray-100 p-7 shadow-sm"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <p className="text-3xl font-black text-gray-900">{stat}</p>
                <p className="mt-2 text-sm text-gray-600 leading-5">{label}</p>
                <p className="mt-3 text-xs text-gray-400 italic">{source}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-base font-medium text-gray-700 max-w-lg">
            Ce n'est pas un problème de compétences. C'est un problème d'outils.
          </p>
        </div>
      </section>

      {/* ── Le produit ── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Ce qu'est ELMES-TEKA
            </h2>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Une plateforme complète de gestion commerciale, accessible depuis
              n'importe quel téléphone, pensée pour les réalités du marché
              congolais.
            </p>
          </div>
          <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {[
              "Gestion des ventes",
              "Suivi des stocks",
              "Base clients",
              "Dépenses et approvisionnements",
              "Comptabilité simplifiée",
              "Exports financiers (Excel, PDF)",
            ].map((module) => (
              <li key={module} className="flex items-center gap-3">
                <span className="w-6 h-6 flex-shrink-0 rounded-full bg-brand-50 flex items-center justify-center">
                  <CheckCircleIcon className="w-4 h-4 text-brand-500" />
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {module}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link
              href="/#benefices"
              className="inline-flex items-center gap-2 text-brand-500 font-semibold text-sm hover:text-brand-600 transition-colors"
            >
              Voir les bénéfices
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
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
