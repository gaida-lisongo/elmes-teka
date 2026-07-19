"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { randomBytes } from "node:crypto";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import { User, Saler } from "@/lib/models/User";
import Store from "@/lib/models/Store";
import { hashPassword } from "@/lib/auth/password";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

/* ───── Types ───── */

export interface SalerListItem {
  id: string;
  userId: string;
  pseudo: string;
  telephone: string;
  email: string;
  matricule: string;
  status: string;
  photo: string | null;
  storeId: string | null;
  storeDesignation: string | null;
  createdAt: string;
}

export interface SalerMetrics {
  total: number;
  actifs: number;
  nonAffectes: number;
  affectes: number;
}

export interface PaginatedSalers {
  items: SalerListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ───── Helpers ───── */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ───── Métriques ───── */

export async function getSalerMetrics(): Promise<ActionResponse<SalerMetrics>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const [result] = await Saler.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          actifs: {
            $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
          },
          nonAffectes: {
            $sum: { $cond: [{ $eq: ["$storeId", null] }, 1, 0] },
          },
          affectes: {
            $sum: { $cond: [{ $ne: ["$storeId", null] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      success: true,
      message: "Metriques recuperees.",
      data: result
        ? {
            total: result.total,
            actifs: result.actifs,
            nonAffectes: result.nonAffectes,
            affectes: result.affectes,
          }
        : { total: 0, actifs: 0, nonAffectes: 0, affectes: 0 },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur metriques." };
  }
}

/* ───── Liste paginée ───── */

export async function getSalers(
  page: number = 1,
  limit: number = 12,
  search: string = "",
  status: string = ""
): Promise<ActionResponse<PaginatedSalers>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const safePage = Math.max(1, Math.min(page, 100));
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const skip = (safePage - 1) * safeLimit;

    const match: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (status && ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"].includes(status)) {
      match.status = status;
    }

    /* On cherche d'abord les Saler, puis on joint User et Store */
    const pipeline: Record<string, unknown>[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: safeLimit },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "_user",
        },
      },
      { $unwind: { path: "$_user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "_store",
        },
      },
      { $unwind: { path: "$_store", preserveNullAndEmptyArrays: true } },
    ];

    /* On filtre par recherche textuelle après lookup */
    if (search && search.length >= 2) {
      const escaped = escapeRegExp(search.slice(0, 80));
      pipeline.push({
        $match: {
          $or: [
            { "_user.pseudo": { $regex: escaped, $options: "i" } },
            { "_user.telephone": { $regex: escaped, $options: "i" } },
            { "_user.email": { $regex: escaped, $options: "i" } },
          ],
        },
      });
    }

    const [countResult] = await Saler.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId) } },
      { $count: "total" },
    ]);

    const total = countResult?.total ?? 0;
    const totalPages = Math.ceil(total / safeLimit) || 1;

    const items = (await Saler.aggregate(pipeline)) as any[];

    return {
      success: true,
      message: "Liste recuperee.",
      data: {
        items: items.map((s) => ({
          id: s._id.toString(),
          userId: s.userId?.toString() ?? "",
          pseudo: s._user?.pseudo ?? "Inconnu",
          telephone: s._user?.telephone ?? "",
          email: s._user?.email ?? "",
          matricule: s._user?.matricule ?? "",
          status: s.status,
          photo: s._user?.photo ?? null,
          storeId: s.storeId?.toString() ?? null,
          storeDesignation: s._store?.designation ?? null,
          createdAt: s.createdAt?.toISOString?.() ?? new Date().toISOString(),
        })),
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur liste." };
  }
}

/* ───── Création d'un agent depuis un user existant ───── */

export async function createSalerFromUser(
  userId: string
): Promise<ActionResponse<{ salerId: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, message: "Utilisateur invalide." };
    }

    const user = await User.findById(userId).select("_id status").lean();
    if (!user) {
      return { success: false, message: "Utilisateur introuvable." };
    }

    const existingSaler = await Saler.findOne({
      userId: user._id,
      tenantId,
    }).lean();

    if (existingSaler) {
      return { success: false, message: "Cet agent est deja enregistre." };
    }

    const saler = await Saler.create({
      userId: user._id,
      tenantId: new Types.ObjectId(tenantId),
      storeId: null,
      status: "ACTIVE",
    });

    revalidatePath("/agents");

    return {
      success: true,
      message: "Agent cree avec succes.",
      data: { salerId: saler._id.toString() },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation." };
  }
}

/* ───── Création d'un agent avec nouveau user ───── */

export async function createSalerWithUser(input: {
  pseudo: string;
  telephone: string;
  email: string;
  password: string;
  photo?: string | null;
}): Promise<ActionResponse<{ salerId: string; userId: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const errors: Record<string, string> = {};

    if (!input.pseudo || input.pseudo.trim().length < 2) {
      errors.pseudo = "Le pseudo doit contenir au moins 2 caracteres.";
    }
    if (!input.telephone || input.telephone.trim().length < 8) {
      errors.telephone = "Numero de telephone invalide.";
    }
    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.email = "Adresse e-mail invalide.";
    }
    if (!input.password || input.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caracteres.";
    } else if (!/[A-Z]/.test(input.password)) {
      errors.password = "Le mot de passe doit contenir une lettre majuscule.";
    } else if (!/[a-z]/.test(input.password)) {
      errors.password = "Le mot de passe doit contenir une lettre minuscule.";
    } else if (!/\d/.test(input.password)) {
      errors.password = "Le mot de passe doit contenir un chiffre.";
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    /* Vérifier unicité */
    const existingUser = await User.findOne({
      $or: [
        { email: input.email.trim().toLowerCase() },
        { telephone: input.telephone.replace(/[^\d+]/g, "") },
      ],
    })
      .select("_id")
      .lean();

    if (existingUser) {
      return {
        success: false,
        message: "Un utilisateur avec cet email ou telephone existe deja.",
      };
    }

    /* Générer matricule */
    const matricule = `SAL-${new Date().getFullYear()}-${randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const secure = await hashPassword(input.password);

    const user = await User.create({
      pseudo: input.pseudo.trim(),
      telephone: input.telephone.replace(/[^\d+]/g, ""),
      email: input.email.trim().toLowerCase(),
      secure,
      matricule,
      status: "ACTIVE",
      photo: input.photo || null,
    });

    const saler = await Saler.create({
      userId: user._id,
      tenantId: new Types.ObjectId(tenantId),
      storeId: null,
      status: "ACTIVE",
    });

    revalidatePath("/agents");

    return {
      success: true,
      message: "Agent cree avec succes.",
      data: {
        salerId: saler._id.toString(),
        userId: user._id.toString(),
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation." };
  }
}

/* ───── Affectation à une boutique ───── */

export async function assignSalerToStore(
  salerId: string,
  storeId: string
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(salerId) || !Types.ObjectId.isValid(storeId)) {
      return { success: false, message: "Identifiants invalides." };
    }

    /* Vérifier que le saler appartient au tenant */
    const saler = await Saler.findOne({ _id: salerId, tenantId }).lean();
    if (!saler) {
      return { success: false, message: "Agent introuvable." };
    }

    /* Vérifier que la boutique appartient au tenant */
    const store = await Store.findOne({ _id: storeId, tenantId }).lean();
    if (!store) {
      return { success: false, message: "Boutique introuvable." };
    }

    await Saler.updateOne({ _id: salerId }, { $set: { storeId: new Types.ObjectId(storeId) } });

    revalidatePath("/agents");

    return { success: true, message: "Agent affecte a la boutique.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur affectation." };
  }
}

/* ───── Retrait d'une boutique ───── */

export async function removeSalerFromStore(
  salerId: string
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(salerId)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const saler = await Saler.findOne({ _id: salerId, tenantId }).lean();
    if (!saler) {
      return { success: false, message: "Agent introuvable." };
    }

    await Saler.updateOne({ _id: salerId }, { $set: { storeId: null } });

    revalidatePath("/agents");

    return { success: true, message: "Agent retire de la boutique.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur retrait." };
  }
}

/* ───── Mise à jour de l'agent (pseudo, telephone, email) ───── */

export async function updateSalerUser(
  salerId: string,
  userId: string,
  input: { pseudo?: string; telephone?: string; email?: string }
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(salerId) || !Types.ObjectId.isValid(userId)) {
      return { success: false, message: "Identifiants invalides." };
    }

    const saler = await Saler.findOne({ _id: salerId, tenantId }).lean();
    if (!saler) {
      return { success: false, message: "Agent introuvable." };
    }

    const update: Record<string, string> = {};
    if (input.pseudo && input.pseudo.trim().length >= 2) update.pseudo = input.pseudo.trim();
    if (input.telephone && input.telephone.trim().length >= 8) update.telephone = input.telephone.replace(/[^\d+]/g, "");
    if (input.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) update.email = input.email.trim().toLowerCase();

    if (Object.keys(update).length > 0) {
      await User.updateOne({ _id: userId }, { $set: update });
    }

    revalidatePath("/agents");

    return { success: true, message: "Agent mis a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur mise a jour." };
  }
}

/* ───── Changement de statut ───── */

export async function updateSalerStatus(
  salerId: string,
  status: string
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!["ACTIVE", "SUSPENDED", "INACTIVE", "PENDING"].includes(status)) {
      return { success: false, message: "Statut invalide." };
    }

    if (!Types.ObjectId.isValid(salerId)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const saler = await Saler.findOne({ _id: salerId, tenantId }).lean();
    if (!saler) {
      return { success: false, message: "Agent introuvable." };
    }

    await Saler.updateOne({ _id: salerId }, { $set: { status } });

    revalidatePath("/agents");

    return { success: true, message: "Statut mis a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur statut." };
  }
}

/* ───── Suppression ───── */

export async function deleteSaler(salerId: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(salerId)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const saler = await Saler.findOne({ _id: salerId, tenantId }).lean();
    if (!saler) {
      return { success: false, message: "Agent introuvable." };
    }

    await Saler.deleteOne({ _id: salerId });

    revalidatePath("/agents");

    return { success: true, message: "Agent supprime.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression." };
  }
}

/* ───── Récupération des boutiques du tenant pour affectation ───── */

export async function getTenantStoresForSelect(): Promise<
  ActionResponse<Array<{ id: string; designation: string }>>
> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const stores = await Store.find({
      tenantId,
      status: { $in: ["ACTIVE", "PENDING_PAYMENT"] },
    })
      .select("_id designation")
      .sort({ designation: 1 })
      .lean();

    return {
      success: true,
      message: "Boutiques recuperees.",
      data: stores.map((s) => ({
        id: s._id.toString(),
        designation: s.designation,
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur boutiques." };
  }
}
