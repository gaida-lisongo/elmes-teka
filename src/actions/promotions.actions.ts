"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import Commande from "@/lib/models/Commande";
import Customer from "@/lib/models/Customer";
import Promotion from "@/lib/models/Promotion";
import { Tenant } from "@/lib/models/User";
import { checkStatus, initiateCollection } from "@/lib/utils/payment.service";
import connectToDb from "@/lib/utils/db";
import { smsNotifier } from "@/lib/utils/sms";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const objectId = (value: string) => new Types.ObjectId(value);

export async function getTenantPromotionWorkspace(page = 1, search = "") {
  const { tenantId } = await requireTenantSession();
  const query: Record<string, unknown> = { tenantId: objectId(tenantId), status: { $ne: "ARCHIVED" } };
  if (search.trim()) {
    const regex = { $regex: escapeRegex(search.trim()), $options: "i" };
    query.$or = [{ designation: regex }, { code: regex }];
  }

  const limit = 12;
  const [items, total, customerMetrics] = await Promise.all([
    Promotion.find(query).sort({ createdAt: -1 }).skip((Math.max(1, page) - 1) * limit).limit(limit).lean(),
    Promotion.countDocuments(query),
    Commande.aggregate([
      { $match: { tenantId: objectId(tenantId), status: { $ne: "CANCELLED" } } },
      { $group: { _id: "$clientId", revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      { $group: { _id: null, buyingCustomers: { $sum: 1 }, revenue: { $sum: "$revenue" }, orders: { $sum: "$orders" } } },
    ]),
  ]);
  const customers = await Customer.countDocuments({ tenantId: objectId(tenantId) });
  const metrics = customerMetrics[0] ?? { buyingCustomers: 0, revenue: 0, orders: 0 };

  return {
    items: items.map((promotion) => ({
      id: promotion._id.toString(), designation: promotion.designation, description: promotion.description,
      code: promotion.code, reduction: promotion.reduction, commandes: promotion.commandes ?? 1,
      credits: promotion.credits, status: promotion.status, photo: promotion.photo ?? null,
      recharges: promotion.recharges?.length ?? 0, createdAt: promotion.createdAt.toISOString(),
    })),
    total, page: Math.max(1, page), totalPages: Math.max(1, Math.ceil(total / limit)),
    metrics: { customers, buyingCustomers: metrics.buyingCustomers, inactiveCustomers: Math.max(0, customers - metrics.buyingCustomers), orders: metrics.orders, revenue: metrics.revenue },
  };
}

export async function createPromotion(input: { designation: string; description: string; code: string; reduction: number; commandes: number }) {
  try {
    const { tenantId } = await requireTenantSession();
    const code = input.code.trim().toUpperCase();
    if (!input.designation.trim() || !input.description.trim() || !code) return { success: false, message: "Tous les champs obligatoires doivent etre renseignes." } as const;
    if (!Number.isInteger(input.commandes) || input.commandes < 1) return { success: false, message: "Le critere de commandes doit etre un entier positif." } as const;
    if (!Number.isFinite(input.reduction) || input.reduction < 0 || input.reduction > 100) return { success: false, message: "Reduction invalide." } as const;
    const promotion = await Promotion.create({ tenantId, designation: input.designation.trim(), description: input.description.trim(), code, reduction: input.reduction, commandes: input.commandes, credits: 0, recharges: [] });
    revalidatePath("/clients");
    return { success: true, message: "Promotion creee.", data: { id: promotion._id.toString(), code: promotion.code } } as const;
  } catch (error: any) {
    return { success: false, message: error?.code === 11000 ? "Ce code de promotion existe deja." : error.message || "Creation impossible." } as const;
  }
}

export async function updatePromotion(id: string, input: { designation: string; description: string; reduction: number; commandes: number; status: "ACTIVE" | "INACTIVE" }) {
  try {
    const { tenantId } = await requireTenantSession();
    if (!Types.ObjectId.isValid(id) || !Number.isInteger(input.commandes) || input.commandes < 1 || input.reduction < 0 || input.reduction > 100) return { success: false, message: "Donnees invalides." } as const;
    const result = await Promotion.updateOne({ _id: id, tenantId }, { $set: { designation: input.designation.trim(), description: input.description.trim(), reduction: input.reduction, commandes: input.commandes, status: input.status } });
    if (!result.matchedCount) return { success: false, message: "Promotion introuvable." } as const;
    revalidatePath("/clients"); revalidatePath("/clients", "layout");
    return { success: true, message: "Promotion modifiee.", data: null } as const;
  } catch (error: any) { return { success: false, message: error.message || "Modification impossible." } as const; }
}

export async function archivePromotion(id: string) {
  try {
    const { tenantId } = await requireTenantSession();
    if (!Types.ObjectId.isValid(id)) return { success: false, message: "Promotion invalide." } as const;
    const db = await connectToDb(); const session = await db.startSession(); let removed = 0;
    try { await session.withTransaction(async () => { const result = await Promotion.updateOne({ _id: id, tenantId }, { $set: { status: "ARCHIVED" } }, { session }); if (!result.matchedCount) throw new Error("Promotion introuvable."); const cleanup = await Customer.updateMany({ tenantId, promotions: objectId(id) }, { $pull: { promotions: objectId(id) } }, { session }); removed = cleanup.modifiedCount; }); } finally { await session.endSession(); }
    revalidatePath("/clients"); revalidatePath("/clients", "layout");
    return { success: true, message: "Promotion archivee et associations retirees.", data: { removed } } as const;
  } catch (error: any) { return { success: false, message: error.message || "Archivage impossible." } as const; }
}

export async function getPromotionAudience(code: string, page = 1, search = "") {
  const { tenantId } = await requireTenantSession();
  const promotion = await Promotion.findOne({ tenantId, code: code.toUpperCase(), status: { $ne: "ARCHIVED" } }).lean();
  if (!promotion) return null;
  const match: Record<string, unknown> = { tenantId: objectId(tenantId), status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] } };
  const pipeline: any[] = [
    { $match: match },
    { $project: { clientId: 1, lines: { $size: "$commandes" }, totalAmount: 1, currency: 1, createdAt: 1 } },
    { $group: { _id: "$clientId", commandes: { $sum: "$lines" }, ventes: { $sum: 1 }, chiffreAffaires: { $sum: "$totalAmount" }, derniereCommande: { $max: "$createdAt" } } },
    { $match: { commandes: { $gte: promotion.commandes ?? 1 } } },
    { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
    { $unwind: "$customer" },
    { $match: { "customer.tenantId": objectId(tenantId), ...(search.trim() ? { $or: [{ "customer.name": { $regex: escapeRegex(search.trim()), $options: "i" } }, { "customer.phone": { $regex: escapeRegex(search.trim()), $options: "i" } }, { "customer.matricule": { $regex: escapeRegex(search.trim()), $options: "i" } }] } : {}) } },
    { $sort: { commandes: -1, derniereCommande: -1 } },
    { $facet: { items: [{ $skip: (Math.max(1, page) - 1) * 20 }, { $limit: 20 }], selection: [{ $limit: 50 }, { $project: { _id: 1 } }], meta: [{ $count: "total" }] } },
  ];
  const [[audience], associatedClients, usage] = await Promise.all([
    Commande.aggregate(pipeline),
    Customer.countDocuments({ tenantId, promotions: promotion._id }),
    Commande.aggregate([{ $match: { tenantId: objectId(tenantId), "promotion.promotionId": promotion._id, status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] } } }, { $group: { _id: "$currency", orders: { $sum: 1 }, revenue: { $sum: "$totalAmount" }, discounts: { $sum: "$discountAmount" } } }]),
  ]);
  const total = audience?.meta?.[0]?.total ?? 0;
  return {
    promotion: { id: promotion._id.toString(), designation: promotion.designation, description: promotion.description, code: promotion.code, reduction: promotion.reduction, commandes: promotion.commandes ?? 1, credits: promotion.credits ?? 0, status: promotion.status, photo: promotion.photo ?? null, smsStats: promotion.smsStats ?? { sent: 0, failed: 0, skipped: 0, lastSentAt: null }, recharges: (promotion.recharges ?? []).map((r) => ({ orderNumber: r.orderNumber, credits: r.credits, amount: r.amount, status: r.status, message: r.message, createdAt: r.createdAt.toISOString() })) },
    items: (audience?.items ?? []).map((item: any) => ({ id: item.customer._id.toString(), name: item.customer.name, phone: item.customer.phone, email: item.customer.email ?? "", matricule: item.customer.matricule, commandes: item.commandes, ventes: item.ventes, chiffreAffaires: item.chiffreAffaires, derniereCommande: item.derniereCommande.toISOString(), associated: (item.customer.promotions ?? []).some((id: Types.ObjectId) => id.toString() === promotion._id.toString()) })),
    selectionIds: (audience?.selection ?? []).map((item: { _id: Types.ObjectId }) => item._id.toString()),
    metrics: { associatedClients, usage: usage.map((item) => ({ currency: item._id, orders: item.orders, revenue: item.revenue, discounts: item.discounts })) },
    total, page: Math.max(1, page), totalPages: Math.max(1, Math.ceil(total / 20)),
  };
}

export async function initiatePromotionRecharge(input: { promotionId: string; credits: number; phone: string }) {
  try {
    const { tenantId } = await requireTenantSession();
    if (!Types.ObjectId.isValid(input.promotionId) || !Number.isInteger(input.credits) || input.credits < 30 || input.credits % 30 !== 0) return { success: false, message: "Les credits doivent etre achetes par multiples de 30." } as const;
    if (input.phone.trim().length < 8) return { success: false, message: "Numero de transaction invalide." } as const;
    const promotion = await Promotion.findOne({ _id: input.promotionId, tenantId, status: { $ne: "ARCHIVED" } }).select("_id code").lean();
    if (!promotion) return { success: false, message: "Promotion introuvable." } as const;
    const amount = (input.credits / 30) * 2;
    const reference = `PROMO-${promotion.code}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const payment = await initiateCollection({ phone: input.phone.trim(), amount, currency: "USD", reference });
    if (!payment.success || !payment.orderNumber) return { success: false, message: payment.error || "Le paiement n'a pas pu etre initie." } as const;
    await Promotion.updateOne({ _id: promotion._id, tenantId }, { $push: { recharges: { orderNumber: payment.orderNumber, credits: input.credits, amount, currency: "USD", phone: input.phone.trim(), status: "PENDING", message: payment.message || "Paiement initie.", createdAt: new Date() } } });
    revalidatePath(`/clients/${promotion.code}`);
    return { success: true, message: "Paiement initie.", data: { orderNumber: payment.orderNumber, credits: input.credits, amount } } as const;
  } catch (error: any) { return { success: false, message: error.message || "Recharge impossible." } as const; }
}

export async function verifyPromotionRecharge(promotionId: string, orderNumber: string) {
  try {
    const { tenantId } = await requireTenantSession();
    const promotion = await Promotion.findOne({ _id: promotionId, tenantId, recharges: { $elemMatch: { orderNumber, status: "PENDING" } } }).select("code recharges").lean();
    if (!promotion) return { success: false, message: "Recharge en attente introuvable." } as const;
    const recharge = promotion.recharges.find((item) => item.orderNumber === orderNumber && item.status === "PENDING");
    if (!recharge) return { success: false, message: "Recharge deja traitee." } as const;
    const status = await checkStatus(orderNumber);
    if (!status.success || status.status === "EN_ATTENTE") return { success: false, message: status.error || "Le paiement est toujours en attente." } as const;
    if (status.status === "ECHEC") {
      await Promotion.updateOne({ _id: promotionId, tenantId }, { $set: { "recharges.$[item].status": "FAILED", "recharges.$[item].message": status.message || "Paiement echoue." } }, { arrayFilters: [{ "item.orderNumber": orderNumber, "item.status": "PENDING" }] });
      return { success: false, message: "Le paiement a echoue." } as const;
    }
    const result = await Promotion.updateOne({ _id: promotionId, tenantId, recharges: { $elemMatch: { orderNumber, status: "PENDING" } } }, { $inc: { credits: recharge.credits }, $set: { "recharges.$[item].status": "PAID", "recharges.$[item].message": status.message || "Paiement confirme.", "recharges.$[item].paidAt": new Date() } }, { arrayFilters: [{ "item.orderNumber": orderNumber, "item.status": "PENDING" }] });
    if (!result.modifiedCount) return { success: false, message: "Cette recharge a deja ete creditee." } as const;
    revalidatePath(`/clients/${promotion.code}`);
    return { success: true, message: `${recharge.credits} credits ajoutes.`, data: { credits: recharge.credits } } as const;
  } catch (error: any) { return { success: false, message: error.message || "Verification impossible." } as const; }
}

export async function removePromotionFromAllCustomers(promotionId: string) {
  try { const { tenantId } = await requireTenantSession(); if (!Types.ObjectId.isValid(promotionId)) return { success: false, message: "Promotion invalide." } as const; const promotion = await Promotion.findOne({ _id: promotionId, tenantId }).select("_id code").lean(); if (!promotion) return { success: false, message: "Promotion introuvable." } as const; const result = await Customer.updateMany({ tenantId, promotions: promotion._id }, { $pull: { promotions: promotion._id } }); revalidatePath(`/clients/${promotion.code}`); return { success: true, message: `${result.modifiedCount} association(s) retiree(s).`, data: { removed: result.modifiedCount } } as const; } catch (error: any) { return { success: false, message: error.message || "Nettoyage impossible." } as const; }
}

export async function sendPromotionSmsToCustomers(input: { promotionId: string; customerIds: string[]; message: string }) {
  try {
    const { tenantId } = await requireTenantSession();
    const ids = [...new Set(input.customerIds)].filter((id) => Types.ObjectId.isValid(id));
    if (!Types.ObjectId.isValid(input.promotionId) || !ids.length || ids.length > 50) return { success: false, message: "Selection invalide ou superieure a 50 clients." } as const;
    const template = input.message.trim();
    if (!template || template.length > 1530 || /{{(?!name|promotion|code|reduction)[^}]+}}/.test(template)) return { success: false, message: "Message invalide ou variable non autorisee." } as const;
    const [promotion, tenant] = await Promise.all([Promotion.findOne({ _id: input.promotionId, tenantId, status: "ACTIVE" }).lean(), Tenant.findById(tenantId).select("slug").lean()]);
    if (!promotion || !tenant?.slug) return { success: false, message: "Promotion active introuvable." } as const;
    const requestedIds = ids.map(objectId);
    const eligibleRows = await Commande.aggregate([{ $match: { tenantId: objectId(tenantId), clientId: { $in: requestedIds }, status: { $in: ["CONFIRMED", "PAID", "DELIVERED"] } } }, { $project: { clientId: 1, lines: { $size: "$commandes" } } }, { $group: { _id: "$clientId", lines: { $sum: "$lines" } } }, { $match: { lines: { $gte: promotion.commandes ?? 1 } } }]);
    const customers = await Customer.find({ _id: { $in: eligibleRows.map((row) => row._id) }, tenantId }).select("name phone promotions").lean();
    const eligible = customers.filter((customer) => !(customer.promotions ?? []).some((id) => id.toString() === promotion._id.toString()));
    const alreadyAssociated = customers.length - eligible.length;
    if (!eligible.length) return { success: true, message: "Aucun nouveau client a notifier.", data: { totalRequested: ids.length, sent: 0, failed: 0, skipped: ids.length, results: [] } } as const;
    const reservation = await Promotion.updateOne({ _id: promotion._id, tenantId, status: "ACTIVE", credits: { $gte: eligible.length } }, { $inc: { credits: -eligible.length } });
    if (!reservation.modifiedCount) return { success: false, message: `Credits insuffisants : ${eligible.length} requis.` } as const;
    const results: Array<{ customerId: string; success: boolean; phone?: string; message: string }> = [];
    for (let index = 0; index < eligible.length; index += 10) {
      const batch = eligible.slice(index, index + 10);
      const sent = await Promise.all(batch.map(async (customer) => {
        try { const personalized = template.replaceAll("{{name}}", customer.name).replaceAll("{{promotion}}", promotion.designation).replaceAll("{{code}}", promotion.code).replaceAll("{{reduction}}", String(promotion.reduction)); const normalizedPhone = smsNotifier.normalizePhone(customer.phone); const response = await smsNotifier.send_simple({ phone: normalizedPhone, message: personalized, clientReference: `promo-${promotion._id}-${customer._id}` }); const delivered = response.success && response.data?.success === true && response.data?.status === "sent"; const accepted = response.success && response.data?.success === true && ["accepted", "sent"].includes(response.data?.status); return { customerId: customer._id.toString(), delivered, accepted, phone: normalizedPhone, message: delivered ? "SMS envoye." : accepted ? "SMS accepte, livraison non confirmee." : response.error ?? "Echec SMS." }; } catch (error: any) { return { customerId: customer._id.toString(), delivered: false, accepted: false, phone: "00000000000", message: error.message || "Numero invalide." }; }
      }));
      results.push(...sent.map((item) => ({ customerId: item.customerId, success: item.delivered, phone: `${item.phone.slice(0, 5)}****${item.phone.slice(-2)}`, message: item.message })));
      const successfulIds = sent.filter((item) => item.delivered).map((item) => objectId(item.customerId));
      if (successfulIds.length) await Customer.updateMany({ _id: { $in: successfulIds }, tenantId }, { $addToSet: { promotions: promotion._id } });
      const acceptedCount = sent.filter((item) => item.accepted).length; const deliveredCount = successfulIds.length; const failedCount = sent.length - acceptedCount; const pendingCount = acceptedCount - deliveredCount;
      await Promotion.updateOne({ _id: promotion._id, tenantId }, { $inc: { credits: sent.length - acceptedCount, "smsStats.sent": deliveredCount, "smsStats.failed": failedCount, "smsStats.skipped": pendingCount }, $set: { "smsStats.lastSentAt": new Date() } });
    }
    const sent = results.filter((item) => item.success).length; const failed = results.filter((item) => !item.success).length;
    revalidatePath(`/clients/${promotion.code}`);
    return { success: true, message: sent ? "Diffusion terminee." : "Aucune livraison n'a ete confirmee.", data: { totalRequested: ids.length, sent, failed, skipped: alreadyAssociated, results } } as const;
  } catch (error: any) { return { success: false, message: error.message || "Envoi SMS impossible." } as const; }
}
