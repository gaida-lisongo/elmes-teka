"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { PlusIcon, CheckLineIcon } from "@/icons";

// @ts-ignore – actions créées par Agent 2
import { createDette, marquerRemboursee } from "@/actions/dettes.actions";

/* ── Types locaux ─────────────────────────────────────────── */

type DetteStatus = "EN_COURS" | "REMBOURSEE" | "LITIGIEUSE";

interface IDetteSerialized {
  _id: string;
  shopId: string;
  anneeId: string;
  fournisseurNom: string;
  fournisseurTel?: string;
  designation: string;
  montant: number;
  currency: string;
  dateEcheance: string;
  dateCreation: string;
  status: DetteStatus;
  reference: string;
  description?: string;
  createdAt: string;
}

interface DettesData {
  items: IDetteSerialized[];
  anneeLabel?: string;
  storeDesignation?: string;
}

/* ── Composant ────────────────────────────────────────────── */

const emptyForm = {
  fournisseurNom: "",
  fournisseurTel: "",
  designation: "",
  montant: 0,
  currency: "CDF",
  dateEcheance: "",
  description: "",
};

export default function DettesClient({
  shopId,
  anneeId,
  initialData,
  role,
}: {
  shopId: string;
  anneeId: string;
  initialData: DettesData | null;
  role: "TENANT" | "SALER";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items: IDetteSerialized[] = initialData?.items ?? [];

  const totalEnCours = items
    .filter((i) => i.status === "EN_COURS")
    .reduce((s, i) => s + i.montant, 0);

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await createDette({ ...form, shopId, anneeId });
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

  const handleRemboursement = async (id: string) => {
    if (!confirm("Marquer cette dette comme remboursée ?")) return;
    try {
      await marquerRemboursee(id);
      router.refresh();
    } catch {
      /* silently handled */
    }
  };

  const statusColor: Record<DetteStatus, string> = {
    EN_COURS: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
    REMBOURSEE: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
    LITIGIEUSE: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  };

  return (
    <>
      <ResourcePageShell
        title="Dettes"
        description={
          initialData?.anneeLabel
            ? `Exercice ${initialData.anneeLabel}${initialData.storeDesignation ? ` — ${initialData.storeDesignation}` : ""}`
            : "Suivi des dettes fournisseurs"
        }
        metrics={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Total dettes" value={items.length} />
            <Metric
              label="En cours"
              value={items.filter((i) => i.status === "EN_COURS").length}
            />
            <Metric
              label="Montant en cours"
              value={totalEnCours.toLocaleString()}
              highlight="warning"
            />
          </div>
        }
        toolbar={
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setForm(emptyForm);
                setMessage("");
                setOpen(true);
              }}
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
              Aucune dette enregistrée.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Fournisseur</th>
                    <th className="px-4 py-3">Désignation</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-4 py-3">Devise</th>
                    <th className="px-4 py-3">Échéance</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => (
                    <tr
                      key={item._id}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.fournisseurNom}
                        </div>
                        {item.fournisseurTel && (
                          <div className="text-xs text-gray-400">
                            {item.fournisseurTel}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {item.designation}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {item.montant.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{item.currency}</td>
                      <td className="px-4 py-3">
                        {new Date(item.dateEcheance).toLocaleDateString("fr-CD")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status === "EN_COURS" && (
                          <button
                            onClick={() => handleRemboursement(item._id)}
                            title="Marquer remboursée"
                            className="inline-flex items-center gap-1 rounded-lg border border-success-300 px-2 py-1 text-xs text-success-700 hover:bg-success-50 dark:border-success-700 dark:text-success-400"
                          >
                            <CheckLineIcon />
                            Remboursée
                          </button>
                        )}
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
        title="Nouvelle dette"
        description="Enregistrez une dette fournisseur."
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom du fournisseur *</Label>
              <Input
                value={form.fournisseurNom}
                onChange={(e) =>
                  setForm({ ...form, fournisseurNom: e.target.value })
                }
                placeholder="ex : Fournisseur ACME"
              />
            </div>
            <div>
              <Label>Téléphone fournisseur</Label>
              <Input
                value={form.fournisseurTel}
                onChange={(e) =>
                  setForm({ ...form, fournisseurTel: e.target.value })
                }
                placeholder="+243..."
              />
            </div>
          </div>
          <div>
            <Label>Désignation *</Label>
            <Input
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value })
              }
              placeholder="ex : Marchandises achetées à crédit"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Montant *</Label>
              <Input
                type="number"
                min={0}
                value={form.montant}
                onChange={(e) =>
                  setForm({ ...form, montant: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Devise *</Label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="CDF">CDF</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Date d'échéance *</Label>
            <Input
              type="date"
              value={form.dateEcheance}
              onChange={(e) => setForm({ ...form, dateEcheance: e.target.value })}
            />
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
          {message && <p className="text-sm text-error-500">{message}</p>}
          <button
            disabled={loading}
            onClick={submit}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </Drawer>
    </>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "warning";
}) {
  const textClass =
    highlight === "warning"
      ? "text-warning-600 dark:text-warning-400"
      : "text-gray-900 dark:text-white";

  return (
    <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
      <small className="text-gray-500">{label}</small>
      <strong className={`block ${textClass}`}>{value}</strong>
    </div>
  );
}
