"use client";

import { useState, useCallback } from "react";
import ResourcePageShell from "@/components/common/ResourcePageShell";
import { Drawer } from "@/components/ui/drawer";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import CustomerSearch, {
  type CustomerResult,
} from "@/components/auth/CustomerSearch";
import ProductSearch, {
  type ProductResult,
} from "@/components/auth/ProductSearch";
import {
  createSale,
  cancelSale,
  listSales,
} from "@/actions/workspace.actions";
import { getInvoiceData, type InvoiceData } from "@/actions/invoice.actions";
import {
  PlusIcon,
  TrashBinIcon,
  DownloadIcon,
  CheckCircleIcon,
  CloseLineIcon,
  UserIcon,
  BoxCubeIcon,
  DollarLineIcon,
} from "@/icons";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface SaleItem {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  currency: string;
  status: string;
  productCount: number;
  createdAt: string;
}

interface SalesData {
  items: SaleItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface Props {
  slug: string;
  header: any;
  initialSales: SalesData | null;
  taux: number;
  exchange: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmee",
  CANCELLED: "Annulee",
  PENDING: "En attente",
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

function StepIndicator({ step }: { step: number }) {
  const steps = ["Client", "Produits", "Validation"];
  return (
    <div className="mb-6 flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i + 1 <= step
                ? "bg-brand-500 text-white"
                : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {i + 1 < step ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              i + 1
            )}
          </div>
          <span
            className={`text-xs font-medium ${
              i + 1 <= step
                ? "text-gray-800 dark:text-white/90"
                : "text-gray-400"
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-6 ${
                i + 1 < step
                  ? "bg-brand-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function SalesClient({
  slug,
  header,
  initialSales,
  taux,
  exchange,
}: Props) {

  // Data
  const [data, setData] = useState<SalesData | null>(initialSales);

  // Metrics currency toggle
  const [displayCurrency, setDisplayCurrency] = useState<"ORIGINAL" | "USD" | "CDF">("CDF");

  // Drawer
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Customer
  const [customer, setCustomer] = useState<CustomerResult | null>(null);

  // Lines
  const [lines, setLines] = useState<
    Array<{
      productId: string;
      designation: string;
      code: string;
      quantity: number;
      max: number;
      price: number;
      currency: string;
    }>
  >([]);

  // State
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Invoice
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(
    null,
  );

  /* ---- refresh data ---- */
  const refreshData = useCallback(async () => {
    const r = await listSales(slug, 1, "", "");
    if (r.success) setData(r.data);
  }, [slug]);

  /* ---- currency conversion ---- */
  const convertAmount = useCallback(
    (amount: number, currency: string): { amount: number; currency: string } => {
      if (displayCurrency === "ORIGINAL") return { amount, currency };
      if (displayCurrency === "USD" && currency === "CDF" && exchange > 0)
        return { amount: Math.round((amount / exchange) * 100) / 100, currency: "USD" };
      if (displayCurrency === "CDF" && currency === "USD" && taux > 0)
        return { amount: Math.round(amount * taux), currency: "CDF" };
      return { amount, currency };
    },
    [displayCurrency, taux, exchange],
  );

  /* ---- actions ---- */
  const addProduct = useCallback(
    (p: ProductResult) => {
      const price = p.price?.[0];
      if (!price || p.quantity < 1) return;
      setLines((prev) =>
        prev.some((l) => l.productId === p.id)
          ? prev
          : [
              ...prev,
              {
                productId: p.id,
                designation: p.designation,
                code: p.code,
                quantity: 1,
                max: p.quantity,
                price: price.amount,
                currency: price.currency,
              },
            ],
      );
    },
    [],
  );

  const updateQty = useCallback((index: number, qty: number) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, quantity: Math.max(1, Math.min(qty, l.max)) } : l,
      ),
    );
  }, []);

  const removeLine = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submit = async () => {
    if (!customer) return;
    setLoading(true);
    const r = await createSale(slug, {
      customerId: customer.id,
      lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    });
    setLoading(false);
    setMessage(r.message);
    if (r.success) {
      setOpen(false);
      refreshData();
    }
  };

  const handleCancel = async (saleId: string) => {
    await cancelSale(slug, saleId);
    refreshData();
  };

  const handleDownloadInvoice = async (saleId: string) => {
    setDownloadingInvoice(saleId);
    const r = await getInvoiceData(saleId);
    setDownloadingInvoice(null);
    if (!r.success || !r.data) return;

    const d = r.data;
    const toCDF = (amount: number, currency: string): number => {
      if (currency === "CDF") return amount;
      if (currency === "USD" && taux > 0) return Math.round(amount * taux);
      return amount;
    };
    const fmt = (n: number) => n.toLocaleString("fr-FR");

    const linesHtml = d.lines
      .map(
        (l) => `
        <tr>
          <td>${l.designation}${l.code ? ` <span class="code">(${l.code})</span>` : ""}</td>
          <td class="center">${l.qte}</td>
          <td class="right">${fmt(toCDF(l.unitPrice, l.currency))} FC</td>
          <td class="center">${l.reduction}%</td>
          <td class="right">${fmt(toCDF(l.total, l.currency))} FC</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture ${d.reference}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #374151; background: #f9fafb; padding: 40px; }
  .invoice { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: hidden; }
  .header { background: #f3f4f6; padding: 28px 32px; border-bottom: 1px solid #e5e7eb; }
  .header h1 { font-size: 22px; font-weight: 700; color: #111827; }
  .header .ref { font-size: 14px; color: #6b7280; margin-top: 4px; }
  .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px 32px; border-bottom: 1px solid #f3f4f6; }
  .info h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #9ca3af; margin-bottom: 6px; }
  .info p { font-size: 13px; color: #4b5563; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; }
  thead th { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #9ca3af; padding: 12px 32px; text-align: left; border-bottom: 1px solid #e5e7eb; background: #fafafa; }
  thead th.center, thead th.right { text-align: center; }
  thead th.right { text-align: right; }
  tbody td { padding: 12px 32px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6; }
  tbody td.center { text-align: center; }
  tbody td.right { text-align: right; }
  .code { color: #9ca3af; font-size: 12px; }
  .totals { padding: 20px 32px; }
  .totals .row { display: flex; justify-content: flex-end; align-items: center; gap: 12px; padding: 4px 0; font-size: 13px; color: #6b7280; }
  .totals .row.total { font-size: 16px; font-weight: 700; color: #111827; border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 12px; }
  .totals .row.total .val { font-size: 18px; }
  .footer { background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { font-size: 12px; color: #9ca3af; }
  .footer .brand { font-weight: 600; color: #6b7280; }
  @media print {
    body { background: #fff; padding: 0; }
    .invoice { box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <h1>${d.tenantName}</h1>
    <p class="ref">Facture ${d.reference} — ${new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
  </div>
  <div class="info">
    <div>
      <h3>Boutique</h3>
      <p>${d.storeName}<br>Exercice ${d.anneeSlug}</p>
    </div>
    <div>
      <h3>Client</h3>
      <p>${d.customerName}<br>${d.customerPhone}</p>
    </div>
    <div>
      <h3>Vendeur</h3>
      <p>${d.salerPseudo} (${d.salerMatricule})</p>
    </div>
    <div>
      <h3>Devise</h3>
      <p>Tous les montants en Francs Congolais (CDF)</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th class="center">Qté</th>
        <th class="right">Prix unitaire</th>
        <th class="center">Réduc.</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${linesHtml}
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Sous-total</span><span class="val">${fmt(toCDF(d.subtotal, d.currency))} FC</span></div>
    <div class="row"><span>Réduction</span><span class="val">−${fmt(toCDF(d.discountAmount, d.currency))} FC</span></div>
    <div class="row total"><span>Total</span><span class="val">${fmt(toCDF(d.totalAmount, d.currency))} FC</span></div>
  </div>
  <div class="footer">
    <p>Facture générée par <span class="brand">ELMES-TEKA</span></p>
  </div>
</div>
<script>window.print();</script>
</body>
</html>`;

    const popup = window.open("", "_blank", "width=900,height=700");
    if (popup) {
      popup.document.write(html);
      popup.document.close();
    }
  };

  const resetDrawer = () => {
    setStep(1);
    setCustomer(null);
    setLines([]);
    setMessage("");
  };

  /* ---- computed ---- */
  const items: SaleItem[] = data?.items ?? [];
  const confirmedItems = items.filter((x) => x.status !== "CANCELLED");
  const cancelledItems = items.filter((x) => x.status === "CANCELLED");

  // Revenue with conversion
  const revenueConverted = confirmedItems.reduce((s, x) => {
    const c = convertAmount(x.totalAmount, x.currency);
    return s + c.amount;
  }, 0);
  const revenueCurrency =
    displayCurrency !== "ORIGINAL"
      ? displayCurrency
      : confirmedItems[0]?.currency ?? "";
  const avgBasket = confirmedItems.length
    ? Math.round(revenueConverted / confirmedItems.length)
    : 0;

  const linesTotal = lines.reduce((s, l) => s + l.quantity * l.price, 0);
  const linesCurrency = lines[0]?.currency ?? "";

  /* ---- render ---- */
  return (
    <>
      <ResourcePageShell
        title="Ventes"
        description={`${header.store.designation} — Exercice ${header.annee.slug}`}
        metrics={
          <div className="space-y-3">
            {/* Currency toggle */}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Ventes" value={data?.total ?? 0} />
              <Metric
                label="Chiffre d'affaires"
                value={formatCurrency(revenueConverted, revenueCurrency)}
              />
              <Metric label="Annulees" value={cancelledItems.length} />
              <Metric
                label="Panier moyen"
                value={
                  confirmedItems.length
                    ? formatCurrency(avgBasket, revenueCurrency)
                    : "—"
                }
              />
            </div>
          </div>
        }
        toolbar={
          <button
            onClick={() => {
              resetDrawer();
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle vente
          </button>
        }
        content={
          items.length > 0 ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((x) => {
                const isCancelled = x.status === "CANCELLED";
                return (
                  <div
                    key={x.id}
                    className={`relative overflow-hidden rounded-xl border bg-white p-5 transition-shadow hover:shadow-md dark:bg-gray-900 ${
                      isCancelled
                        ? "border-error-200 dark:border-error-800"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {/* Status badge */}
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isCancelled
                            ? "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                            : "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                        }`}
                      >
                        {STATUS_LABELS[x.status] ?? x.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(x.createdAt)}
                      </span>
                    </div>

                    {/* Reference */}
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">
                      {x.reference}
                    </h4>

                    {/* Customer */}
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>
                        {x.customerName || "—"}
                        {x.phone ? ` · ${x.phone}` : ""}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="mt-3 flex items-baseline gap-1">
                      <DollarLineIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-xl font-bold text-gray-800 dark:text-white/90">
                        {formatCurrency(x.totalAmount, x.currency)}
                      </span>
                    </div>

                    {/* Product count */}
                    <p className="mt-1 text-xs text-gray-500">
                      {x.productCount} produit{x.productCount > 1 ? "s" : ""}
                    </p>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
                      {!isCancelled && (
                        <button
                          onClick={() => handleCancel(x.id)}
                          className="text-xs font-medium text-error-500 transition-colors hover:text-error-600"
                        >
                          Annuler
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadInvoice(x.id)}
                        disabled={downloadingInvoice === x.id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 transition-colors hover:text-brand-600 disabled:opacity-50"
                      >
                        <DownloadIcon className="h-3.5 w-3.5" />
                        {downloadingInvoice === x.id
                          ? "Telechargement..."
                          : "Facture"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : undefined
        }
        emptyState={
          !items.length ? (
            <EmptyState text="Aucune vente n'a encore ete enregistree pour cette boutique. Creez une vente pour commencer le suivi des recettes." />
          ) : undefined
        }
      />

      {/* ================================================================ */}
      {/*  Drawer — Nouvelle vente                                         */}
      {/* ================================================================ */}
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Nouvelle vente"
        description={`Boutique ${header.store.designation}`}
        size="xl"
      >
        <StepIndicator step={step} />

        {/* ---------- Step 1 : Client ---------- */}
        {step === 1 && (
          <div className="space-y-4">
            <CustomerSearch
              selectedCustomer={customer}
              onSelect={(c) => {
                setCustomer(c);
                setStep(2);
              }}
              onClear={() => setCustomer(null)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!customer}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* ---------- Step 2 : Produits ---------- */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Customer recap */}
            {customer && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {customer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {customer.phone}
                    {customer.email ? ` — ${customer.email}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomer(null);
                    setStep(1);
                  }}
                  className="ml-auto text-xs text-brand-500 hover:text-brand-600"
                >
                  Modifier
                </button>
              </div>
            )}

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
                        <p className="text-xs text-gray-500">
                          {l.code} — {formatCurrency(l.price, l.currency)} / u
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={String(l.max)}
                          value={l.quantity}
                          onChange={(e) => updateQty(i, Number(e.target.value))}
                          className="w-20 text-center"
                        />
                        <span className="text-xs text-gray-500">
                          × {formatCurrency(l.price, l.currency)}
                        </span>
                      </div>
                      <div className="w-20 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
                        {formatCurrency(l.quantity * l.price, l.currency)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        className="ml-1 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-gray-800"
                      >
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ← Retour
              </button>
              <button
                type="button"
                disabled={!lines.length}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                Voir le resume
              </button>
            </div>
          </div>
        )}

        {/* ---------- Step 3 : Validation ---------- */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Recap card */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-800 dark:text-white/90">
                  Recapitulatif de la commande
                </h4>
              </div>

              {/* Customer */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3 dark:border-gray-700">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {customer?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {customer?.phone}
                    {customer?.email ? ` — ${customer.email}` : ""}
                  </p>
                </div>
              </div>

              {/* Lines */}
              <div className="px-5 py-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500">
                      <th className="pb-2 font-medium">Produit</th>
                      <th className="pb-2 text-center font-medium">Qte</th>
                      <th className="pb-2 text-right font-medium">P.U.</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {lines.map((l) => (
                      <tr key={l.productId}>
                        <td className="py-2">
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {l.designation}
                          </p>
                          <p className="text-xs text-gray-500">{l.code}</p>
                        </td>
                        <td className="py-2 text-center text-gray-600 dark:text-gray-400">
                          {l.quantity}
                        </td>
                        <td className="py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(l.price, l.currency)}
                        </td>
                        <td className="py-2 text-right font-semibold text-gray-800 dark:text-white/90">
                          {formatCurrency(l.quantity * l.price, l.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total
                  </span>
                  <span className="text-xl font-bold text-gray-800 dark:text-white/90">
                    {formatCurrency(linesTotal, linesCurrency)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Le serveur recalculera le prix final, les promotions
                  applicables et mettra a jour le stock.
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ← Modifier les produits
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? (
                  "Enregistrement..."
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Valider la vente
                  </>
                )}
              </button>
            </div>

            {message && (
              <div className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
                <CloseLineIcon className="h-4 w-4 shrink-0" />
                {message}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
