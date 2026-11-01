"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  sendChatMessage,
  getConversation,
  deleteConversation,
  getRecommendations,
  generateEnrichedDossier,
  type Recommendation,
} from "@/actions/advisor.actions";
import type { ConversationSummary } from "@/lib/ai/conversations";
import { initiateRecharge } from "@/actions/credits.actions";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import MarkdownContent from "@/components/advisor/MarkdownContent";
import {
  ChatIcon,
  BoltIcon,
  DollarLineIcon,
  PaperPlaneIcon,
  ShootingStarIcon,
  CopyIcon,
  CheckLineIcon,
  PieChartIcon,
  FileIcon,
  PlusIcon,
  TrashBinIcon,
} from "@/icons";

type Message = { role: "user" | "assistant"; content: string; error?: boolean };

type Dossier = {
  text: string;
  score: number | null;
  components: { regularite: number; croissance: number; diversification: number; marge: number } | null;
  interpretation: string;
  disclaimer: string;
};

const RECHARGE_PACKS = [
  { label: "50 crédits", pack: "50cr" as const, usd: 2 },
  { label: "200 crédits", pack: "200cr" as const, usd: 6 },
  { label: "500 crédits", pack: "500cr" as const, usd: 12 },
];

const SUGGESTIONS = [
  "Quels produits dois-je réapprovisionner en priorité ?",
  "Comment améliorer ma trésorerie d'ici la fin de l'année ?",
  "Quels clients dois-je relancer cette semaine ?",
  "Quelle boutique est la plus rentable et pourquoi ?",
];

const MAX_MESSAGES = 20;

const PRIORITY_BADGE: Record<Recommendation["priorite"], { color: "error" | "warning" | "light"; label: string }> = {
  haute: { color: "error", label: "Priorité haute" },
  moyenne: { color: "warning", label: "Priorité moyenne" },
  basse: { color: "light", label: "Priorité basse" },
};

const SCORE_PARTS: Array<{ key: keyof NonNullable<Dossier["components"]>; label: string }> = [
  { key: "regularite", label: "Régularité des ventes" },
  { key: "croissance", label: "Croissance" },
  { key: "diversification", label: "Diversification" },
  { key: "marge", label: "Marge" },
];

function scoreTone(score: number) {
  if (score >= 75) return { stroke: "stroke-success-500", text: "text-success-600", label: "Solide" };
  if (score >= 50) return { stroke: "stroke-warning-500", text: "text-warning-600", label: "Acceptable" };
  return { stroke: "stroke-error-500", text: "text-error-600", label: "Fragile" };
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* presse-papiers indisponible */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5"
    >
      {done ? <CheckLineIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
      {done ? "Copié" : "Copier"}
    </button>
  );
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function AssistantAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white shadow-theme-xs">
      <ShootingStarIcon className="h-4 w-4" />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <AssistantAvatar />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        {[0, 150, 300].map((d) => (
          <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: `${d}ms` }} />
        ))}
        <span className="ml-2 text-xs text-gray-400">Analyse de vos chiffres…</span>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-white/90">{title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export default function AdvisorClient({
  anneeId,
  creditsTotal,
  creditsUsed,
  initialConversations,
}: {
  anneeId: string;
  creditsTotal: number;
  creditsUsed: number;
  initialConversations: ConversationSummary[];
}) {
  const [total] = useState(creditsTotal);
  const [used, setUsed] = useState(creditsUsed);
  const balance = total - used;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [convLoading, setConvLoading] = useState(false);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeStatus, setRechargeStatus] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoError, setRecoError] = useState<string | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierError, setDossierError] = useState<string | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  // Zone de saisie qui grandit avec le texte (4 lignes max)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [input]);

  const limitReached = messages.filter((m) => !m.error).length >= MAX_MESSAGES;

  function deduct(cost: number) {
    setUsed((prev) => prev + cost);
  }

  function send(text: string) {
    const userMsg = text.trim();
    if (!userMsg || isPending || limitReached || convLoading) return;
    if (balance < 2) { setRechargeOpen(true); return; }
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    startTransition(async () => {
      const result = await sendChatMessage(anneeId, activeId, userMsg);
      if (result.success) {
        const conv = result.data.conversation;
        setMessages((prev) => [...prev, { role: "assistant", content: result.data.reply }]);
        setActiveId(conv.id);
        setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
        deduct(2);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: result.message, error: true }]);
      }
    });
  }

  function newConversation() {
    if (isPending) return;
    setActiveId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  async function openConversation(id: string) {
    if (isPending || id === activeId) return;
    setConvLoading(true);
    const result = await getConversation(anneeId, id);
    setConvLoading(false);
    if (result.success) {
      setActiveId(id);
      setMessages(result.data.messages.map((m) => ({ role: m.role, content: m.content })));
    }
  }

  async function removeConversation(id: string) {
    if (!window.confirm("Supprimer cette conversation ?")) return;
    const result = await deleteConversation(id);
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) newConversation();
    }
  }

  async function handleGetRecommendations() {
    if (balance < 5) { setRechargeOpen(true); return; }
    setRecoLoading(true);
    setRecoError(null);
    const result = await getRecommendations(anneeId);
    setRecoLoading(false);
    if (result.success) {
      setRecommendations(result.data.recommendations);
      deduct(5);
    } else {
      setRecoError(result.message);
    }
  }

  async function handleGenerateDossier() {
    if (balance < 10) { setRechargeOpen(true); return; }
    setDossierLoading(true);
    setDossierError(null);
    const result = await generateEnrichedDossier(anneeId);
    setDossierLoading(false);
    if (result.success) {
      setDossier({
        text: result.data.dossier,
        score: result.data.score,
        components: result.data.components,
        interpretation: result.data.interpretation,
        disclaimer: result.data.disclaimer,
      });
      deduct(10);
    } else {
      setDossierError(result.message);
    }
  }

  async function handleRecharge(pack: typeof RECHARGE_PACKS[number]) {
    setRechargeStatus("Envoi de la demande de paiement…");
    const result = await initiateRecharge(anneeId, pack.pack);
    if (result.success) {
      setRechargeStatus(`Paiement initié. Référence : ${result.data.orderNumber}`);
    } else {
      setRechargeStatus(`Erreur : ${result.message}`);
    }
  }

  const creditRatio = total > 0 ? Math.max(0, Math.min(1, balance / total)) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-800 p-6 text-white">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <ShootingStarIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Conseiller IA</h1>
            <p className="text-sm text-white/70">
              Des conseils fondés sur les chiffres réels de votre exercice : ventes, stocks, clients et trésorerie.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="min-w-[160px]">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-white/70">Crédits IA</span>
              <span className="font-semibold">{balance} / {total}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-brand-300" style={{ width: `${creditRatio * 100}%` }} />
            </div>
          </div>
          <button
            onClick={() => setRechargeOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            <BoltIcon className="h-4 w-4" />
            Recharger
          </button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-100 dark:border-gray-800 md:flex">
          <div className="p-3">
            <button
              onClick={newConversation}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-25 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              <PlusIcon className="h-4 w-4" />
              Nouvelle conversation
            </button>
          </div>
          <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Historique</p>
          <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3" style={{ maxHeight: 560 }}>
            {conversations.length === 0 && (
              <p className="px-2 py-3 text-xs text-gray-400">Vos conversations apparaîtront ici.</p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-lg ${c.id === activeId ? "bg-brand-50 dark:bg-brand-500/15" : "hover:bg-gray-50 dark:hover:bg-white/5"}`}
              >
                <button onClick={() => openConversation(c.id)} className="min-w-0 flex-1 px-2.5 py-2 text-left">
                  <p className={`truncate text-sm ${c.id === activeId ? "font-medium text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                    {c.title}
                  </p>
                  <p className="text-xs text-gray-400">{relativeDate(c.updatedAt)} · {c.messageCount} messages</p>
                </button>
                <button
                  onClick={() => removeConversation(c.id)}
                  aria-label="Supprimer la conversation"
                  className="mr-1 rounded-md p-1.5 text-gray-400 opacity-0 transition hover:bg-error-50 hover:text-error-500 group-hover:opacity-100 focus:opacity-100"
                >
                  <TrashBinIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <SectionHeader
            icon={<ChatIcon className="h-4 w-4" />}
            title={activeId ? conversations.find((c) => c.id === activeId)?.title ?? "Chat conseiller" : "Chat conseiller"}
            subtitle={activeId ? "Conversation enregistrée" : "Posez une question sur votre activité"}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={newConversation}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 md:hidden dark:border-gray-700 dark:text-gray-300"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> Nouvelle
                </button>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 dark:bg-white/5">
                  {messages.filter((m) => !m.error).length}/{MAX_MESSAGES} messages · 2 crédits
                </span>
              </div>
            }
          />

          <div ref={scrollRef} className="relative h-[480px] space-y-5 overflow-y-auto bg-gray-50/60 p-5 dark:bg-transparent">
            {convLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-gray-900/60">
                <Spinner className="h-6 w-6 text-brand-500" />
              </div>
            )}
            {messages.length === 0 && !isPending && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
                  <ChatIcon className="h-6 w-6" />
                </span>
                <p className="font-medium text-gray-800 dark:text-white/90">Comment puis-je vous aider ?</p>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Le conseiller lit les chiffres de votre exercice avant de répondre. Essayez une de ces questions :
                </p>
                <div className="mt-5 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-700 transition hover:border-brand-300 hover:bg-brand-25 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-500 px-4 py-2.5 text-sm leading-relaxed text-white">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-3">
                  <AssistantAvatar />
                  <div
                    className={`min-w-0 max-w-[88%] rounded-2xl rounded-tl-sm border px-4 py-3 ${
                      m.error
                        ? "border-error-200 bg-error-50 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10"
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                    }`}
                  >
                    {m.error ? m.content : <MarkdownContent content={m.content} compact />}
                    {!m.error && (
                      <div className="mt-2 flex justify-end border-t border-gray-100 pt-1.5 dark:border-gray-800">
                        <CopyButton text={m.content} />
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {isPending && <TypingIndicator />}
          </div>

          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            {limitReached ? (
              <p className="text-center text-sm text-gray-500">
                Cette conversation a atteint {MAX_MESSAGES} messages.{" "}
                <button onClick={newConversation} className="font-medium text-brand-600 hover:underline">Commencer une nouvelle conversation</button>
              </p>
            ) : (
              <>
                <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-white p-2 focus-within:border-brand-400 dark:border-gray-700 dark:bg-gray-900">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder="Votre question…"
                    className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-white"
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={isPending || !input.trim()}
                    aria-label="Envoyer"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:opacity-40"
                  >
                    {isPending ? <Spinner className="h-4 w-4" /> : <PaperPlaneIcon className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 px-1 text-xs text-gray-400">Entrée pour envoyer · Maj + Entrée pour aller à la ligne</p>
              </>
            )}
          </div>
        </div>

      </div>

        {/* Recommandations */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <SectionHeader
            icon={<BoltIcon className="h-4 w-4" />}
            title="Recommandations"
            subtitle="Les actions prioritaires du moment"
          />
          <div className="grid flex-1 grid-cols-1 gap-3 p-5 md:grid-cols-2">
            {recoLoading &&
              [0, 1, 2].map((k) => (
                <div key={k} className="animate-pulse rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-3 h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}

            {!recoLoading && recommendations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center md:col-span-2">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
                  <BoltIcon className="h-6 w-6" />
                </span>
                <p className="max-w-xs text-sm text-gray-500">
                  L&apos;IA analyse vos ventes, vos stocks et votre trésorerie, puis propose les actions à mener en premier.
                </p>
              </div>
            )}

            {!recoLoading &&
              recommendations.map((r, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4 transition hover:border-brand-200 hover:shadow-theme-xs dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-800 dark:text-white/90">{r.titre}</p>
                        <Badge size="sm" color={PRIORITY_BADGE[r.priorite].color}>{PRIORITY_BADGE[r.priorite].label}</Badge>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{r.action}</p>
                      {r.impact && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-brand-25 px-2.5 py-1.5 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                          <PieChartIcon className="mt-px h-3.5 w-3.5 shrink-0" />
                          {r.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {recoError && <p className="text-sm text-error-500 md:col-span-2">{recoError}</p>}
          </div>
          <div className="flex justify-end border-t border-gray-100 p-4 dark:border-gray-800">
            <Button
              onClick={handleGetRecommendations}
              loading={recoLoading}
              disabled={balance < 5}
              startIcon={<BoltIcon className="h-4 w-4" />}
            >
              {recommendations.length ? "Actualiser" : "Générer"} · 5 crédits
            </Button>
          </div>
        </div>

      {/* Dossier de financement */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <SectionHeader
          icon={<FileIcon className="h-4 w-4" />}
          title="Dossier de financement enrichi"
          subtitle="Synthèse rédigée à partir de vos données, à présenter à une microfinance"
          action={
            <Button
              size="sm"
              onClick={handleGenerateDossier}
              loading={dossierLoading}
              disabled={balance < 10}
              startIcon={<DollarLineIcon className="h-4 w-4" />}
            >
              {dossier ? "Régénérer" : "Générer"} · 10 crédits
            </Button>
          }
        />

        {!dossier && !dossierLoading && (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            {[
              { t: "Score de solvabilité", d: "Calculé sans IA, à partir de la régularité, la croissance, la diversification et la marge." },
              { t: "Synthèse rédigée", d: "Activité, trésorerie, engagements, points forts et points de vigilance." },
              { t: "Prêt à partager", d: "Copiez le texte pour votre dossier de crédit." },
            ].map((c) => (
              <div key={c.t} className="rounded-xl bg-gray-50 p-4 dark:bg-white/[0.02]">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{c.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{c.d}</p>
              </div>
            ))}
          </div>
        )}

        {dossierLoading && (
          <div className="flex items-center justify-center gap-3 p-10 text-sm text-gray-500">
            <Spinner className="h-5 w-5 text-brand-500" />
            Rédaction du dossier à partir de vos chiffres…
          </div>
        )}

        {dossierError && <p className="px-5 pb-5 text-sm text-error-500">{dossierError}</p>}

        {dossier && !dossierLoading && (
          <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-5 dark:bg-white/[0.02]">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Score indicatif</p>
              {dossier.score !== null ? (
                <>
                  <div className="relative mx-auto mt-3 h-36 w-36">
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                      <circle cx="60" cy="60" r="52" className="fill-none stroke-gray-200 dark:stroke-gray-700" strokeWidth="10" />
                      <circle
                        cx="60"
                        cy="60"
                        r="52"
                        className={`fill-none ${scoreTone(dossier.score).stroke}`}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(dossier.score / 100) * 326.7} 326.7`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{dossier.score}</span>
                      <span className={`text-xs font-semibold ${scoreTone(dossier.score).text}`}>{scoreTone(dossier.score).label}</span>
                    </div>
                  </div>
                  {dossier.components && (
                    <div className="mt-4 space-y-2.5">
                      {SCORE_PARTS.map((p) => (
                        <div key={p.key}>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>{p.label}</span>
                            <span className="font-semibold">{dossier.components![p.key]}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, dossier.components![p.key])}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {dossier.interpretation && <p className="mt-4 text-xs leading-relaxed text-gray-500">{dossier.interpretation}</p>}
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-500">Pas assez de ventes sur les 8 dernières semaines pour calculer un score.</p>
              )}
            </div>
            <div className="lg:col-span-2">
              <div className="mb-2 flex justify-end">
                <CopyButton text={dossier.text} />
              </div>
              <MarkdownContent content={dossier.text} />
              <p className="mt-5 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                {dossier.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recharge */}
      {rechargeOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recharger vos crédits</h3>
            <p className="mb-4 mt-1 text-sm text-gray-500">Paiement par Mobile Money. Les crédits s&apos;ajoutent à l&apos;exercice en cours.</p>
            <div className="space-y-3">
              {RECHARGE_PACKS.map((pack) => (
                <button
                  key={pack.pack}
                  onClick={() => handleRecharge(pack)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-25 dark:border-gray-700 dark:hover:bg-brand-500/5"
                >
                  <span className="font-semibold text-gray-800 dark:text-white">{pack.label}</span>
                  <span className="text-sm text-gray-500">{pack.usd} USD</span>
                </button>
              ))}
            </div>
            {rechargeStatus && <p className="mt-3 text-sm text-brand-600 dark:text-brand-400">{rechargeStatus}</p>}
            <button
              onClick={() => { setRechargeOpen(false); setRechargeStatus(null); }}
              className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
