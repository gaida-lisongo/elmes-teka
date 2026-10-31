import { PLANS } from "@/lib/payments/plans";
import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Nous contacter | ELMES-TEKA",
  description:
    "Contactez l'équipe ELMES-TEKA. Nous sommes disponibles pour répondre à toutes vos questions.",
};

export default function ContactPage() {
  return (
    <>
      {/* ── Section 1 : Bannière ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden flex items-center justify-center"
        style={{
          background: "#102B50",
          minHeight: "40vh",
        }}
      >
        {/* Overlay radial */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% -20%, rgba(57,136,255,0.15) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-8 py-24 lg:py-32 text-center">
          {/* Badge */}
          <span
            className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6"
            style={{
              background: "rgba(57,136,255,0.12)",
              color: "rgba(147,197,253,0.9)",
              border: "1px solid rgba(57,136,255,0.20)",
            }}
          >
            Support &amp; Contact
          </span>

          <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
            Parlons de votre commerce
          </h1>

          <p
            className="mt-5 text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Notre équipe est disponible pour vous aider à démarrer ou à
            résoudre vos questions.
          </p>
        </div>
      </section>

      {/* ── Section 2 : Disponibilité + Formulaire ───────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* ── Colonne gauche : Disponibilité ── */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">
                Nos disponibilités
              </h2>

              {/* Blocs horaires */}
              <div className="flex flex-col gap-3 mb-10">
                {[
                  {
                    jours: "Lundi — Vendredi",
                    heures: "08h00 – 17h00",
                    note: "HAC",
                    ouvert: true,
                  },
                  {
                    jours: "Samedi",
                    heures: "09h00 – 13h00",
                    note: "HAC",
                    ouvert: true,
                  },
                  {
                    jours: "Dimanche et jours fériés",
                    heures: "Fermé",
                    note: null,
                    ouvert: false,
                  },
                ].map(({ jours, heures, note, ouvert }) => (
                  <div
                    key={jours}
                    className="flex items-center justify-between rounded-xl px-5 py-4"
                    style={{
                      background: "#F2F6FC",
                      border: "1px solid #dce8f9",
                    }}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {jours}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: ouvert ? "#124A99" : "#9ca3af" }}
                    >
                      {heures}
                      {note && (
                        <span className="ml-1.5 text-xs font-normal text-gray-400">
                          ({note})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                <p className="mt-1 text-xs text-gray-400">
                  HAC = Heure de l&apos;Afrique Centrale
                </p>
              </div>

              {/* Informations de contact */}
              <div className="flex flex-col gap-5 mb-8">
                {/* Email */}
                <a
                  href="mailto:contact@elmes-solution.site"
                  className="group flex items-start gap-4"
                >
                  <span
                    className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "#F2F6FC", border: "1px solid #dce8f9" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="1.5"
                        y="4"
                        width="15"
                        height="10"
                        rx="1.5"
                        stroke="#124A99"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M1.5 5.5l7.5 5 7.5-5"
                        stroke="#124A99"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                      Email
                    </p>
                    <p className="text-sm font-medium text-gray-700 transition-colors group-hover:text-brand-500">
                      contact@elmes-solution.site
                    </p>
                  </div>
                </a>

                {/* Téléphone */}
                <a href="tel:+243853102426" className="group flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "#F2F6FC", border: "1px solid #dce8f9" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 2.5h3l1.5 3.5-2 1.5a9 9 0 0 0 4 4l1.5-2 3.5 1.5v3A1.5 1.5 0 0 1 13.5 15C7.5 15 3 10.5 3 4.5A1.5 1.5 0 0 1 3.5 2.5z"
                        stroke="#124A99"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                      Téléphone
                    </p>
                    <p className="text-sm font-medium text-gray-700 transition-colors group-hover:text-brand-500">
                      +243 85 310 24 26
                    </p>
                  </div>
                </a>

                {/* Adresse */}
                <div className="flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "#F2F6FC", border: "1px solid #dce8f9" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 1.5A5 5 0 0 1 14 6.5c0 4-5 10-5 10S4 10.5 4 6.5a5 5 0 0 1 5-5z"
                        stroke="#124A99"
                        strokeWidth="1.4"
                        fill="none"
                      />
                      <circle
                        cx="9"
                        cy="6.5"
                        r="1.7"
                        stroke="#124A99"
                        strokeWidth="1.3"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                      Adresse
                    </p>
                    <p className="text-sm font-medium text-gray-700 leading-5">
                      98 Busudjanoa, ONL/Kasa-Vubu
                      <br />
                      Kinshasa, RDC
                    </p>
                  </div>
                </div>
              </div>

              {/* Délai de réponse */}
              <div
                className="rounded-xl px-5 py-4 flex items-start gap-3"
                style={{
                  background: "rgba(57,136,255,0.06)",
                  border: "1px solid rgba(57,136,255,0.15)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden="true"
                  className="mt-0.5 flex-shrink-0"
                >
                  <circle cx="9" cy="9" r="7.5" stroke="#3988FF" strokeWidth="1.4" />
                  <path
                    d="M9 5.5V9l2.5 2"
                    stroke="#3988FF"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-sm text-gray-600 leading-5">
                  Nous répondons généralement dans les{" "}
                  <span className="font-semibold text-gray-800">
                    24 heures ouvrées
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* ── Colonne droite : Formulaire ── */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-8">
                Envoyer un message
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 : CTA bas de page ──────────────────────────── */}
      <section className="et-cta-bg py-24 lg:py-32">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Prêt à essayer ELMES-TEKA ?
          </h2>
          <p className="mt-5 text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
            Choisissez Starter à {PLANS.STARTER.annualUsd} $, Business à {PLANS.BUSINESS.annualUsd} $ ou Premium à {PLANS.PREMIUM.annualUsd} $ par an.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-white px-10 py-4 text-base font-semibold transition-colors hover:bg-gray-100"
              style={{ color: "#124A99" }}
            >
              Créer mon compte
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
