import { NextResponse, type NextRequest } from "next/server";
import {
  ANNEE_PREFIX,
  PROMO_PREFIX,
  applyAnneePayment,
  applyPromotionRecharge,
  type AppliedPayment,
} from "@/lib/payments/flexpay-results";
import { checkStatus, isValidCallbackKey } from "@/lib/utils/payment.service";
import { publishTenantEvent } from "@/lib/utils/realtime";

/*
 * Callback FlexPay (Mobile Money, carte, pay out).
 * FlexPay ne signe pas ses notifications : on exige la clé HMAC placée dans
 * l'URL de callback, puis on ignore le statut reçu et on interroge /check,
 * seule source de vérité, avant de mettre à jour la base.
 */

async function readBody(request: NextRequest): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return (await request.json()) ?? {};
    if (type.includes("form")) return Object.fromEntries((await request.formData()).entries());
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("ref");
  if (!reference || !isValidCallbackKey(reference, request.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readBody(request);
  // La doc FlexPay orthographie parfois "orderNumer" dans le callback.
  const orderNumber = String(body.orderNumber ?? body.orderNumer ?? "").trim();
  if (body.reference && String(body.reference) !== reference) {
    return NextResponse.json({ error: "Reference mismatch" }, { status: 400 });
  }
  if (!orderNumber) return NextResponse.json({ error: "orderNumber manquant" }, { status: 400 });

  const status = await checkStatus(orderNumber);
  console.log("[FLEX CALLBACK]", reference, orderNumber, body.code, status.success ? status.status : status.error);
  if (!status.success) {
    // Statut non vérifiable pour l'instant : le bouton « Vérifier » reste disponible.
    return NextResponse.json({ error: "Verification impossible" }, { status: 502 });
  }
  if (status.reference && status.reference !== reference) {
    return NextResponse.json({ error: "Reference mismatch" }, { status: 400 });
  }

  let applied: AppliedPayment;
  if (reference.startsWith(ANNEE_PREFIX)) {
    applied = await applyAnneePayment(reference.slice(ANNEE_PREFIX.length), status);
  } else if (reference.startsWith(PROMO_PREFIX)) {
    applied = await applyPromotionRecharge(orderNumber, status);
  } else {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (applied.tenantId) {
    await publishTenantEvent(applied.tenantId, "paiements", "payment.updated", {
      reference,
      state: applied.state,
      message: applied.message,
    });
  }
  return NextResponse.json({ received: true, state: applied.state });
}
