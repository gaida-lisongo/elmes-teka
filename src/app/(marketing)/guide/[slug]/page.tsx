import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuideVideo from "@/components/guide/GuideVideo";
import ScreenFrame from "@/components/guide/ScreenFrame";
import { shotSrc, videoSrc } from "@/components/guide/media";
import { GUIDE_TOPICS, getTopic } from "@/content/guide";

export function generateStaticParams() {
  return GUIDE_TOPICS.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const topic = getTopic((await params).slug);
  if (!topic) return {};
  return { title: `${topic.title} | Guide ELMES-TEKA`, description: topic.summary };
}

export default async function GuideTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const topic = getTopic((await params).slug);
  if (!topic) notFound();

  const index = GUIDE_TOPICS.findIndex((item) => item.slug === topic.slug);
  const previous = GUIDE_TOPICS[index - 1];
  const next = GUIDE_TOPICS[index + 1];
  const video = videoSrc(topic.video);
  const related = topic.related.map((slug) => getTopic(slug)).filter((item) => item !== undefined);

  return (
    <>
      {/* ── En-tête ───────────────────────────────────────────── */}
      <section className="pb-12 pt-32 lg:pt-36" style={{ background: "#102B50" }}>
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <nav className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }} aria-label="Fil d'Ariane">
            <Link href="/guide" className="hover:text-white">Guide</Link>
            <span className="mx-2">›</span>
            <span>{topic.category}</span>
          </nav>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white lg:text-4xl">{topic.title}</h1>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: "rgba(255,255,255,0.75)" }}>{topic.summary}</p>
          <dl className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ["Pour qui", topic.role],
              ["Durée", topic.duration],
              ["Où le trouver", topic.where],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <dt className="text-xs uppercase tracking-wider" style={{ color: "#4ADE80" }}>{label}</dt>
                <dd className="mt-1 text-sm font-medium text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[220px_1fr] lg:px-8">
        {/* ── Sommaire ────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-1 text-sm" aria-label="Étapes">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Étapes</p>
            {topic.steps.map((step, i) => (
              <a key={step.title} href={`#etape-${i + 1}`} className="flex gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F2F6FC]" style={{ color: "#334155" }}>
                <span className="font-semibold" style={{ color: "#124A99" }}>{i + 1}.</span> {step.title}
              </a>
            ))}
            <a href="#faq" className="block rounded-lg px-2 py-1.5 hover:bg-[#F2F6FC]" style={{ color: "#334155" }}>Questions fréquentes</a>
          </nav>
        </aside>

        <div className="min-w-0 space-y-12">
          {/* ── Ce que ça vous apporte ─────────────────────────── */}
          <div className="rounded-2xl p-6" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#15803D" }}>Ce que ça vous apporte</p>
            <p className="mt-2 text-lg font-medium" style={{ color: "#14532D" }}>{topic.benefit}</p>
            {topic.prerequisites.length > 0 && (
              <p className="mt-3 text-sm" style={{ color: "#166534" }}>
                <span className="font-semibold">Avant de commencer : </span>
                {topic.prerequisites.join(" · ")}
              </p>
            )}
          </div>

          {video && (
            <section aria-labelledby="video-title">
              <h2 id="video-title" className="mb-4 text-xl font-bold" style={{ color: "#102B50" }}>La démonstration en vidéo</h2>
              <GuideVideo src={video.src} poster={video.poster} title={topic.title} />
            </section>
          )}

          {/* ── Étapes ─────────────────────────────────────────── */}
          <ol className="space-y-12">
            {topic.steps.map((step, i) => {
              const src = shotSrc(step.shot);
              return (
                <li key={step.title} id={`etape-${i + 1}`} className="scroll-mt-28">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold text-white" style={{ background: "#124A99" }}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold" style={{ color: "#102B50" }}>{step.title}</h2>
                      <p className="mt-2 text-base leading-7" style={{ color: "#334155" }}>{step.text}</p>
                      {step.tip && (
                        <p className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}>
                          <span className="font-semibold">Astuce : </span>
                          {step.tip}
                        </p>
                      )}
                      {src && (
                        <div className="mt-5">
                          <ScreenFrame src={src} alt={`${topic.title} — ${step.title}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* ── FAQ ────────────────────────────────────────────── */}
          {topic.faq.length > 0 && (
            <section id="faq" className="scroll-mt-28">
              <h2 className="text-xl font-bold" style={{ color: "#102B50" }}>Questions fréquentes</h2>
              <div className="mt-4 divide-y rounded-2xl" style={{ border: "1px solid #DCE6F5" }}>
                {topic.faq.map((item) => (
                  <details key={item.q} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none font-semibold" style={{ color: "#102B50" }}>
                      <span className="mr-2 inline-block transition group-open:rotate-90" style={{ color: "#3988FF" }}>›</span>
                      {item.q}
                    </summary>
                    <p className="mt-2 pl-5 text-sm leading-6" style={{ color: "#475569" }}>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ── Pour aller plus loin ───────────────────────────── */}
          {related.length > 0 && (
            <section>
              <h2 className="text-xl font-bold" style={{ color: "#102B50" }}>Pour aller plus loin</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {related.map((item) => (
                  <Link key={item.slug} href={`/guide/${item.slug}`} className="rounded-2xl p-5 transition hover:shadow-md" style={{ border: "1px solid #DCE6F5" }}>
                    <p className="font-semibold" style={{ color: "#102B50" }}>{item.title}</p>
                    <p className="mt-1 text-sm" style={{ color: "#64748B" }}>{item.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Précédent / suivant ────────────────────────────── */}
          <nav className="grid gap-4 border-t pt-8 sm:grid-cols-2" style={{ borderColor: "#E2E8F0" }} aria-label="Parcours suivant">
            {previous ? (
              <Link href={`/guide/${previous.slug}`} className="rounded-xl p-4 hover:bg-[#F2F6FC]">
                <span className="text-xs" style={{ color: "#64748B" }}>← Précédent</span>
                <span className="mt-1 block font-semibold" style={{ color: "#102B50" }}>{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/guide/${next.slug}`} className="rounded-xl p-4 text-right hover:bg-[#F2F6FC]">
                <span className="text-xs" style={{ color: "#64748B" }}>Suivant →</span>
                <span className="mt-1 block font-semibold" style={{ color: "#102B50" }}>{next.title}</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
