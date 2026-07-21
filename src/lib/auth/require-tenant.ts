import { Types } from "mongoose";

import { getSession } from "@/lib/auth/session";
import connectToDb from "@/lib/utils/db";
import { Tenant } from "@/lib/models/User";

export interface TenantSession {
  userId: string;
  tenantId: string;
}

/**
 * Vérifie que l'utilisateur connecté est un TENANT actif
 * et retourne son userId et tenantId.
 * Lance une erreur (throw) si la session est invalide.
 */
export async function requireTenantSession(): Promise<TenantSession> {
  const session = await getSession();

  if (!session) {
    throw new Error("SESSION_REQUIRED");
  }

  if (session.accountType !== "TENANT") {
    throw new Error("FORBIDDEN_TENANT_ONLY");
  }

  if (!session.tenantId || !Types.ObjectId.isValid(session.tenantId)) {
    throw new Error("INVALID_TENANT");
  }

  await connectToDb();

  const tenant = await Tenant.findById(session.tenantId)
    .select("_id status")
    .lean();

  if (!tenant || tenant.status !== "ACTIVE") {
    throw new Error("TENANT_INACTIVE");
  }

  return {
    userId: session.userId,
    tenantId: session.tenantId,
  };
}

/**
 * Retourne la session tenant ou null (sans throw).
 * Utile pour les pages qui doivent afficher une erreur 404 au lieu de rediriger.
 */
export async function getTenantSession(): Promise<TenantSession | null> {
  try {
    return await requireTenantSession();
  } catch {
    return null;
  }
}