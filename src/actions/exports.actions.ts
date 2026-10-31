"use server";

import { requireSubscriptionFeature } from "@/lib/payments/entitlements";
import { Types } from "mongoose";
import ExcelJS from "exceljs";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";
import Creance from "@/lib/models/Creance";
import Dette from "@/lib/models/Dette";
import Store from "@/lib/models/Store";
import Product from "@/lib/models/Product";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { Tenant } from "@/lib/models/User";

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
    await requireSubscriptionFeature(tenantId, "advancedReports");
    await connectToDb();

    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const annee = await Annee.findOne({ _id: anneeId, tenantId }).lean();
    if (!annee) {
      return { success: false, message: "Exercice introuvable." };
    }

    const tenant = await Tenant.findById(tenantId)
      .select("designation")
      .lean();

    const tenantOid = new Types.ObjectId(tenantId);
    const anneeOid = new Types.ObjectId(anneeId);

    /* Données */
    const commandes = await Commande.find({
      tenantId: tenantOid,
      anneeId: anneeOid,
      status: { $nin: ["CANCELLED", "DRAFT"] },
    })
      .populate("shopId", "designation")
      .populate("clientId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const depenses = await Depense.find({ tenantId: tenantOid, anneeId: anneeOid, status: { $nin: ["REJECTED", "CANCELLED"] } })
      .populate("shopId", "designation")
      .populate("agentId", "pseudo")
      .sort({ createdAt: -1 })
      .lean();

    const stores = await Store.find({ tenantId: tenantOid })
      .select("designation")
      .lean();

    const totals = ["USD", "CDF"].map(currency => ({
      currency,
      recettes: commandes.filter(order => order.currency === currency).reduce((sum, order) => sum + order.totalAmount, 0),
      depenses: depenses.filter(expense => expense.currency === currency).reduce((sum, expense) => sum + expense.depenses.filter(line => line.status !== "REJECTED").reduce((lineSum, line) => lineSum + line.amount, 0), 0),
    }));

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
    for (const total of totals) {
      sheet1.addRow([`Recettes (${total.currency})`, formatCurrency(total.recettes, total.currency)]);
      sheet1.addRow([`Dépenses (${total.currency})`, formatCurrency(total.depenses, total.currency)]);
      sheet1.addRow([`Solde enregistré (${total.currency})`, formatCurrency(total.recettes - total.depenses, total.currency)]);
    }
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

    commandes.forEach(c => {
      sheet2.addRow({ date: formatDate(c.createdAt), type: "RECETTE", reference: c.reference,
        boutique: (c.shopId as unknown as { designation?: string })?.designation ?? "", agent: "",
        libelle: `Commande ${c.reference}`, montant: c.totalAmount, devise: c.currency, statut: c.status });
    });

    depenses.forEach((d) => {
      const items = d.depenses || [];
      items.forEach((item) => {
        if (item.status === "REJECTED") return;
        sheet2.addRow({
          date: formatDate(d.createdAt),
          type: "DEPENSE",
          reference: d.reference,
          boutique: (d.shopId as unknown as { designation?: string })?.designation ?? "",
          agent: (d.agentId as unknown as { pseudo?: string })?.pseudo ?? "",
          libelle: item.libelle,
          montant: item.amount,
          devise: d.currency,
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
          boutique: (c.shopId as unknown as { designation?: string })?.designation ?? "",
          client: (c.clientId as unknown as { name?: string })?.name ?? "",
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
          boutique: (d.shopId as unknown as { designation?: string })?.designation ?? "",
          agent: (d.agentId as unknown as { pseudo?: string })?.pseudo ?? "",
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
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur export.") };
  }
}

/* ───── Export ventes d'un produit ───── */

export async function exportProductSales(
  productId: string
): Promise<ActionResponse<{ buffer: number[]; filename: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await requireSubscriptionFeature(tenantId, "advancedReports");
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
      { $match: { tenantId: new Types.ObjectId(tenantId), "commandes.product": productOid, status: { $nin: ["CANCELLED", "DRAFT"] } } },
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
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur export.") };
  }
}

/* ───── Export dossier financement PDF ───── */

export async function exportDossierFinancement(
  anneeId: string
): Promise<ActionResponse<{ buffer: number[]; filename: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await requireSubscriptionFeature(tenantId, "advancedReports");
    await connectToDb();

    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const tenantOid = new Types.ObjectId(tenantId);
    const anneeOid = new Types.ObjectId(anneeId);

    const annee = await Annee.findOne({ _id: anneeOid, tenantId }).lean();
    if (!annee) return { success: false, message: "Exercice introuvable." };

    const tenant = await Tenant.findById(tenantOid).select("designation logo").lean();

    const [commandesByMonth, depensesByMonth, top10Commandes, creancesTotal, dettesTotal] =
      await Promise.all([
        Commande.aggregate([
          { $match: { tenantId: tenantOid, anneeId: anneeOid, status: { $nin: ["CANCELLED", "DRAFT"] } } },
          { $group: { _id: { month: { $month: "$createdAt" }, currency: "$currency" }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
          { $sort: { "_id.month": 1 } },
        ]),
        Depense.aggregate([
          { $match: { tenantId: tenantOid, anneeId: anneeOid, status: "APPROVED" } },
          { $group: { _id: { month: { $month: "$createdAt" }, currency: "$currency" }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
          { $sort: { "_id.month": 1 } },
        ]),
        Commande.find({ tenantId: tenantOid, anneeId: anneeOid, status: { $nin: ["CANCELLED", "DRAFT"] } })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("reference totalAmount currency createdAt")
          .lean(),
        Creance.aggregate([
          { $match: { tenantId: tenantOid, anneeId: anneeOid, status: "EN_COURS" } },
          { $group: { _id: "$currency", total: { $sum: "$montant" }, count: { $sum: 1 } } },
        ]),
        Dette.aggregate([
          { $match: { tenantId: tenantOid, anneeId: anneeOid, status: "EN_COURS" } },
          { $group: { _id: "$currency", total: { $sum: "$montant" }, count: { $sum: 1 } } },
        ]),
      ]);

    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

    const months = ["USD", "CDF"].flatMap(currency => Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const ca = commandesByMonth.find((r) => r._id.month === m && r._id.currency === currency)?.total ?? 0;
      const dep = depensesByMonth.find((r) => r._id.month === m && r._id.currency === currency)?.total ?? 0;
      return { label: `${monthNames[i]} (${currency})`, ca, dep, result: ca - dep, currency };
    }));

    const totals = ["USD", "CDF"].map(currency => {
      const rows = months.filter(month => month.currency === currency);
      const ca = rows.reduce((sum, month) => sum + month.ca, 0);
      const dep = rows.reduce((sum, month) => sum + month.dep, 0);
      return { currency, ca, dep, result: ca - dep };
    });

    const pdfmake = (await import("pdfmake")).default;
    const fonts = {
      Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };
    pdfmake.addFonts(fonts);
    pdfmake.setUrlAccessPolicy(() => false);
    pdfmake.setLocalAccessPolicy(path => ["Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique"].includes(path));

    const docDefinition: TDocumentDefinitions = {
      defaultStyle: { font: "Helvetica", fontSize: 10 },
      pageMargins: [40, 60, 40, 60],
      content: [
        { text: tenant?.designation ?? "ELMES-TEKA", style: "title" },
        { text: "Dossier de Financement", style: "subtitle" },
        { text: `Exercice : ${formatDate(annee.debut)} — ${formatDate(annee.fin)}`, style: "meta" },
        { text: `Généré le ${formatDate(new Date())}`, style: "meta" },
        { text: " " },
        { text: "1. Opérations mensuelles par devise (sans conversion)", style: "sectionTitle" },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "*", "*"],
            body: [
              [
                { text: "Mois", bold: true },
                { text: "Recettes", bold: true },
                { text: "Dépenses", bold: true },
                { text: "Solde des opérations", bold: true },
              ],
              ...months.map((m) => [
                m.label,
                m.ca.toLocaleString("fr-FR"),
                m.dep.toLocaleString("fr-FR"),
                { text: m.result.toLocaleString("fr-FR"), color: m.result < 0 ? "#dc2626" : "#16a34a" },
              ]),
              ...totals.map(total => [
                { text: `TOTAL (${total.currency})`, bold: true },
                { text: total.ca.toLocaleString("fr-FR"), bold: true },
                { text: total.dep.toLocaleString("fr-FR"), bold: true },
                { text: total.result.toLocaleString("fr-FR"), bold: true },
              ]),
            ],
          },
          layout: "lightHorizontalLines",
        },
        { text: " " },
        { text: "2. Dix dernières ventes de l’exercice", style: "sectionTitle" },
        {
          table: {
            headerRows: 1,
            widths: ["*", 120, 60, 100],
            body: [
              [
                { text: "Référence", bold: true },
                { text: "Date", bold: true },
                { text: "Devise", bold: true },
                { text: "Montant", bold: true },
              ],
              ...top10Commandes.map((c) => [
                c.reference,
                formatDate(c.createdAt),
                c.currency,
                c.totalAmount.toLocaleString("fr-FR"),
              ]),
            ],
          },
          layout: "lightHorizontalLines",
        },
        { text: " " },
        { text: "3. Créances et dettes en cours", style: "sectionTitle" },
        {
          ul: [
            ...creancesTotal.map((r: { _id: string; total: number; count: number }) => `Créances (${r._id}) : ${r.total.toLocaleString("fr-FR")} — ${r.count} dossier(s)`),
            ...(creancesTotal.length === 0 ? ["Aucune créance en cours"] : []),
            ...dettesTotal.map((r: { _id: string; total: number; count: number }) => `Dettes (${r._id}) : ${r.total.toLocaleString("fr-FR")} — ${r.count} dossier(s)`),
            ...(dettesTotal.length === 0 ? ["Aucune dette en cours"] : []),
          ],
        },
        { text: " " },
        { text: "Récapitulatif des opérations enregistrées. Le solde présenté n’est ni un bénéfice net, ni une capacité de remboursement. Aucun score ou accord de crédit n’est calculé par ce document.", style: "footer" },
      ],
      styles: {
        title: { fontSize: 18, bold: true, margin: [0, 0, 0, 4] },
        subtitle: { fontSize: 14, color: "#465FFF", margin: [0, 0, 0, 6] },
        meta: { fontSize: 9, color: "#6b7280", margin: [0, 0, 0, 2] },
        sectionTitle: { fontSize: 12, bold: true, margin: [0, 10, 0, 6], color: "#374151" },
        footer: { fontSize: 8, color: "#9ca3af", italics: true },
      },
    };

    const buffer = await pdfmake.createPdf(docDefinition).getBuffer();
    const filename = `dossier-financement-${annee.slug}-elmes-teka.pdf`;

    return {
      success: true,
      message: "Dossier PDF généré.",
      data: { buffer: Array.from(new Uint8Array(buffer)), filename },
    };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur génération PDF.") };
  }
}