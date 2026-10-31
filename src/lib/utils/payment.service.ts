/**
 * Service de paiement — encapsule les appels HTTP vers l'Edge Function Supabase
 * qui sert d'intermédiaire avec FlexPay (Mobile Money, RDC).
 *
 * Variables d'environnement requises :
 *   PAYMENT_API_URL   – URL de base de l'Edge Function
 */

import { smsNotifier } from '@/lib/utils/sms';

const BASE_URL = process.env.PAYMENT_API_URL;

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

export interface PaymentResponse {
  success: boolean;
  orderNumber?: string;
  message?: string;
  error?: string;
  raw?: any;
}

export interface StatusResponse {
  success: boolean;
  status?: 'EN_ATTENTE' | 'SUCCES' | 'ECHEC';
  orderNumber?: string;
  message?: string;
  error?: string;
  raw?: any;
}

// ── Appels HTTP internes ───────────────────────────────────────────

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; data: T; status: number }> {
  if (!BASE_URL) {
    throw new Error(
      'PAYMENT_API_URL n’est pas défini dans les variables d’environnement.',
    );
  }

  const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // L'Edge Function enveloppe normalement la réponse dans { data } ; les erreurs
  // (4xx/5xx) peuvent arriver sans enveloppe, voire sans corps JSON.
  const json = await res.json().catch(() => null);
  const data = (json?.data ?? json ?? {}) as T;
  return { ok: res.ok, data, status: res.status };
}

// ── Méthodes publiques ─────────────────────────────────────────────

/**
 * 1. Initie une COLLECTE (paiement depuis un joueur vers le compte marchand).
 *    Utilisé pour les recharges de niveau.
 */
export async function initiateCollection(
  payload: CollectionPayload,
): Promise<PaymentResponse> {
  try {
    const { data, status } = await request<any>('POST', '/collect', {
      channel: 'MOBILE_MONEY',
      amount: payload.amount,
      currency: payload.currency ?? 'CDF',
      reference: payload.reference,
      // FlexPay attend le format international 243XXXXXXXXX
      phone: smsNotifier.normalizePhone(payload.phone),
    });
    console.log('[FLEX COLLECT]', status, data?.code, data?.message ?? data?.error);

    // La réponse FlexPay retourne généralement data.code === "0" pour un succès
    if (data.code == '0' && data?.orderNumber) {
      return {
        success: true,
        orderNumber: data.orderNumber,
        message: data.message || 'Collecte initiée avec succès.',
        raw: data,
      };
    }

    return {
      success: false,
      error: data?.message || data?.error || `Échec de l’initiation de la collecte (HTTP ${status}).`,
      raw: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur réseau lors de la collecte.',
    };
  }
}

/**
 * 2. Initie un PAIEMENT (transfert depuis le compte marchand vers un agent).
 *    Utilisé pour les retraits de commissions des agents.
 */
export async function initiatePayout(
  payload: PayoutPayload,
): Promise<PaymentResponse> {
  try {
    const { data, ok } = await request<any>('POST', '/payout', {
      amount: payload.amount,
      currency: payload?.currency ?? 'CDF',
      phone: payload.phone,
      reference: payload.reference,
    });

    console.log('PayOut', data)

    if (data.code === '0' && data?.orderNumber) {
      return {
        success: true,
        orderNumber: data.orderNumber,
        message: data.message || 'Paiement initié avec succès.',
        raw: data,
      };
    }

    const message = data?.status == '0XX6' ? "Veuillez patienter le temps que nous disposons des fonds" : data.message || data.error || 'Échec de l’initiation du paiement.'

    return {
      success: false,
      error: message,
      raw: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur réseau lors du paiement.',
    };
  }
}

/**
 * 3. Vérifie le statut d’une transaction à partir de son orderNumber.
 */
export async function checkStatus(
  orderNumber: string,
): Promise<StatusResponse> {
  try {
    const { data } = await request<any>(
      'GET',
      `/check?orderNumber=${encodeURIComponent(orderNumber)}`,
    );

    console.log("[Payment Service Check]", data)

    const transaction = data?.transaction;
    if (!transaction && !data?.status) {
      return {
        success: false,
        error: data?.message || data?.error || 'Statut du paiement indisponible.',
      };
    }

    // Adapter selon la forme de la réponse de l'Edge Function
    const statusMap: Record<string, 'EN_ATTENTE' | 'SUCCES' | 'ECHEC'> = {
      pending: 'EN_ATTENTE',
      success: 'SUCCES',
      failed: 'ECHEC',
      cancelled: 'ECHEC',
    };

    const mappedStatus =
      statusMap[data.status?.toLowerCase()] ||
      (transaction?.status === '2' ? 'EN_ATTENTE' : (transaction?.status === '0' ? 'SUCCES' : 'ECHEC'));

    return {
      success: true,
      status: mappedStatus,
      orderNumber,
      message: data.message || 'Statut récupéré.',
      raw: {...transaction, code: transaction?.status},
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur réseau lors de la vérification du statut.',
    };
  }
}