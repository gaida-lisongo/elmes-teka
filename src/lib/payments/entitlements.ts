import Annee from "@/lib/models/Annee";
import connectToDb from "@/lib/utils/db";
import { PLAN_FEATURES, type Plan, type SubscriptionFeature } from "./plans";

export async function requireSubscriptionFeature(tenantId: string, feature: SubscriptionFeature) {
  await connectToDb();
  const now = new Date();
  const allowed = (Object.keys(PLAN_FEATURES) as Plan[]).filter(plan => PLAN_FEATURES[plan][feature]);
  const subscription = await Annee.findOne({ tenantId, status: "ACTIVE", "provider.status": "PAID",
    debut: { $lte: now }, fin: { $gt: now }, plan: { $in: allowed } }).select("_id plan").lean();
  if (!subscription) throw new Error(feature === "ai" ? "Cette fonction nécessite Premium actif." : "Cette fonction nécessite Business ou Premium actif.");
  return subscription;
}
