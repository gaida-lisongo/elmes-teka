import { Types } from "mongoose";

import { getSession } from "@/lib/auth/session";
import connectToDb from "@/lib/utils/db";
import { Tenant, User } from "@/lib/models/User";

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

  if (!Types.ObjectId.isValid(session.userId) || !session.tenantId || !Types.ObjectId.isValid(session.tenantId)) {
    throw new Error("INVALID_TENANT");
  }

  await connectToDb();

  const [user, tenant] = await Promise.all([
    User.findOne({ _id: session.userId, status: "ACTIVE" }).select("_id").lean(),
    Tenant.findOne({ _id: session.tenantId, userId: session.userId, status: "ACTIVE" }).select("_id").lean(),
  ]);

  if (!user || !tenant) {
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