"use client";

import { useState, useCallback } from "react";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {
  PlusIcon,
  TrashBinIcon,
  CloseLineIcon,
  DollarLineIcon,
  BoxCubeIcon,
} from "@/icons";
import {
  createExpense,
  cancelExpense,
  listExpenses,
} from "@/actions/workspace.actions";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface ExpenseLine {
  libelle: string;
  amount: number;
  observation?: string;
}

interface ExpenseItem {
  id: string;
  reference: string;
  lines: ExpenseLine[];
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  canEdit: boolean;
}

interface ExpensesData {
  items: ExpenseItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface Props {
  slug: string;
  header: any;
  initialData: ExpensesData | null;
  taux: number;
  exchange: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "En attente",
    className:
      "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400",
  },
  APPROVED: {
    label: "Approuvee",
    className:
      "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400",
  },
  REJECTED: {
    label: "Rejetee",
    className:
      "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
  },
  CANCELLED: {
    label: "Annulee",
    className:
      "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  },
};

function formatCurrency(amount: number, currency: string) {
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toLocaleString("fr-FR")} FC`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */
function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <BoxCubeIcon className="h-8 w-8 text-gray-400" />
      </div>
      <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {text}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function ExpensesClient({
  slug,
  header,
  initialData,
  taux,
  exchange,
}: Props) {
  const [data, setData] = useState<ExpensesData | null>(initialData);
  const [displayCurrency, setDisplayCurrency] = useState<
    "ORIGINAL" | "USD" | "CDF"
  >("CDF");

  // Drawer
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState([
    { libelle: "", amount: 0, observation: "" },
  ]);
  const [currency, setCurrency] = useState("CDF");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---- refresh ---- */
  const refreshData = useCallback(async () => {
    const r = await listExpenses(slug, 1, "", "");
    if (r.success) setData(r.data);
  }, [slug]);

  /* ---- conversion ---- */
  const convertAmount = useCallback(
    (amount: number, currency: string) => {
      if (displayCurrency === "ORIGINAL") return { amount, currency };
      if (displayCurrency === "USD" && currency === "CDF" && exchange > 0)
        return {
          amount: Math.round((amount / exchange) * 100) / 100,
          currency: "USD",
        };
      if (displayCurrency === "CDF" && currency === "USD" && taux > 0)
        return { amount: Math.round(amount * taux), currency: "CDF" };
      return { amount, currency };
    },
    [displayCurrency, taux, exchange],
  );

  /* ---- actions ---- */
  const submit = async () => {
    setLoading(true);
    const r = await createExpense(slug, {
      currency: currency as "USD" | "CDF",
      lines,
    });
    setLoading(false);
    setMessage(r.message);
    if (r.success) {
      setOpen(false);
      setLines([{ libelle: "", amount: 0, observation: "" }]);
      setCurrency("CDF");
      refreshData();
    }
  };

  const handleCancel = async (id: string) => {
    await cancelExpense(slug, id);
    refreshData();
  };

  /* ---- computed ---- */
  const items: ExpenseItem[] = data?.items ?? [];

  // Raw totals by currency
  const totalCDF = items
    .filter((x) => x.currency === "CDF")
    .reduce((s, x) => s + x.totalAmount, 0);
  const totalUSD = items
    .filter((x) => x.currency === "USD")
    .reduce((s, x) => s + x.totalAmount, 0);

  const totalConverted = items.reduce((s, x) => {
    const c = convertAmount(x.totalAmount, x.currency);
    return s + c.amount;
  }, 0);
  const displayCur =
    displayCurrency !== "ORIGINAL"
      ? displayCurrency
      : items[0]?.currency ?? "";

  const drawerTotal = lines.reduce((s, l) => s + (l.amount || 0), 0);

  /* ---- render ---- */
  return (
    <>
      <ResourcePageShell
        title="Depenses"
        description={`${header.store.designation} — Exercice ${header.annee.slug}`}
        metrics={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Monnaie :</span>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
                {(["ORIGINAL", "USD", "CDF"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDisplayCurrency(c)}
                    className={`px-3 py-1 text-xs font-medium first:rounded-l-lg last:rounded-r-lg ${
                      displayCurrency === c
                        ? "bg-brand-500 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
                    }`}
                  >
                    {c === "ORIGINAL" ? "Originale" : c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Metric label="Depenses" value={data?.total ?? 0} />
              <Metric
                label="Total (USD)"
                value={formatCurrency(totalUSD, "USD")}
              />
              <Metric
                label="Total (CDF)"
                value={formatCurrency(totalCDF, "CDF")}
              />
              <Metric
                label="En attente"
                value={items.filter((x) => x.status === "PENDING").length}
              />
              <Metric
                label="Approuvees"
                value={items.filter((x) => x.status === "APPROVED").length}
              />
            </div>
          </div>
        }
        toolbar={
          <button
            onClick={() => {
              setOpen(true);
              setMessage("");
              setLines([{ libelle: "", amount: 0, observation: "" }]);
              setCurrency("CDF");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle depense
          </button>
        }
        content={
          items.length > 0 ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((x) => {
                const cfg = STATUS_CONFIG[x.status] ?? STATUS_CONFIG.PENDING;
                const isCancelled = x.status === "CANCELLED";
                return (
                  <div
                    key={x.id}
                    className={`relative overflow-hidden rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-md dark:bg-gray-900 ${
                      isCancelled
                        ? "border-gray-200 opacity-60 dark:border-gray-700"
                        : x.status === "APPROVED"
                          ? "border-success-200 dark:border-success-800"
                          : x.status === "REJECTED"
                            ? "border-error-200 dark:border-error-800"
                            : "border-warning-200 dark:border-warning-800"
                    }`}
                  >
                    {/* Status + Date */}
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(x.createdAt)}
                      </span>
                    </div>

                    {/* Reference */}
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">
                      {x.reference}
                    </h4>

                    {/* Amount */}
                    <div className="mt-3 flex items-baseline gap-1">
                      <DollarLineIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-xl font-bold text-gray-800 dark:text-white/90">
                        {formatCurrency(x.totalAmount, x.currency)}
                      </span>
                    </div>

                    {/* Lines preview */}
                    <div className="mt-2 space-y-1">
                      {x.lines.slice(0, 3).map((l, i) => (
                        <p key={i} className="truncate text-xs text-gray-500">
                          {l.libelle} — {formatCurrency(l.amount, x.currency)}
                        </p>
                      ))}
                      {x.lines.length > 3 && (
                        <p className="text-xs text-gray-400">
                          +{x.lines.length - 3} autre(s) ligne(s)
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {x.canEdit && x.status === "PENDING" && (
                      <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
                        <button
                          onClick={() => handleCancel(x.id)}
                          className="text-xs font-medium text-error-500 transition-colors hover:text-error-600"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : undefined
        }
        emptyState={
          !items.length ? (
            <EmptyState text="Aucune depense n'a encore ete enregistree. Ajoutez une depense pour garder une vue fiable sur les sorties de caisse." />
          ) : undefined
        }
      />

      {/* ================================================================ */}
      {/*  Drawer — Nouvelle depense                                       */}
      {/* ================================================================ */}
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Nouvelle depense"
        description={`Boutique ${header.store.designation}`}
        size="lg"
      >
        <div className="space-y-5">
          {/* Currency */}
          <div>
            <Label>Devise</Label>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
              {["CDF", "USD"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium first:rounded-l-lg last:rounded-r-lg ${
                    currency === c
                      ? "bg-brand-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-3">
            <Label>Lignes de depense</Label>
            {lines.map((l, i) => (
              <div
                key={i}
                className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Ligne {i + 1}
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setLines((a) => a.filter((_, j) => j !== i))
                      }
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-gray-800"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Input
                  placeholder="Libelle (ex: Transport, Fournitures...)"
                  value={l.libelle}
                  onChange={(e) =>
                    setLines((a) =>
                      a.map((v, j) =>
                        j === i ? { ...v, libelle: e.target.value } : v,
                      ),
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder="Montant"
                  value={l.amount || ""}
                  onChange={(e) =>
                    setLines((a) =>
                      a.map((v, j) =>
                        j === i
                          ? { ...v, amount: Number(e.target.value) }
                          : v,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="Observation (facultatif)"
                  value={l.observation}
                  onChange={(e) =>
                    setLines((a) =>
                      a.map((v, j) =>
                        j === i ? { ...v, observation: e.target.value } : v,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setLines((a) =>
                  a.concat({ libelle: "", amount: 0, observation: "" }),
                )
              }
              className="text-sm font-medium text-brand-500 hover:text-brand-600"
            >
              + Ajouter une ligne
            </button>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total
            </span>
            <span className="text-lg font-bold text-gray-800 dark:text-white/90">
              {formatCurrency(drawerTotal, currency)}
            </span>
          </div>

          {/* Submit */}
          <button
            type="button"
            disabled={loading || !lines.some((l) => l.libelle && l.amount > 0)}
            onClick={submit}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Enregistrer la depense"}
          </button>

          {message && (
            <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
              <CloseLineIcon className="h-4 w-4 shrink-0" />
              {message}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
