"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { initiatePromotionRecharge, sendPromotionAlerts, verifyPromotionRecharge } from "@/actions/promotions.actions";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";

export default function PromotionAudienceClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const { promotion, items } = initialData;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [credits, setCredits] = useState(30);
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const initiate = async () => {
    setLoading(true); const result = await initiatePromotionRecharge({ promotionId: promotion.id, credits, phone }); setLoading(false); setMessage(result.message);
    if (result.success) { setOrderNumber(result.data.orderNumber); setStep(2); router.refresh(); }
  };
  const verify = async () => {
    setLoading(true); const result = await verifyPromotionRecharge(promotion.id, orderNumber); setLoading(false); setMessage(result.message);
    if (result.success) { setOpen(false); router.refresh(); }
  };

  return <>
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-400 p-6 text-white shadow-theme-md">
      <p className="text-sm font-medium text-white/80">PROMOTION {promotion.code}</p><h1 className="mt-1 text-2xl font-bold">{promotion.designation}</h1><p className="mt-2 max-w-3xl whitespace-pre-line text-sm text-white/90">{promotion.description}</p>
      <div className="mt-5 flex flex-wrap gap-3"><BannerStat label="Réduction" value={`${promotion.reduction}%`} /><BannerStat label="Seuil" value={`${promotion.commandes} produits`} /><BannerStat label="Audience" value={initialData.total} /><BannerStat label="Crédits SMS" value={promotion.credits} /></div>
    </div>
    <ResourcePageShell
      title="Clients éligibles"
      description="Clients dont le nombre cumulé de produits achetés atteint le seuil de la promotion."
      toolbar={<div className="flex flex-wrap items-center justify-between gap-3"><form className="flex-1"><Input name="search" placeholder="Rechercher par nom ou téléphone..." /></form><div className="flex gap-2"><button onClick={() => { setStep(1); setMessage(""); setOpen(true); }} className="rounded-lg border border-brand-500 px-4 py-2 text-sm font-medium text-brand-500">Recharger les crédits</button><button onClick={async () => { const result = await sendPromotionAlerts(); setMessage(result.message); }} disabled={!promotion.credits || !items.length} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Envoyer les alertes</button></div></div>}
      content={<div className="space-y-3 p-5">{items.map((client: any) => <article key={client.id} className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center dark:border-gray-800"><div><h3 className="font-medium text-gray-900 dark:text-white">{client.name}</h3><p className="text-sm text-gray-500">{client.phone} · {client.matricule}</p></div><div className="flex flex-wrap gap-4 text-sm"><span>{client.commandes} produits achetés</span><span>{client.ventes} ventes</span><span>{client.associated ? "Promotion associée" : "À notifier"}</span></div></article>)}</div>}
      emptyState={!items.length ? <div className="p-12 text-center text-sm text-gray-500">Aucun client ne remplit encore les critères de cette promotion.</div> : undefined}
    />
    {message && !open && <p className="mt-4 rounded-lg bg-gray-100 p-3 text-sm dark:bg-gray-800">{message}</p>}
    <Drawer isOpen={open} onClose={() => setOpen(false)} title="Recharger les crédits SMS" description="30 crédits coûtent 2 USD. Les crédits ne sont ajoutés qu’après vérification FlexPay.">
      <div className="space-y-5"><div className="flex gap-2">{[1, 2].map((item) => <span key={item} className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${step >= item ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"}`}>{item}</span>)}</div>{step === 1 ? <><div><Label>Nombre de messages</Label><Input type="number" min={30} step={30} value={credits} onChange={(e) => setCredits(Number(e.target.value))} /><p className="mt-1 text-xs text-gray-500">Montant : {(credits / 30) * 2} USD</p></div><div><Label>Numéro Mobile Money</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+243XXXXXXXXX" /></div><button disabled={loading || credits < 30 || credits % 30 !== 0} onClick={initiate} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Initiation..." : "Initier le paiement"}</button></> : <><div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800"><p>Order Number</p><strong>{orderNumber}</strong><p className="mt-2">Crédits attendus : {credits}</p></div><button disabled={loading} onClick={verify} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Vérification..." : "Vérifier le paiement"}</button></>}{message && <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>}</div>
    </Drawer>
  </>;
}

function BannerStat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-white/15 px-4 py-3"><small className="block text-white/75">{label}</small><strong>{value}</strong></div>; }
