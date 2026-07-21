"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import type { PaginatedStores, StoreMetrics } from "@/actions/stores.actions";
import {
  createStoreStep1,
  initiateStorePayment,
  verifyStorePayment,
  updateStore,
  archiveStore,
  addStoreCapital,
  updateStoreCapital,
  deleteStoreCapital,
  removeProductFromStore,
  updateStoreProductQuantity,
  associateProductsWithStore,
  getStoreProducts,
  getTenantProductsForSelect,
  getTenantAnneesForSelect,
} from "@/actions/stores.actions";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import Pagination from "@/components/tables/Pagination";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { PlusIcon, PencilIcon, TrashBinIcon, FolderIcon, EyeIcon } from "@/icons";

interface StoresClientProps {
  initialData: PaginatedStores | null;
  initialMetrics: StoreMetrics | null;
  currentPage: number;
  currentLimit: number;
  currentSearch: string;
  currentStatus: string;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <FolderIcon className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
      <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        Aucun point de vente enregistre
      </h3>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
        Créez votre première boutique pour commencer la supervision.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
      >
        <PlusIcon /> Creer un point de vente
      </button>
    </div>
  );
}

function StoreCard({
  store,
  onView,
  onEdit,
  onArchive,
  onAssociate,
  onCapitals,
}: {
  store: any;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onAssociate: () => void;
  onCapitals: () => void;
}) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-success-500/10 text-success-500",
    INACTIVE: "bg-gray-500/10 text-gray-500",
    ARCHIVED: "bg-error-500/10 text-error-500",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {store.designation}
          </h4>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {store.reference}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[store.status] || ""}`}>
              {store.status}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>{store.nbAgents} agent(s)</span>
            <span>{store.nbProducts} produit(s)</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-500">CA</p>
          <p className="text-sm font-semibold">{store.chiffreAffaires}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Depenses</p>
          <p className="text-sm font-semibold">{store.depenses}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Resultat</p>
          <p className={`text-sm font-semibold ${store.chiffreAffaires - store.depenses >= 0 ? "text-success-500" : "text-error-500"}`}>
            {store.chiffreAffaires - store.depenses}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button onClick={onView} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400">
          <EyeIcon className="h-4 w-4" /> Voir
        </button>
        <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400">
          <PencilIcon className="h-4 w-4" /> Modifier
        </button>
        <button onClick={onAssociate} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-500 hover:bg-brand-500/10">
          Associer produits
        </button>
        <button onClick={onCapitals} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-500 hover:bg-brand-500/10">
          Gerer les capitaux
        </button>
        <button onClick={onArchive} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-warning-500 hover:bg-warning-500/10">
          Archiver
        </button>
      </div>
    </div>
  );
}

export default function StoresClient({
  initialData,
  initialMetrics,
  currentPage,
  currentLimit,
  currentSearch,
  currentStatus,
}: StoresClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [metrics, setMetrics] = useState(initialMetrics);

  /* Drawers */
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [associateDrawerOpen, setAssociateDrawerOpen] = useState(false);
  const [capitalDrawerOpen, setCapitalDrawerOpen] = useState(false);

  /* Create form - Step 1: Info */
  const [createStep, setCreateStep] = useState(1);
  const [createInfo, setCreateInfo] = useState({
    designation: "",
    description: "",
    coordonnes: [{ title: "Adresse", content: "" }],
    phone: "",
  });
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeRef, setStoreRef] = useState<string>("");

  /* Create - Step 2: Payment */
  const [paymentCurrency, setPaymentCurrency] = useState<"USD" | "CDF">("USD");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState(50);

  /* Create - Step 3: Verify */
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [verificationLoading, setVerificationLoading] = useState(false);

  /* Edit */
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ designation: "", description: "" });

  /* View detail */
  const [viewStore, setViewStore] = useState<any>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});

  /* Associate */
  const [associateStoreId, setAssociateStoreId] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; designation: string; code: string }>>([]);
  const [availableAnnees, setAvailableAnnees] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedAnneeId, setSelectedAnneeId] = useState("");

  /* Capitals */
  const [capitalStore, setCapitalStore] = useState<any>(null);
  const [capitalId, setCapitalId] = useState<string | null>(null);
  const [capitalForm, setCapitalForm] = useState({
    anneeId: "",
    amount: 0,
    currency: "CDF" as "USD" | "CDF",
    status: "ACTIVE" as "PENDING" | "ACTIVE" | "CLOSED" | "CANCELLED",
  });

  /* General */
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

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
      router.push(`/stores?${sp.toString()}`);
    },
    [router, currentLimit]
  );

  /* ─── Step 1: Create store info ─── */
  const handleCreateStep1 = async () => {
    setActionLoading(true);
    setFormErrors({});
    const res = await createStoreStep1(createInfo);
    setActionLoading(false);
    if (res.success && res.data) {
      setCreateDrawerOpen(false);
      setCreateInfo({ designation: "", description: "", coordonnes: [{ title: "Adresse", content: "" }], phone: "" });
      setActionMessage("");
      await refreshData();
    } else {
      if (res.errors) setFormErrors(res.errors);
      setActionMessage(res.message);
    }
  };

  /* ─── Step 2: Initiate payment ─── */
  const handleInitiatePayment = async () => {
    if (!storeId) return;
    setActionLoading(true);
    setActionMessage("");
    const res = await initiateStorePayment({
      storeId,
      currency: paymentCurrency,
      phone: createInfo.phone,
    });
    setActionLoading(false);
    if (res.success && res.data) {
      setOrderNumber(res.data.orderNumber);
      setPaymentAmount(res.data.amount);
      setCreateStep(3);
    } else {
      setActionMessage(res.message);
    }
  };

  /* ─── Step 3: Verify payment ─── */
  const handleVerifyPayment = async () => {
    if (!storeId) return;
    setVerificationLoading(true);
    setActionMessage("");
    const res = await verifyStorePayment(storeId);
    setVerificationLoading(false);
    if (res.success) {
      setPaymentStatus(res.data.status);
      if (res.data.paid) {
        setActionMessage("Boutique activee avec succes!");
        setTimeout(async () => {
          setCreateDrawerOpen(false);
          setCreateStep(1);
          setStoreId(null);
          setOrderNumber("");
          setPaymentStatus("");
          setCreateInfo({ designation: "", description: "", coordonnes: [{ title: "Adresse", content: "" }], phone: "" });
          await refreshData();
        }, 1500);
      } else if (res.data.status === "FAILED") {
        setActionMessage("Le paiement a echoue. Vous pouvez reessayer.");
      } else {
        setActionMessage("Paiement en attente. Veuillez verifier plus tard.");
      }
    } else {
      setActionMessage(res.message);
    }
  };

  /* ─── Edit ─── */
  const handleEdit = async () => {
    if (!editId) return;
    setActionLoading(true);
    setActionMessage("");
    const res = await updateStore(editId, editData);
    setActionLoading(false);
    if (res.success) {
      setEditDrawerOpen(false);
      setEditId(null);
      await refreshData();
    } else {
      setActionMessage(res.message);
    }
  };

  /* ─── Archive ─── */
  const handleArchive = async (id: string) => {
    setActionLoading(true);
    setActionMessage("");
    const res = await archiveStore(id);
    setActionLoading(false);
    if (res.success) await refreshData();
    else setActionMessage(res.message);
  };

  /* ─── SPA refresh ─── */
  const refreshData = async () => {
    const { getStores, getStoreMetrics } = await import("@/actions/stores.actions");
    const [newMetrics, newData] = await Promise.all([
      getStoreMetrics(),
      getStores(currentPage, currentLimit, currentSearch, currentStatus),
    ]);
    if (newMetrics.success) setMetrics(newMetrics.data);
    if (newData.success) setData(newData.data);
    router.refresh();
  };

  /* ─── View detail ─── */
  const handleView = async (store: any) => {
    setViewStore(store);
    setViewDrawerOpen(true);
    setActionMessage("");
    const [res, anneesRes] = await Promise.all([
      getStoreProducts(store.id),
      getTenantAnneesForSelect(),
    ]);
    if (res.success) {
      setStoreProducts(res.data);
      setStockQuantities(
        Object.fromEntries(
          res.data.map((item) => [
            `${item.productId}-${item.anneeId}`,
            item.qte,
          ])
        )
      );
    }
    if (anneesRes.success) setAvailableAnnees(anneesRes.data);
  };

  const handleUpdateStockQuantity = async (
    productId: string,
    anneeId: string
  ) => {
    if (!viewStore) return;
    const key = `${productId}-${anneeId}`;
    const quantity = stockQuantities[key];
    setActionLoading(true);
    setActionMessage("");
    const res = await updateStoreProductQuantity(
      viewStore.id,
      productId,
      anneeId,
      quantity
    );
    setActionLoading(false);
    setActionMessage(res.message);
    if (res.success) {
      setStoreProducts((current) =>
        current.map((item) =>
          item.productId === productId && item.anneeId === anneeId
            ? { ...item, qte: res.data.quantity }
            : item
        )
      );
      await refreshData();
    }
  };

  const handleRemoveStoreProduct = async (
    productId: string,
    anneeId: string
  ) => {
    if (!viewStore) return;
    setActionLoading(true);
    setActionMessage("");
    const res = await removeProductFromStore(viewStore.id, productId, anneeId);
    setActionLoading(false);
    setActionMessage(res.message);
    if (res.success) {
      setStoreProducts((current) =>
        current.filter(
          (item) => item.productId !== productId || item.anneeId !== anneeId
        )
      );
      await refreshData();
    }
  };

  /* ─── Associate products ─── */
  const handleOpenAssociate = async (storeId: string) => {
    setAssociateStoreId(storeId);
    setSelectedProductIds([]);
    setSelectedAnneeId("");
    setActionMessage("");
    const [productsRes, anneesRes] = await Promise.all([
      getTenantProductsForSelect(),
      getTenantAnneesForSelect(),
    ]);
    if (productsRes.success) setAvailableProducts(productsRes.data);
    if (anneesRes.success) setAvailableAnnees(anneesRes.data);
    setAssociateDrawerOpen(true);
  };

  const handleAssociate = async () => {
    if (!associateStoreId || !selectedAnneeId || selectedProductIds.length === 0) return;
    setActionLoading(true);
    setActionMessage("");
    const res = await associateProductsWithStore(associateStoreId, selectedProductIds, selectedAnneeId);
    setActionLoading(false);
    if (res.success) {
      setAssociateDrawerOpen(false);
      await refreshData();
    } else {
      setActionMessage(res.message);
    }
  };

  const resetCapitalForm = () => {
    setCapitalId(null);
    setCapitalForm({ anneeId: "", amount: 0, currency: "CDF", status: "ACTIVE" });
  };

  const handleOpenCapitals = async (store: any) => {
    setCapitalStore(store);
    resetCapitalForm();
    setActionMessage("");
    const anneesRes = await getTenantAnneesForSelect();
    if (anneesRes.success) setAvailableAnnees(anneesRes.data);
    setCapitalDrawerOpen(true);
  };

  const handleSaveCapital = async () => {
    if (!capitalStore || !capitalForm.anneeId) return;
    setActionLoading(true);
    setActionMessage("");
    const res = capitalId
      ? await updateStoreCapital(capitalStore.id, capitalId, capitalForm)
      : await addStoreCapital(capitalStore.id, capitalForm);
    setActionLoading(false);
    setActionMessage(res.message);
    if (res.success) {
      setCapitalDrawerOpen(false);
      resetCapitalForm();
      await refreshData();
    }
  };

  const handleDeleteCapital = async (id: string) => {
    if (!capitalStore) return;
    setActionLoading(true);
    setActionMessage("");
    const res = await deleteStoreCapital(capitalStore.id, id);
    setActionLoading(false);
    setActionMessage(res.message);
    if (res.success) {
      setCapitalDrawerOpen(false);
      await refreshData();
    }
  };

  const handleSearch = () => {
    navigateWithParams({ search: searchQuery, status: statusFilter, page: "1" });
  };

  const items = data?.items ?? [];
  const isEmpty = items.length === 0;

  return (
    <>
      <ResourcePageShell
        title="Points de vente"
        description="Gerer les points de vente de votre entreprise"
        metrics={
          metrics ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard label="Total" value={metrics.total} />
              <MetricCard label="Actives" value={metrics.actives} />
              <MetricCard label="Inactives" value={metrics.inactives} />
              <MetricCard label="Agents" value={metrics.totalAgents} />
            </div>
          ) : null
        }
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher un point de vente..."
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => {
                setCreateStep(1);
                setCreateInfo({ designation: "", description: "", coordonnes: [{ title: "Adresse", content: "" }], phone: "" });
                setStoreId(null);
                setOrderNumber("");
                setPaymentStatus("");
                setFormErrors({});
                setActionMessage("");
                setCreateDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <PlusIcon /> Nouveau point de vente
            </button>
          </div>
        }
        content={
          isEmpty ? null : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <StoreCard
                  key={s.id}
                  store={s}
                  onView={() => handleView(s)}
                  onEdit={() => {
                    setEditId(s.id);
                    setEditData({ designation: s.designation, description: s.description });
                    setActionMessage("");
                    setEditDrawerOpen(true);
                  }}
                  onArchive={() => handleArchive(s.id)}
                  onAssociate={() => handleOpenAssociate(s.id)}
                  onCapitals={() => handleOpenCapitals(s)}
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

      {/* ─── Create Drawer (3 steps) ─── */}
      <Drawer
        isOpen={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Creer un point de vente"
        description="Renseignez les informations du point de vente."
      >
        {createStep === 1 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Informations</h4>
            <div>
              <Label>Designation *</Label>
              <Input
                value={createInfo.designation}
                onChange={(e) => setCreateInfo({ ...createInfo, designation: e.target.value })}
                error={!!formErrors.designation}
                hint={formErrors.designation}
              />
            </div>
            <div>
              <Label>Description *</Label>
              <textarea
                value={createInfo.description}
                onChange={(e) => setCreateInfo({ ...createInfo, description: e.target.value })}
                rows={3}
                className="h-20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={createInfo.coordonnes[0]?.content ?? ""}
                onChange={(e) => setCreateInfo({ ...createInfo, coordonnes: [{ title: "Adresse", content: e.target.value }] })}
              />
            </div>
            {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
            <button
              onClick={handleCreateStep1}
              disabled={actionLoading}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {actionLoading ? "Creation..." : "Creer"}
            </button>
          </div>
        )}

        {createStep === 2 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Etape 2: Paiement</h4>
            <p className="text-sm text-gray-500">
              La creation d'un point de vente coute <strong>50 USD</strong>.
            </p>
            <div>
              <Label>Devise de paiement</Label>
              <select
                value={paymentCurrency}
                onChange={(e) => setPaymentCurrency(e.target.value as "USD" | "CDF")}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="USD">USD - 50 USD</option>
                <option value="CDF">CDF - 50 x TAUX</option>
              </select>
            </div>
            <div>
              <Label>Telephone Mobile Money *</Label>
              <Input
                value={createInfo.phone}
                onChange={(e) => setCreateInfo({ ...createInfo, phone: e.target.value })}
                placeholder="+243XXXXXXXXX"
              />
            </div>
            <p className="text-xs text-gray-500">
              Reference: {storeRef}
            </p>
            {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCreateStep(1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={handleInitiatePayment}
                disabled={actionLoading}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {actionLoading ? "Paiement en cours..." : "Payer maintenant"}
              </button>
            </div>
          </div>
        )}

        {createStep === 3 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Etape 3: Verification</h4>
            <p className="text-sm text-gray-500">
              Order Number: <strong>{orderNumber}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Montant: <strong>{paymentAmount} {paymentCurrency}</strong>
            </p>
            {paymentStatus && (
              <div className={`rounded-lg p-3 text-sm ${
                paymentStatus === "PAID" ? "bg-success-500/10 text-success-500" :
                paymentStatus === "FAILED" ? "bg-error-500/10 text-error-500" :
                "bg-warning-500/10 text-warning-500"
              }`}>
                Statut: {paymentStatus === "PAID" ? "Paye" : paymentStatus === "FAILED" ? "Echoue" : "En attente"}
              </div>
            )}
            {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCreateStep(2)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={handleVerifyPayment}
                disabled={verificationLoading}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {verificationLoading ? "Verification..." : "Verifier le paiement"}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Edit Drawer ─── */}
      <Drawer
        isOpen={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        title="Modifier le point de vente"
      >
        <div className="space-y-4">
          <div>
            <Label>Designation</Label>
            <Input
              value={editData.designation}
              onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={3}
              className="h-20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900"
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

      {/* ─── View Drawer ─── */}
      <Drawer
        isOpen={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        title="Details du point de vente"
        description={viewStore?.designation ?? ""}
      >
        {viewStore && (
          <div className="space-y-4">
            <details open className="group rounded-xl border border-gray-200 dark:border-gray-700">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                Informations generales
              </summary>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 p-4 dark:border-gray-800">
                <div><Label>Reference</Label><p className="text-sm">{viewStore.reference}</p></div>
                <div><Label>Statut</Label><p className="text-sm">{viewStore.status}</p></div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <p className="whitespace-pre-wrap break-words text-sm">{viewStore.description}</p>
                </div>
                <div><Label>Agents</Label><p className="text-sm">{viewStore.nbAgents}</p></div>
                <div><Label>Produits</Label><p className="text-sm">{viewStore.nbProducts}</p></div>
                <div><Label>Chiffre d'affaires</Label><p className="text-sm">{viewStore.chiffreAffaires}</p></div>
              </div>
            </details>

            {viewStore.coordonnes?.length > 0 && (
              <details className="group rounded-xl border border-gray-200 dark:border-gray-700">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                  Coordonnees ({viewStore.coordonnes.length})
                </summary>
                <div className="space-y-3 border-t border-gray-100 p-4 dark:border-gray-800">
                  {viewStore.coordonnes.map((c: any, i: number) => (
                    <div key={i}>
                      <Label>{c.title}</Label>
                      <p className="whitespace-pre-wrap break-words text-sm text-gray-500">{c.content}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <details className="group rounded-xl border border-gray-200 dark:border-gray-700">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                Produits associes ({storeProducts.length})
              </summary>
              <div className="space-y-2 border-t border-gray-100 p-4 dark:border-gray-800">
                {storeProducts.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun produit associe.</p>
                ) : storeProducts.map((sp) => (
                  <details key={`${sp.productId}-${sp.anneeId}`} className="rounded-lg border border-gray-200 dark:border-gray-700">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-medium">
                      <span>{sp.designation}</span>
                      <span className="text-xs text-gray-500">Qte: {sp.qte}</span>
                    </summary>
                    <div className="space-y-3 border-t border-gray-100 px-3 py-3 dark:border-gray-800">
                      <p className="text-xs text-gray-500">{sp.anneeLabel}</p>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-32 flex-1">
                          <Label>Quantite en stock</Label>
                          <Input
                            type="number"
                            min="0"
                            step={1}
                            value={stockQuantities[`${sp.productId}-${sp.anneeId}`] ?? sp.qte}
                            onChange={(e) =>
                              setStockQuantities((current) => ({
                                ...current,
                                [`${sp.productId}-${sp.anneeId}`]: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStockQuantity(sp.productId, sp.anneeId)}
                          disabled={actionLoading}
                          className="h-11 rounded-lg bg-brand-500 px-3 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => handleRemoveStoreProduct(sp.productId, sp.anneeId)}
                          disabled={actionLoading || sp.qte > 0}
                          className="inline-flex h-11 items-center gap-1 rounded-lg px-3 text-xs font-medium text-error-500 hover:bg-error-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          title={sp.qte > 0 ? "Ramenez la quantite a zero avant le retrait" : "Retirer ce produit"}
                        >
                          <TrashBinIcon className="h-4 w-4" /> Retirer
                        </button>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </details>
            {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
          </div>
        )}
      </Drawer>

      <Drawer
        isOpen={capitalDrawerOpen}
        onClose={() => setCapitalDrawerOpen(false)}
        title="Capitaux du point de vente"
        description={capitalStore?.designation ?? ""}
      >
        <div className="space-y-5">
          {capitalStore?.capitals?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-800 dark:text-white/90">Capitaux enregistres</h4>
              {capitalStore.capitals.map((capital: any) => (
                <div key={capital.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {capital.amount.toLocaleString("fr-FR")} {capital.currency}
                    </p>
                    <p className="text-xs text-gray-500">
                      {availableAnnees.find((annee) => annee.id === capital.anneeId)?.label ?? "Exercice"} - {capital.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCapitalId(capital.id);
                        setCapitalForm({
                          anneeId: capital.anneeId,
                          amount: capital.amount,
                          currency: capital.currency,
                          status: capital.status,
                        });
                        setActionMessage("");
                      }}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Modifier le capital"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCapital(capital.id)}
                      disabled={actionLoading}
                      className="rounded-lg p-2 text-error-500 hover:bg-error-500/10 disabled:opacity-50"
                      aria-label="Supprimer le capital"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
            <h4 className="mb-4 text-sm font-medium text-gray-800 dark:text-white/90">
              {capitalId ? "Modifier le capital" : "Ajouter un capital"}
            </h4>
            <div className="space-y-4">
              <div>
                <Label>Exercice *</Label>
                <select
                  value={capitalForm.anneeId}
                  onChange={(e) => setCapitalForm({ ...capitalForm, anneeId: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">Selectionner un exercice actif</option>
                  {availableAnnees.map((annee) => (
                    <option key={annee.id} value={annee.id}>{annee.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Montant *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={capitalForm.amount}
                    onChange={(e) => setCapitalForm({ ...capitalForm, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Devise *</Label>
                  <select
                    value={capitalForm.currency}
                    onChange={(e) => setCapitalForm({ ...capitalForm, currency: e.target.value as "USD" | "CDF" })}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="CDF">CDF</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Statut *</Label>
                <select
                  value={capitalForm.status}
                  onChange={(e) => setCapitalForm({ ...capitalForm, status: e.target.value as typeof capitalForm.status })}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="PENDING">En attente</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="CLOSED">Cloture</option>
                  <option value="CANCELLED">Annule</option>
                </select>
              </div>
              {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
              <div className="flex gap-3">
                {capitalId && (
                  <button
                    onClick={resetCapitalForm}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                )}
                <button
                  onClick={handleSaveCapital}
                  disabled={actionLoading || !capitalForm.anneeId}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {actionLoading ? "Enregistrement..." : capitalId ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* ─── Associate Products Drawer ─── */}
      <Drawer
        isOpen={associateDrawerOpen}
        onClose={() => setAssociateDrawerOpen(false)}
        title="Associer des produits"
        description="Selectionnez les produits a associer a cette boutique"
      >
        <div className="space-y-4">
          <div>
            <Label>Exercice *</Label>
            <select
              value={selectedAnneeId}
              onChange={(e) => setSelectedAnneeId(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="">Selectionner un exercice</option>
              {availableAnnees.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Produits *</Label>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
              {availableProducts.map((p) => (
                <details key={p.id} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    {p.designation}
                  </summary>
                  <label className="flex cursor-pointer items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductIds([...selectedProductIds, p.id]);
                        } else {
                          setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Associer le produit - {p.code}
                  </label>
                </details>
              ))}
            </div>
          </div>
          {actionMessage && <p className="text-sm text-error-500">{actionMessage}</p>}
          <button
            onClick={handleAssociate}
            disabled={actionLoading || !selectedAnneeId || selectedProductIds.length === 0}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {actionLoading ? "Association..." : "Associer les produits"}
          </button>
        </div>
      </Drawer>
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
