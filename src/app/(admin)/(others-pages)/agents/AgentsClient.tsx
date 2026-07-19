"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import type { PaginatedSalers, SalerMetrics } from "@/actions/agents.actions";
import {
  createSalerFromUser,
  createSalerWithUser,
  assignSalerToStore,
  removeSalerFromStore,
  updateSalerStatus,
  deleteSaler,
} from "@/actions/agents.actions";
import { searchUsers } from "@/actions/auth.actions";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import Pagination from "@/components/tables/Pagination";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import { PlusIcon, PencilIcon, TrashBinIcon, UserCircleIcon, CheckLineIcon, CloseLineIcon } from "@/icons";

interface AgentsClientProps {
  initialData: PaginatedSalers | null;
  initialMetrics: SalerMetrics | null;
  stores: Array<{ id: string; designation: string }>;
  currentPage: number;
  currentLimit: number;
  currentSearch: string;
  currentStatus: string;
}

/* ───── Empty State ───── */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <UserCircleIcon className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
      <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        Aucun agent enregistre
      </h3>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
        Créez votre premier agent pour commencer à organiser votre équipe.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
      >
        <PlusIcon /> Creer un agent
      </button>
    </div>
  );
}

/* ───── Agent Card ───── */
function AgentCard({
  agent,
  onView,
  onEdit,
  onAssign,
  onRemoveStore,
  onToggleStatus,
  onDelete,
}: {
  agent: any;
  onView: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onRemoveStore: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-success-500/10 text-success-500",
    INACTIVE: "bg-gray-500/10 text-gray-500",
    SUSPENDED: "bg-error-500/10 text-error-500",
    PENDING: "bg-warning-500/10 text-warning-500",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          {agent.photo ? (
            <img src={agent.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <UserCircleIcon />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {agent.pseudo}
          </h4>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {agent.matricule}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">{agent.telephone}</span>
            <span className="text-xs text-gray-500">{agent.email}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[agent.status] || ""}`}>
              {agent.status}
            </span>
            {agent.storeDesignation && (
              <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500">
                {agent.storeDesignation}
              </span>
            )}
            {!agent.storeDesignation && (
              <span className="inline-flex items-center rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                Non affecte
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <button onClick={onView} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]">
          Voir
        </button>
        <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]">
          <PencilIcon className="h-4 w-4" /> Modifier
        </button>
        {!agent.storeDesignation ? (
          <button onClick={onAssign} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-500 hover:bg-brand-500/10">
            Affecter boutique
          </button>
        ) : (
          <button onClick={onRemoveStore} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-warning-500 hover:bg-warning-500/10">
            Retirer boutique
          </button>
        )}
        <button onClick={onToggleStatus} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]">
          {agent.status === "ACTIVE" ? "Suspendre" : "Activer"}
        </button>
        <button onClick={onDelete} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-error-500 hover:bg-error-500/10">
          <TrashBinIcon className="h-4 w-4" /> Supprimer
        </button>
      </div>
    </div>
  );
}

/* ───── Main Client Component ───── */
export default function AgentsClient({
  initialData,
  initialMetrics,
  stores,
  currentPage,
  currentLimit,
  currentSearch,
  currentStatus,
}: AgentsClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [metrics, setMetrics] = useState(initialMetrics);

  /* Drawers */
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  /* Selected agent */
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  /* Create form */
  const [createStep, setCreateStep] = useState<"search" | "user-form" | "confirm">("search");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newUserForm, setNewUserForm] = useState({ pseudo: "", telephone: "", email: "", password: "", photo: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  /* Assign form */
  const [assignStoreId, setAssignStoreId] = useState("");

  /* Delete confirmation */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  /* Search state */
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  /* ─── Navigation ─── */
  const navigateWithParams = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      sp.set("page", params.page || "1");
      sp.set("limit", params.limit || String(currentLimit));
      if (params.search) sp.set("search", params.search);
      if (params.status) sp.set("status", params.status);
      router.push(`/agents?${sp.toString()}`);
    },
    [router, currentLimit]
  );

  /* ─── Create flow ─── */
  const handleSearchUser = async (userId: string) => {
    setSelectedUserId(userId);
    setActionLoading(true);
    const res = await createSalerFromUser(userId);
    setActionLoading(false);
    if (res.success) {
      setCreateDrawerOpen(false);
      router.refresh();
    } else {
      setActionMessage(res.message);
    }
  };

  const handleCreateNewUser = async () => {
    setActionLoading(true);
    setFormErrors({});
    const res = await createSalerWithUser(newUserForm);
    setActionLoading(false);
    if (res.success) {
      setCreateDrawerOpen(false);
      setCreateStep("search");
      setNewUserForm({ pseudo: "", telephone: "", email: "", password: "", photo: "" });
      router.refresh();
    } else {
      if (res.errors) setFormErrors(res.errors);
      setActionMessage(res.message);
    }
  };

  /* ─── Assign ─── */
  const handleAssign = async () => {
    if (!selectedAgent || !assignStoreId) return;
    setActionLoading(true);
    const res = await assignSalerToStore(selectedAgent.id, assignStoreId);
    setActionLoading(false);
    if (res.success) {
      setAssignDrawerOpen(false);
      router.refresh();
    } else {
      setActionMessage(res.message);
    }
  };

  /* ─── Remove store ─── */
  const handleRemoveStore = async (salerId: string) => {
    setActionLoading(true);
    const res = await removeSalerFromStore(salerId);
    setActionLoading(false);
    if (res.success) router.refresh();
    else setActionMessage(res.message);
  };

  /* ─── Toggle status ─── */
  const handleToggleStatus = async (salerId: string, current: string) => {
    setActionLoading(true);
    const newStatus = current === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const res = await updateSalerStatus(salerId, newStatus);
    setActionLoading(false);
    if (res.success) router.refresh();
    else setActionMessage(res.message);
  };

  /* ─── Delete ─── */
  const handleDeleteConfirm = async () => {
    if (!agentToDelete) return;
    setActionLoading(true);
    const res = await deleteSaler(agentToDelete);
    setActionLoading(false);
    if (res.success) {
      setDeleteModalOpen(false);
      setAgentToDelete(null);
      router.refresh();
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
        title="Agents"
        description="Gerer les agents commerciaux de votre entreprise"
        metrics={
          metrics ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard label="Total" value={metrics.total} />
              <MetricCard label="Actifs" value={metrics.actifs} />
              <MetricCard label="Non affectes" value={metrics.nonAffectes} />
              <MetricCard label="Affectes" value={metrics.affectes} />
            </div>
          ) : null
        }
        toolbar={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <input
                type="text"
                placeholder="Rechercher un agent..."
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
                <option value="SUSPENDED">Suspendu</option>
                <option value="INACTIVE">Inactif</option>
              </select>
            </div>
            <button
              onClick={() => {
                setCreateStep("search");
                setSelectedUserId(null);
                setActionMessage("");
                setCreateDrawerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              <PlusIcon /> Nouvel agent
            </button>
          </div>
        }
        content={
          isEmpty ? null : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onView={() => {
                    setSelectedAgent(agent);
                    setViewDrawerOpen(true);
                  }}
                  onEdit={() => {
                    setSelectedAgent(agent);
                    setEditDrawerOpen(true);
                  }}
                  onAssign={() => {
                    setSelectedAgent(agent);
                    setAssignStoreId("");
                    setActionMessage("");
                    setAssignDrawerOpen(true);
                  }}
                  onRemoveStore={() => handleRemoveStore(agent.id)}
                  onToggleStatus={() => handleToggleStatus(agent.id, agent.status)}
                  onDelete={() => {
                    setAgentToDelete(agent.id);
                    setDeleteModalOpen(true);
                  }}
                />
              ))}
            </div>
          )
        }
        emptyState={
          isEmpty ? (
            <EmptyState
              onCreate={() => {
                setCreateStep("search");
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

      {/* ─── Create Drawer ─── */}
      <Drawer
        isOpen={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Creer un agent"
        description="Recherchez un utilisateur existant ou creez un nouveau compte."
      >
        {createStep === "search" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Recherchez un utilisateur par pseudo, telephone ou e-mail.</p>
            <UserSearchInline
              onSelect={(userId, textValue) => {
                if (userId) {
                  handleSearchUser(userId);
                }
              }}
            />
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="mb-2 text-sm text-gray-500">Ou creez un nouveau compte :</p>
              <button
                onClick={() => setCreateStep("user-form")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700"
              >
                <PlusIcon /> Creer un nouvel utilisateur
              </button>
            </div>
            {actionMessage && (
              <p className="text-sm text-error-500">{actionMessage}</p>
            )}
          </div>
        )}

        {createStep === "user-form" && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-white/90">Etape 1: Informations</h4>
            <div>
              <Label>Pseudo *</Label>
              <Input
                value={newUserForm.pseudo}
                onChange={(e) => setNewUserForm({ ...newUserForm, pseudo: e.target.value })}
                error={!!formErrors.pseudo}
                hint={formErrors.pseudo}
              />
            </div>
            <div>
              <Label>Telephone *</Label>
              <Input
                value={newUserForm.telephone}
                onChange={(e) => setNewUserForm({ ...newUserForm, telephone: e.target.value })}
                error={!!formErrors.telephone}
                hint={formErrors.telephone}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                error={!!formErrors.email}
                hint={formErrors.email}
              />
            </div>
            <div>
              <Label>Mot de passe *</Label>
              <Input
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                error={!!formErrors.password}
                hint={formErrors.password}
              />
            </div>
            {actionMessage && (
              <p className="text-sm text-error-500">{actionMessage}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCreateStep("search")}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700"
              >
                Retour
              </button>
              <button
                onClick={handleCreateNewUser}
                disabled={actionLoading}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {actionLoading ? "Creation..." : "Creer l'agent"}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Assign Drawer ─── */}
      <Drawer
        isOpen={assignDrawerOpen}
        onClose={() => setAssignDrawerOpen(false)}
        title="Affecter a une boutique"
        description={selectedAgent?.pseudo ? `Affecter ${selectedAgent.pseudo} a une boutique` : ""}
      >
        <div className="space-y-4">
          <Label>Boutique *</Label>
          <select
            value={assignStoreId}
            onChange={(e) => setAssignStoreId(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">Selectionner une boutique</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.designation}
              </option>
            ))}
          </select>
          {actionMessage && (
            <p className="text-sm text-error-500">{actionMessage}</p>
          )}
          <button
            onClick={handleAssign}
            disabled={actionLoading || !assignStoreId}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {actionLoading ? "Affectation..." : "Affecter"}
          </button>
        </div>
      </Drawer>

      {/* ─── View Drawer ─── */}
      <Drawer
        isOpen={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        title="Details de l'agent"
        description={selectedAgent?.pseudo ?? ""}
      >
        {selectedAgent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <UserCircleIcon />
              </div>
              <div>
                <h4 className="text-lg font-semibold">{selectedAgent.pseudo}</h4>
                <p className="text-sm text-gray-500">{selectedAgent.matricule}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telephone</Label>
                <p className="text-sm">{selectedAgent.telephone}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm">{selectedAgent.email}</p>
              </div>
              <div>
                <Label>Statut</Label>
                <p className="text-sm">{selectedAgent.status}</p>
              </div>
              <div>
                <Label>Boutique</Label>
                <p className="text-sm">{selectedAgent.storeDesignation || "Non affecte"}</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Delete Modal ─── */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold">Confirmer la suppression</h3>
          <p className="mb-6 text-sm text-gray-500">
            Etes-vous sur de vouloir supprimer cet agent ? Cette action est irreversible.
          </p>
          {actionMessage && (
            <p className="mb-4 text-sm text-error-500">{actionMessage}</p>
          )}
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

/* ───── Metric Card ───── */
function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</p>
    </div>
  );
}

/* ───── Inline User Search ───── */
function UserSearchInline({ onSelect }: { onSelect: (userId: string | null, text: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setMessage("");
      return;
    }
    setIsLoading(true);
    const res = await searchUsers(value);
    setIsLoading(false);
    if (res.success) {
      setResults(res.data);
      setMessage(res.data.length ? "" : "Aucun utilisateur trouve.");
    } else {
      setMessage(res.message);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="Pseudo, telephone ou e-mail..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isLoading && <p className="text-sm text-gray-500">Recherche...</p>}
      {message && <p className="text-sm text-gray-500">{message}</p>}
      {results.length > 0 && (
        <ul className="rounded-lg border border-gray-200 dark:border-gray-700">
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onSelect(user.id, user.pseudo)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              >
                <span className="block font-medium">{user.pseudo}</span>
                <span className="block text-xs text-gray-500">
                  {user.email} - {user.telephone} - {user.accountType || "Aucun profil"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}