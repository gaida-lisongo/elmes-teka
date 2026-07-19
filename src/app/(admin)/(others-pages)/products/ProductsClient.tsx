"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import type { PaginatedProducts, ProductMetrics } from "@/actions/products.actions";
import { createProduct, updateProduct, archiveProduct, deleteProduct } from "@/actions/products.actions";
import { exportProductSales } from "@/actions/exports.actions";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import Pagination from "@/components/tables/Pagination";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { PlusIcon, PencilIcon, TrashBinIcon, DownloadIcon, BoxIcon } from "@/icons";

interface ProductsClientProps {
  initialData: PaginatedProducts | null;
  initialMetrics: ProductMetrics | null;
  currentPage: number;
  currentLimit: number;
  currentSearch: string;
  currentStatus: string;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <BoxIcon className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
      <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        Aucun produit ou service disponible
      </h3>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
        Ajoutez ce que votre entreprise commercialise.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
      >
        <PlusIcon /> Ajouter un produit
      </button>
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
  onArchive,
  onDelete,
  onExport,
}: {
  product: any;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-success-500/10 text-success-500",
    INACTIVE: "bg-gray-500/10 text-gray-500",
    ARCHIVED: "bg-error-500/10 text-error-500",
  };

  const mainPhoto = product.photos?.[0]?.url;
  const mainPrice = product.price?.[0];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          {mainPhoto ? (
            <img src={mainPhoto} alt="" className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <BoxIcon />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {product.designation}
          </h4>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {product.code} - {product.categorie}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[product.status] || ""}`}>
              {product.status}
            </span>
            {mainPrice && (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {mainPrice.amount.toLocaleString("fr-FR")} {mainPrice.currency}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>Vendu: {product.totalVendu}</span>
            <span>Stocks: {product.nbStocks}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400">
          <PencilIcon className="h-4 w-4" /> Modifier
        </button>
        <button onClick={onExport} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-500 hover:bg-brand-500/10">
          <DownloadIcon className="h-4 w-4" /> Ventes
        </button>
        <button onClick={onArchive} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-warning-500 hover:bg-warning-500/10">
          Archiver
        </button>
        <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-error-500 hover:bg-error-500/10">
          <TrashBinIcon className="h-4 w-4" /> Supprimer
        </button>
      </div>
    </div>
  );
}

export default function ProductsClient({
  initialData,
  initialMetrics,
  currentPage,
  currentLimit,
  currentSearch,
  currentStatus,
}: ProductsClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [metrics, setMetrics] = useState(initialMetrics);

  /* Drawers */
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  /* Create form */
  const [createStep, setCreateStep] = useState(1);
  const [formData, setFormData] = useState({
    designation: "",
    categorie: "",
    code: "",
    price: [{ amount: 0, currency: "CDF" }],
    photos: [] as Array<{ title: string; url: string }>,
    description: [] as Array<{ title: string; content: string }>,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  /* Delete */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  /* Search */
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  const navigateWithParams = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      sp.set("page", params.page || "1");
      sp.set("limit", params.limit || String(currentLimit));
      if (params.search) sp.set("search", params.search);
      if (params.status) sp.set("status", params.status);
      router.push(`/products?${sp.toString()}`);
    },
    [router, currentLimit]
  );

  /* ─── Create ─── */
  const handleCreate = async () => {
    setActionLoading(true);
    setFormErrors({});
    setActionMessage("");
    const res = await createProduct(formData);
    setActionLoading(false);
    if (res.success) {
      setCreateDrawerOpen(false);
      setCreateStep(1);
      setFormData({ designation: "", categorie: "", code: "", price: [{ amount: 0, currency: "CDF" }], photos: [], description: [] });
      await refreshData();
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
    setActionMessage("");
    const res = await updateProduct(editId, formData);
    setActionLoading(false);
    if (res.success) {
      setEditDrawerOpen(false);
      setEditId(null);
      await refreshData();
    } else {
      if (res.errors) setFormErrors(res.errors);
      setActionMessage(res.message);
    }
  };

  /* ─── Archive ─── */
  const handleArchive = async (id: string) => {
    setActionLoading(true);
    setActionMessage("");
    const res = await archiveProduct(id);
    setActionLoading(false);
    if (res.success) await refreshData();
    else setActionMessage(res.message);
  };

  /* ─── Delete ─── */
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setActionLoading(true);
    setActionMessage("");
    const res = await deleteProduct(productToDelete);
    setActionLoading(false);
    if (res.success) {
      setDeleteModalOpen(false);
      setProductToDelete(null);
      await refreshData();
    } else {
      setActionMessage(res.message);
    }
  };

  /* ─── SPA refresh ─── */
  const refreshData = async () => {
    const { getProducts, getProductMetrics } = await import("@/actions/products.actions");
    const [newMetrics, newData] = await Promise.all([
      getProductMetrics(),
      getProducts(currentPage, currentLimit, currentSearch, currentStatus),
    ]);
    if (newMetrics.success) setMetrics(newMetrics.data);
    if (newData.success) setData(newData.data);
    router.refresh();
  };

  /* ─── Export ─── */
  const handleExport = async (productId: string) => {
    setActionLoading(true);
    const res = await exportProductSales(productId);
    setActionLoading(false);
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

  /* ─── Search ─── */
  const handleSearch = () => {
    navigateWithParams({ search: searchQuery, status: statusFilter, page: "1" });
  };

  const items = data?.items ?? [];
  const isEmpty = items.length === 0;

  return (
    <>
      <ResourcePageShell
        title="Produits et services"
        description="Gerer les produits et services commercialises"
        metrics={
          metrics ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard label="Total" value={metrics.total} />
              <MetricCard label="Actifs" value={metrics.actifs} />
              <MetricCard label="Inactifs" value={metrics.inactifs} />
              <MetricCard
                label="Plus vendu"
                value={metrics.plusVendu?.designation ?? "Aucun"}
              />
            </div>
          ) : null
        }
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-10 w-full max-w-xs rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  navigateWithParams({ status: e.target.value, page: "1" });
                }}
                className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Tous</option>
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
                <option value="ARCHIVED">Archive</option>
              </select>
            </div>
            <button
              onClick={() => {
                setCreateStep(1);
                setFormData({ designation: "", categorie: "", code: "", price: [{ amount: 0, currency: "CDF" }], photos: [], description: [] });
                setFormErrors({});
                setActionMessage("");
                setCreateDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <PlusIcon /> Nouveau produit
            </button>
          </div>
        }
        content={
          isEmpty ? null : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onEdit={() => {
                    setEditId(p.id);
                    setFormData({
                      designation: p.designation,
                      categorie: p.categorie,
                      code: p.code,
                      price: p.price,
                      photos: p.photos,
                      description: p.description,
                    });
                    setFormErrors({});
                    setActionMessage("");
                    setEditDrawerOpen(true);
                  }}
                  onArchive={() => handleArchive(p.id)}
                  onDelete={() => {
                    setProductToDelete(p.id);
                    setActionMessage("");
                    setDeleteModalOpen(true);
                  }}
                  onExport={() => handleExport(p.id)}
                />
              ))}
            </div>
          )
        }
        emptyState={
          isEmpty ? (
            <EmptyState
              onCreate={() => {
                setCreateStep(1);
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
        title="Ajouter un produit"
        description="Remplissez les informations du produit"
      >
        {createStep === 1 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Etape 1: Informations</h4>
            <div>
              <Label>Designation *</Label>
              <Input
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                error={!!formErrors.designation}
                hint={formErrors.designation}
              />
            </div>
            <div>
              <Label>Categorie *</Label>
              <Input
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                error={!!formErrors.categorie}
                hint={formErrors.categorie}
              />
            </div>
            <div>
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                error={!!formErrors.code}
                hint={formErrors.code}
              />
            </div>
            {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
            <button
              onClick={() => setCreateStep(2)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Suivant: Tarification
            </button>
          </div>
        )}
        {createStep === 2 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Etape 2: Tarification</h4>
            {formData.price.map((p, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1">
                  <Label>Montant</Label>
                  <Input
                    type="number"
                    value={p.amount}
                    onChange={(e) => {
                      const newPrices = [...formData.price];
                      newPrices[i] = { ...newPrices[i], amount: Number(e.target.value) };
                      setFormData({ ...formData, price: newPrices });
                    }}
                  />
                </div>
                <div className="w-24">
                  <Label>Devise</Label>
                  <select
                    value={p.currency}
                    onChange={(e) => {
                      const newPrices = [...formData.price];
                      newPrices[i] = { ...newPrices[i], currency: e.target.value };
                      setFormData({ ...formData, price: newPrices });
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="CDF">CDF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            ))}
            {formErrors.price && <p className="text-sm text-error-500">{formErrors.price}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCreateStep(1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={() => setCreateStep(3)}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Suivant: Presentation
              </button>
            </div>
          </div>
        )}
        {createStep === 3 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Etape 3: Presentation</h4>
            <div>
              <Label>Description</Label>
              <textarea
                value={formData.description?.[0]?.content ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: [{ title: "Description", content: e.target.value }],
                  })
                }
                rows={4}
                className="h-24 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCreateStep(2)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {actionLoading ? "Creation..." : "Creer le produit"}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Edit Drawer */}
      {editDrawerOpen && (
        <Drawer
          isOpen={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          title="Modifier le produit"
          description={formData.designation}
        >
          <div className="space-y-4">
            <div>
              <Label>Designation</Label>
              <Input
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
            <div>
              <Label>Categorie</Label>
              <Input
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
              />
            </div>
            <div>
              <Label>Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            {formData.price.map((p, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1">
                  <Label>Montant</Label>
                  <Input
                    type="number"
                    value={p.amount}
                    onChange={(e) => {
                      const newPrices = [...formData.price];
                      newPrices[i] = { ...newPrices[i], amount: Number(e.target.value) };
                      setFormData({ ...formData, price: newPrices });
                    }}
                  />
                </div>
                <div className="w-24">
                  <Label>Devise</Label>
                  <select
                    value={p.currency}
                    onChange={(e) => {
                      const newPrices = [...formData.price];
                      newPrices[i] = { ...newPrices[i], currency: e.target.value };
                      setFormData({ ...formData, price: newPrices });
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="CDF">CDF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            ))}
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
      )}

      {/* Delete Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold">Confirmer la suppression</h3>
          <p className="mb-6 text-sm text-gray-500">
            Etes-vous sur de vouloir supprimer ce produit ?
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