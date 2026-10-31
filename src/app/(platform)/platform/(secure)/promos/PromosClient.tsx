"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPlatformPromo, updatePlatformPromo, updatePlatformPromoFlags } from "@/actions/platform.actions";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Drawer } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { PlusIcon } from "@/icons";
import type { PlatformPromoRow } from "@/lib/platform/data";

const stateBadge: Record<PlatformPromoRow["state"], { label: string; color: "success" | "warning" | "error" | "light" | "info" }> = {
  EN_COURS: { label: "En cours", color: "success" },
  A_VENIR: { label: "A venir", color: "info" },
  EXPIRE: { label: "Expire", color: "light" },
  EPUISE: { label: "Quota atteint", color: "warning" },
  DESACTIVE: { label: "Desactive", color: "error" },
};

// Dates manipulées dans le fuseau de Kinshasa, comme côté serveur
const TZ = "Africa/Kinshasa";
const toDay = (iso: string | Date) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const showDay = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { timeZone: TZ });
const today = () => toDay(new Date());
const emptyForm = () => ({ code: "", label: "", reduction: "20", startsAt: today(), endsAt: "", maxUses: "", isPublic: true });

const STEPS = [
  { title: "Le code", hint: "Le code que les participants saisiront et la reduction accordee." },
  { title: "Validite", hint: "La periode pendant laquelle le code fonctionne et le nombre maximal d'utilisations." },
];

export default function PromosClient({ promos }: { promos: PlatformPromoRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const startEdit = (promo: PlatformPromoRow) => {
    setForm({
      code: promo.code,
      label: promo.label,
      reduction: String(promo.reduction),
      startsAt: toDay(promo.startsAt),
      endsAt: toDay(promo.endsAt),
      maxUses: promo.maxUses === null ? "" : String(promo.maxUses),
      isPublic: promo.isPublic,
    });
    setErrors({});
    setMessage("");
    setStep(0);
    setEditingId(promo.id);
    setOpen(true);
  };

  const update = (field: keyof ReturnType<typeof emptyForm>, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateStep = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!/^[A-Z0-9_-]{3,30}$/.test(form.code)) next.code = "3 a 30 caracteres : lettres, chiffres, - ou _.";
      if (form.label.trim().length < 2) next.label = "Donnez un nom a ce code.";
      const r = Number(form.reduction);
      if (!Number.isFinite(r) || r < 1 || r > 100) next.reduction = "Entre 1 et 100 %.";
    } else {
      if (!form.startsAt) next.startsAt = "Date de debut obligatoire.";
      if (!form.endsAt) next.endsAt = "Date de fin obligatoire.";
      else if (form.endsAt < form.startsAt) next.endsAt = "La fin doit etre apres le debut.";
      if (form.maxUses && (!Number.isInteger(Number(form.maxUses)) || Number(form.maxUses) < 1)) next.maxUses = "Nombre entier, ou vide pour illimite.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    setMessage("");
    const fields = {
      label: form.label,
      reduction: Number(form.reduction),
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      isPublic: form.isPublic,
    };
    const res = editingId ? await updatePlatformPromo(editingId, fields) : await createPlatformPromo({ code: form.code, ...fields });
    setSaving(false);
    if (!res.success) {
      setMessage(res.message);
      if (res.errors) {
        setErrors(res.errors);
        if (res.errors.code || res.errors.label || res.errors.reduction) setStep(0);
      }
      return;
    }
    setOpen(false);
    router.refresh();
  };

  const toggle = async (promo: PlatformPromoRow, flags: { status?: "ACTIVE" | "INACTIVE"; isPublic?: boolean }) => {
    setBusyId(promo.id);
    await updatePlatformPromoFlags(promo.id, flags);
    router.refresh();
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">Codes promo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Reductions sur l&apos;abonnement annuel, par exemple pour une conference. Un code public s&apos;affiche sur le site.
          </p>
        </div>
        <Button
          startIcon={<PlusIcon />}
          onClick={() => {
            setForm(emptyForm());
            setErrors({});
            setMessage("");
            setStep(0);
            setEditingId(null);
            setOpen(true);
          }}
        >
          Nouveau code
        </Button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Code", "Reduction", "Periode", "Utilisations", "Inscrits", "Etat", "Actions"].map((h) => (
                  <TableCell key={h} isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {promos.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-6 text-sm text-gray-500">Aucun code promo. Creez-en un pour votre prochain evenement.</TableCell>
                </TableRow>
              )}
              {promos.map((p) => (
                <TableRow key={p.id} className={busyId === p.id ? "opacity-50" : ""}>
                  <TableCell className="px-5 py-3">
                    <p className="font-mono text-sm font-semibold text-gray-800 dark:text-white/90">{p.code}</p>
                    <p className="text-xs text-gray-500">{p.label}{p.isPublic ? " · public" : ""}</p>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">-{p.reduction} %</TableCell>
                  <TableCell className="whitespace-nowrap px-5 py-3 text-sm text-gray-500">
                    {showDay(p.startsAt)} → {showDay(p.endsAt)} inclus
                  </TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{p.uses} / {p.maxUses ?? "∞"}</TableCell>
                  <TableCell className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{p.signups}</TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge size="sm" color={stateBadge[p.state].color}>{stateBadge[p.state].label}</Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button disabled={busyId === p.id} onClick={() => startEdit(p)} className="rounded-lg px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                        Modifier
                      </button>
                      <button disabled={busyId === p.id} onClick={() => toggle(p, { status: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })} className="rounded-lg px-2.5 py-1 text-brand-500 hover:bg-brand-500/10">
                        {p.status === "ACTIVE" ? "Desactiver" : "Reactiver"}
                      </button>
                      <button disabled={busyId === p.id} onClick={() => toggle(p, { isPublic: !p.isPublic })} className="rounded-lg px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                        {p.isPublic ? "Retirer du site" : "Afficher sur le site"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Drawer loading={saving} isOpen={open} onClose={() => setOpen(false)} title={editingId ? `Modifier le code ${form.code}` : "Nouveau code promo"} description={STEPS[step].hint}>
        <div className="mb-5">
          <div className="mb-2 flex justify-between text-xs font-medium text-gray-500">
            <span>Etape {step + 1} sur {STEPS.length} · {STEPS[step].title}</span>
            <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-4">
          {step === 0 ? (
            <>
              <div>
                <Label>Code *</Label>
                <Input value={form.code} disabled={Boolean(editingId)} onChange={(e) => update("code", e.target.value.toUpperCase().replace(/\s+/g, ""))} placeholder="CONF-KIN-2026" error={!!errors.code} hint={errors.code || (editingId ? "Le code ne peut pas etre modifie." : undefined)} />
              </div>
              <div>
                <Label>Nom de l&apos;operation *</Label>
                <Input value={form.label} onChange={(e) => update("label", e.target.value)} placeholder="Conference entrepreneurs Kinshasa" error={!!errors.label} hint={errors.label} />
              </div>
              <div>
                <Label>Reduction sur l&apos;abonnement (%) *</Label>
                <Input type="number" min="1" max="100" value={form.reduction} onChange={(e) => update("reduction", e.target.value)} error={!!errors.reduction} hint={errors.reduction || "100 % = exercice offert."} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Debut *</Label>
                  <Input type="date" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} error={!!errors.startsAt} hint={errors.startsAt} />
                </div>
                <div>
                  <Label>Fin (incluse) *</Label>
                  <Input type="date" value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} error={!!errors.endsAt} hint={errors.endsAt} />
                </div>
              </div>
              <div>
                <Label>Nombre maximal d&apos;utilisations</Label>
                <Input type="number" min="1" value={form.maxUses} onChange={(e) => update("maxUses", e.target.value)} placeholder="Illimite" error={!!errors.maxUses} hint={errors.maxUses || "Compte les abonnements payes avec ce code."} />
              </div>
              <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.isPublic} onChange={(e) => update("isPublic", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                Afficher ce code sur le site internet pendant sa periode
              </label>
            </>
          )}

          {message && <p className="text-sm text-error-500">{message}</p>}

          <div className="flex justify-between gap-3 pt-2">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(0)}>Precedent</Button>
            ) : (
              <span />
            )}
            {step === 0 ? (
              <Button onClick={() => validateStep() && setStep(1)}>Suivant</Button>
            ) : (
              <Button onClick={submit} loading={saving}>{saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Creer le code"}</Button>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
