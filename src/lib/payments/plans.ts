export const PLANS = {
  STARTER: { name: "Starter", annualUsd: 50, features: ["Ventes, produits et stocks", "Clients et dépenses", "Une boutique", "Tableau de bord essentiel"] },
  BUSINESS: { name: "Business", annualUsd: 120, features: ["Toutes les fonctions Starter", "Pilotage multi-boutiques", "Exports et rapports avancés"] },
  PREMIUM: { name: "Premium", annualUsd: 200, features: ["Toutes les fonctions Business", "Assistant et recommandations IA (à venir)", "Préparation du financement (à venir)"] },
} as const;
export type Plan = keyof typeof PLANS;
export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && Object.hasOwn(PLANS, value);
}
export function upgradePrice(current: Plan, target: Plan, start: Date, end: Date, now = new Date()) {
  const difference = PLANS[target].annualUsd - PLANS[current].annualUsd;
  if (difference <= 0) throw new Error("Choisissez une formule supérieure.");
  const duration = end.getTime() - start.getTime();
  if (![duration, now.getTime(), start.getTime(), end.getTime()].every(Number.isFinite) || duration <= 0 || now >= end) throw new Error("Abonnement expiré.");
  if (now < start) throw new Error("Cet exercice n’a pas encore commencé.");
  const fraction = (end.getTime() - now.getTime()) / duration;
  return Math.round(difference * fraction * 100) / 100;
}

export type SubscriptionFeature = "advancedReports" | "multiStore" | "ai";
export const PLAN_FEATURES: Record<Plan, Readonly<Record<SubscriptionFeature, boolean>>> = {
  STARTER: { advancedReports: false, multiStore: false, ai: false },
  BUSINESS: { advancedReports: true, multiStore: true, ai: false },
  PREMIUM: { advancedReports: true, multiStore: true, ai: true },
};
export function hasPlanFeature(plan: unknown, feature: SubscriptionFeature): boolean {
  return isPlan(plan) && PLAN_FEATURES[plan][feature];
}
