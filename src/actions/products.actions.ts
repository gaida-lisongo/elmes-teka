"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { randomBytes } from "node:crypto";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Product from "@/lib/models/Product";
import Commande from "@/lib/models/Commande";
import Stock from "@/lib/models/Stock";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

/* ───── Types ───── */

export interface ProductListItem {
  id: string;
  designation: string;
  categorie: string;
  code: string;
  status: string;
  photos: Array<{ title: string; url: string }>;
  price: Array<{ amount: number; currency: string }>;
  description: Array<{ title: string; content: string }>;
  createdAt: string;
  totalVendu: number;
  chiffreAffaires: number;
  nbStocks: number;
}

export interface ProductMetrics {
  total: number;
  actifs: number;
  inactifs: number;
  chiffreAffaires: number;
  plusVendu: { designation: string; total: number } | null;
}

export interface PaginatedProducts {
  items: ProductListItem[];
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

export async function getProductMetrics(): Promise<ActionResponse<ProductMetrics>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const tenantOid = new Types.ObjectId(tenantId);

    const [counts] = await Product.aggregate([
      { $match: { tenantId: tenantOid } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          actifs: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
          inactifs: { $sum: { $cond: [{ $eq: ["$status", "INACTIVE"] }, 1, 0] } },
        },
      },
    ]);

    /* Produit le plus vendu via les commandes du tenant */
    const [topProduct] = await Commande.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "commandes.product",
          foreignField: "_id",
          as: "_products",
        },
      },
      { $unwind: "$commandes" },
      {
        $lookup: {
          from: "products",
          localField: "commandes.product",
          foreignField: "_id",
          as: "_product",
        },
      },
      { $unwind: "$_product" },
      { $match: { "_product.tenantId": tenantOid, status: { $nin: ["CANCELLED", "DRAFT"] } } },
      {
        $group: {
          _id: "$_product._id",
          designation: { $first: "$_product.designation" },
          total: { $sum: "$commandes.qte" },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    return {
      success: true,
      message: "Metriques recuperees.",
      data: {
        total: counts?.total ?? 0,
        actifs: counts?.actifs ?? 0,
        inactifs: counts?.inactifs ?? 0,
        chiffreAffaires: topProduct?.total ?? 0,
        plusVendu: topProduct
          ? { designation: topProduct.designation, total: topProduct.total }
          : null,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur metriques." };
  }
}

/* ───── Liste paginée ───── */

export async function getProducts(
  page: number = 1,
  limit: number = 12,
  search: string = "",
  status: string = ""
): Promise<ActionResponse<PaginatedProducts>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const safePage = Math.max(1, Math.min(page, 100));
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const skip = (safePage - 1) * safeLimit;

    const tenantOid = new Types.ObjectId(tenantId);

    const match: Record<string, unknown> = { tenantId: tenantOid };
    if (status && ["ACTIVE", "INACTIVE", "ARCHIVED"].includes(status)) {
      match.status = status;
    }
    if (search && search.length >= 2) {
      const escaped = escapeRegExp(search.slice(0, 80));
      match.$or = [
        { designation: { $regex: escaped, $options: "i" } },
        { code: { $regex: escaped, $options: "i" } },
        { categorie: { $regex: escaped, $options: "i" } },
      ];
    }

    const [totalResult] = await Product.aggregate([
      { $match: { tenantId: tenantOid } },
      { $count: "total" },
    ]);

    const total = totalResult?.total ?? 0;
    const totalPages = Math.ceil(total / safeLimit) || 1;

    const products = await Product.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const items = await Promise.all(
      products.map(async (product) => {
        const productOid = product._id;

        const [ventesAgg] = await Commande.aggregate([
          { $unwind: "$commandes" },
          {
            $match: {
              "commandes.product": productOid,
              status: { $nin: ["CANCELLED", "DRAFT"] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$commandes.qte" },
            },
          },
        ]);

        const [stockCount] = await Stock.aggregate([
          { $unwind: "$stocks" },
          { $match: { "stocks.product": productOid } },
          { $count: "count" },
        ]);

        return {
          id: product._id.toString(),
          designation: product.designation,
          categorie: product.categorie,
          code: product.code,
          status: product.status,
          photos: product.photos ?? [],
          price: product.price ?? [],
          description: product.description ?? [],
          createdAt: product.createdAt.toISOString(),
          totalVendu: ventesAgg?.total ?? 0,
          chiffreAffaires: 0,
          nbStocks: stockCount?.count ?? 0,
        };
      })
    );

    return {
      success: true,
      message: "Liste recuperee.",
      data: { items, total, page: safePage, limit: safeLimit, totalPages },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur liste." };
  }
}

/* ───── Création ───── */

export async function createProduct(input: {
  designation: string;
  categorie: string;
  code: string;
  price: Array<{ amount: number; currency: string }>;
  photos?: Array<{ title: string; url: string }>;
  description?: Array<{ title: string; content: string }>;
  status?: string;
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const errors: Record<string, string> = {};

    if (!input.designation || input.designation.trim().length < 2) {
      errors.designation = "La designation est requise.";
    }
    if (!input.categorie || input.categorie.trim().length < 2) {
      errors.categorie = "La categorie est requise.";
    }
    if (!input.code || input.code.trim().length < 2) {
      errors.code = "Le code est requis.";
    }
    if (!input.price || input.price.length === 0) {
      errors.price = "Au moins un prix est requis.";
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    /* Vérifier unicité du code */
    const existing = await Product.findOne({
      tenantId: new Types.ObjectId(tenantId),
      code: input.code.trim().toUpperCase(),
    }).lean();

    if (existing) {
      return { success: false, message: "Un produit avec ce code existe deja." };
    }

    const product = await Product.create({
      tenantId: new Types.ObjectId(tenantId),
      designation: input.designation.trim(),
      categorie: input.categorie.trim(),
      code: input.code.trim().toUpperCase(),
      price: input.price,
      photos: input.photos ?? [],
      description: input.description ?? [],
      status: input.status || "ACTIVE",
    });

    revalidatePath("/products");

    return {
      success: true,
      message: "Produit cree.",
      data: { id: product._id.toString() },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation." };
  }
}

/* ───── Modification ───── */

export async function updateProduct(
  id: string,
  input: {
    designation?: string;
    categorie?: string;
    code?: string;
    price?: Array<{ amount: number; currency: string }>;
    photos?: Array<{ title: string; url: string }>;
    description?: Array<{ title: string; content: string }>;
    status?: string;
  }
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const product = await Product.findOne({ _id: id, tenantId }).lean();
    if (!product) {
      return { success: false, message: "Produit introuvable." };
    }

    const update: Record<string, unknown> = {};
    if (input.designation) update.designation = input.designation.trim();
    if (input.categorie) update.categorie = input.categorie.trim();
    if (input.code) update.code = input.code.trim().toUpperCase();
    if (input.price) update.price = input.price;
    if (input.photos) update.photos = input.photos;
    if (input.description) update.description = input.description;
    if (input.status) update.status = input.status;

    await Product.updateOne({ _id: id }, { $set: update });

    revalidatePath("/products");

    return { success: true, message: "Produit mis a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur modification." };
  }
}

/* ───── Suppression / Archivage ───── */

export async function archiveProduct(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const product = await Product.findOne({ _id: id, tenantId }).lean();
    if (!product) {
      return { success: false, message: "Produit introuvable." };
    }

    await Product.updateOne(
      { _id: id },
      { $set: { status: "ARCHIVED" } }
    );

    revalidatePath("/products");

    return { success: true, message: "Produit archive.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur archivage." };
  }
}

export async function deleteProduct(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const product = await Product.findOne({ _id: id, tenantId }).lean();
    if (!product) {
      return { success: false, message: "Produit introuvable." };
    }

    await Product.deleteOne({ _id: id });

    revalidatePath("/products");

    return { success: true, message: "Produit supprime.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression." };
  }
}