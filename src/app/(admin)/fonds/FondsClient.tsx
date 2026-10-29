"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { PlusIcon } from "@/icons";

// @ts-ignore – actions créées par Agent 2
import { createFonds } from "@/actions/fonds.actions";

/* ── Types locaux ─────────────────────────────────────────── */

type FondsType = "APPORT" | "RETRAIT";
type FondsStatus = "VALIDE" | "ANNULE";

interface IFondsSerialized {
  _id: string;
  shopId: string;
  anneeId: string;
  libelle: string;
  montant: number;
  currency: string;
  type: FondsType;
  reference: string;
  dateOperation: string;
  status: FondsStatus;
  description?: string;
  createdAt: string;
}

/* ── Composant ────────────────────────────────────────────── */

const emptyForm = {
  libelle: "",
  type: "APPORT" as FondsType,
  montant: 0,
  currency: "CDF",
  dateOperation: new Date().toISOString().split("T")[0],
  description: "",
};

export default function FondsClient({
  initialData,
}: {
  initialData: IFondsSerialized[] | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const items: IFondsSerialized[] = initialData ?? [];

  const totalApports = items
    .filter((i) => i.type === "APPORT" && i.status === "VALIDE")
    .reduce((s, i) => s + i.montant, 0);

  const totalRetraits = items
    .filter((i) => i.type === "RETRAIT" && i.status === "VALIDE")
    .reduce((s, i) => s + i.montant, 0);

  const solde = totalApports - totalRetraits;

  const submit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await createFonds(form);
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

  const typeColor: Record<FondsType, string> = {
    APPORT: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
    RETRAIT: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  };

  const statusColor: Record<FondsStatus, string> = {
    VALIDE: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
    ANNULE: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };

  return (
    <>
      <ResourcePageShell
        title="Fonds propres"
        description="Suivez les apports et retraits de fonds de l'entreprise."
        metrics={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Apports (VALIDE)" value={totalApports.toLocaleString()} />
            <Metric label="Retraits (VALIDE)" value={totalRetraits.toLocaleString()} />
            <Metric
              label="Solde"
              value={solde.toLocaleString()}
              highlight={solde >= 0 ? "success" : "error"}
            />
            <Metric label="Total opérations" value={items.length} />
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
              Aucune opération de fonds enregistrée.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Libellé</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-4 py-3">Devise</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
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
                          {item.libelle}
                        </div>
                        <div className="text-xs text-gray-400">{item.reference}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[item.type]}`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {item.montant.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {item.currency}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(item.dateOperation).toLocaleDateString("fr-CD")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[item.status]}`}
                        >
                          {item.status}
                        </span>
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
        title="Nouvelle opération de fonds"
        description="Enregistrez un apport ou un retrait de fonds."
      >
        <div className="space-y-4">
          <div>
            <Label>Libellé *</Label>
            <Input
              value={form.libelle}
              onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              placeholder="ex : Apport en capital"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type *</Label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as FondsType })
                }
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="APPORT">APPORT</option>
                <option value="RETRAIT">RETRAIT</option>
              </select>
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
              <Label>Date de l'opération *</Label>
              <Input
                type="date"
                value={form.dateOperation}
                onChange={(e) =>
                  setForm({ ...form, dateOperation: e.target.value })
                }
              />
            </div>
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
  highlight?: "success" | "error";
}) {
  const textClass =
    highlight === "success"
      ? "text-success-600 dark:text-success-400"
      : highlight === "error"
      ? "text-error-600 dark:text-error-400"
      : "text-gray-900 dark:text-white";

  return (
    <div className="rounded-xl border border-gray-100 p-3 dark:border-gray-800">
      <small className="text-gray-500">{label}</small>
      <strong className={`block ${textClass}`}>{value}</strong>
    </div>
  );
}
