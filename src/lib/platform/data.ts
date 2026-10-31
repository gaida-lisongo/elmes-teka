import Annee from "@/lib/models/Annee";
import PlatformPromo from "@/lib/models/PlatformPromo";
import Promotion from "@/lib/models/Promotion";
import Store from "@/lib/models/Store";
import { Tenant } from "@/lib/models/User";
import { countPaidReferrals } from "@/lib/payments/pricing";
import connectToDb from "@/lib/utils/db";

/* Données de supervision pour l'administrateur de la plateforme (toutes entreprises). */

export interface PlatformPaymentRow {
  id: string;
  kind: "ABONNEMENT" | "RECHARGE_SMS";
  tenant: string;
  label: string;
  amount: number;
  currency: string;
  status: string;
  discount: string | null;
  orderNumber: string | null;
  date: string;
}

export interface PlatformOverview {
  tenants: { total: number; last30Days: number; referred: number };
  stores: number;
  exercises: { pending: number; active: number; completed: number };
  revenue: Array<{ currency: string; amount: number; count: number }>;
  payments: PlatformPaymentRow[];
  topReferrers: Array<{ tenant: string; code: string | null; total: number; paid: number }>;
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  await connectToDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [tenantsTotal, tenantsRecent, tenantsReferred, stores, exerciseGroups, revenue, annees, recharges, referrerGroups] =
    await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ createdAt: { $gte: since } }),
      Tenant.countDocuments({ referredBy: { $ne: null } }),
      Store.countDocuments(),
      Annee.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Annee.aggregate([
        { $match: { "provider.status": "PAID", "provider.amount": { $gt: 0 } } },
        { $group: { _id: "$provider.currency", amount: { $sum: "$provider.amount" }, count: { $sum: 1 } } },
      ]),
      Annee.find({ "provider.orderNumber": { $ne: null } })
        .select("tenantId debut fin provider updatedAt")
        .sort({ updatedAt: -1 })
        .limit(30)
        .populate("tenantId", "designation")
        .lean(),
      Promotion.aggregate([
        { $unwind: "$recharges" },
        { $sort: { "recharges.createdAt": -1 } },
        { $limit: 20 },
        { $lookup: { from: "tenants", localField: "tenantId", foreignField: "_id", as: "tenant" } },
        { $project: { code: 1, recharges: 1, tenant: { $arrayElemAt: ["$tenant.designation", 0] } } },
      ]),
      Tenant.aggregate([
        { $match: { referredBy: { $ne: null } } },
        { $group: { _id: "$referredBy", total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $lookup: { from: "tenants", localField: "_id", foreignField: "_id", as: "parrain" } },
        { $project: { total: 1, designation: { $arrayElemAt: ["$parrain.designation", 0] }, code: { $arrayElemAt: ["$parrain.referralCode", 0] } } },
      ]),
    ]);

  const byStatus = Object.fromEntries(exerciseGroups.map((g: { _id: string; count: number }) => [g._id, g.count]));

  const payments: PlatformPaymentRow[] = [
    ...annees.map((a) => ({
      id: a._id.toString(),
      kind: "ABONNEMENT" as const,
      tenant: (a.tenantId as unknown as { designation?: string })?.designation ?? "-",
      label: `Exercice ${a.debut.getFullYear()}`,
      amount: a.provider?.amount ?? 0,
      currency: a.provider?.currency ?? "USD",
      status: a.provider?.status ?? "PENDING",
      discount: a.provider?.discountPercent ? `-${a.provider.discountPercent} % (${a.provider.promoCode ?? a.provider.discountSource})` : null,
      orderNumber: a.provider?.orderNumber ?? null,
      date: (a.updatedAt as Date).toISOString(),
    })),
    ...recharges.map((r: { _id: unknown; code: string; tenant?: string; recharges: { orderNumber: string; credits: number; amount: number; currency: string; status: string; createdAt: Date } }) => ({
      id: `${String(r._id)}-${r.recharges.orderNumber}`,
      kind: "RECHARGE_SMS" as const,
      tenant: r.tenant ?? "-",
      label: `${r.recharges.credits} credits SMS (${r.code})`,
      amount: r.recharges.amount,
      currency: r.recharges.currency,
      status: r.recharges.status,
      discount: null,
      orderNumber: r.recharges.orderNumber,
      date: new Date(r.recharges.createdAt).toISOString(),
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40);

  const topReferrers = await Promise.all(
    referrerGroups.map(async (g: { _id: { toString(): string }; total: number; designation?: string; code?: string }) => ({
      tenant: g.designation ?? "-",
      code: g.code ?? null,
      total: g.total,
      paid: await countPaidReferrals(g._id.toString()),
    }))
  );

  return {
    tenants: { total: tenantsTotal, last30Days: tenantsRecent, referred: tenantsReferred },
    stores,
    exercises: { pending: byStatus.PENDING ?? 0, active: byStatus.ACTIVE ?? 0, completed: byStatus.COMPLETED ?? 0 },
    revenue: revenue.map((r: { _id: string; amount: number; count: number }) => ({ currency: r._id, amount: r.amount, count: r.count })),
    payments,
    topReferrers,
  };
}

export interface PlatformPromoRow {
  id: string;
  code: string;
  label: string;
  reduction: number;
  startsAt: string;
  endsAt: string;
  maxUses: number | null;
  uses: number;
  isPublic: boolean;
  status: "ACTIVE" | "INACTIVE";
  state: "A_VENIR" | "EN_COURS" | "EXPIRE" | "EPUISE" | "DESACTIVE";
  signups: number;
}

export async function getPlatformPromos(): Promise<PlatformPromoRow[]> {
  await connectToDb();
  const promos = await PlatformPromo.find().sort({ createdAt: -1 }).lean();
  const signupGroups = await Tenant.aggregate([
    { $match: { signupPromoCode: { $in: promos.map((p) => p.code) } } },
    { $group: { _id: "$signupPromoCode", count: { $sum: 1 } } },
  ]);
  const signups = Object.fromEntries(signupGroups.map((g: { _id: string; count: number }) => [g._id, g.count]));
  const now = new Date();
  return promos.map((p) => ({
    id: p._id.toString(),
    code: p.code,
    label: p.label,
    reduction: p.reduction,
    startsAt: p.startsAt.toISOString(),
    endsAt: p.endsAt.toISOString(),
    maxUses: p.maxUses ?? null,
    uses: p.uses,
    isPublic: p.isPublic,
    status: p.status,
    state:
      p.status === "INACTIVE"
        ? "DESACTIVE"
        : p.maxUses !== null && p.uses >= p.maxUses
          ? "EPUISE"
          : p.endsAt < now
            ? "EXPIRE"
            : p.startsAt > now
              ? "A_VENIR"
              : "EN_COURS",
    signups: signups[p.code] ?? 0,
  }));
}

/** Codes promo publics actuellement valides, pour le site internet. */
export async function getPublicPromos(): Promise<Array<{ code: string; label: string; reduction: number; endsAt: string }>> {
  await connectToDb();
  const now = new Date();
  const promos = await PlatformPromo.find({ status: "ACTIVE", isPublic: true, startsAt: { $lte: now }, endsAt: { $gte: now } })
    .sort({ endsAt: 1 })
    .limit(3)
    .lean();
  return promos
    .filter((p) => p.maxUses === null || p.uses < p.maxUses)
    .map((p) => ({ code: p.code, label: p.label, reduction: p.reduction, endsAt: p.endsAt.toISOString() }));
}
