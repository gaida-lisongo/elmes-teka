"use server";

import { Types } from "mongoose";
import ExcelJS from "exceljs";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";
import Store from "@/lib/models/Store";
import Product from "@/lib/models/Product";
import { Saler, Tenant } from "@/lib/models/User";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

/* ───── Utilitaires Excel ───── */

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string): string {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

function applyHeaderStyle(worksheet: ExcelJS.Worksheet, row: number) {
  const headerRow = worksheet.getRow(row);
  headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF465FFF" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

function applyTotalStyle(worksheet: ExcelJS.Worksheet, row: number) {
  const totalRow = worksheet.getRow(row);
  totalRow.font = { bold: true, size: 11 };
  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: "double" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

/* ───── Export journal d'exercice ───── */

export async function exportAnneeJournal(
  anneeId: string
): Promise<ActionResponse<{ buffer: number[]; filename: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const annee = await Annee.findOne({ _id: anneeId, tenantId }).lean();
    if (!annee) {
      return { success: false, message: "Exercice introuvable." };
    }

    const tenant = await Tenant.findOne({ userId: new Types.ObjectId(tenantId) })
      .select("designation")
      .lean();

    const tenantOid = new Types.ObjectId(tenantId);
    const anneeOid = new Types.ObjectId(anneeId);

    /* Données */
    const commandes = await Commande.find({
      anneeId: anneeOid,
      status: { $nin: ["CANCELLED", "DRAFT"] },
    })
      .populate("shopId", "designation")
      .populate("clientId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const depenses = await Depense.find({ anneeId: anneeOid })
      .populate("shopId", "designation")
      .populate("agentId", "pseudo")
      .sort({ createdAt: -1 })
      .lean();

    const stores = await Store.find({ tenantId: tenantOid })
      .select("designation")
      .lean();

    const totalRecettes = commandes.reduce((sum, c) => {
      const items = c.commandes || [];
      return sum + items.reduce((s, i) => s + i.qte, 0);
    }, 0);

    const totalDepenses = depenses.reduce((sum, d) => {
      const items = d.depenses || [];
      return sum + items.filter((i) => i.status !== "REJECTED").reduce((s, i) => s + i.amount, 0);
    }, 0);

    const workbook = new ExcelJS.Workbook();
    const filename = `journal-exercice-${annee.slug}-elmes-teka.xlsx`;

    /* ─── Feuille 1: Synthèse ─── */
    const sheet1 = workbook.addWorksheet("Synthèse");
    sheet1.columns = [
      { header: "Rubrique", key: "rubrique", width: 30 },
      { header: "Valeur", key: "valeur", width: 40 },
    ];

    sheet1.addRow(["Designation", tenant?.designation ?? ""]);
    sheet1.addRow(["Exercice", `${formatDate(annee.debut)} - ${formatDate(annee.fin)}`]);
    sheet1.addRow(["Date de generation", formatDate(new Date())]);
    sheet1.addRow([]);
    sheet1.addRow(["Total Recettes", formatCurrency(totalRecettes, "CDF")]);
    sheet1.addRow(["Total Depenses", formatCurrency(totalDepenses, "CDF")]);
    sheet1.addRow(["Resultat", formatCurrency(totalRecettes - totalDepenses, "CDF")]);
    sheet1.addRow([]);
    sheet1.addRow(["Nombre de transactions", commandes.length + depenses.length]);
    sheet1.addRow(["Boutiques concernees", stores.length]);
    applyHeaderStyle(sheet1, 1);

    /* ─── Feuille 2: Journal ─── */
    const sheet2 = workbook.addWorksheet("Journal");
    sheet2.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Type", key: "type", width: 12 },
      { header: "Reference", key: "reference", width: 20 },
      { header: "Boutique", key: "boutique", width: 20 },
      { header: "Agent", key: "agent", width: 20 },
      { header: "Libelle", key: "libelle", width: 30 },
      { header: "Montant", key: "montant", width: 16 },
      { header: "Devise", key: "devise", width: 8 },
      { header: "Statut", key: "statut", width: 14 },
    ];
    applyHeaderStyle(sheet2, 1);

    commandes.forEach((c) => {
      const items = c.commandes || [];
      items.forEach((item) => {
        sheet2.addRow({
          date: formatDate(c.createdAt),
          type: "RECETTE",
          reference: c.reference,
          boutique: (c.shopId as any)?.designation ?? "",
          agent: "",
          libelle: `Commande ${c.reference}`,
          montant: item.qte,
          devise: c.currency,
          statut: c.status,
        });
      });
    });

    depenses.forEach((d) => {
      const items = d.depenses || [];
      items.forEach((item) => {
        if (item.status === "REJECTED") return;
        sheet2.addRow({
          date: formatDate(d.createdAt),
          type: "DEPENSE",
          reference: d.reference,
          boutique: (d.shopId as any)?.designation ?? "",
          agent: (d.agentId as any)?.pseudo ?? "",
          libelle: item.libelle,
          montant: item.amount,
          devise: "CDF",
          statut: item.status,
        });
      });
    });

    sheet2.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 9 },
    };

    /* ─── Feuille 3: Recettes ─── */
    const sheet3 = workbook.addWorksheet("Recettes");
    sheet3.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Reference", key: "reference", width: 20 },
      { header: "Boutique", key: "boutique", width: 20 },
      { header: "Client", key: "client", width: 20 },
      { header: "Quantite", key: "qte", width: 10 },
      { header: "Devise", key: "devise", width: 8 },
      { header: "Statut", key: "statut", width: 14 },
    ];
    applyHeaderStyle(sheet3, 1);

    commandes.forEach((c) => {
      const items = c.commandes || [];
      items.forEach((item) => {
        sheet3.addRow({
          date: formatDate(c.createdAt),
          reference: c.reference,
          boutique: (c.shopId as any)?.designation ?? "",
          client: (c.clientId as any)?.name ?? "",
          qte: item.qte,
          devise: c.currency,
          statut: c.status,
        });
      });
    });

    /* ─── Feuille 4: Depenses ─── */
    const sheet4 = workbook.addWorksheet("Depenses");
    sheet4.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Reference", key: "reference", width: 20 },
      { header: "Boutique", key: "boutique", width: 20 },
      { header: "Agent", key: "agent", width: 20 },
      { header: "Libelle", key: "libelle", width: 30 },
      { header: "Montant", key: "montant", width: 16 },
      { header: "Statut", key: "statut", width: 14 },
      { header: "Observation", key: "observation", width: 30 },
    ];
    applyHeaderStyle(sheet4, 1);

    depenses.forEach((d) => {
      const items = d.depenses || [];
      items.forEach((item) => {
        if (item.status === "REJECTED") return;
        sheet4.addRow({
          date: formatDate(d.createdAt),
          reference: d.reference,
          boutique: (d.shopId as any)?.designation ?? "",
          agent: (d.agentId as any)?.pseudo ?? "",
          libelle: item.libelle,
          montant: item.amount,
          statut: item.status,
          observation: item.observation ?? "",
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      success: true,
      message: "Journal genere.",
      data: { buffer: Array.from(new Uint8Array(buffer)), filename },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur export." };
  }
}

/* ───── Export ventes d'un produit ───── */

export async function exportProductSales(
  productId: string
): Promise<ActionResponse<{ buffer: number[]; filename: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(productId)) {
      return { success: false, message: "Produit invalide." };
    }

    const product = await Product.findOne({ _id: productId, tenantId }).lean();
    if (!product) {
      return { success: false, message: "Produit introuvable." };
    }

    const productOid = new Types.ObjectId(productId);

    /* Récupérer les commandes contenant ce produit */
    const commandes = await Commande.aggregate([
      { $unwind: "$commandes" },
      { $match: { "commandes.product": productOid, status: { $nin: ["CANCELLED", "DRAFT"] } } },
      {
        $lookup: {
          from: "stores",
          localField: "shopId",
          foreignField: "_id",
          as: "_store",
        },
      },
      { $unwind: { path: "$_store", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "customers",
          localField: "clientId",
          foreignField: "_id",
          as: "_client",
        },
      },
      { $unwind: { path: "$_client", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "annees",
          localField: "anneeId",
          foreignField: "_id",
          as: "_annee",
        },
      },
      { $unwind: { path: "$_annee", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
    ]);

    const totalQte = commandes.reduce((sum, c) => sum + (c.commandes?.qte ?? 0), 0);
    const totalCommandes = commandes.length;
    const storesSet = new Set(commandes.map((c) => c._store?.designation).filter(Boolean));

    const workbook = new ExcelJS.Workbook();
    const filename = `ventes-${product.code}-elmes-teka.xlsx`;

    /* Feuille Synthèse */
    const sheet1 = workbook.addWorksheet("Synthese");
    sheet1.columns = [
      { header: "Rubrique", key: "rubrique", width: 30 },
      { header: "Valeur", key: "valeur", width: 30 },
    ];

    sheet1.addRow(["Produit", product.designation]);
    sheet1.addRow(["Code", product.code]);
    sheet1.addRow(["Date de generation", formatDate(new Date())]);
    sheet1.addRow([]);
    sheet1.addRow(["Quantite totale vendue", totalQte]);
    sheet1.addRow(["Nombre de commandes", totalCommandes]);
    sheet1.addRow(["Boutiques concernees", storesSet.size]);
    applyHeaderStyle(sheet1, 1);

    /* Feuille Ventes */
    const sheet2 = workbook.addWorksheet("Ventes");
    sheet2.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Reference commande", key: "reference", width: 20 },
      { header: "Exercice", key: "exercice", width: 14 },
      { header: "Boutique", key: "boutique", width: 20 },
      { header: "Client", key: "client", width: 20 },
      { header: "Quantite", key: "qte", width: 10 },
      { header: "Devise", key: "devise", width: 8 },
      { header: "Statut", key: "statut", width: 14 },
    ];
    applyHeaderStyle(sheet2, 1);

    commandes.forEach((c) => {
      sheet2.addRow({
        date: formatDate(new Date(c.createdAt)),
        reference: c.reference,
        exercice: c._annee?.slug ?? "",
        boutique: c._store?.designation ?? "",
        client: c._client?.name ?? "",
        qte: c.commandes?.qte ?? 0,
        devise: c.currency,
        statut: c.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      success: true,
      message: "Export genere.",
      data: { buffer: Array.from(new Uint8Array(buffer)), filename },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur export." };
  }
}