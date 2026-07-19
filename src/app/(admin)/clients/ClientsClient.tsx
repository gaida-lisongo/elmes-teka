"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { archivePromotion, createPromotion, updatePromotion } from "@/actions/promotions.actions";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";
import { PlusIcon, TrashBinIcon } from "@/icons";

const emptyForm = { designation: "", description: "", code: "", reduction: 0, commandes: 1, status: "ACTIVE" as const };

export default function ClientsClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const edit = (item: any) => {
    setEditingId(item.id);
    setForm({ designation: item.designation, description: item.description, code: item.code, reduction: item.reduction, commandes: item.commandes, status: item.status });
    setMessage(""); setOpen(true);
  };

  const submit = async () => {
    setLoading(true); setMessage("");
    const result = editingId ? await updatePromotion(editingId, form) : await createPromotion(form);
    setLoading(false); setMessage(result.message);
    if (result.success) { setOpen(false); router.refresh(); }
  };

  const metrics = initialData.metrics;
  return <>
    <ResourcePageShell
      title="Clients et promotions"
      description="Segmentez et récompensez vos meilleurs clients selon leurs achats."
      metrics={<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Clients" value={metrics.customers} />
        <Metric label="Clients acheteurs" value={metrics.buyingCustomers} />
        <Metric label="Sans achat" value={metrics.inactiveCustomers} />
        <Metric label="Commandes" value={metrics.orders} />
        <Metric label="CA cumulé" value={metrics.revenue} />
      </div>}
      toolbar={<div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex-1"><Input name="search" placeholder="Rechercher une promotion..." /></form>
        <button onClick={() => { setEditingId(null); setForm(emptyForm); setMessage(""); setOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white"><PlusIcon /> Nouvelle promotion</button>
      </div>}
      content={<div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">{initialData.items.map((item: any) =>
        <article key={item.id} className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-brand-500">{item.code}</p><h3 className="font-semibold text-gray-900 dark:text-white">{item.designation}</h3></div><span className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">{item.status}</span></div>
          <p className="mt-3 whitespace-pre-line text-sm text-gray-500">{item.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center"><Metric label="Réduction" value={`${item.reduction}%`} /><Metric label="Seuil" value={item.commandes} /><Metric label="Crédits" value={item.credits} /></div>
          <div className="mt-4 flex flex-wrap gap-2"><Link href={`/clients/${item.code}`} className="rounded-lg bg-brand-500 px-3 py-2 text-sm text-white">Voir les clients</Link><button onClick={() => edit(item)} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-700">Modifier</button><button aria-label="Archiver" onClick={async () => { if (confirm("Archiver cette promotion ?")) { await archivePromotion(item.id); router.refresh(); } }} className="rounded-lg border p-2 text-error-500 dark:border-gray-700"><TrashBinIcon /></button></div>
        </article>)}</div>}
      emptyState={!initialData.items.length ? <div className="p-12 text-center text-sm text-gray-500">Aucune promotion n’est encore configurée.</div> : undefined}
    />
    <Drawer isOpen={open} onClose={() => setOpen(false)} title={editingId ? "Modifier la promotion" : "Créer une promotion"} description="Le seuil correspond au nombre cumulé de produits achetés par le client.">
      <div className="space-y-4"><div><Label>Désignation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div><div><Label>Code</Label><Input disabled={Boolean(editingId)} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div><div><Label>Description</Label><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900" /></div><div className="grid grid-cols-2 gap-3"><div><Label>Réduction (%)</Label><Input type="number" value={form.reduction} onChange={(e) => setForm({ ...form, reduction: Number(e.target.value) })} /></div><div><Label>Produits achetés minimum</Label><Input type="number" value={form.commandes} onChange={(e) => setForm({ ...form, commandes: Number(e.target.value) })} /></div></div>{editingId && <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-11 w-full rounded-lg border px-3 dark:border-gray-700 dark:bg-gray-900"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>} {message && <p className="text-sm text-error-500">{message}</p>}<button disabled={loading} onClick={submit} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{loading ? "Enregistrement..." : "Enregistrer"}</button></div>
    </Drawer>
  </>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800"><small className="text-gray-500">{label}</small><strong className="block text-gray-900 dark:text-white">{value}</strong></div>; }
