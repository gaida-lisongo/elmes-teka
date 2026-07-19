"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { archivePromotion, initiatePromotionRecharge, removePromotionFromAllCustomers, sendPromotionSmsToCustomers, verifyPromotionRecharge } from "@/actions/promotions.actions";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";

export default function PromotionAudienceClient({ initialData }: { initialData: any }) {
  const router = useRouter(); const params = useSearchParams(); const { promotion, items } = initialData;
  const [rechargeOpen, setRechargeOpen] = useState(false); const [step, setStep] = useState(1); const [credits, setCredits] = useState(30); const [phone, setPhone] = useState(""); const [orderNumber, setOrderNumber] = useState("");
  const [selected, setSelected] = useState<string[]>([]); const [template, setTemplate] = useState("Bonjour {{name}}, profitez de la promotion {{promotion}} avec le code {{code}} et une reduction de {{reduction}}%."); const [message, setMessage] = useState(""); const [report, setReport] = useState<any>(null); const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number; current: string; logs: Array<{ name: string; phone: string; success: boolean; msg: string }> } | null>(null);
  const navigatePage = (page: number) => { const query = new URLSearchParams(params.toString()); query.set("page", String(page)); router.push(`/clients/${promotion.code}?${query.toString()}`); };
  const initiate = async () => { setLoading(true); const result = await initiatePromotionRecharge({ promotionId: promotion.id, credits, phone }); setLoading(false); setMessage(result.message); if (result.success) { setOrderNumber(result.data.orderNumber); setStep(2); router.refresh(); } };
  const verify = async () => { setLoading(true); const result = await verifyPromotionRecharge(promotion.id, orderNumber); setLoading(false); setMessage(result.message); if (result.success) { setRechargeOpen(false); router.refresh(); } };
  const send = async () => {
    if (!selected.length || !confirm(`Envoyer la promotion a ${selected.length} client(s) ?`)) return;
    setLoading(true);
    setReport(null);
    setProgress({ sent: 0, failed: 0, total: selected.length, current: "", logs: [] });
    setMessage("");

    let sent = 0;
    let failed = 0;
    const logs: Array<{ name: string; phone: string; success: boolean; msg: string }> = [];

    for (const customerId of selected) {
      const client = items.find((c: any) => c.id === customerId);
      const name = client?.name ?? "Client";
      const phoneDisplay = client?.phone ?? "—";

      setProgress((prev) => prev ? { ...prev, current: name, sent, failed } : null);

      try {
        const result = await sendPromotionSmsToCustomers({
          promotionId: promotion.id,
          customerIds: [customerId],
          message: template,
        });

        if (result.success && result.data && result.data.sent > 0) {
          sent++;
          logs.push({ name, phone: phoneDisplay, success: true, msg: "Envoye" });
        } else {
          failed++;
          const reason = result.message || "Echec";
          logs.push({ name, phone: phoneDisplay, success: false, msg: reason });
        }
      } catch {
        failed++;
        logs.push({ name, phone: phoneDisplay, success: false, msg: "Erreur reseau" });
      }

      setProgress((prev) => prev ? { ...prev, sent, failed, logs: [...logs] } : null);
    }

    setLoading(false);
    setProgress(null);
    setReport({ totalRequested: selected.length, sent, failed, skipped: 0, results: logs });
    setSelected([]);
    setMessage(sent > 0 ? `${sent} SMS envoye(s), ${failed} echec(s).` : "Aucun SMS envoye.");
    router.refresh();
  };
  const toggleAll = () => setSelected(selected.length === initialData.selectionIds.length ? [] : initialData.selectionIds);
  const stats = promotion.smsStats ?? { sent: 0, failed: 0, skipped: 0 };

  return <>
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 p-6 text-white shadow-theme-md"><p className="text-sm font-medium text-white/80">PROMOTION {promotion.code}</p><h1 className="mt-1 text-2xl font-bold">{promotion.designation}</h1><p className="mt-2 max-w-3xl whitespace-pre-line text-sm text-white/90">{promotion.description}</p><div className="mt-5 flex flex-wrap gap-3"><BannerStat label="Réduction" value={`${promotion.reduction}%`} /><BannerStat label="Seuil" value={`${promotion.commandes} produits`} /><BannerStat label="Audience" value={initialData.total} /><BannerStat label="Associés" value={initialData.metrics?.associatedClients ?? 0} /><BannerStat label="Crédits SMS" value={promotion.credits} /><BannerStat label="SMS confirmés" value={stats.sent} /><BannerStat label="Échecs" value={stats.failed} /></div>{initialData.metrics?.usage?.length > 0 && <p className="mt-4 text-sm text-white/90">Utilisation : {initialData.metrics.usage.map((item: any) => `${item.orders} commande(s), CA ${item.currency} ${item.revenue}, réductions ${item.currency} ${item.discounts}`).join(" · ")}</p>}</div>
    <ResourcePageShell title="Diffusion de la promotion" description="Sélectionnez les clients éligibles puis envoyez un message personnalisé."
      toolbar={<div className="space-y-3"><div className="flex flex-wrap items-center gap-3"><form className="min-w-60 flex-1"><Input name="search" placeholder="Nom, téléphone ou matricule..." /></form><button onClick={toggleAll} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700">{selected.length === initialData.selectionIds.length && selected.length ? "Tout désélectionner" : `Sélectionner les résultats (${initialData.selectionIds.length}/50 max.)`}</button><button onClick={() => { setStep(1); setMessage(""); setRechargeOpen(true); }} className="rounded-lg border border-brand-500 px-4 py-2 text-sm text-brand-500">Recharger</button></div><div><Label>Message SMS</Label><textarea rows={3} value={template} onChange={(event) => setTemplate(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900" /><p className="mt-1 text-xs text-gray-500">Variables : {"{{name}}"}, {"{{promotion}}"}, {"{{code}}"}, {"{{reduction}}"}</p></div><div className="flex flex-wrap gap-2"><button disabled={loading || !selected.length || promotion.status !== "ACTIVE"} onClick={send} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? "Envoi en cours..." : `Envoyer à ${selected.length} client(s)`}</button><button onClick={async () => { if (confirm("Retirer cette promotion de tous les clients ?")) { const result = await removePromotionFromAllCustomers(promotion.id); setMessage(result.message); router.refresh(); } }} className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700">Retirer de tous les clients</button><button onClick={async () => { if (confirm("Archiver cette promotion et retirer toutes ses associations ?")) { const result = await archivePromotion(promotion.id); if (result.success) router.push("/clients"); else setMessage(result.message); } }} className="rounded-lg border border-error-500 px-4 py-2 text-sm text-error-500">Archiver</button></div></div>}
      content={
        <div className="space-y-3">
          {items.map((client: any) => <label key={client.id} className="flex cursor-pointer flex-col justify-between gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center dark:border-gray-800 bg-white dark:bg-white/[0.03]"><div className="flex items-center gap-3"><input type="checkbox" checked={selected.includes(client.id)} disabled={client.associated} onChange={() => setSelected((current) => current.includes(client.id) ? current.filter((id) => id !== client.id) : [...current, client.id])} className="h-4 w-4" /><div><h3 className="font-medium text-gray-900 dark:text-white">{client.name}</h3><p className="text-sm text-gray-500">{client.phone} · {client.matricule}</p></div></div><div className="flex flex-wrap gap-4 text-sm"><span>{client.commandes} produits</span><span>{client.ventes} ventes</span><span>{client.associated ? "Déjà associé" : "Éligible"}</span></div></label>)}</div>}
      emptyState={!items.length ? <div className="p-12 text-center text-sm text-gray-500">Aucun client ne remplit les critères de cette promotion.</div> : undefined}
      pagination={<div className="flex justify-between p-4"><button disabled={initialData.page <= 1} onClick={() => navigatePage(initialData.page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40 dark:border-gray-700">Précédent</button><span className="text-sm">Page {initialData.page} sur {initialData.totalPages}</span><button disabled={initialData.page >= initialData.totalPages} onClick={() => navigatePage(initialData.page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40 dark:border-gray-700">Suivant</button></div>}
    />
    {progress && (
      <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-500/5">
        <div className="mb-3 flex items-center justify-between">
          <strong className="text-sm text-brand-700 dark:text-brand-300">
            Envoi en cours : {progress.sent}/{progress.total}
          </strong>
          <span className="text-xs text-brand-500">{progress.current}</span>
        </div>
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-brand-200 dark:bg-brand-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-300"
            style={{ width: `${Math.round(((progress.sent + progress.failed) / progress.total) * 100)}%` }}
          />
        </div>
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {progress.logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={log.success ? "text-success-500" : "text-error-500"}>
                {log.success ? "✓" : "✗"}
              </span>
              <span className="text-gray-700 dark:text-gray-300">{log.name}</span>
              <span className="text-gray-400">{log.phone}</span>
              <span className="text-gray-500">— {log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    )}
    {report && <div className="mt-4 rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-800"><strong>{report.totalRequested} client(s) selectionne(s)</strong><p>{report.sent} SMS confirme(s), {report.failed} echec(s), {report.skipped} deja associe(s).</p></div>}{message && !rechargeOpen && <p className="mt-4 rounded-lg bg-gray-100 p-3 text-sm dark:bg-gray-800">{message}</p>}
    <Drawer isOpen={rechargeOpen} onClose={() => setRechargeOpen(false)} title="Recharger les crédits SMS" description="30 crédits coûtent 2 USD. Les crédits sont ajoutés après vérification FlexPay."><div className="space-y-5"><div className="flex gap-2">{[1, 2].map((item) => <span key={item} className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${step >= item ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"}`}>{item}</span>)}</div>{step === 1 ? <><div><Label>Nombre de messages</Label><Input type="number" min="30" step={30} value={credits} onChange={(event) => setCredits(Number(event.target.value))} /><p className="mt-1 text-xs text-gray-500">Montant : {(credits / 30) * 2} USD</p></div><div><Label>Numéro Mobile Money</Label><Input value={phone} onChange={(event) => setPhone(event.target.value)} /></div><button disabled={loading || credits < 30 || credits % 30 !== 0} onClick={initiate} className="rounded-lg bg-brand-500 px-4 py-2.5 text-white disabled:opacity-50">Initier le paiement</button></> : <><p className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">Order Number : <strong>{orderNumber}</strong></p><button disabled={loading} onClick={verify} className="rounded-lg bg-brand-500 px-4 py-2.5 text-white disabled:opacity-50">Vérifier le paiement</button></>}{message && <p className="text-sm">{message}</p>}</div></Drawer>
  </>;
}

function BannerStat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-white/15 px-4 py-3"><small className="block text-white/75">{label}</small><strong>{value}</strong></div>; }
