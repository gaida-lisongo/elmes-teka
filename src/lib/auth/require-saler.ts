import { Types } from "mongoose";
import { getSession } from "@/lib/auth/session";
import connectToDb from "@/lib/utils/db";
import { Saler, User } from "@/lib/models/User";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";

export interface SalerWorkContext {
  userId: string;
  salerId: string;
  tenantId: string;
  storeId: string;
  storeReference: string;
  storeDesignation: string;
}

export async function requireSalerSession(): Promise<SalerWorkContext> {
  const session = await getSession();
  if (!session || session.accountType !== "SALER") throw new Error("SALER_SESSION_REQUIRED");
  if (!session.salerId || !session.storeId || !Types.ObjectId.isValid(session.salerId) || !Types.ObjectId.isValid(session.storeId)) {
    throw new Error("SALER_WORKSPACE_INVALID");
  }
  await connectToDb();
  const saler = await Saler.findOne({ _id: session.salerId, userId: session.userId, storeId: session.storeId, status: "ACTIVE" }).lean();
  if (!saler?.tenantId) throw new Error("SALER_INACTIVE");
  const [user, store] = await Promise.all([
    User.findOne({ _id: session.userId, status: "ACTIVE" }).select("_id").lean(),
    Store.findOne({ _id: session.storeId, tenantId: saler.tenantId, status: { $in: ["ACTIVE", "PENDING_PAYMENT"] } })
      .select("_id tenantId reference designation").lean(),
  ]);
  if (!user || !store || store.tenantId.toString() !== saler.tenantId.toString()) throw new Error("SALER_SCOPE_INVALID");
  return { userId: user._id.toString(), salerId: saler._id.toString(), tenantId: saler.tenantId.toString(), storeId: store._id.toString(), storeReference: store.reference, storeDesignation: store.designation };
}

export async function requireActiveAnnee(context: SalerWorkContext, slug: string) {
  const annee = await Annee.findOne({ tenantId: context.tenantId, slug, status: "ACTIVE", "provider.status": "PAID" }).lean();
  if (!annee) throw new Error("ACTIVE_ANNEE_REQUIRED");
  return { id: annee._id.toString(), slug: annee.slug, debut: annee.debut.toISOString(), fin: annee.fin.toISOString() };
}
