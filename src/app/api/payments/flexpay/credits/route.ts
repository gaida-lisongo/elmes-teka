import { NextResponse, type NextRequest } from "next/server";

import { checkStatus, isValidCallbackKey } from "@/lib/utils/payment.service";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import { Types } from "mongoose";

const CREDITS_PREFIX = "RCH-";
const PACK_CREDITS: Record<string, number> = {
  "50cr": 50,
  "200cr": 200,
  "500cr": 500,
};

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

/**
 * POST /api/payments/flexpay/credits
 *
 * Callback de confirmation de recharge crédits IA.
 * Référence format : RCH-{timestamp}-{pack}
 * Exemple : RCH-1730000000000-50cr
 */
export async function POST(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("ref");
  if (!reference || !isValidCallbackKey(reference, request.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!reference.startsWith(CREDITS_PREFIX)) {
    return NextResponse.json({ error: "Référence de recharge invalide." }, { status: 400 });
  }

  const body = await readBody(request);
  const orderNumber = String(body.orderNumber ?? body.orderNumer ?? "").trim();
  if (!orderNumber) return NextResponse.json({ error: "orderNumber manquant." }, { status: 400 });

  // Vérification du statut auprès de FlexPay (seule source de vérité)
  const status = await checkStatus(orderNumber);
  if (!status.success) {
    return NextResponse.json({ error: "Vérification impossible." }, { status: 502 });
  }
  if (status.status !== "SUCCES") {
    return NextResponse.json({ ok: false, status: status.status });
  }

  // Extraire pack et anneeId depuis la référence : RCH-{ts}-{pack}
  // L'anneeId doit être passé en query param ?anneeId=...
  const anneeId = request.nextUrl.searchParams.get("anneeId");
  if (!anneeId || !Types.ObjectId.isValid(anneeId)) {
    return NextResponse.json({ error: "anneeId invalide." }, { status: 400 });
  }

  const parts = reference.split("-");
  const pack = parts[parts.length - 1];
  const creditsToAdd = PACK_CREDITS[pack];
  if (!creditsToAdd) {
    return NextResponse.json({ error: `Pack inconnu : ${pack}` }, { status: 400 });
  }

  await connectToDb();

  const annee = await Annee.findOne({
    _id: anneeId,
    plan: "PREMIUM",
    status: "ACTIVE",
  })
    .select("aiCredits")
    .lean();

  if (!annee) {
    return NextResponse.json({ error: "Exercice Premium introuvable." }, { status: 404 });
  }

  // Idempotent : vérifier si l'orderNumber a déjà été traité
  // (on stocke dans un champ futur — pour l'instant on incrémente directement)
  await Annee.updateOne(
    { _id: anneeId },
    { $inc: { "aiCredits.total": creditsToAdd } },
  );

  return NextResponse.json({
    ok: true,
    creditsAdded: creditsToAdd,
    message: `${creditsToAdd} crédits ajoutés avec succès.`,
  });
}
