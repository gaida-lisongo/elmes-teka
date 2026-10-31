import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(relative, mocks = {}) {
  const exports = {};
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const execute = vm.runInThisContext(`(function(require, exports) { ${js}\n })`);
  execute(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), exports);
  return exports;
}
const plans = load("../../src/lib/payments/plans.ts");
const quotes = load("../../src/lib/payments/upgrade-quote.ts", { "./plans": plans });
const now = Date.parse("2026-07-02T12:00:00Z");
const quote = {
  tenantId: "111111111111111111111111", anneeId: "222222222222222222222222", from: "STARTER", target: "BUSINESS",
  periodStart: "2026-01-01T00:00:00.000Z", periodEnd: "2027-01-01T00:00:00.000Z", quotedAt: now, expiresAt: now + 600_000,
};
quote.amount = plans.upgradePrice(quote.from, quote.target, new Date(quote.periodStart), new Date(quote.periodEnd), new Date(now));
const secret = "test-only-secret-no-real-credential";

test("devis : montant signé inchangé, falsification/expiration refusées", () => {
  const token = quotes.signUpgradeQuote(quote, secret);
  assert.equal(quotes.verifyUpgradeQuote(token, secret, now + 1000).amount, quote.amount);
  assert.throws(() => quotes.verifyUpgradeQuote(token, "wrong-secret", now));
  assert.throws(() => quotes.verifyUpgradeQuote(token, secret, quote.expiresAt));
  const [payload, signature] = token.split(".");
  const tampered = JSON.parse(Buffer.from(payload, "base64url"));
  tampered.amount = 0.01;
  assert.throws(() => quotes.verifyUpgradeQuote(`${Buffer.from(JSON.stringify(tampered)).toString("base64url")}.${signature}`, secret, now));
  assert.throws(() => quotes.verifyUpgradeQuote(`${token}.extra`, secret, now));
});

test("matrice de fonctionnalités : Starter, Business, Premium et entrées inconnues", () => {
  assert.equal(plans.hasPlanFeature("STARTER", "multiStore"), false);
  assert.equal(plans.hasPlanFeature("STARTER", "advancedReports"), false);
  assert.equal(plans.hasPlanFeature("BUSINESS", "multiStore"), true);
  assert.equal(plans.hasPlanFeature("BUSINESS", "ai"), false);
  assert.equal(plans.hasPlanFeature("PREMIUM", "ai"), true);
  assert.equal(plans.hasPlanFeature("__proto__", "ai"), false);
});

function fixture(overrides = {}) {
  const id = quote.anneeId;
  let writes = 0;
  const state = { _id: id, tenantId: quote.tenantId, plan: "STARTER", upgrade: { from: "STARTER", target: "BUSINESS", amount: quote.amount, reference: "UPGRADE-test", orderNumber: "ORDER-1", status: "PENDING" }, ...overrides };
  const model = {
    findOne(filter) {
      const data = filter.tenantId && filter.tenantId !== state.tenantId ? null : state;
      const query = { select: () => query, lean: async () => data ? structuredClone(data) : null };
      return query;
    },
    async updateOne(filter, update) {
      if (state.upgrade.status !== filter["upgrade.status"] || (filter.plan && state.plan !== filter.plan)) return { modifiedCount: 0 };
      if (filter.$or && state.plan !== "STARTER") return { modifiedCount: 0 };
      writes += 1;
      for (const [key, value] of Object.entries(update.$set)) {
        if (key.startsWith("upgrade.")) state.upgrade[key.slice(8)] = value;
        else state[key] = value;
      }
      return { modifiedCount: 1 };
    },
  };
  const { applyUpgradePayment } = load("../../src/lib/payments/flexpay-results.ts", {
    "next/cache": { revalidatePath() {} }, "@/lib/models/Annee": model,
    "@/lib/models/PlatformPromo": {}, "@/lib/models/Promotion": {}, "@/lib/models/User": {},
    "@/lib/admin/notify": {}, "@/lib/utils/db": async () => {},
  });
  const pay = (result = {}, tenantId = quote.tenantId) => applyUpgradePayment(id, "UPGRADE-test", { success: true, status: "SUCCES", orderNumber: "ORDER-1", reference: "UPGRADE-test", ...result }, tenantId);
  return { state, pay, writes: () => writes };
}

test("confirmation : activation puis replay idempotent", async () => {
  const f = fixture();
  assert.equal((await f.pay()).state, "PAID");
  assert.equal(f.state.plan, "BUSINESS");
  assert.equal((await f.pay()).state, "PAID");
  assert.equal(f.writes(), 1);
});

test("paiement non vérifié, autre tenant, autre ordre ou référence : aucun droit accordé", async () => {
  for (const [result, tenant] of [[{ success: false }], [{ orderNumber: "OTHER" }], [{ reference: "OTHER" }], [{}, "333333333333333333333333"]]) {
    const f = fixture();
    assert.equal((await f.pay(result, tenant)).state, "FAILED");
    assert.equal(f.state.plan, "STARTER");
    assert.equal(f.writes(), 0);
  }
});

test("échec terminal ou plan modifié : ne jamais annoncer une activation qui n'a pas eu lieu", async () => {
  const failed = fixture();
  assert.equal((await failed.pay({ status: "ECHEC" })).state, "FAILED");
  assert.equal((await failed.pay()).state, "FAILED");
  assert.equal(failed.state.plan, "STARTER");
  const changed = fixture({ plan: "PREMIUM" });
  assert.notEqual((await changed.pay()).state, "PAID");
  assert.equal(changed.state.plan, "PREMIUM");
});

test("réponse réseau perdue : seul le résultat prestataire lié à la référence peut lier un nouvel ordre", async () => {
  const valid = fixture(); valid.state.upgrade.orderNumber = null;
  assert.equal((await valid.pay()).state, "PAID");
  const invalid = fixture(); invalid.state.upgrade.orderNumber = null;
  assert.equal((await invalid.pay({ reference: undefined })).state, "FAILED");
  assert.equal(invalid.state.plan, "STARTER");
});
