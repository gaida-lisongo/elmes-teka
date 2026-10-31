import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import ExcelJS from "exceljs";

const require = createRequire(import.meta.url);
const tenantId = "111111111111111111111111";
const anneeId = "222222222222222222222222";
const date = new Date("2026-07-01T10:00:00Z");
function query(value) {
  const result = { select: () => result, populate: () => result, sort: () => result, limit: () => result, lean: async () => value };
  return result;
}
function fixture() {
  const calls = { tenantId: null, pdf: null };
  const orders = [
    { createdAt: date, reference: "USD-ORDER", currency: "USD", totalAmount: 90, status: "PAID", shopId: { designation: "Ma boutique" }, clientId: { name: "Client" }, commandes: [{ total: 100, qte: 1 }] },
    { createdAt: date, reference: "CDF-ORDER", currency: "CDF", totalAmount: 280000, status: "PAID", shopId: { designation: "Ma boutique" }, clientId: { name: "Client" }, commandes: [{ total: 280000, qte: 1 }] },
  ];
  const expenses = [
    { createdAt: date, reference: "USD-EXPENSE", currency: "USD", status: "APPROVED", shopId: { designation: "Ma boutique" }, agentId: { pseudo: "Agent" }, depenses: [{ libelle: "Loyer", amount: 20, status: "APPROVED" }], totalAmount: 20 },
    { createdAt: date, reference: "CDF-EXPENSE", currency: "CDF", status: "APPROVED", shopId: { designation: "Ma boutique" }, agentId: { pseudo: "Agent" }, depenses: [{ libelle: "Transport", amount: 50000, status: "APPROVED" }], totalAmount: 50000 },
  ];
  const mocks = {
    "@/lib/auth/require-tenant": { requireTenantSession: async () => ({ tenantId }) },
    "@/lib/payments/entitlements": { requireSubscriptionFeature: async () => ({ plan: "BUSINESS" }) },
    "@/lib/utils/db": async () => {},
    "@/lib/models/User": { Tenant: { findById(id) { calls.tenantId = id.toString(); return query({ designation: "Entreprise correcte" }); } } },
    "@/lib/models/Annee": { findOne: () => query({ _id: anneeId, slug: "2026-2026", debut: new Date("2026-01-01"), fin: new Date("2026-12-31T23:59:59.999Z") }) },
    "@/lib/models/Commande": { find: () => query(orders), aggregate: async () => [{ _id: { month: 7, currency: "USD" }, total: 90 }, { _id: { month: 7, currency: "CDF" }, total: 280000 }] },
    "@/lib/models/Depense": { find: () => query(expenses), aggregate: async () => [{ _id: { month: 7, currency: "USD" }, total: 20 }, { _id: { month: 7, currency: "CDF" }, total: 50000 }] },
    "@/lib/models/Creance": { aggregate: async () => [] }, "@/lib/models/Dette": { aggregate: async () => [] },
    "@/lib/models/Store": { find: () => query([{ designation: "Ma boutique" }]) }, "@/lib/models/Product": {},
    pdfmake: { addFonts() {}, setUrlAccessPolicy() {}, setLocalAccessPolicy() {}, createPdf(definition) { calls.pdf = definition; return { getBuffer: async () => Buffer.from("%PDF-test") }; } },
  };
  const exports = {};
  const source = readFileSync(new URL("../../src/actions/exports.actions.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const execute = vm.runInThisContext(`(function(require, exports) { ${js}\n })`);
  execute(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), exports);
  return { actions: exports, calls };
}

test("Excel : l'entreprise correcte, recettes nettes après remise et devises séparées", async () => {
  const { actions, calls } = fixture();
  const result = await actions.exportAnneeJournal(anneeId);
  assert.equal(result.success, true, result.message);
  assert.equal(calls.tenantId, tenantId);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(result.data.buffer));
  const summary = workbook.getWorksheet("Synthèse");
  const values = {};
  summary.eachRow(row => { values[row.getCell(1).text] = row.getCell(2).text; });
  assert.equal(values["Recettes (USD)"], "90 USD");
  assert.equal(values["Dépenses (USD)"], "20 USD");
  assert.equal(values["Solde enregistré (USD)"], "70 USD");
  assert.match(values["Solde enregistré (CDF)"], /230.*000 CDF/);
  const journal = workbook.getWorksheet("Journal");
  assert.equal(journal.getCell("G2").value, 90);
  const rows = [];
  journal.eachRow(row => rows.push(row.values));
  assert.ok(rows.some(row => row.includes("USD-EXPENSE") && row.includes("USD")));
});

test("PDF : chaque devise garde son solde, sans prétendre calculer une capacité de crédit", async () => {
  const { actions, calls } = fixture();
  const result = await actions.exportDossierFinancement(anneeId);
  assert.equal(result.success, true, result.message);
  assert.equal(calls.tenantId, tenantId);
  const content = calls.pdf.content;
  const table = content.find(item => item.table).table.body;
  const usd = table.find(row => row[0]?.text === "TOTAL (USD)");
  const cdf = table.find(row => row[0]?.text === "TOTAL (CDF)");
  assert.equal(usd[3].text, "70");
  assert.match(cdf[3].text, /230.*000/);
  assert.ok(content.some(item => typeof item.text === "string" && item.text.includes("ni une capacité de remboursement")));
});
