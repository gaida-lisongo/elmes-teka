"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { sendChatMessage, getRecommendations, generateEnrichedDossier } from "@/actions/advisor.actions";
import { initiateRecharge } from "@/actions/credits.actions";
import { ChatIcon, BoltIcon, DollarLineIcon } from "@/icons";

type Message = { role: "user" | "assistant"; content: string };

const RECHARGE_PACKS = [
  { label: "50 crédits", pack: "50cr" as const, usd: 2 },
  { label: "200 crédits", pack: "200cr" as const, usd: 6 },
  { label: "500 crédits", pack: "500cr" as const, usd: 12 },
];

export default function AdvisorClient({
  anneeId,
  creditsTotal,
  creditsUsed,
}: {
  anneeId: string;
  creditsTotal: number;
  creditsUsed: number;
}) {
  const [total, setTotal] = useState(creditsTotal);
  const [used, setUsed] = useState(creditsUsed);
  const balance = total - used;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeStatus, setRechargeStatus] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recoLoading, setRecoLoading] = useState(false);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierText, setDossierText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function deduct(cost: number) {
    setUsed((prev) => prev + cost);
  }

  function handleSend() {
    if (!input.trim() || isPending) return;
    if (balance < 2) { setRechargeOpen(true); return; }
    const userMsg = input.trim();
    setInput("");
    const history = messages.slice(-18);
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    startTransition(async () => {
      const result = await sendChatMessage(anneeId, userMsg, history.map(m => ({ role: m.role, content: m.content })));
      if (result.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.data.reply }]);
        deduct(2);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: `Erreur : ${result.message}` }]);
      }
    });
  }

  async function handleGetRecommendations() {
    if (balance < 5) { setRechargeOpen(true); return; }
    setRecoLoading(true);
    const result = await getRecommendations(anneeId);
    setRecoLoading(false);
    if (result.success) {
      setRecommendations(result.data.recommendations);
      deduct(5);
    }
  }

  async function handleGenerateDossier() {
    if (balance < 10) { setRechargeOpen(true); return; }
    setDossierLoading(true);
    const result = await generateEnrichedDossier(anneeId);
    setDossierLoading(false);
    if (result.success) {
      setDossierText(result.data.dossier);
      deduct(10);
    }
  }

  async function handleRecharge(pack: typeof RECHARGE_PACKS[number]) {
    setRechargeStatus("Redirection vers FlexPay…");
    const result = await initiateRecharge(anneeId, pack.pack);
    if (result.success) {
      setRechargeStatus(`Paiement initié. Référence : ${result.data.orderNumber}`);
    } else {
      setRechargeStatus(`Erreur : ${result.message}`);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">

      {/* Header + Credits */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white/90">Conseiller IA</h1>
          <p className="text-sm text-gray-500">Posez vos questions commerciales, obtenez des recommandations.</p>
        </div>
        <button
          onClick={() => setRechargeOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300"
        >
          <BoltIcon className="h-4 w-4" />
          {balance} crédit{balance !== 1 ? "s" : ""}
        </button>
      </div>

      {/* Recommendations */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-white/90">Recommandations automatiques</h2>
          <button
            onClick={handleGetRecommendations}
            disabled={recoLoading || balance < 5}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {recoLoading ? "Analyse…" : "Générer (5 crédits)"}
          </button>
        </div>
        {recommendations.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="rounded-lg border border-brand-100 bg-brand-25 p-3 text-sm text-gray-700 dark:border-brand-500/10 dark:bg-brand-500/5 dark:text-gray-300">
                {rec}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-gray-500">Cliquez sur "Générer" pour obtenir des recommandations basées sur vos données.</p>
        )}
      </div>

      {/* Chatbot */}
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white/90">
            <ChatIcon className="h-4 w-4 text-brand-500" />
            Chat conseiller <span className="ml-auto text-xs font-normal text-gray-400">{messages.length}/20 messages · 2 crédits/message</span>
          </h2>
        </div>
        <div className="h-80 overflow-y-auto space-y-3 p-5">
          {messages.length === 0 && (
            <p className="text-center text-sm text-gray-400 pt-10">Posez votre première question…</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500 dark:bg-gray-800">Réflexion…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-gray-100 p-4 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Votre question…"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={isPending || !input.trim()}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>

      {/* Dossier financement */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-white/90">Dossier de financement enrichi</h2>
            <p className="mt-0.5 text-xs text-gray-500">Narrative IA basée sur vos données — score indicatif, non contractuel.</p>
          </div>
          <button
            onClick={handleGenerateDossier}
            disabled={dossierLoading || balance < 10}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            <DollarLineIcon className="h-4 w-4" />
            {dossierLoading ? "Génération…" : "Générer (10 crédits)"}
          </button>
        </div>
        {dossierText && (
          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-25 p-4 text-sm leading-relaxed text-gray-700 dark:border-brand-500/10 dark:bg-brand-500/5 dark:text-gray-300 whitespace-pre-wrap">
            {dossierText}
            <p className="mt-3 text-xs text-gray-400 italic">Ce dossier est généré par IA à titre indicatif à partir de vos données réelles. Il ne constitue pas une décision de financement ou de crédit.</p>
          </div>
        )}
      </div>

      {/* Recharge modale */}
      {rechargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Recharger vos crédits</h3>
            <div className="space-y-3">
              {RECHARGE_PACKS.map((pack) => (
                <button
                  key={pack.pack}
                  onClick={() => handleRecharge(pack)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-25 dark:border-gray-700 dark:hover:bg-brand-500/5"
                >
                  <span className="font-semibold text-gray-800 dark:text-white">{pack.label}</span>
                  <span className="text-sm text-gray-500">${pack.usd}</span>
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
