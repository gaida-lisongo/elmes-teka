"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  adminUpdateTenantEmail,
  adminUpdateTenantPlan,
  adminUpdateTenantStatus,
} from "@/actions/platform.actions";
import type { TenantRow } from "@/lib/platform/data";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

const PLAN_COLOR = { STARTER: "light", BUSINESS: "info", PREMIUM: "warning" } as const;
const STATUS_COLOR = { ACTIVE: "success", SUSPENDED: "error", PENDING: "warning", INACTIVE: "light" } as const;

type Modal =
  | { kind: "email"; tenant: TenantRow }
  | { kind: "plan"; tenant: TenantRow }
  | { kind: "status"; tenant: TenantRow; next: "ACTIVE" | "SUSPENDED" }
  | null;

export default function TenantsClient({
  rows: initialRows,
  total,
  page,
  search: initialSearch,
  perPage,
}: {
  rows: TenantRow[];
  total: number;
  page: number;
  search: string;
  perPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState(initialSearch);
  const [modal, setModal] = useState<Modal>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Email form state
  const [emailInput, setEmailInput] = useState("");
  // Plan form state
  const [planInput, setPlanInput] = useState<"STARTER" | "BUSINESS" | "PREMIUM">("STARTER");

  const pages = Math.ceil(total / perPage);

  function navigate(p: number, q: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    navigate(1, search);
  }, [search]);

  function openEmail(t: TenantRow) {
    setEmailInput(t.email);
    setFeedback(null);
    setModal({ kind: "email", tenant: t });
  }

  function openPlan(t: TenantRow) {
    setPlanInput((t.activeAnnee?.plan ?? t.plan) as "STARTER" | "BUSINESS" | "PREMIUM");
    setFeedback(null);
    setModal({ kind: "plan", tenant: t });
  }

  function openStatus(t: TenantRow) {
    setFeedback(null);
    setModal({ kind: "status", tenant: t, next: t.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
  }

  function applyUpdate(id: string, patch: Partial<TenantRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function submitEmail() {
    if (!modal || modal.kind !== "email") return;
    const { tenant } = modal;
    startTransition(async () => {
      const res = await adminUpdateTenantEmail(tenant.id, emailInput);
      setFeedback({ ok: res.success, msg: res.message });
      if (res.success) {
        applyUpdate(tenant.id, { email: emailInput.trim().toLowerCase() });
        setTimeout(() => setModal(null), 1200);
      }
    });
  }

  function submitPlan() {
    if (!modal || modal.kind !== "plan") return;
    const { tenant } = modal;
    if (!tenant.activeAnnee) {
      setFeedback({ ok: false, msg: "Aucun exercice actif trouvé pour ce tenant." });
      return;
    }
    startTransition(async () => {
      const res = await adminUpdateTenantPlan(tenant.id, tenant.activeAnnee!.id, planInput);
      setFeedback({ ok: res.success, msg: res.message });
      if (res.success) {
        applyUpdate(tenant.id, {
          plan: planInput,
          activeAnnee: tenant.activeAnnee ? { ...tenant.activeAnnee, plan: planInput } : null,
        });
        setTimeout(() => setModal(null), 1200);
      }
    });
  }

  function submitStatus() {
    if (!modal || modal.kind !== "status") return;
    const { tenant, next } = modal;
    startTransition(async () => {
      const res = await adminUpdateTenantStatus(tenant.id, next);
      setFeedback({ ok: res.success, msg: res.message });
      if (res.success) {
        applyUpdate(tenant.id, { status: next });
        setTimeout(() => setModal(null), 1200);
      }
    });
  }

  return (
    <>
      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, nRef…"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
        >
          Rechercher
        </button>
      </form>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Entreprise", "Email", "Téléphone", "Matricule", "Plan", "Statut", "Actions"].map((h) => (
                  <TableCell key={h} isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 && (
                <TableRow>
                  <TableCell className="px-4 py-8 text-center text-sm text-gray-400">Aucun résultat.</TableCell>
                </TableRow>
              )}
              {rows.map((t) => (
                <TableRow key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-white/90 text-sm">{t.designation}</div>
                    <div className="text-xs text-gray-400">{t.nRef}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t.email}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t.telephone}</TableCell>
                  <TableCell className="px-4 py-3 text-xs font-mono text-gray-500">{t.matricule}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge color={PLAN_COLOR[t.plan as keyof typeof PLAN_COLOR] ?? "light"} size="sm">
                      {t.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge color={STATUS_COLOR[t.status as keyof typeof STATUS_COLOR] ?? "light"} size="sm">
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEmail(t)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 transition"
                      >
                        Email
                      </button>
                      <button
                        onClick={() => openPlan(t)}
                        disabled={!t.activeAnnee}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 transition disabled:opacity-40"
                        title={!t.activeAnnee ? "Aucun exercice actif" : undefined}
                      >
                        Plan
                      </button>
                      <button
                        onClick={() => openStatus(t)}
                        className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                          t.status === "ACTIVE"
                            ? "border-error-200 text-error-600 hover:bg-error-50 dark:border-error-800 dark:text-error-400"
                            : "border-success-200 text-success-600 hover:bg-success-50 dark:border-success-800 dark:text-success-400"
                        }`}
                      >
                        {t.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} / {pages} · {total} résultats</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => navigate(page - 1, search)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700"
            >
              Précédent
            </button>
            <button
              disabled={page >= pages}
              onClick={() => navigate(page + 1, search)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">

            {/* Modale Email */}
            {modal.kind === "email" && (
              <>
                <h3 className="mb-1 text-base font-bold text-gray-800 dark:text-white">Modifier l'email</h3>
                <p className="mb-4 text-sm text-gray-500">{modal.tenant.designation}</p>
                <input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  type="email"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {feedback && (
                  <p className={`mt-2 text-sm ${feedback.ok ? "text-success-600" : "text-error-500"}`}>{feedback.msg}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 dark:border-gray-700">Annuler</button>
                  <button onClick={submitEmail} disabled={isPending} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                    {isPending ? "…" : "Mettre à jour"}
                  </button>
                </div>
              </>
            )}

            {/* Modale Plan */}
            {modal.kind === "plan" && (
              <>
                <h3 className="mb-1 text-base font-bold text-gray-800 dark:text-white">Changer le plan</h3>
                <p className="mb-4 text-sm text-gray-500">{modal.tenant.designation}</p>
                <div className="space-y-2">
                  {(["STARTER", "BUSINESS", "PREMIUM"] as const).map((p) => (
                    <label key={p} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${planInput === p ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700"}`}>
                      <input type="radio" name="plan" value={p} checked={planInput === p} onChange={() => setPlanInput(p)} className="accent-brand-500" />
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{p}</span>
                    </label>
                  ))}
                </div>
                {!modal.tenant.activeAnnee && (
                  <p className="mt-2 text-xs text-warning-600">Aucun exercice actif — le plan sera stocké mais sans exercice associé.</p>
                )}
                {feedback && (
                  <p className={`mt-2 text-sm ${feedback.ok ? "text-success-600" : "text-error-500"}`}>{feedback.msg}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 dark:border-gray-700">Annuler</button>
                  <button onClick={submitPlan} disabled={isPending} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
                    {isPending ? "…" : "Appliquer"}
                  </button>
                </div>
              </>
            )}

            {/* Modale Statut */}
            {modal.kind === "status" && (
              <>
                <h3 className="mb-1 text-base font-bold text-gray-800 dark:text-white">
                  {modal.next === "SUSPENDED" ? "Suspendre le compte" : "Réactiver le compte"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {modal.next === "SUSPENDED"
                    ? `${modal.tenant.designation} ne pourra plus se connecter.`
                    : `${modal.tenant.designation} pourra se connecter à nouveau.`}
                </p>
                {feedback && (
                  <p className={`mt-3 text-sm ${feedback.ok ? "text-success-600" : "text-error-500"}`}>{feedback.msg}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 dark:border-gray-700">Annuler</button>
                  <button
                    onClick={submitStatus}
                    disabled={isPending}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition ${modal.next === "SUSPENDED" ? "bg-error-500 hover:bg-error-600" : "bg-success-500 hover:bg-success-600"}`}
                  >
                    {isPending ? "…" : modal.next === "SUSPENDED" ? "Suspendre" : "Réactiver"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
