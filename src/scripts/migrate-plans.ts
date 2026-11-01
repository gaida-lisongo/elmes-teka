/**
 * Script one-shot de migration des plans d'exercices.
 *
 * Règles :
 * - Tous les exercices ACTIVE ou COMPLETED → plan BUSINESS
 * - Exercice(s) du compte inbtpkinshasa@gmail.com → plan PREMIUM + 100 crédits IA
 * - Les exercices PENDING ou CANCELLED ne sont pas touchés.
 *
 * Usage :
 *   MONGO_URI=mongodb://... npx ts-node -r tsconfig-paths/register src/scripts/migrate-plans.ts
 */

import mongoose from "mongoose";
import Annee from "@/lib/models/Annee";
import { Tenant, User } from "@/lib/models/User";

const ADMIN_EMAIL = "inbtpkinshasa@gmail.com";

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Variable d'environnement MONGO_URI manquante.");
  }

  await mongoose.connect(uri);
  console.log("Connecté à MongoDB.");

  // Tous les exercices ACTIVE ou COMPLETED → BUSINESS
  const bulkResult = await Annee.updateMany(
    { status: { $in: ["ACTIVE", "COMPLETED"] } },
    { $set: { plan: "BUSINESS" } },
  );
  console.log(`Exercices mis à jour vers BUSINESS : ${bulkResult.modifiedCount}`);

  // Trouver le tenant du compte admin
  const adminUser = await User.findOne({ email: ADMIN_EMAIL }).select("_id").lean();
  if (!adminUser) {
    console.warn(`Compte admin introuvable : ${ADMIN_EMAIL}`);
  } else {
    const adminTenant = await Tenant.findOne({ userId: adminUser._id }).select("_id").lean();
    if (!adminTenant) {
      console.warn(`Tenant introuvable pour ${ADMIN_EMAIL}`);
    } else {
      // Exercices actifs du tenant admin → PREMIUM + 100 crédits
      const premiumResult = await Annee.updateMany(
        {
          tenantId: adminTenant._id,
          status: { $in: ["ACTIVE", "COMPLETED"] },
        },
        {
          $set: {
            plan: "PREMIUM",
            aiCredits: {
              total: 100,
              used: 0,
              lastResetAt: new Date(),
            },
          },
        },
      );
      console.log(`Exercices du compte admin mis à PREMIUM : ${premiumResult.modifiedCount}`);
    }
  }

  await mongoose.disconnect();
  console.log("Migration terminée.");
}

main().catch((err) => {
  console.error("Erreur de migration :", err);
  process.exit(1);
});
