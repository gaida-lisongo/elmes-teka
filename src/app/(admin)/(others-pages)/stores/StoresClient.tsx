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
}: {
  store: any;
  onView: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onAssociate: () => void;
}) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-success-500/10 text-success-500",
    PENDING_PAYMENT: "bg-warning-500/10 text-warning-500",
    INACTIVE: "bg-gray-500/10 text-gray-500",
    ARCHIVED: "bg-error-500/10 text-error-500",
  };

  const paymentStatusColors: Record<string, string> = {
    PAID: "bg-success-500/10 text-success-500",
    PENDING: "bg-warning-500/10 text-warning-500",
    FAILED: "bg-error-500/10 text-error-500",
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
              {store.status === "PENDING_PAYMENT" ? "En attente de paiement" : store.status}
            </span>
            {store.payment && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusColors[store.payment.status] || ""}`}>
                Paiement: {store.payment.status}
              </span>
            )}
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

  /* Associate */
  const [associateStoreId, setAssociateStoreId] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Array<{ id: string; designation: string; code: string }>>([]);
  const [availableAnnees, setAvailableAnnees] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedAnneeId, setSelectedAnneeId] = useState("");

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
      setStoreId(res.data.storeId);
      setStoreRef(res.data.reference);
      setCreateStep(2);
      setActionMessage("");
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
    setActionLoading(false);
    if (res.success) router.refresh();
    else setActionMessage(res.message);
  };

  /* ─── View detail ─── */
  const handleView = async (store: any) => {
    setViewStore(store);
    setViewDrawerOpen(true);
    const res = await getStoreProducts(store.id);
    if (res.success) {
      setStoreProducts(res.data);
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
              <MetricCard label="En attente" value={metrics.enAttente} />
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
                <option value="PENDING_PAYMENT">En attente</option>
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
        description="Creation en 3 etapes (50 USD)"
      >
        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                createStep >= step ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
              }`}>
                {step}
              </div>
              {step < 3 && <div className={`h-0.5 w-8 ${createStep > step ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />}
            </div>
          ))}
        </div>

        {createStep === 1 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Etape 1: Informations</h4>
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
              <Label>Telephone</Label>
              <Input
                value={createInfo.phone}
                onChange={(e) => setCreateInfo({ ...createInfo, phone: e.target.value })}
                placeholder="Numero pour le paiement"
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
              {actionLoading ? "Creation..." : "Suivant: Paiement"}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reference</Label>
                <p className="text-sm">{viewStore.reference}</p>
              </div>
              <div>
                <Label>Statut</Label>
                <p className="text-sm">{viewStore.status}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{viewStore.description}</p>
              </div>
              <div>
                <Label>Agents</Label>
                <p className="text-sm">{viewStore.nbAgents}</p>
              </div>
              <div>
                <Label>Produits</Label>
                <p className="text-sm">{viewStore.nbProducts}</p>
              </div>
              <div>
                <Label>Chiffre d'affaires</Label>
                <p className="text-sm">{viewStore.chiffreAffaires}</p>
              </div>
            </div>

            {/* Coordonnées */}
            {viewStore.coordonnes?.length > 0 && (
              <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Coordonnees</h5>
                {viewStore.coordonnes.map((c: any, i: number) => (
                  <p key={i} className="text-sm text-gray-500">
                    <strong>{c.title}:</strong> {c.content}
                  </p>
                ))}
              </div>
            )}

            {/* Paiement */}
            {viewStore.payment && (
              <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Paiement</h5>
                <p className="text-sm text-gray-500">Montant: {viewStore.payment.amount} {viewStore.payment.currency}</p>
                <p className="text-sm text-gray-500">Order: {viewStore.payment.orderNumber}</p>
                <p className="text-sm text-gray-500">Statut: {viewStore.payment.status}</p>
                {viewStore.payment.paidAt && (
                  <p className="text-sm text-gray-500">Paye le: {new Date(viewStore.payment.paidAt).toLocaleDateString("fr-FR")}</p>
                )}
              </div>
            )}

            {/* Produits associés */}
            {storeProducts.length > 0 && (
              <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Produits associes</h5>
                <div className="space-y-2">
                  {storeProducts.map((sp, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                      <span>{sp.designation}</span>
                      <span className="text-gray-500">Qte: {sp.qte}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
                <label key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.05]">
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
                  <span className="text-sm">{p.designation} ({p.code})</span>
                </label>
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