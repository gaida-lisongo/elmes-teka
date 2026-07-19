"use client";

import { useState, useCallback } from "react";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import ProductSearch, {
  type ProductResult,
} from "@/components/auth/ProductSearch";
import {
  PlusIcon,
  TrashBinIcon,
  CloseLineIcon,
  BoxCubeIcon,
  CheckCircleIcon,
} from "@/icons";
import {
  createSupplyRequest,
  cancelSupplyRequest,
  listSupplyRequests,
} from "@/actions/workspace.actions";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface SupplyItem {
  id: string;
  reference: string;
  products: Array<{ id: string; designation: string; qte: number }>;
  status: string;
  description: string;
  createdAt: string;
}

interface SupplyData {
  items: SupplyItem[];
  total: number;
  page: number;
  totalPages: number;
  stock: Array<{ productId: string; qte: number }>;
}

interface Props {
  slug: string;
  header: any;
  initialData: SupplyData | null;
  products: ProductResult[];
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
export default function StocksClient({
  slug,
  header,
  initialData,
  products,
  taux,
  exchange,
}: Props) {
  const [data, setData] = useState<SupplyData | null>(initialData);

  // Drawer
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<
    Array<{ productId: string; designation: string; code: string; qte: number }>
  >([]);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---- refresh ---- */
  const refreshData = useCallback(async () => {
    const r = await listSupplyRequests(slug, 1, "");
    if (r.success) setData(r.data);
  }, [slug]);

  /* ---- actions ---- */
  const addProduct = useCallback((p: ProductResult) => {
    setLines((prev) =>
      prev.some((l) => l.productId === p.id)
        ? prev
        : [
            ...prev,
            {
              productId: p.id,
              designation: p.designation,
              code: p.code,
              qte: 1,
            },
          ],
    );
  }, []);

  const updateQty = useCallback((index: number, qty: number) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, qte: Math.max(1, qty) } : l,
      ),
    );
  }, []);

  const removeLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submit = async () => {
    setLoading(true);
    const r = await createSupplyRequest(slug, {
      description,
      products: lines.map((l) => ({ productId: l.productId, qte: l.qte })),
    });
    setLoading(false);
    setMessage(r.message);
    if (r.success) {
      setOpen(false);
      setLines([]);
      setDescription("");
      refreshData();
    }
  };

  const handleCancel = async (id: string) => {
    await cancelSupplyRequest(slug, id);
    refreshData();
  };

  /* ---- computed ---- */
  const items: SupplyItem[] = data?.items ?? [];
  const stock = data?.stock ?? [];

  // Stock value in CDF and USD
  const stockValueCDF = products.reduce((sum, p) => {
    const s = stock.find((x) => x.productId === p.id);
    const price = p.price?.[0];
    if (!s || !price) return sum;
    if (price.currency === "CDF") return sum + s.qte * price.amount;
    if (price.currency === "USD" && taux > 0)
      return sum + s.qte * Math.round(price.amount * taux);
    return sum;
  }, 0);

  const stockValueUSD = products.reduce((sum, p) => {
    const s = stock.find((x) => x.productId === p.id);
    const price = p.price?.[0];
    if (!s || !price) return sum;
    if (price.currency === "USD") return sum + s.qte * price.amount;
    if (price.currency === "CDF" && exchange > 0)
      return sum + Math.round((s.qte * price.amount * 100) / exchange) / 100;
    return sum;
  }, 0);

  /* ---- render ---- */
  return (
    <>
      <ResourcePageShell
        title="Demandes d'approvisionnement"
        description={`${header.store.designation} — Exercice ${header.annee.slug}`}
        metrics={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Demandes" value={data?.total ?? 0} />
            <Metric
              label="En attente"
              value={items.filter((x) => x.status === "PENDING").length}
            />
            <Metric
              label="Stock (CDF)"
              value={formatCurrency(stockValueCDF, "CDF")}
            />
            <Metric
              label="Stock (USD)"
              value={formatCurrency(stockValueUSD, "USD")}
            />
          </div>
        }
        toolbar={
          <button
            onClick={() => {
              setOpen(true);
              setMessage("");
              setLines([]);
              setDescription("");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle demande
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

                    {/* Products */}
                    <div className="mt-2 space-y-1">
                      {x.products.slice(0, 3).map((p, i) => (
                        <p key={i} className="truncate text-xs text-gray-500">
                          {p.designation} × {p.qte}
                        </p>
                      ))}
                      {x.products.length > 3 && (
                        <p className="text-xs text-gray-400">
                          +{x.products.length - 3} autre(s) produit(s)
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    {x.description && (
                      <p className="mt-2 text-xs italic text-gray-400 line-clamp-2">
                        {x.description}
                      </p>
                    )}

                    {/* Actions */}
                    {x.status === "PENDING" && (
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
            <EmptyState text="Aucune demande d'approvisionnement n'a encore ete creee. Creez une demande lorsque la boutique doit recevoir de nouvelles marchandises." />
          ) : undefined
        }
      />

      {/* ================================================================ */}
      {/*  Drawer — Nouvelle demande                                       */}
      {/* ================================================================ */}
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Demande d'approvisionnement"
        description="Le stock ne sera modifie qu'apres validation du tenant."
        size="lg"
      >
        <div className="space-y-5">
          {/* Product search */}
          <ProductSearch
            slug={slug}
            taux={taux}
            exchange={exchange}
            selectedIds={lines.map((l) => l.productId)}
            onAdd={addProduct}
          />

          {/* Selected lines */}
          {lines.length > 0 && (
            <div className="space-y-2">
              <Label>Produits selectionnes ({lines.length})</Label>
              <div className="divide-y rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                {lines.map((l, i) => (
                  <div
                    key={l.productId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {l.designation}
                      </p>
                      <p className="text-xs text-gray-500">{l.code}</p>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={l.qte}
                      onChange={(e) => updateQty(i, Number(e.target.value))}
                      className="w-24 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-gray-800"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <Label>Description (facultatif)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Precisez le motif de la demande..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            disabled={loading || !lines.length}
            onClick={submit}
            className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Envoyer la demande"}
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
