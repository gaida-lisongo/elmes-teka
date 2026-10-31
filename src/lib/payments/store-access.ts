import { Types } from "mongoose";
import Store, { type IStore } from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";
import { Tenant } from "@/lib/models/User";
import connectToDb from "@/lib/utils/db";

/** Le verrou d'écriture tenant sérialise les créations concurrentes dans la transaction. */
export async function createStoreWithinPlan(tenantId: string, input: Pick<IStore, "designation" | "description" | "reference"> & Partial<Pick<IStore, "coordonnes" | "photos">>) {
  const db = await connectToDb();
  const session = await db.startSession();
  try {
    return await session.withTransaction(async () => {
      const owner = await Tenant.updateOne({ _id: tenantId, status: "ACTIVE" }, { $inc: { storeCreationVersion: 1 } }, { session });
      if (!owner.matchedCount) throw new Error("Entreprise inactive.");
      const existing = await Store.exists({ tenantId }).session(session);
      if (existing) {
        const now = new Date();
        const subscription = await Annee.exists({ tenantId, status: "ACTIVE", "provider.status": "PAID", plan: { $in: ["BUSINESS", "PREMIUM"] }, debut: { $lte: now }, fin: { $gt: now } }).session(session);
        if (!subscription) throw new Error("Créer plusieurs boutiques nécessite Business ou Premium actif.");
      }
      const [store] = await Store.create([{ ...input, tenantId: new Types.ObjectId(tenantId), status: "ACTIVE", capitals: [], caisses: [] }], { session });
      await Tenant.updateOne({ _id: tenantId }, { $addToSet: { storesId: store._id } }, { session });
      return store;
    });
  } finally { await session.endSession(); }
}
