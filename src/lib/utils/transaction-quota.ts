import { Types } from "mongoose";
import Store from "@/lib/models/Store";

/**
 * Vérifie que la boutique a un abonnement actif pour l'exercice donné
 * et que le quota de transactions n'est pas atteint.
 * Si tout est valide, incrémente atomiquement transactionCount.
 *
 * @throws Error si aucune subscription active ou quota atteint
 */
export async function checkAndIncrementQuota(
  shopId: string,
  anneeId: string
): Promise<void> {
  const storeOid = new Types.ObjectId(shopId);
  const anneeOid = new Types.ObjectId(anneeId);

  const store = await Store.findOne(
    {
      _id: storeOid,
      subscriptions: {
        $elemMatch: {
          anneeId: anneeOid,
          status: "ACTIVE",
        },
      },
    },
    { "subscriptions.$": 1 }
  ).lean();

  if (!store || !store.subscriptions?.length) {
    throw new Error("Aucun abonnement actif pour cet exercice");
  }

  const subscription = store.subscriptions[0];

  if (
    subscription.transactionLimit !== null &&
    subscription.transactionCount >= subscription.transactionLimit
  ) {
    throw new Error("Quota de transactions atteint");
  }

  /* Incrément atomique sur le sous-document correspondant à cet anneeId */
  await Store.updateOne(
    {
      _id: storeOid,
      subscriptions: {
        $elemMatch: {
          anneeId: anneeOid,
          status: "ACTIVE",
        },
      },
    },
    {
      $inc: { "subscriptions.$.transactionCount": 1 },
    }
  );
}
