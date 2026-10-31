import { createHmac, timingSafeEqual } from "node:crypto";
import { isPlan, upgradePrice, type Plan } from "./plans";

export interface UpgradeQuote {
  tenantId: string;
  anneeId: string;
  from: Plan;
  target: Plan;
  amount: number;
  periodStart: string;
  periodEnd: string;
  quotedAt: number;
  expiresAt: number;
}

export function signUpgradeQuote(quote: UpgradeQuote, secret: string): string {
  const payload = Buffer.from(JSON.stringify(quote)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(`upgrade:${payload}`).digest("base64url")}`;
}

export function verifyUpgradeQuote(token: string, secret: string, now = Date.now()): UpgradeQuote {
  if (typeof token !== "string" || token.length > 4096) throw new Error("Devis invalide.");
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) throw new Error("Devis invalide.");
  const expected = createHmac("sha256", secret).update(`upgrade:${payload}`).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) throw new Error("Devis invalide.");
  const quote: UpgradeQuote = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!isPlan(quote.from) || !isPlan(quote.target) || !Number.isFinite(quote.amount) ||
      !Number.isFinite(quote.quotedAt) || !Number.isFinite(quote.expiresAt) ||
      quote.quotedAt > now || quote.expiresAt <= now || quote.expiresAt - quote.quotedAt > 600_000 ||
      quote.amount !== upgradePrice(quote.from, quote.target, new Date(quote.periodStart), new Date(quote.periodEnd), new Date(quote.quotedAt))) {
    throw new Error("Le devis a expiré ou n’est plus valide. Actualisez-le.");
  }
  return quote;
}
