import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { getAgentSession } from "@/lib/agent/auth";
import connectToDb from "@/lib/utils/db";
import { Tenant } from "@/lib/models/User";
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

const uid = () => randomBytes(3).toString("hex").toUpperCase();
const ref = (p: string) => `${p}-2026-${uid()}`;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export async function POST(request: NextRequest) {
  const session = getAgentSession(request);
  if (!session || session.accountType !== "TENANT" || !session.tenantId) {
    return NextResponse.json({ error: "TENANT session required" }, { status: 401 });
  }

  await connectToDb();

  const tenantId = new Types.ObjectId(session.tenantId);
  const agentId = new Types.ObjectId(session.userId);

  const tenant = await Tenant.findById(tenantId).select("_id status").lean();
  if (!tenant || tenant.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tenant not active" }, { status: 403 });
  }

  /* ── Récupération store + annee principaux ── */
  const store = await Store.findOne({ tenantId, status: "ACTIVE" }).lean();
  if (!store) return NextResponse.json({ error: "No active store" }, { status: 404 });

  const annee = await Annee.findOne({ tenantId, status: "ACTIVE" }).lean();
  if (!annee) return NextResponse.json({ error: "No active annee" }, { status: 404 });

  const shopId = store._id as Types.ObjectId;
  const anneeId = annee._id as Types.ObjectId;
  const results: Record<string, unknown> = {};

  /* ════════════════════════════════════════════
     1. DEUXIÈME BOUTIQUE (point de vente)
  ════════════════════════════════════════════ */
  const store2Ref = `STR-${uid()}`;
  const store2 = await Store.create({
    tenantId, designation: "Agence Gombe", description: "Point de vente centre-ville Gombe.",
    reference: store2Ref, status: "ACTIVE",
    coordonnes: [{ label: "Adresse", value: "Av. du Commerce 12, Gombe, Kinshasa" }],
    capitals: [], caisses: [], photos: [],
  });
  await Tenant.updateOne({ _id: tenantId }, { $addToSet: { storesId: store2._id } });
  results.store2 = store2._id.toString();

  /* ════════════════════════════════════════════
     2. PRODUITS (catalogue)
  ════════════════════════════════════════════ */
  const productsData = [
    { designation: "Téléphone Samsung Galaxy A54", categorie: "Électronique",
      price: [{ amount: 320, currency: "USD" }, { amount: 928000, currency: "CDF" }] },
    { designation: "Laptop HP ProBook 450", categorie: "Informatique",
      price: [{ amount: 750, currency: "USD" }, { amount: 2175000, currency: "CDF" }] },
    { designation: "Imprimante Canon PIXMA", categorie: "Informatique",
      price: [{ amount: 180, currency: "USD" }, { amount: 522000, currency: "CDF" }] },
    { designation: "Climatiseur LG 12000 BTU", categorie: "Électroménager",
      price: [{ amount: 420, currency: "USD" }, { amount: 1218000, currency: "CDF" }] },
    { designation: "Groupe électrogène 5 KVA", categorie: "Énergie",
      price: [{ amount: 850, currency: "USD" }, { amount: 2465000, currency: "CDF" }] },
    { designation: "Chaise de bureau ergonomique", categorie: "Mobilier",
      price: [{ amount: 95, currency: "USD" }, { amount: 275500, currency: "CDF" }] },
    { designation: "Bureau en bois 140cm", categorie: "Mobilier",
      price: [{ amount: 210, currency: "USD" }, { amount: 609000, currency: "CDF" }] },
    { designation: "Cartouche d'encre HP 305", categorie: "Fournitures",
      price: [{ amount: 25, currency: "USD" }, { amount: 72500, currency: "CDF" }] },
    { designation: "Rame de papier A4 (500 feuilles)", categorie: "Fournitures",
      price: [{ amount: 12, currency: "USD" }, { amount: 34800, currency: "CDF" }] },
    { designation: "Modem 4G LTE Huawei", categorie: "Réseau",
      price: [{ amount: 65, currency: "USD" }, { amount: 188500, currency: "CDF" }] },
  ];

  let counter = 1;
  const productIds: Types.ObjectId[] = [];
  for (const p of productsData) {
    const code = `PRD-2026-${String(counter).padStart(4, "0")}`;
    counter++;
    const prod = await Product.create({
      tenantId, designation: p.designation, categorie: p.categorie,
      code, price: p.price, photos: [], description: [], status: "ACTIVE",
    });
    productIds.push(prod._id as Types.ObjectId);
  }
  results.products = productIds.length;

  /* ════════════════════════════════════════════
     3. CLIENTS
  ════════════════════════════════════════════ */
  const customersData = [
    { name: "SARL ELEC-CONGO", phone: "+243812340001", email: "contact@elec-congo.cd" },
    { name: "Jean-Baptiste Mukendi", phone: "+243812340002", email: "jb.mukendi@gmail.com" },
    { name: "Marie-Claire Nsimba", phone: "+243812340003" },
    { name: "Entreprise BÂTI-KIN", phone: "+243812340004", email: "info@batkin.cd" },
    { name: "Patrick Lufungula", phone: "+243812340005" },
    { name: "Pharmacie Centrale", phone: "+243812340006", email: "pharma.centrale@cd.cd" },
    { name: "École Saint-Joseph", phone: "+243812340007" },
    { name: "Hôtel Grand Palace", phone: "+243812340008", email: "reservations@grandpalace.cd" },
  ];
  const customerIds: Types.ObjectId[] = [];
  for (const c of customersData) {
    const cust = await Customer.create({ tenantId, name: c.name, phone: c.phone, email: c.email });
    customerIds.push(cust._id as Types.ObjectId);
  }
  results.customers = customerIds.length;

  /* ════════════════════════════════════════════
     4. IMMOBILISATIONS
  ════════════════════════════════════════════ */
  const immos = [
    { designation: "Véhicule Toyota Hilux", categorie: "VEHICULE", valeurAchat: 35000, dureeVieAns: 10, dateAcquisition: daysAgo(180) },
    { designation: "Groupe électrogène 20 KVA", categorie: "MATERIEL", valeurAchat: 12000, dureeVieAns: 8, dateAcquisition: daysAgo(365) },
    { designation: "Climatiseurs bureaux (x4)", categorie: "MATERIEL", valeurAchat: 3200, dureeVieAns: 7, dateAcquisition: daysAgo(90) },
    { designation: "Mobilier de bureau complet", categorie: "MOBILIER", valeurAchat: 8500, dureeVieAns: 10, dateAcquisition: daysAgo(200) },
    { designation: "Serveur informatique Dell", categorie: "MATERIEL", valeurAchat: 6800, dureeVieAns: 5, dateAcquisition: daysAgo(60) },
    { designation: "Local commercial Gombe", categorie: "IMMEUBLE", valeurAchat: 120000, dureeVieAns: 30, dateAcquisition: daysAgo(730) },
    { designation: "Photocopieur Xerox Pro", categorie: "MATERIEL", valeurAchat: 4200, dureeVieAns: 6, dateAcquisition: daysAgo(300) },
  ];
  for (const im of immos) {
    await Immobilisation.create({
      tenantId, shopId, anneeId, agentId,
      designation: im.designation,
      categorie: im.categorie as "VEHICULE" | "MATERIEL" | "MOBILIER" | "IMMEUBLE" | "AUTRE",
      valeurAchat: im.valeurAchat,
      dureeVieAns: im.dureeVieAns,
      dateAcquisition: im.dateAcquisition,
      reference: ref("IMM"),
      status: "ACTIF",
      description: "",
    });
  }
  results.immobilisations = immos.length;

  /* ════════════════════════════════════════════
     5. FONDS PROPRES (apports et retraits)
  ════════════════════════════════════════════ */
  const fondsData = [
    { libelle: "Capital initial fondateurs", montant: 50000, currency: "USD", type: "APPORT", date: daysAgo(300) },
    { libelle: "Apport complémentaire Q1", montant: 15000, currency: "USD", type: "APPORT", date: daysAgo(200) },
    { libelle: "Apport en nature — matériel", montant: 8500, currency: "USD", type: "APPORT", date: daysAgo(150) },
    { libelle: "Retrait dividendes associés", montant: 5000, currency: "USD", type: "RETRAIT", date: daysAgo(30) },
    { libelle: "Apport Q3 — développement", montant: 20000, currency: "USD", type: "APPORT", date: daysAgo(60) },
  ];
  for (const f of fondsData) {
    await Fonds.create({
      tenantId, shopId, anneeId,
      libelle: f.libelle, montant: f.montant, currency: f.currency,
      type: f.type as "APPORT" | "RETRAIT",
      reference: ref("FND"),
      dateOperation: f.date,
      status: "VALIDE",
    });
  }
  results.fonds = fondsData.length;

  /* ════════════════════════════════════════════
     6. LIQUIDITÉS (entrées et sorties de caisse)
  ════════════════════════════════════════════ */
  const liquidites = [
    { libelle: "Vente matériel informatique — SARL ELEC-CONGO", montant: 4750, currency: "USD", type: "ENTREE", date: daysAgo(5) },
    { libelle: "Règlement facture #INV-001 — Bâti-Kin", montant: 2300, currency: "USD", type: "ENTREE", date: daysAgo(8) },
    { libelle: "Paiement loyer local Gombe", montant: 1800, currency: "USD", type: "SORTIE", date: daysAgo(3) },
    { libelle: "Achat fournitures de bureau", montant: 450, currency: "USD", type: "SORTIE", date: daysAgo(12) },
    { libelle: "Encaissement ventes journalières", montant: 3200000, currency: "CDF", type: "ENTREE", date: daysAgo(1) },
    { libelle: "Règlement salaires personnel", montant: 5400000, currency: "CDF", type: "SORTIE", date: daysAgo(7) },
    { libelle: "Vente équipements Hôtel Grand Palace", montant: 8900, currency: "USD", type: "ENTREE", date: daysAgo(15) },
    { libelle: "Carburant véhicule", montant: 350000, currency: "CDF", type: "SORTIE", date: daysAgo(4) },
    { libelle: "Règlement École Saint-Joseph", montant: 1200, currency: "USD", type: "ENTREE", date: daysAgo(20) },
    { libelle: "Maintenance groupe électrogène", montant: 680, currency: "USD", type: "SORTIE", date: daysAgo(10) },
    { libelle: "Ventes comptoir — semaine S42", montant: 7600000, currency: "CDF", type: "ENTREE", date: daysAgo(14) },
    { libelle: "Facture internet & téléphonie", montant: 850000, currency: "CDF", type: "SORTIE", date: daysAgo(6) },
  ];
  for (const liq of liquidites) {
    await Liquidite.create({
      tenantId, shopId, anneeId, agentId,
      libelle: liq.libelle, montant: liq.montant, currency: liq.currency,
      type: liq.type as "ENTREE" | "SORTIE",
      reference: ref("LIQ"),
      dateOperation: liq.date,
      status: "VALIDE",
    });
  }
  results.liquidites = liquidites.length;

  /* ════════════════════════════════════════════
     7. DETTES (fournisseurs)
  ════════════════════════════════════════════ */
  const dettes = [
    { fournisseurNom: "SOTRAKIN — Transport", fournisseurTel: "+243800100001", designation: "Service livraison Q3", montant: 3500, currency: "USD", echeance: daysFromNow(45), date: daysAgo(20) },
    { fournisseurNom: "ELECTROGAZ", fournisseurTel: "+243800100002", designation: "Facture électricité oct-2026", montant: 1200000, currency: "CDF", echeance: daysFromNow(15), date: daysAgo(5) },
    { fournisseurNom: "Imprimerie PRIMA", fournisseurTel: "+243800100003", designation: "Edition supports marketing", montant: 2800000, currency: "CDF", echeance: daysFromNow(30), date: daysAgo(10) },
    { fournisseurNom: "Congo IT Solutions", fournisseurTel: "+243800100004", designation: "Maintenance réseau Q3", montant: 1500, currency: "USD", echeance: daysFromNow(20), date: daysAgo(7) },
    { fournisseurNom: "SNEL — Société Nationale d’Électricité", fournisseurTel: "+243800100005", designation: "Raccordement agence Gombe", montant: 4200, currency: "USD", echeance: daysFromNow(60), date: daysAgo(3) },
  ];
  for (const d of dettes) {
    await Dette.create({
      tenantId, shopId, anneeId,
      fournisseurNom: d.fournisseurNom, fournisseurTel: d.fournisseurTel ?? "",
      designation: d.designation, montant: d.montant, currency: d.currency,
      dateEcheance: d.echeance, dateCreation: d.date,
      status: "EN_COURS", reference: ref("DET"),
    });
  }
  results.dettes = dettes.length;

  /* ════════════════════════════════════════════
     8. CRÉANCES (clients débiteurs)
  ════════════════════════════════════════════ */
  const creancessData = [
    { clientIdx: 0, montant: 6800, currency: "USD", echeance: daysFromNow(30), date: daysAgo(10) },
    { clientIdx: 1, montant: 1200000, currency: "CDF", echeance: daysFromNow(15), date: daysAgo(5) },
    { clientIdx: 3, montant: 4500, currency: "USD", echeance: daysFromNow(45), date: daysAgo(20) },
    { clientIdx: 5, montant: 850000, currency: "CDF", echeance: daysFromNow(60), date: daysAgo(3) },
    { clientIdx: 7, montant: 9200, currency: "USD", echeance: daysFromNow(20), date: daysAgo(8) },
  ];
  for (const cr of creancessData) {
    await Creance.create({
      tenantId, shopId, anneeId,
      clientId: customerIds[cr.clientIdx],
      montant: cr.montant, currency: cr.currency,
      dateEcheance: cr.echeance, dateCreation: cr.date,
      status: "EN_COURS", reference: ref("CRE"),
    });
  }
  results.creances = creancessData.length;

  /* ════════════════════════════════════════════
     9. STOCK initial
  ════════════════════════════════════════════ */
  await Stock.create({
    anneeId, shopId,
    designation: "Stock initial 2026",
    description: "Inventaire de départ — exercice 2026",
    reference: ref("STK"),
    status: "ACTIVE",
    stocks: productIds.slice(0, 8).map((pid, i) => ({
      product: pid,
      qte: [50, 20, 35, 8, 5, 30, 15, 200][i] ?? 10,
    })),
  });
  results.stocks = 1;

  return NextResponse.json({ ok: true, created: results });
}
