import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { getAgentSession } from "@/lib/agent/auth";
import connectToDb from "@/lib/utils/db";
import { Tenant, Saler } from "@/lib/models/User";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";
import Product from "@/lib/models/Product";
import Customer from "@/lib/models/Customer";
import Immobilisation from "@/lib/models/Immobilisation";
import Liquidite from "@/lib/models/Liquidite";
import Fonds from "@/lib/models/Fonds";
import Dette from "@/lib/models/Dette";
import Creance from "@/lib/models/Creance";
import Stock from "@/lib/models/Stock";
import Commande from "@/lib/models/Commande";

const uid = () => randomBytes(4).toString("hex").toUpperCase();
const ref = (p: string) => `${p}-${uid()}`;

function ago(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
function from(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(request: NextRequest) {
  try {
    const session = getAgentSession(request);
    if (!session || session.accountType !== "TENANT" || !session.tenantId) {
      return NextResponse.json({ error: "TENANT session required" }, { status: 401 });
    }

    await connectToDb();

    const tenantId = new Types.ObjectId(session.tenantId);
    const agentUserId = new Types.ObjectId(session.userId);

    const tenant = await Tenant.findById(tenantId).select("_id status").lean();
    if (!tenant || tenant.status !== "ACTIVE") {
      return NextResponse.json({ error: "Tenant not active" }, { status: 403 });
    }

    /* ── Boutique principale ── */
    const store1 = await Store.findOne({ tenantId }).sort({ createdAt: 1 }).lean();
    if (!store1) return NextResponse.json({ error: "No store found" }, { status: 404 });
    const shopId = new Types.ObjectId(store1._id.toString());

    /* ── Exercice 2026 principal ── */
    const annee2026 = await Annee.findOne({ tenantId, status: "ACTIVE" }).lean();
    if (!annee2026) return NextResponse.json({ error: "No active annee found" }, { status: 404 });
    const anneeId = new Types.ObjectId(annee2026._id.toString());

    /* ── Saler pour les commandes ── */
    const saler = await Saler.findOne({ tenantId }).select("_id userId storeId").lean();
    if (!saler) return NextResponse.json({ error: "No saler found" }, { status: 404 });
    const salerId = new Types.ObjectId(saler._id.toString());
    const salerShopId = saler.storeId
      ? new Types.ObjectId(saler.storeId.toString())
      : shopId;

    /* ═══════════════════════════════════════
       NETTOYAGE des données de démo existantes
    ═══════════════════════════════════════ */
    await Promise.all([
      Product.deleteMany({ tenantId }),
      Customer.deleteMany({ tenantId }),
      Immobilisation.deleteMany({ tenantId }),
      Liquidite.deleteMany({ tenantId }),
      Fonds.deleteMany({ tenantId }),
      Dette.deleteMany({ tenantId }),
      Creance.deleteMany({ tenantId }),
      Stock.deleteMany({ shopId }),
      Commande.deleteMany({ tenantId }),
      Store.deleteMany({ tenantId, reference: { $ne: store1.reference } }),
    ]);

    /* ═══════════════════════════════════════
       1. DEUXIÈME BOUTIQUE
    ═══════════════════════════════════════ */
    const store2 = await Store.create({
      tenantId,
      designation: "Agence Gombe",
      description: "Point de vente centre-ville Gombe.",
      reference: ref("STR"),
      status: "ACTIVE",
      coordonnes: [{ title: "Adresse", content: "Av. du Commerce 12, Gombe, Kinshasa" }],
      capitals: [],
      caisses: [],
      photos: [],
    });
    await Tenant.updateOne({ _id: tenantId }, { $addToSet: { storesId: store2._id } });
    const shopId2 = new Types.ObjectId(store2._id.toString());

    /* ═══════════════════════════════════════
       2. EXERCICE 2025 (historique)
    ═══════════════════════════════════════ */
    const annee2025 = await Annee.findOneAndUpdate(
      { tenantId, slug: "2025" },
      {
        $setOnInsert: {
          tenantId,
          debut: new Date("2025-01-01"),
          fin: new Date("2025-12-31"),
          slug: "2025",
          status: "COMPLETED",
          provider: {
            name: "FLEXPAY",
            orderNumber: `AGT-${uid()}`,
            message: "Exercice 2025 cloturé",
            status: "PAID",
            amount: 10,
            currency: "USD",
            paidAt: new Date("2025-01-01"),
          },
        },
      },
      { upsert: true, new: true }
    ).lean();
    const anneeId2025 = new Types.ObjectId(annee2025!._id.toString());

    /* ═══════════════════════════════════════
       3. PRODUITS (batch)
    ═══════════════════════════════════════ */
    const productsRaw = [
      { designation: "Téléphone Samsung Galaxy A54", categorie: "Électronique", usd: 320, cdf: 928000 },
      { designation: "Laptop HP ProBook 450 G9", categorie: "Informatique", usd: 750, cdf: 2175000 },
      { designation: "Imprimante Canon PIXMA MG3650", categorie: "Informatique", usd: 180, cdf: 522000 },
      { designation: "Climatiseur LG 12000 BTU", categorie: "Électroménager", usd: 420, cdf: 1218000 },
      { designation: "Groupe électrogène 5 KVA", categorie: "Énergie", usd: 850, cdf: 2465000 },
      { designation: "Chaise de bureau ergonomique", categorie: "Mobilier", usd: 95, cdf: 275500 },
      { designation: "Bureau en bois 140cm", categorie: "Mobilier", usd: 210, cdf: 609000 },
      { designation: "Cartouche d'encre HP 305XL", categorie: "Fournitures", usd: 25, cdf: 72500 },
      { designation: "Rame de papier A4 500 feuilles", categorie: "Fournitures", usd: 12, cdf: 34800 },
      { designation: "Modem 4G LTE Huawei B315", categorie: "Réseau", usd: 65, cdf: 188500 },
    ];
    const productsInserted = await Product.insertMany(
      productsRaw.map((p) => ({
        tenantId,
        designation: p.designation,
        categorie: p.categorie,
        code: ref("PRD"),
        price: [
          { amount: p.usd, currency: "USD" },
          { amount: p.cdf, currency: "CDF" },
        ],
        photos: [],
        description: [],
        status: "ACTIVE",
      }))
    );
    const pIds = productsInserted.map((p) => p._id as Types.ObjectId);

    /* ═══════════════════════════════════════
       4. CLIENTS (batch)
    ═══════════════════════════════════════ */
    const customersRaw = [
      { name: "SARL ELEC-CONGO", phone: "+243812340001", email: "contact@elec-congo.cd" },
      { name: "Jean-Baptiste Mukendi", phone: "+243812340002", email: "jb.mukendi@gmail.com" },
      { name: "Marie-Claire Nsimba", phone: "+243812340003" },
      { name: "Entreprise BÂTI-KIN", phone: "+243812340004", email: "info@batkin.cd" },
      { name: "Patrick Lufungula", phone: "+243812340005" },
      { name: "Pharmacie Centrale Kinshasa", phone: "+243812340006", email: "pharma.centrale@cd.cd" },
      { name: "École Saint-Joseph", phone: "+243812340007" },
      { name: "Hôtel Grand Palace", phone: "+243812340008", email: "reservations@grandpalace.cd" },
    ];
    const customersInserted = await Customer.insertMany(
      customersRaw.map((c) => ({ tenantId, name: c.name, phone: c.phone, email: c.email }))
    );
    const cIds = customersInserted.map((c) => c._id as Types.ObjectId);

    /* ═══════════════════════════════════════
       5. DONNÉES FINANCIÈRES (parallèle)
    ═══════════════════════════════════════ */
    // diagnostic guard — should never trigger if ObjectId construction worked
    if (!shopId || !shopId2 || !anneeId || !agentUserId) {
      return NextResponse.json({
        error: "diagnostic: null ObjectId",
        shopId: shopId?.toString(),
        shopId2: shopId2?.toString(),
        anneeId: anneeId?.toString(),
        agentUserId: agentUserId?.toString(),
      }, { status: 500 });
    }

    await Promise.all([
      /* Immobilisations */
      Immobilisation.insertMany([
        { tenantId, shopId, anneeId, agentId: agentUserId, designation: "Véhicule Toyota Hilux DC", categorie: "VEHICULE", valeurAchat: 35000, dureeVieAns: 10, dateAcquisition: ago(180), reference: ref("IMM"), status: "ACTIF", description: "" },
        { tenantId, shopId, anneeId, agentId: agentUserId, designation: "Groupe électrogène 20 KVA Cummins", categorie: "MATERIEL", valeurAchat: 12000, dureeVieAns: 8, dateAcquisition: ago(365), reference: ref("IMM"), status: "ACTIF", description: "" },
        { tenantId, shopId, anneeId, agentId: agentUserId, designation: "Climatiseurs bureaux (×4)", categorie: "MATERIEL", valeurAchat: 3200, dureeVieAns: 7, dateAcquisition: ago(90), reference: ref("IMM"), status: "ACTIF", description: "" },
        { tenantId, shopId, anneeId, agentId: agentUserId, designation: "Mobilier de bureau complet", categorie: "MOBILIER", valeurAchat: 8500, dureeVieAns: 10, dateAcquisition: ago(200), reference: ref("IMM"), status: "ACTIF", description: "" },
        { tenantId, shopId, anneeId, agentId: agentUserId, designation: "Serveur Dell PowerEdge R640", categorie: "MATERIEL", valeurAchat: 6800, dureeVieAns: 5, dateAcquisition: ago(60), reference: ref("IMM"), status: "ACTIF", description: "" },
        { tenantId, shopId: shopId2, anneeId, agentId: agentUserId, designation: "Local commercial Gombe", categorie: "IMMEUBLE", valeurAchat: 120000, dureeVieAns: 30, dateAcquisition: ago(730), reference: ref("IMM"), status: "ACTIF", description: "" },
        { tenantId, shopId: shopId2, anneeId, agentId: agentUserId, designation: "Photocopieur Xerox WorkCentre", categorie: "MATERIEL", valeurAchat: 4200, dureeVieAns: 6, dateAcquisition: ago(300), reference: ref("IMM"), status: "ACTIF", description: "" },
      ]),

      /* Fonds propres */
      Fonds.insertMany([
        { tenantId, shopId, anneeId, libelle: "Capital initial fondateurs", montant: 50000, currency: "USD", type: "APPORT", reference: ref("FND"), dateOperation: ago(300), status: "VALIDE" },
        { tenantId, shopId, anneeId, libelle: "Apport complémentaire Q1", montant: 15000, currency: "USD", type: "APPORT", reference: ref("FND"), dateOperation: ago(200), status: "VALIDE" },
        { tenantId, shopId, anneeId, libelle: "Apport en nature — matériel informatique", montant: 8500, currency: "USD", type: "APPORT", reference: ref("FND"), dateOperation: ago(150), status: "VALIDE" },
        { tenantId, shopId, anneeId, libelle: "Retrait dividendes — associés", montant: 5000, currency: "USD", type: "RETRAIT", reference: ref("FND"), dateOperation: ago(30), status: "VALIDE" },
        { tenantId, shopId, anneeId, libelle: "Apport Q3 — expansion Agence Gombe", montant: 20000, currency: "USD", type: "APPORT", reference: ref("FND"), dateOperation: ago(60), status: "VALIDE" },
      ]),

      /* Liquidités (journal de caisse) */
      Liquidite.insertMany([
        { tenantId, shopId, anneeId, agentId: agentUserId, libelle: "Vente matériel informatique — SARL ELEC-CONGO", montant: 4750, currency: "USD", type: "ENTREE", reference: ref("LIQ"), dateOperation: ago(5), status: "VALIDE" },
        { tenantId, shopId, anneeId, agentId: agentUserId, libelle: "Règlement facture Bâti-Kin", montant: 2300, currency: "USD", type: "ENTREE", reference: ref("LIQ"), dateOperation: ago(8), status: "VALIDE" },
        { tenantId, shopId, anneeId, agentId: agentUserId, libelle: "Paiement loyer local Gombe", montant: 1800, currency: "USD", type: "SORTIE", reference: ref("LIQ"), dateOperation: ago(3), status: "VALIDE" },
        { tenantId, shopId, anneeId, agentId: agentUserId, libelle: "Achat fournitures de bureau", montant: 450, currency: "USD", type: "SORTIE", reference: ref("LIQ"), dateOperation: ago(12), status: "VALIDE" },
        { tenantId, shopId, anneeId, agentId: agentUserId, libelle: "Encaissement ventes journalières", montant: 3200000, currency: "CDF", type: "ENTREE", reference: ref("LIQ"), dateOperation: ago(1), status: "VALIDE" },
        { tenantId, shopId, anneeId, agentId: agentUserId, libelle: "Règlement salaires personnel", montant: 5400000, currency: "CDF", type: "SORTIE", reference: ref("LIQ"), dateOperation: ago(7), status: "VALIDE" },
        { tenantId, shopId: shopId2, anneeId, agentId: agentUserId, libelle: "Vente équipements Hôtel Grand Palace", montant: 8900, currency: "USD", type: "ENTREE", reference: ref("LIQ"), dateOperation: ago(15), status: "VALIDE" },
        { tenantId, shopId: shopId2, anneeId, agentId: agentUserId, libelle: "Carburant véhicule — livraisons", montant: 350000, currency: "CDF", type: "SORTIE", reference: ref("LIQ"), dateOperation: ago(4), status: "VALIDE" },
        { tenantId, shopId: shopId2, anneeId, agentId: agentUserId, libelle: "Règlement École Saint-Joseph", montant: 1200, currency: "USD", type: "ENTREE", reference: ref("LIQ"), dateOperation: ago(20), status: "VALIDE" },
        { tenantId, shopId, anneeId, agentId: agentUserId, libelle: "Maintenance groupe électrogène", montant: 680, currency: "USD", type: "SORTIE", reference: ref("LIQ"), dateOperation: ago(10), status: "VALIDE" },
        { tenantId, shopId, anneeId, agentId: agentUserId, libelle: "Ventes comptoir — semaine S42", montant: 7600000, currency: "CDF", type: "ENTREE", reference: ref("LIQ"), dateOperation: ago(14), status: "VALIDE" },
        { tenantId, shopId: shopId2, anneeId, agentId: agentUserId, libelle: "Facture internet & téléphonie", montant: 850000, currency: "CDF", type: "SORTIE", reference: ref("LIQ"), dateOperation: ago(6), status: "VALIDE" },
      ]),

      /* Dettes */
      Dette.insertMany([
        { tenantId, shopId, anneeId, fournisseurNom: "SOTRAKIN — Transport", fournisseurTel: "+243800100001", designation: "Service livraison Q3-2026", montant: 3500, currency: "USD", dateEcheance: from(45), dateCreation: ago(20), status: "EN_COURS", reference: ref("DET") },
        { tenantId, shopId, anneeId, fournisseurNom: "ELECTROGAZ SARL", fournisseurTel: "+243800100002", designation: "Facture électricité oct-2026", montant: 1200000, currency: "CDF", dateEcheance: from(15), dateCreation: ago(5), status: "EN_COURS", reference: ref("DET") },
        { tenantId, shopId: shopId2, anneeId, fournisseurNom: "Imprimerie PRIMA", fournisseurTel: "+243800100003", designation: "Édition supports marketing 2026", montant: 2800000, currency: "CDF", dateEcheance: from(30), dateCreation: ago(10), status: "EN_COURS", reference: ref("DET") },
        { tenantId, shopId, anneeId, fournisseurNom: "Congo IT Solutions", fournisseurTel: "+243800100004", designation: "Maintenance réseau Q3", montant: 1500, currency: "USD", dateEcheance: from(20), dateCreation: ago(7), status: "EN_COURS", reference: ref("DET") },
        { tenantId, shopId: shopId2, anneeId, fournisseurNom: "SNEL — Raccordement", fournisseurTel: "+243800100005", designation: "Raccordement agence Gombe", montant: 4200, currency: "USD", dateEcheance: from(60), dateCreation: ago(3), status: "EN_COURS", reference: ref("DET") },
      ]),

      /* Créances */
      Creance.insertMany([
        { tenantId, shopId, anneeId, clientId: cIds[0], montant: 6800, currency: "USD", dateEcheance: from(30), dateCreation: ago(10), status: "EN_COURS", reference: ref("CRE") },
        { tenantId, shopId, anneeId, clientId: cIds[1], montant: 1200000, currency: "CDF", dateEcheance: from(15), dateCreation: ago(5), status: "EN_COURS", reference: ref("CRE") },
        { tenantId, shopId: shopId2, anneeId, clientId: cIds[3], montant: 4500, currency: "USD", dateEcheance: from(45), dateCreation: ago(20), status: "EN_COURS", reference: ref("CRE") },
        { tenantId, shopId: shopId2, anneeId, clientId: cIds[5], montant: 850000, currency: "CDF", dateEcheance: from(60), dateCreation: ago(3), status: "EN_COURS", reference: ref("CRE") },
        { tenantId, shopId, anneeId, clientId: cIds[7], montant: 9200, currency: "USD", dateEcheance: from(20), dateCreation: ago(8), status: "EN_COURS", reference: ref("CRE") },
      ]),

      /* Stocks */
      Stock.insertMany([
        {
          anneeId, shopId,
          designation: "Stock principal 2026",
          description: "Inventaire boutique principale — exercice 2026",
          reference: ref("STK"),
          status: "ACTIVE",
          stocks: pIds.map((pid, i) => ({ product: pid, qte: [50, 20, 35, 8, 5, 30, 15, 200, 180, 25][i] ?? 10 })),
        },
        {
          anneeId, shopId: shopId2,
          designation: "Stock Agence Gombe 2026",
          description: "Inventaire Agence Gombe — exercice 2026",
          reference: ref("STK"),
          status: "ACTIVE",
          stocks: pIds.slice(0, 6).map((pid, i) => ({ product: pid, qte: [20, 10, 15, 5, 3, 12][i] ?? 5 })),
        },
      ]),
    ]);

    /* ═══════════════════════════════════════
       6. COMMANDES 2026 (ventes)
    ═══════════════════════════════════════ */
    const commandes2026 = [
      {
        tenantId, agentId: salerId, anneeId, shopId: salerShopId,
        clientId: cIds[0], currency: "USD",
        commandes: [
          { product: pIds[0], designation: "Téléphone Samsung Galaxy A54", qte: 3, unitPrice: 320, currency: "USD", reduction: 0, total: 960 },
          { product: pIds[9], designation: "Modem 4G LTE Huawei B315", qte: 2, unitPrice: 65, currency: "USD", reduction: 0, total: 130 },
        ],
        subtotal: 1090, discountAmount: 0, totalAmount: 1090,
        status: "DELIVERED", reference: ref("CMD"),
      },
      {
        tenantId, agentId: salerId, anneeId, shopId: salerShopId,
        clientId: cIds[3], currency: "USD",
        commandes: [
          { product: pIds[1], designation: "Laptop HP ProBook 450 G9", qte: 2, unitPrice: 750, currency: "USD", reduction: 50, total: 1450 },
          { product: pIds[5], designation: "Chaise de bureau ergonomique", qte: 4, unitPrice: 95, currency: "USD", reduction: 0, total: 380 },
          { product: pIds[6], designation: "Bureau en bois 140cm", qte: 2, unitPrice: 210, currency: "USD", reduction: 0, total: 420 },
        ],
        subtotal: 2300, discountAmount: 50, totalAmount: 2250,
        status: "PAID", reference: ref("CMD"),
      },
      {
        tenantId, agentId: salerId, anneeId, shopId: salerShopId,
        clientId: cIds[7], currency: "USD",
        commandes: [
          { product: pIds[3], designation: "Climatiseur LG 12000 BTU", qte: 4, unitPrice: 420, currency: "USD", reduction: 0, total: 1680 },
          { product: pIds[2], designation: "Imprimante Canon PIXMA", qte: 2, unitPrice: 180, currency: "USD", reduction: 0, total: 360 },
        ],
        subtotal: 2040, discountAmount: 0, totalAmount: 2040,
        status: "DELIVERED", reference: ref("CMD"),
      },
      {
        tenantId, agentId: salerId, anneeId, shopId: salerShopId,
        clientId: cIds[5], currency: "CDF",
        commandes: [
          { product: pIds[7], designation: "Cartouche d'encre HP 305XL", qte: 10, unitPrice: 72500, currency: "CDF", reduction: 0, total: 725000 },
          { product: pIds[8], designation: "Rame de papier A4", qte: 20, unitPrice: 34800, currency: "CDF", reduction: 0, total: 696000 },
        ],
        subtotal: 1421000, discountAmount: 0, totalAmount: 1421000,
        status: "PAID", reference: ref("CMD"),
      },
      {
        tenantId, agentId: salerId, anneeId, shopId: salerShopId,
        clientId: cIds[2], currency: "USD",
        commandes: [
          { product: pIds[0], designation: "Téléphone Samsung Galaxy A54", qte: 1, unitPrice: 320, currency: "USD", reduction: 0, total: 320 },
        ],
        subtotal: 320, discountAmount: 0, totalAmount: 320,
        status: "CONFIRMED", reference: ref("CMD"),
      },
      {
        tenantId, agentId: salerId, anneeId, shopId: salerShopId,
        clientId: cIds[1], currency: "USD",
        commandes: [
          { product: pIds[4], designation: "Groupe électrogène 5 KVA", qte: 1, unitPrice: 850, currency: "USD", reduction: 0, total: 850 },
        ],
        subtotal: 850, discountAmount: 0, totalAmount: 850,
        status: "PENDING", reference: ref("CMD"),
      },
    ];

    /* ═══════════════════════════════════════
       7. COMMANDES 2025 (historique)
    ═══════════════════════════════════════ */
    const commandes2025 = [
      {
        tenantId, agentId: salerId, anneeId: anneeId2025, shopId: salerShopId,
        clientId: cIds[0], currency: "USD",
        commandes: [
          { product: pIds[1], designation: "Laptop HP ProBook 450 G9", qte: 5, unitPrice: 750, currency: "USD", reduction: 100, total: 3650 },
        ],
        subtotal: 3750, discountAmount: 100, totalAmount: 3650,
        status: "DELIVERED", reference: ref("CMD"),
      },
      {
        tenantId, agentId: salerId, anneeId: anneeId2025, shopId: salerShopId,
        clientId: cIds[6], currency: "CDF",
        commandes: [
          { product: pIds[8], designation: "Rame de papier A4", qte: 50, unitPrice: 34800, currency: "CDF", reduction: 0, total: 1740000 },
          { product: pIds[7], designation: "Cartouche d'encre HP 305XL", qte: 15, unitPrice: 72500, currency: "CDF", reduction: 0, total: 1087500 },
        ],
        subtotal: 2827500, discountAmount: 0, totalAmount: 2827500,
        status: "DELIVERED", reference: ref("CMD"),
      },
      {
        tenantId, agentId: salerId, anneeId: anneeId2025, shopId: salerShopId,
        clientId: cIds[4], currency: "USD",
        commandes: [
          { product: pIds[3], designation: "Climatiseur LG 12000 BTU", qte: 2, unitPrice: 420, currency: "USD", reduction: 0, total: 840 },
          { product: pIds[5], designation: "Chaise de bureau ergonomique", qte: 6, unitPrice: 95, currency: "USD", reduction: 0, total: 570 },
        ],
        subtotal: 1410, discountAmount: 0, totalAmount: 1410,
        status: "DELIVERED", reference: ref("CMD"),
      },
    ];

    await Commande.insertMany([...commandes2026, ...commandes2025]);

    return NextResponse.json({
      ok: true,
      created: {
        stores: 2,
        annees: 2,
        products: productsInserted.length,
        customers: customersInserted.length,
        immobilisations: 7,
        fonds: 5,
        liquidites: 12,
        dettes: 5,
        creances: 5,
        stocks: 2,
        commandes: commandes2026.length + commandes2025.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
