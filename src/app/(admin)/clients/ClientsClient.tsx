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

const emptyForm = {
  designation: "",
  description: "",
  code: "",
  reduction: 0,
  commandes: 1,
  status: "ACTIVE" as const,
};

interface PromotionItem {
  id: string;
  designation: string;
  description: string;
  code: string;
  reduction: number;
  commandes: number;
  credits: number;
  status: string;
  eligibleCount?: number;
  usedCount?: number;
}

interface ClientMetrics {
  customers: number;
  buyingCustomers: number;
  inactiveCustomers: number;
  orders: number;
  revenue: string | number;
}

interface InitialData {
  metrics: ClientMetrics;
  items: PromotionItem[];
}

export default function ClientsClient({ initialData }: { initialData: InitialData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const edit = (item: PromotionItem) => {
    setEditingId(item.id);
    setForm({
      designation: item.designation,
      description: item.description,
      code: item.code,
      reduction: item.reduction,
      commandes: item.commandes,
      status: item.status as typeof emptyForm.status,
    });
    setMessage("");
    setOpen(true);
  };

  const submit = async () => {
    setLoading(true);
    setMessage("");
    const result = editingId
      ? await updatePromotion(editingId, form)
      : await createPromotion(form);
    setLoading(false);
    setMessage(result.message);
    if (result.success) {
      setOpen(false);
      router.refresh();
    }
  };

  const { metrics } = initialData;
  const activeRate =
    metrics.customers > 0
      ? Math.round((metrics.buyingCustomers / metrics.customers) * 100)
      : 0;

  return (
    <>
      <ResourcePageShell
        title="Clients et promotions"
        description="Segmentez et récompensez vos meilleurs clients selon leurs achats."
        metrics={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Total */}
            <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <small className="text-xs text-gray-500">Total clients</small>
              <strong className="mt-1 block text-2xl text-gray-900 dark:text-white">
                {metrics.customers.toLocaleString()}
              </strong>
              <span className="text-xs text-gray-400">base enregistrée</span>
            </div>

            {/* Actifs */}
            <div className="rounded-xl border border-success-200 bg-success-50 p-4 dark:border-success-500/30 dark:bg-success-500/10">
              <small className="text-xs text-success-600 dark:text-success-400">
                Clients acheteurs
              </small>
              <strong className="mt-1 block text-2xl text-success-700 dark:text-success-300">
                {metrics.buyingCustomers.toLocaleString()}
              </strong>
              <span className="text-xs text-success-600/70 dark:text-success-400/70">
                {activeRate}% du total
              </span>
            </div>

            {/* Inactifs */}
            <div className="rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10">
              <div className="flex items-center justify-between">
                <small className="text-xs text-error-600 dark:text-error-400">
                  Sans achat
                </small>
                {metrics.inactiveCustomers > 0 && (
                  <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-semibold text-error-700 dark:bg-error-500/20 dark:text-error-300">
                    À réactiver
                  </span>
                )}
              </div>
              <strong className="mt-1 block text-2xl text-error-700 dark:text-error-300">
                {metrics.inactiveCustomers.toLocaleString()}
              </strong>
              <span className="text-xs text-error-600/70 dark:text-error-400/70">
                clients inactifs
              </span>
            </div>

            {/* CA cumulé */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <small className="text-xs text-brand-600 dark:text-brand-400">
                CA cumulé
              </small>
              <strong className="mt-1 block text-xl font-bold text-brand-700 dark:text-brand-300">
                {typeof metrics.revenue === "number"
                  ? metrics.revenue.toLocaleString()
                  : metrics.revenue}
              </strong>
              <span className="text-xs text-brand-600/70 dark:text-brand-400/70">
                {metrics.orders.toLocaleString()} commandes
              </span>
            </div>
          </div>
        }
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <form className="flex-1">
              <Input name="search" placeholder="Rechercher une promotion..." />
            </form>
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setMessage("");
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <PlusIcon />
              Nouvelle promotion
            </button>
          </div>
        }
        content={
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {initialData.items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-brand-500">
                      {item.code}
                    </p>
                    <h3 className="mt-0.5 font-semibold text-gray-900 dark:text-white">
                      {item.designation}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.status === "ACTIVE"
                        ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {item.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Description */}
                {item.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                    {item.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-brand-50 p-2.5 text-center dark:bg-brand-500/10">
                    <strong className="block text-lg font-bold text-brand-600 dark:text-brand-400">
                      {item.reduction}%
                    </strong>
                    <small className="text-xs text-gray-500">Réduction</small>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2.5 text-center dark:bg-gray-800">
                    <strong className="block text-lg font-bold text-gray-700 dark:text-gray-200">
                      {item.commandes}
                    </strong>
                    <small className="text-xs text-gray-500">Seuil produits</small>
                  </div>
                  <div className="rounded-lg bg-success-50 p-2.5 text-center dark:bg-success-500/10">
                    <strong className="block text-lg font-bold text-success-600 dark:text-success-400">
                      {item.credits ?? 0}
                    </strong>
                    <small className="text-xs text-gray-500">Crédits actifs</small>
                  </div>
                </div>

                {/* Eligible / Used counts if provided */}
                {(item.eligibleCount !== undefined ||
                  item.usedCount !== undefined) && (
                  <div className="mt-3 flex gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                    {item.eligibleCount !== undefined && (
                      <span className="text-xs text-gray-500">
                        <strong className="text-gray-800 dark:text-white">
                          {item.eligibleCount}
                        </strong>{" "}
                        éligibles
                      </span>
                    )}
                    {item.usedCount !== undefined && (
                      <span className="text-xs text-gray-500">
                        <strong className="text-gray-800 dark:text-white">
                          {item.usedCount}
                        </strong>{" "}
                        utilisations
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <Link
                    href={`/clients/${item.code}`}
                    className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Voir les clients
                  </Link>
                  <button
                    onClick={() => edit(item)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Modifier
                  </button>
                  <button
                    aria-label="Archiver"
                    onClick={async () => {
                      if (confirm("Archiver cette promotion ?")) {
                        await archivePromotion(item.id);
                        router.refresh();
                      }
                    }}
                    className="rounded-lg border border-gray-300 p-2 text-error-500 hover:bg-error-50 dark:border-gray-700 dark:hover:bg-error-500/10"
                  >
                    <TrashBinIcon />
                  </button>
                </div>
              </article>
            ))}
          </div>
        }
        emptyState={
          !initialData.items.length ? (
            <div className="rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500 dark:border-gray-800">
              Aucune promotion n&apos;est encore configurée.
            </div>
          ) : undefined
        }
      />

      {/* Drawer création / édition */}
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Modifier la promotion" : "Créer une promotion"}
        description="Le seuil correspond au nombre cumulé de produits achetés par le client."
      >
        <div className="space-y-4">
          <div>
            <Label>Désignation</Label>
            <Input
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            />
          </div>
          <div>
            <Label>Code</Label>
            <Input
              disabled={Boolean(editingId)}
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Réduction (%)</Label>
              <Input
                type="number"
                value={form.reduction}
                onChange={(e) =>
                  setForm({ ...form, reduction: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Produits achetés minimum</Label>
              <Input
                type="number"
                value={form.commandes}
                onChange={(e) =>
                  setForm({ ...form, commandes: Number(e.target.value) })
                }
              />
            </div>
          </div>
          {editingId && (
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as typeof emptyForm.status,
                })
              }
              className="h-11 w-full rounded-lg border px-3 dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          )}
          {message && <p className="text-sm text-error-500">{message}</p>}
          <button
            disabled={loading}
            onClick={submit}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-brand-600"
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </Drawer>
    </>
  );
}
