import type { Metadata } from "next";
import Link from "next/link";
import { videoSrc } from "@/components/guide/media";
import { GUIDE_CATEGORIES, GUIDE_PATH, GUIDE_TOPICS } from "@/content/guide";

export const metadata: Metadata = {
  title: "Guide et formation | ELMES-TEKA",
  description:
    "Apprenez à utiliser ELMES-TEKA pas à pas : ventes, stocks, vendeurs, trésorerie, clôture. Captures et vidéos de la plateforme réelle.",
};

const roleColor: Record<string, { bg: string; fg: string }> = {
  Gestionnaire: { bg: "rgba(18,74,153,0.1)", fg: "#124A99" },
  Vendeur: { bg: "rgba(34,197,94,0.12)", fg: "#15803D" },
  "Gestionnaire et vendeur": { bg: "rgba(251,191,36,0.15)", fg: "#B45309" },
};

export default function GuidePage() {
  return (
    <>
      {/* ── En-tête ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-16 pt-32 lg:pt-40" style={{ background: "#102B50" }}>
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(57,136,255,0.35) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: "#4ADE80" }}>
            Centre de formation
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-white lg:text-5xl">
            Apprenez ELMES-TEKA en suivant chaque parcours, pas à pas.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8" style={{ color: "rgba(255,255,255,0.7)" }}>
            Chaque fonctionnalité a sa page : à quoi elle sert, où la trouver, les étapes illustrées par de vraies captures de la
            plateforme et des démonstrations vidéo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/guide/${GUIDE_PATH[0].slug}`} className="rounded-xl px-6 py-3 font-semibold text-white" style={{ background: "#22C55E" }}>
              Commencer la formation
            </Link>
            <a href="#parcours" className="rounded-xl px-6 py-3 font-semibold text-white" style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
              Voir toutes les fonctionnalités
            </a>
          </div>
        </div>
      </section>

      {/* ── Démarrer en 6 étapes ──────────────────────────────── */}
      <section className="py-16" style={{ background: "#F2F6FC" }}>
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 className="text-2xl font-bold lg:text-3xl" style={{ color: "#102B50" }}>Démarrer en 6 étapes</h2>
          <p className="mt-2 text-base" style={{ color: "#475569" }}>
            Le chemin conseillé pour être opérationnel le premier jour.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDE_PATH.map((step, index) => (
              <li key={step.slug}>
                <Link
                  href={`/guide/${step.slug}`}
                  className="group flex h-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ border: "1px solid #DCE6F5" }}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: "#124A99" }}>
                    {index + 1}
                  </span>
                  <span className="font-semibold" style={{ color: "#102B50" }}>{step.label}</span>
                  <span className="ml-auto text-xl transition group-hover:translate-x-1" style={{ color: "#3988FF" }} aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Toutes les fonctionnalités ────────────────────────── */}
      <section id="parcours" className="scroll-mt-24 py-16" style={{ background: "#FFFFFF" }}>
        <div className="mx-auto max-w-6xl space-y-14 px-6 lg:px-8">
          {GUIDE_CATEGORIES.map((category) => {
            const topics = GUIDE_TOPICS.filter((topic) => topic.category === category);
            if (!topics.length) return null;
            return (
              <div key={category}>
                <h2 className="text-xl font-bold lg:text-2xl" style={{ color: "#102B50" }}>{category}</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {topics.map((topic) => {
                    const hasVideo = Boolean(videoSrc(topic.video));
                    const color = roleColor[topic.role];
                    return (
                      <Link
                        key={topic.slug}
                        href={`/guide/${topic.slug}`}
                        className="flex flex-col rounded-2xl p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
                        style={{ border: "1px solid #DCE6F5", background: "#FBFDFF" }}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="rounded-full px-2.5 py-1" style={{ background: color.bg, color: color.fg }}>{topic.role}</span>
                          <span style={{ color: "#64748B" }}>{topic.duration}</span>
                          {hasVideo && (
                            <span className="rounded-full px-2.5 py-1" style={{ background: "#102B50", color: "#fff" }}>▶ Vidéo</span>
                          )}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold" style={{ color: "#102B50" }}>{topic.title}</h3>
                        <p className="mt-2 flex-1 text-sm leading-6" style={{ color: "#475569" }}>{topic.summary}</p>
                        <span className="mt-5 text-sm font-semibold" style={{ color: "#124A99" }}>
                          {topic.steps.length} étapes · Suivre le parcours →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
