"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";

// @ts-ignore – actions créées par Agent 2
import {
  createImmobilisation,
  updateImmobilisation,
  deleteImmobilisation,
} from "@/actions/immobilisations.actions";

/* ── Types locaux ─────────────────────────────────────────── */

type ImmobilisationCategorie =
  | "MOBILIER"
  | "MATERIEL"
  | "VEHICULE"
  | "IMMEUBLE"
  | "AUTRE";

type ImmobilisationStatus = "ACTIF" | "CEDE" | "AMORTI";

interface IImmobilisationSerialized {
  _id: string;
  shopId: string;
  anneeId: string;
  designation: string;
  categorie: ImmobilisationCategorie;
  valeurAchat: number;
  dureeVieAns: number;
  valeurNette: number;
  dateAcquisition: string;
  reference: string;
  status: ImmobilisationStatus;
  description?: string;
  createdAt: string;
}

/* ── Formulaire ───────────────────────────────────────────── */

const CATEGORIES: ImmobilisationCategorie[] = [
  "MOBILIER",
  "MATERIEL",
  "VEHICULE",
  "IMMEUBLE",
  "AUTRE",
];

const STATUSES: ImmobilisationStatus[] = ["ACTIF", "CEDE", "AMORTI"];

const emptyForm = {
  designation: "",
  categorie: "MATERIEL" as ImmobilisationCategorie,
  valeurAchat: 0,
  dureeVieAns: 1,
  dateAcquisition: new Date().toISOString().split("T")[0],
  description: "",
  status: "ACTIF" as ImmobilisationStatus,
};

const STEPS = ["Informations générales", "Détails financiers"];

/* ── Composant ────────────────────────────────────────────── */

export default function ImmobilisationsClient({
  shopId,
  anneeId,
  initialData,
}: {
  shopId: string;
  anneeId: string;
  initialData: IImmobilisationSerialized[] | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items: IImmobilisationSerialized[] = initialData ?? [];

  /* Valeur nette calculée localement si absente */
  function valeurNette(item: IImmobilisationSerialized): number {
    if (item.valeurNette !== undefined) return item.valeurNette;
    // amortissement linéaire simple
    const anneesEcouleees = Math.max(
      0,
      (Date.now() - new Date(item.dateAcquisition).getTime()) /
        (1000 * 60 * 60 * 24 * 365)
    );
    const amort =
      item.dureeVieAns > 0
        ? (item.valeurAchat / item.dureeVieAns) * anneesEcouleees
        : 0;
    return Math.max(0, item.valeurAchat - amort);
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setStep(0);
    setOpen(true);
  };

  const openEdit = (item: IImmobilisationSerialized) => {
    setEditingId(item._id);
    setForm({
      designation: item.designation,
      categorie: item.categorie,
      valeurAchat: item.valeurAchat,
      dureeVieAns: item.dureeVieAns,
      dateAcquisition: item.dateAcquisition.split("T")[0],
      description: item.description ?? "",
      status: item.status,
    });
    setMessage("");
    setStep(0);
    setOpen(true);
  };

  const nextStep = () => {
    if (!form.designation.trim()) {
      setMessage("La désignation est obligatoire.");
      return;
    }
    setMessage("");
    setStep(1);
  };

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = editingId
        ? await updateImmobilisation(editingId, form)
        : await createImmobilisation({ ...form, shopId, anneeId });
      setMessage(result.message);
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setMessage("Une erreur inattendue s'est produite.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette immobilisation ?")) return;
    try {
      await deleteImmobilisation(id);
      router.refresh();
    } catch {
      /* silently handled */
    }
  };

  const statusColor: Record<ImmobilisationStatus, string> = {
    ACTIF: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
    CEDE: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
    AMORTI: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  };

  return (
    <>
      <ResourcePageShell
        title="Immobilisations"
        description="Gérez les actifs immobilisés de votre entreprise."
        metrics={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Total" value={items.length} />
            <Metric
              label="Actifs"
              value={items.filter((i) => i.status === "ACTIF").length}
            />
            <Metric
              label="Cédés"
              value={items.filter((i) => i.status === "CEDE").length}
            />
            <Metric
              label="Amortis"
              value={items.filter((i) => i.status === "AMORTI").length}
            />
          </div>
        }
        toolbar={
          <div className="flex items-center justify-end">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <PlusIcon />
              Ajouter
            </button>
          </div>
        }
        content={
          items.length === 0 ? (
            <div className="rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500 dark:border-gray-800">
              Aucune immobilisation enregistrée.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Désignation</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3 text-right">Valeur achat</th>
                    <th className="px-4 py-3 text-right">Durée (ans)</th>
                    <th className="px-4 py-3 text-right">Valeur nette</th>
                    <th className="px-4 py-3">Acquisition</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => (
                    <tr
                      key={item._id}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        <div>{item.designation}</div>
                        <div className="text-xs text-gray-400">{item.reference}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {item.categorie}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {item.valeurAchat.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {item.dureeVieAns}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {Math.round(valeurNette(item)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(item.dateAcquisition).toLocaleDateString("fr-CD")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                          >
                            <PencilIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="rounded p-1.5 text-error-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                          >
                            <TrashBinIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      />

      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Modifier l'immobilisation" : "Nouvelle immobilisation"}
        description={`Étape ${step + 1} / ${STEPS.length} — ${STEPS[step]}`}
      >
        {/* Progression */}
        <div className="mb-6 flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>Désignation *</Label>
              <Input
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="ex : Ordinateur portable"
              />
            </div>
            <div>
              <Label>Catégorie *</Label>
              <select
                value={form.categorie}
                onChange={(e) =>
                  setForm({ ...form, categorie: e.target.value as ImmobilisationCategorie })
                }
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            {editingId && (
              <div>
                <Label>Statut</Label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as ImmobilisationStatus })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {message && <p className="text-sm text-error-500">{message}</p>}
            <button
              onClick={nextStep}
              className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Suivant
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valeur d'achat *</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.valeurAchat}
                  onChange={(e) =>
                    setForm({ ...form, valeurAchat: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Durée de vie (ans) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.dureeVieAns}
                  onChange={(e) =>
                    setForm({ ...form, dureeVieAns: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Date d'acquisition *</Label>
              <Input
                type="date"
                value={form.dateAcquisition}
                onChange={(e) =>
                  setForm({ ...form, dateAcquisition: e.target.value })
                }
              />
            </div>
            {message && <p className="text-sm text-error-500">{message}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(0); setMessage(""); }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Retour
              </button>
              <button
                disabled={loading}
                onClick={submit}
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
      <small className="text-gray-500">{label}</small>
      <strong className="block text-gray-900 dark:text-white">{value}</strong>
    </div>
  );
}
