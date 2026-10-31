# Écart présentation ↔ codebase — Suivi

> Date : 31/10/2026 — base : `main` @ `5e9c8d7`
> Référence : `plan.md`, `01-introduction.md` (§1.3 Objectifs), `04-benefices.md`, avec contrôle des promesses des chapitres 2, 3 et 5.
> Précédente mesure : `docs/codebase-evaluation.md` (29/10/2026, score bénéfices ~44 %).

Légende : ✅ livré · 🟡 partiel · ❌ absent. Score = ✅ 1 pt, 🟡 0,5 pt, ❌ 0 pt, rapporté au nombre de promesses.

---

## Résumé — distance restante

| Axe | Couverture | Distance | Évolution vs 29/10 |
|-----|-----------|----------|--------------------|
| **Objectifs (§1.3)** | **~69 %** | ~31 % | — (non mesuré) |
| 4.1 Superviser à 360° | 80 % | 20 % | +30 pts |
| 4.2 Fidéliser ses clients | 40 % | 60 % | +5 pts |
| 4.3 Connaître ses chiffres | 33 % | 67 % | −27 pts (grille plus stricte, voir note) |
| 4.4 Dossier d'accès au crédit | 60 % | 40 % | +30 pts |
| **Bénéfices (moyenne)** | **~53 %** | **~47 %** | +9 pts |

> Note 4.3 : la grille suit ligne à ligne les 6 promesses de `04-benefices.md` (marge, vendeur, comparaison…), plus exigeante que l'évaluation du 29/10.

**Ce qui a été comblé depuis le 29/10** : bug `totalRecettes` corrigé (`exports.actions.ts:112`), export PDF `exportDossierFinancement` branché dans le Journal, rafraîchissement du dashboard sur `commande.created` (`DashboardRealtimeUpdater.tsx`), champ `seuilCritique` + statut critique dans la vue stocks, KPI par boutique (jour) et top clients sur le dashboard, historique des 20 dernières commandes sur la fiche client.

---

## A. Objectifs de la plateforme (`01-introduction.md` §1.3)

| Objectif | Score | Preuves | Écart restant |
|----------|-------|---------|---------------|
| **O1 — Accessibilité** | 🟡 75 % | Inscription tenant (`auth.actions.ts:createTenantAccount`), paiement Mobile Money FlexPay (`payment.service.ts`), packs STARTER/BUSINESS/PREMIUM (`stores.actions.ts:1098`), manifest PWA (`public/site.webmanifest`) | Grille tarifaire non affichée/confirmée ; pas de mode hors-ligne ; « gratuit » annoncé sur la home sans offre d'essai dans le code |
| **O2 — Simplicité** | 🟡 70 % | Formulaires multi-étapes (création boutique en étapes, paiement), UI en français, TailAdmin | Non mesurable par le code seul : aucun test utilisateur ; terminologie tenant/saler non tranchée (note §1) |
| **O3 — Contrôle en temps réel** | 🟡 75 % | Dashboard tenant multi-boutiques (`lib/dashboard/data.ts`), Pusher privé par tenant, rafraîchissement auto, notifications header | Pas d'alerte seuil poussée (affichage seul) ; annulation de vente libre côté vendeur sans validation ni trace |
| **O4 — Historique financier** | 🟡 55 % | Journal 6 types (`comptabilite.actions.ts`), export Excel, dossier PDF, clôture d'exercice | Pas de score de crédibilité ; pas de récap mensuel/trimestriel exportable ; pas de journal d'audit garantissant la non-altération |

---

## B. Bénéfices (`04-benefices.md`)

### 4.1 Superviser à 360° — 80 %

| Promesse | État | Preuve / manque |
|----------|------|-----------------|
| Vision unifiée de tous les points de vente | ✅ | `getDashboardData` (scope TENANT), `StoreMetric` |
| Chaque vente notifiée en temps réel | ✅ | `publishTenantEvent` après commit + `DashboardRealtimeUpdater` (rechargement, pas MAJ optimiste) |
| Stock de chaque boutique visible | ✅ | `stocks/StocksOverviewClient.tsx` |
| Journal de caisse **non modifiable** par le vendeur | 🟡 | `cancelSale` (`workspace.actions.ts:417`) : le vendeur annule seul, sans validation tenant, sans motif, hors transaction MongoDB |
| Alerte automatique sous seuil critique | 🟡 | Coloration dans la vue stocks ; aucune alerte dashboard (`DashboardAlert` ne couvre que commandes/approvisionnements) ni événement Pusher |

### 4.2 Fidéliser ses clients — 40 %

| Promesse | État | Preuve / manque |
|----------|------|-----------------|
| Base client centralisée avec historique | ✅ | `getCustomerDetail` (20 dernières commandes) |
| Fidèles / à risque / perdus | ❌ | Seulement statut ACTIVE/INACTIVE manuel ; pas de `lastPurchaseDate` ni segmentation |
| Ciblage de promotions sur clients inactifs | 🟡 | `sendPromotionSmsToCustomers` : sélection manuelle ≤ 50, éligibilité par nombre de lignes, pas par inactivité |
| Suivi des commandes en attente par client | 🟡 | Statut visible dans l'historique client ; pas de vue « en attente » dédiée |
| Produits préférés → ventes croisées | ❌ | Aucune agrégation par client × produit |

### 4.3 Connaître ses chiffres — 33 %

| Promesse | État | Preuve / manque |
|----------|------|-----------------|
| CA global et par boutique, en temps réel | 🟡 | Global ✅ ; par boutique uniquement pour le jour (`todayRevenue`) |
| Marge brute par produit | ❌ | `Product` n'a pas de prix d'achat / coût |
| Performance par vendeur | ❌ | `getSalerMetrics` = comptage de comptes, pas de CA par `agentId` |
| Évolution des ventes | ✅ | Graphique mensuel par exercice |
| Top produits, top clients, top boutiques | 🟡 | Produits ✅, clients ✅, boutiques ❌ (pas de classement) |
| Comparaison avec la période précédente | ❌ | Aucun calcul N-1 |

### 4.4 Dossier d'accès au crédit — 60 %

| Promesse | État | Preuve / manque |
|----------|------|-----------------|
| Historique complet des transactions | ✅ | Journal unifié 6 types |
| États financiers exportables en PDF | ✅ | `exportDossierFinancement` (`exports.actions.ts:385`), bouton dans `JournalClient` |
| Récapitulatifs mensuels et trimestriels | 🟡 | Données mensuelles dans le graphique ; pas d'export dédié |
| Score de crédibilité commerciale (roadmap) | ❌ | Inexistant — la slide l'annonce déjà comme roadmap |
| Dossier exploitable par une IMF | 🟡 | PDF générique ; aucun format validé avec une institution partenaire |

---

## C. Promesses des chapitres 2, 3 et 5 non couvertes par le code

À corriger **dans les slides** ou **dans le code** avant présentation publique :

| Slide | Promesse | Réalité codebase | Action recommandée |
|-------|----------|------------------|--------------------|
| `plan.md` §4 | Bénéfices : scoring / fraude / promotions (3) | `04-benefices.md` en a 4, différents | Aligner `plan.md` sur `04-benefices.md` |
| 2.2 | Plans Starter / Pro / Business limités en boutiques et vendeurs | Packs STARTER (200 tx) / BUSINESS / PREMIUM (illimité), **par boutique et par exercice**, limités en transactions | Réécrire la slide sur la grille réelle + prix |
| 2.3 | Types : Commande (réservation), Inventaire, Promotion | Ventes, dépenses, demandes d'approvisionnement ; promotion = réduction sur vente ; pas de réservation ni d'inventaire | Retirer ou marquer « bientôt » |
| 2.4 / 3.1 | Marge brute, comparaison de périodes, alerte solde critique | Absents | Retirer ou roadmap |
| 3.2 | Inventaires périodiques avec régularisation | Ajustement manuel de quantité (`updateStoreProductQuantity`) sans écart théorique/physique | Reformuler |
| 3.4 | Journal d'audit des actions sensibles | Aucun modèle d'audit | Retirer ou roadmap |
| 3.4 | Bon de commande, rapport performance vendeur, bilan mensuel | Facture ✅ (`invoice.actions.ts`), journal Excel ✅, dossier PDF ✅ ; les 3 autres ❌ | Lister seulement les documents existants |
| 5.1 | « Démarrage en moins de 15 minutes » | Non mesuré | Chronométrer un parcours réel |

---

## D. Plan de rattrapage priorisé (pour suivi)

| # | Action | Bénéfice | Gain estimé | Effort |
|---|--------|----------|-------------|--------|
| P0 | Aligner les slides sur l'existant (section C) | Crédibilité | — | Faible |
| P1 | Sécuriser `cancelSale` : validation tenant ou motif obligatoire, transaction MongoDB, trace | 4.1 / O3 / O4 | +10 pts 4.1 | Moyen |
| P1 | Alerte seuil critique : `DashboardAlert` « low_stock » + événement Pusher après décrément | 4.1 / O3 | +10 pts 4.1 | Faible |
| P2 | Performance par vendeur : `$group` Commande par `agentId` | 4.3 | +17 pts 4.3 | Faible |
| P2 | Comparaison N-1 et classement des boutiques dans `getDashboardData` | 4.3 | +25 pts 4.3 | Moyen |
| P2 | Prix d'achat sur `Product` → marge brute | 4.3 | +17 pts 4.3 | Moyen |
| P3 | Segmentation clients (dernière commande → fidèle / à risque / perdu) + ciblage SMS par segment | 4.2 | +30 pts 4.2 | Moyen |
| P3 | Produits préférés par client | 4.2 | +20 pts 4.2 | Faible |
| P4 | Récap mensuel/trimestriel dans le dossier PDF | 4.4 | +10 pts 4.4 | Faible |
| P5 | Score de crédibilité (régularité × volume × ancienneté) | 4.4 / O4 | +20 pts 4.4 | Élevé |

Avec P1 + P2 réalisés, la moyenne des bénéfices passerait d'environ **53 % à ~72 %** (4.1 → 100 %, 4.3 → ~92 %).

---

## Historique des mesures

| Date | Bénéfices | Objectifs | Commentaire |
|------|-----------|-----------|-------------|
| 29/10/2026 | ~44 % | — | `docs/codebase-evaluation.md` |
| 31/10/2026 | ~53 % | ~69 % | Ce document |
