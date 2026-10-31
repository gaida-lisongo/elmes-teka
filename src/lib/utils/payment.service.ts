/**
 * Service de paiement FlexPay (Mobile Money et carte bancaire, RDC).
 * Documentation : docs/flexpay/README.md
 *
 * Variables d'environnement requises :
 *   FLEX_HOST_PAYMENT_MOBILE – URL de paymentService (ex. https://backend.flexpay.cd/api/rest/v1/paymentService)
 *   FLEX_HOST_PAYMENT_CARD   – URL de paiement carte (ex. https://cardpayment.flexpay.cd/v1.1/pay)
 *   FLEX_HOST_CHECK          – URL de base du check (ex. https://backend.flexpay.cd/api/rest/v1/check/)
 *   FLEX_MERCHANT            – code marchand FlexPay
 *   FLEX_TOKEN               – token d'autorisation, préfixé par "Bearer "
 */

import crypto from 'node:crypto';
import { getSessionSecret } from '@/lib/auth/session';
import { appOrigin } from '@/lib/utils/app-url';
import { smsNotifier } from '@/lib/utils/sms';

// ── Types ──────────────────────────────────────────────────────────

export type PaymentCurrency = 'CDF' | 'USD';

export interface CollectionPayload {
  phone: string;
  amount: number;
  reference: string;
  currency?: PaymentCurrency;
}

export interface PayoutPayload {
  phone: string;
  amount: number;
  reference: string;
  currency?: PaymentCurrency;
}

export interface CardPaymentPayload {
  amount: number;
  reference: string;
  currency?: PaymentCurrency;
  description?: string;
  /** Chemin de la page de retour (ex. "/annees"), complété par ?payment=approve|cancel|decline */
  returnPath: string;
}

export interface PaymentResponse {
  success: boolean;
  orderNumber?: string;
  url?: string;
  message?: string;
  error?: string;
  raw?: any;
}

export interface StatusResponse {
  success: boolean;
  status?: 'EN_ATTENTE' | 'SUCCES' | 'ECHEC';
  orderNumber?: string;
  reference?: string;
  message?: string;
  error?: string;
  raw?: any;
}

// ── Configuration ──────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`${key} n’est pas défini dans les variables d’environnement.`);
  return value;
}

/** Accepte un hôte seul (on ajoute le chemin documenté) ou une URL déjà complète. */
function endpoint(hostKey: string, defaultPath: string): string {
  const url = new URL(requireEnv(hostKey));
  if (url.pathname === '/' || url.pathname === '') url.pathname = defaultPath;
  return url.toString().replace(/\/$/, '');
}

function authorization(): string {
  const token = requireEnv('FLEX_TOKEN');
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

// ── Callback signé ─────────────────────────────────────────────────
// FlexPay ne signe pas ses callbacks : l'URL porte une clé HMAC liée à la
// référence, et le webhook revérifie toujours le statut via /check.

export function callbackKey(reference: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(`flexpay:${reference}`).digest('hex');
}

export function isValidCallbackKey(reference: string, key: string | null): boolean {
  if (!key) return false;
  const expected = Buffer.from(callbackKey(reference));
  const supplied = Buffer.from(key);
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}

async function callbackUrl(reference: string): Promise<string> {
  const url = new URL('/api/payments/flexpay/callback', await appOrigin());
  url.searchParams.set('ref', reference);
  url.searchParams.set('key', callbackKey(reference));
  return url.toString();
}

// ── Appels HTTP internes ───────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST',
  url: string,
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; data: T; status: number }> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: authorization() },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, data, status: res.status };
}

function failure(data: any, status: number, fallback: string): PaymentResponse {
  return {
    success: false,
    error: data?.message || data?.error || `${fallback} (HTTP ${status}).`,
    raw: data,
  };
}

// ── Méthodes publiques ─────────────────────────────────────────────

/**
 * 1. Collecte Mobile Money : FlexPay envoie un push au téléphone du client,
 *    puis appelle le callback avec le résultat.
 */
export async function initiateCollection(payload: CollectionPayload): Promise<PaymentResponse> {
  try {
    const { data, status } = await request<any>(
      'POST',
      endpoint('FLEX_HOST_PAYMENT_MOBILE', '/api/rest/v1/paymentService'),
      {
        merchant: requireEnv('FLEX_MERCHANT'),
        type: '1',
        phone: smsNotifier.normalizePhone(payload.phone),
        reference: payload.reference,
        amount: String(payload.amount),
        currency: payload.currency ?? 'CDF',
        callbackUrl: await callbackUrl(payload.reference),
      },
    );
    console.log('[FLEX COLLECT]', payload.reference, status, data?.code, data?.message);

    if (String(data?.code) === '0' && data?.orderNumber) {
      return {
        success: true,
        orderNumber: data.orderNumber,
        message: data.message || 'Collecte initiée avec succès.',
        raw: data,
      };
    }
    return failure(data, status, 'Échec de l’initiation de la collecte');
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur réseau lors de la collecte.' };
  }
}

/**
 * 2. Paiement par carte : FlexPay renvoie une URL vers laquelle rediriger le client.
 */
export async function initiateCardPayment(payload: CardPaymentPayload): Promise<PaymentResponse> {
  try {
    const origin = await appOrigin();
    const back = (result: string) => {
      const url = new URL(payload.returnPath, origin);
      url.searchParams.set('payment', result);
      url.searchParams.set('ref', payload.reference);
      return url.toString();
    };
    const { data, status } = await request<any>(
      'POST',
      endpoint('FLEX_HOST_PAYMENT_CARD', '/v1.1/pay'),
      {
        authorization: authorization(),
        merchant: requireEnv('FLEX_MERCHANT'),
        reference: payload.reference,
        amount: String(payload.amount),
        currency: payload.currency ?? 'USD',
        description: payload.description ?? payload.reference,
        callback_url: await callbackUrl(payload.reference),
        approve_url: back('approve'),
        cancel_url: back('cancel'),
        decline_url: back('decline'),
        language: 'fr',
      },
    );
    console.log('[FLEX CARD]', payload.reference, status, data?.code, data?.message);

    if (String(data?.code) === '0' && data?.orderNumber && data?.url) {
      return {
        success: true,
        orderNumber: data.orderNumber,
        url: data.url,
        message: data.message || 'Redirection en cours.',
        raw: data,
      };
    }
    return failure(data, status, 'Échec de l’initiation du paiement par carte');
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur réseau lors du paiement par carte.' };
  }
}

/**
 * 3. Pay out marchand : transfert du compte marchand vers un numéro Mobile Money.
 */
export async function initiatePayout(payload: PayoutPayload): Promise<PaymentResponse> {
  try {
    const { data, status } = await request<any>(
      'POST',
      // FLEX_HOST_PAYMENT_MOBILE pointe souvent sur …/paymentService : le pay out est son voisin.
      endpoint('FLEX_HOST_PAYMENT_MOBILE', '/api/rest/v1/merchantPayOutService').replace(
        /\/paymentService$/,
        '/merchantPayOutService',
      ),
      {
        merchant: requireEnv('FLEX_MERCHANT'),
        type: '1',
        phone: smsNotifier.normalizePhone(payload.phone),
        reference: payload.reference,
        amount: String(payload.amount),
        currency: payload.currency ?? 'CDF',
        callbackUrl: await callbackUrl(payload.reference),
      },
    );
    console.log('[FLEX PAYOUT]', payload.reference, status, data?.code, data?.message);

    if (String(data?.code) === '0' && data?.orderNumber) {
      return {
        success: true,
        orderNumber: data.orderNumber,
        message: data.message || 'Paiement initié avec succès.',
        raw: data,
      };
    }
    return failure(data, status, 'Échec de l’initiation du paiement');
  } catch (error: any) {
    return { success: false, error: error.message || 'Erreur réseau lors du paiement.' };
  }
}

/**
 * 4. Vérifie le statut d’une transaction (source de vérité, y compris pour le webhook).
 *    transaction.status : 0 succès · 1 échec · 2 en attente · 3/4 remboursement · 5 annulée
 */
export async function checkStatus(orderNumber: string): Promise<StatusResponse> {
  try {
    const url = `${endpoint('FLEX_HOST_CHECK', '/api/rest/v1/check')}/${encodeURIComponent(orderNumber)}`;
    const { data, status } = await request<any>('GET', url);
    console.log('[FLEX CHECK]', orderNumber, status, data?.code, data?.transaction?.status);

    const transaction = data?.transaction;
    if (String(data?.code) !== '0' || !transaction) {
      return {
        success: false,
        error: data?.message || data?.messsage || `Transaction introuvable (HTTP ${status}).`,
        raw: data,
      };
    }

    const code = String(transaction.status);
    const mappedStatus = code === '0' ? 'SUCCES' : code === '2' ? 'EN_ATTENTE' : 'ECHEC';
    return {
      success: true,
      status: mappedStatus,
      orderNumber: transaction.orderNumber ?? orderNumber,
      reference: transaction.reference,
      message: data.message || data.messsage || 'Statut récupéré.',
      raw: transaction,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur réseau lors de la vérification du statut.',
    };
  }
}
