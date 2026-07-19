"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import type { PaginatedAnnees, AnneeMetrics } from "@/actions/annees.actions";
import { createAnnee, updateAnnee, deleteAnnee } from "@/actions/annees.actions";
import { exportAnneeJournal } from "@/actions/exports.actions";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import Pagination from "@/components/tables/Pagination";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { PlusIcon, PencilIcon, TrashBinIcon, DownloadIcon, FolderIcon } from "@/icons";

interface AnneesClientProps {
  initialData: PaginatedAnnees | null;
  initialMetrics: AnneeMetrics | null;
  currentPage: number;
  currentLimit: number;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <FolderIcon className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
      <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        Aucun exercice defini
      </h3>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
        Créez un exercice pour organiser vos recettes et dépenses par période.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
      >
        <PlusIcon /> Creer un exercice
      </button>
    </div>
  );
}

function AnneeCard({
  annee,
  onEdit,
  onDelete,
  onExport,
}: {
  annee: any;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const resultatClass = annee.resultat >= 0 ? "text-success-500" : "text-error-500";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {new Date(annee.debut).getFullYear()} - {new Date(annee.fin).getFullYear()}
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {new Date(annee.debut).toLocaleDateString("fr-FR")} au{" "}
            {new Date(annee.fin).toLocaleDateString("fr-FR")}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Slug: {annee.slug}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium dark:bg-gray-800">
          {annee.nbCommandes} cmd
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-500">Recettes</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            {annee.totalRecettes}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Depenses</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            {annee.totalDepenses}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Resultat</p>
          <p className={`text-sm font-semibold ${resultatClass}`}>
            {annee.resultat >= 0 ? "+" : ""}
            {annee.resultat}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400">
          <PencilIcon className="h-4 w-4" /> Modifier
        </button>
        <button onClick={onExport} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-500 hover:bg-brand-500/10">
          <DownloadIcon className="h-4 w-4" /> Exporter le journal
        </button>
        <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-error-500 hover:bg-error-500/10">
          <TrashBinIcon className="h-4 w-4" /> Supprimer
        </button>
      </div>
    </div>
  );
}

export default function AnneesClient({
  initialData,
  initialMetrics,
  currentPage,
  currentLimit,
}: AnneesClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [metrics, setMetrics] = useState(initialMetrics);

  /* Drawers */
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  /* Form */
  const [formData, setFormData] = useState({ debut: "", fin: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  /* Delete */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [anneeToDelete, setAnneeToDelete] = useState<string | null>(null);

  /* Export */
  const [exportLoading, setExportLoading] = useState(false);

  const navigateWithParams = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      sp.set("page", params.page || "1");
      sp.set("limit", params.limit || String(currentLimit));
      router.push(`/annees?${sp.toString()}`);
    },
    [router, currentLimit]
  );

  /* ─── Create ─── */
  const handleCreate = async () => {
    setActionLoading(true);
    setFormErrors({});
    const res = await createAnnee(formData);
    setActionLoading(false);
    if (res.success) {
      setCreateDrawerOpen(false);
      setFormData({ debut: "", fin: "" });
      router.refresh();
    } else {
      if (res.errors) setFormErrors(res.errors);
      setActionMessage(res.message);
    }
  };

  /* ─── Edit ─── */
  const handleEdit = async () => {
    if (!editId) return;
    setActionLoading(true);
    setFormErrors({});
    const res = await updateAnnee(editId, formData);
    setActionLoading(false);
    if (res.success) {
      setEditDrawerOpen(false);
      setEditId(null);
      setFormData({ debut: "", fin: "" });
      router.refresh();
    } else {
      if (res.errors) setFormErrors(res.errors);
      setActionMessage(res.message);
    }
  };

  /* ─── Delete ─── */
  const handleDeleteConfirm = async () => {
    if (!anneeToDelete) return;
    setActionLoading(true);
    const res = await deleteAnnee(anneeToDelete);
    setActionLoading(false);
    if (res.success) {
      setDeleteModalOpen(false);
      setAnneeToDelete(null);
      router.refresh();
    } else {
      setActionMessage(res.message);
    }
  };

  /* ─── Export ─── */
  const handleExport = async (anneeId: string) => {
    setExportLoading(true);
    const res = await exportAnneeJournal(anneeId);
    setExportLoading(false);
    if (res.success && res.data) {
      const blob = new Blob([new Uint8Array(res.data.buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      setActionMessage(res.message);
    }
  };

  const items = data?.items ?? [];
  const isEmpty = items.length === 0;

  return (
    <>
      <ResourcePageShell
        title="Exercices"
        description="Gerer les exercices comptables de votre entreprise"
        metrics={
          metrics ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard label="Total exercices" value={metrics.total} />
              <MetricCard label="Exercice courant" value={metrics.courant ?? "Aucun"} />
              <MetricCard label="Recettes USD" value={metrics.totalRecettesUSD} />
              <MetricCard label="Depenses USD" value={metrics.totalDepensesUSD} />
            </div>
          ) : null
        }
        toolbar={
          <div className="flex items-center justify-between">
            <div />
            <button
              onClick={() => {
                setFormData({ debut: "", fin: "" });
                setFormErrors({});
                setActionMessage("");
                setCreateDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <PlusIcon /> Nouvel exercice
            </button>
          </div>
        }
        content={
          isEmpty ? null : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <AnneeCard
                  key={a.id}
                  annee={a}
                  onEdit={() => {
                    setEditId(a.id);
                    setFormData({
                      debut: new Date(a.debut).toISOString().split("T")[0],
                      fin: new Date(a.fin).toISOString().split("T")[0],
                    });
                    setFormErrors({});
                    setActionMessage("");
                    setEditDrawerOpen(true);
                  }}
                  onDelete={() => {
                    setAnneeToDelete(a.id);
                    setActionMessage("");
                    setDeleteModalOpen(true);
                  }}
                  onExport={() => handleExport(a.id)}
                />
              ))}
            </div>
          )
        }
        emptyState={
          isEmpty ? (
            <EmptyState
              onCreate={() => {
                setFormData({ debut: "", fin: "" });
                setCreateDrawerOpen(true);
              }}
            />
          ) : undefined
        }
        pagination={
          data && data.totalPages > 1 ? (
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              onPageChange={(p) => navigateWithParams({ page: String(p) })}
            />
          ) : null
        }
      />

      {/* Create Drawer */}
      <Drawer
        isOpen={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Creer un exercice"
        description="Definissez la periode de l'exercice comptable."
      >
        <div className="space-y-4">
          <div>
            <Label>Date de debut *</Label>
            <Input
              type="date"
              value={formData.debut}
              onChange={(e) => setFormData({ ...formData, debut: e.target.value })}
              error={!!formErrors.debut}
              hint={formErrors.debut}
            />
          </div>
          <div>
            <Label>Date de fin *</Label>
            <Input
              type="date"
              value={formData.fin}
              onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
              error={!!formErrors.fin}
              hint={formErrors.fin}
            />
          </div>
          {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
          <button
            onClick={handleCreate}
            disabled={actionLoading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {actionLoading ? "Creation..." : "Creer"}
          </button>
        </div>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        isOpen={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        title="Modifier l'exercice"
        description="Modifiez les dates de l'exercice."
      >
        <div className="space-y-4">
          <div>
            <Label>Date de debut *</Label>
            <Input
              type="date"
              value={formData.debut}
              onChange={(e) => setFormData({ ...formData, debut: e.target.value })}
              error={!!formErrors.debut}
              hint={formErrors.debut}
            />
          </div>
          <div>
            <Label>Date de fin *</Label>
            <Input
              type="date"
              value={formData.fin}
              onChange={(e) => setFormData({ ...formData, fin: e.target.value })}
              error={!!formErrors.fin}
              hint={formErrors.fin}
            />
          </div>
          {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
          <button
            onClick={handleEdit}
            disabled={actionLoading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {actionLoading ? "Modification..." : "Enregistrer"}
          </button>
        </div>
      </Drawer>

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold">Confirmer la suppression</h3>
          <p className="mb-6 text-sm text-gray-500">
            Etes-vous sur de vouloir supprimer cet exercice ?
          </p>
          {actionMessage && <p className="mb-4 text-sm text-error-500">{actionMessage}</p>}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-50"
            >
              {actionLoading ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
    </div>
  );
}