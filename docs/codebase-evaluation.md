# Évaluation de la codebase — Capacité à livrer les 4 bénéfices

> Date : 29 octobre 2026
> Branche : `claude/jolly-volta-lbvtrg`
> Périmètre : évaluation de ce que la codebase actuelle peut concrètement livrer par rapport aux 4 bénéfices présentés aux utilisateurs cibles.

---

## Résumé exécutif

| Bénéfice | Score | Statut |
|----------|-------|--------|
| 1. Superviser à 360° en temps réel | **50 %** | 🟡 Socle présent, temps réel incomplet |
| 2. Fidéliser ses clients | **35 %** | 🔴 Fondations posées, segmentation manquante |
| 3. Connaître ses chiffres | **60 %** | 🟡 Agrégats solides, analyses avancées absentes |
| 4. Préparer un dossier d'accès au crédit | **30 %** | 🔴 Données disponibles, rapport exportable incomplet |

**Score global : ~44 %**

---

## Bénéfice 1 — Superviser à 360° ses activités en temps réel

### Score : 50 %

### Ce qui est implémenté ✅

| Feature | Preuve dans la codebase |
|---------|------------------------|
| Dashboard tenant multi-boutiques | `src/lib/dashboard/data.ts` — `getDashboardData()` agrège CA et dépenses de toutes les boutiques |
| Décrement stock atomique à la vente | `workspace.actions.ts:293-306` — `Stock.updateOne` dans la même transaction MongoDB que `Commande.create` |
| Publication Pusher après vente réussie | `workspace.actions.ts:333-347` — `publishTenantEvent(tenantId, "commandes", "commande.created", ...)` appelé après commit |
| Canaux Pusher isolés par tenant | `private-tenant-{tenantId}-commandes`, `private-tenant-{tenantId}-stocks` |
| Tableau stocks multi-boutiques | `stocks/StocksOverviewClient.tsx` — vue consolidée par boutique et produit |

### Ce qui manque ❌

| Gap | Impact | Complexité à corriger |
|-----|--------|----------------------|
| L'événement `commande.created` est publié mais **le dashboard ne le consomme pas** pour mettre à jour les KPIs | Le CA affiché ne change pas sans rechargement de page | Moyen — connecter `NotificationDropdown` ou un hook Pusher au dashboard |
| **Pas d'alertes seuil critique** — `StocksOverviewClient` affiche les quantités mais aucun seuil de déclenchement | Promesse de "fini les ruptures surprise" non tenue | Moyen — ajouter champ `seuilCritique` sur Product/Stock + coloration conditionnelle |
| **Dashboard agrège toutes les boutiques ensemble** — pas de KPI par boutique | Impossible de savoir quelle boutique performe | Moyen — segmenter `getDashboardData()` par `shopId` |
| Journal de caisse non modifiable par le vendeur — partiellement : `CONFIRMED` immédiat, mais pas de contrôle d'audit | Le tenant ne peut pas détecter une vente annulée frauduleusement | Faible — vérification à faire |

### Pour atteindre 100 %

1. Connecter l'événement Pusher `commande.created` au composant dashboard pour mise à jour optimiste des KPIs
2. Ajouter un champ `seuilCritique` sur Product, vérifier à chaque décrement, publier `stock.alert` sur Pusher
3. Ajouter un sélecteur de boutique sur le dashboard tenant avec KPIs par boutique

---

## Bénéfice 2 — Fidéliser ses clients

### Score : 35 %

### Ce qui est implémenté ✅

| Feature | Preuve dans la codebase |
|---------|------------------------|
| Métriques clients de base | `ClientsClient.tsx:42-48` — `customers`, `buyingCustomers`, `inactiveCustomers`, `orders`, CA cumulé |
| Système de promotions complet | `Promotion.ts` — code, réduction %, crédits, SMS, photos |
| Application automatique de promotion à la vente | `workspace.actions.ts:270-292` — sélection automatique de la meilleure promotion du client |
| Vue clients d'une promotion | `/clients/[code]` via `getPromotionAudience` |

### Ce qui manque ❌

| Gap | Impact | Complexité à corriger |
|-----|--------|----------------------|
| **Pas d'historique d'achats sur la fiche client** — `Customer` n'a pas de lien `Commande[]` | Impossible de voir "ce que le client a acheté" | Faible — requête `Commande.find({ clientId })` déjà indexée dans Commande.ts |
| **Pas de segmentation "clients à risque"** — uniquement actifs vs inactifs | On ne sait pas qui est en train de partir | Moyen — calculer `lastPurchaseDate` depuis Commandes, seuil configurable |
| **Promotions non envoyées de façon ciblée** — le système SMS existe (Promotion.smsStats) mais pas d'envoi déclenché automatiquement | Fidélisation passive uniquement | Élevé — nécessite logique d'envoi et intégration SMS active |
| **Pas d'affichage des produits préférés par client** | Ventes croisées impossibles | Faible — `$group` sur `Commande.commandes` par `clientId` |

### Pour atteindre 100 %

1. Ajouter une tab "Historique" sur la page `/clients/[code]` avec les commandes du client
2. Calculer `lastPurchaseDate` depuis les commandes et afficher un badge "Inactif depuis X jours"
3. Ajouter l'envoi SMS déclenché sur les clients d'un segment (inactifs depuis N jours → promotion ciblée)

---

## Bénéfice 3 — Connaître ses chiffres

### Score : 60 %

### Ce qui est implémenté ✅

| Feature | Preuve dans la codebase |
|---------|------------------------|
| CA global USD + CDF | `dashboard/data.ts` — agrégation par devise et type (COMMANDE) |
| Total dépenses global | `dashboard/data.ts` — agrégation Depense par devise |
| Graphique mensuel des ventes | `dashboard/data.ts` — données groupées par mois pour `MonthlySalesChart` |
| Top produits par CA | `dashboard/data.ts` — `RecentOrders` avec ranking produit |
| Export Excel 4 feuilles | `exports.actions.ts` — Synthèse, Journal, Recettes, Dépenses |
| Journal unifié 6 types d'opérations | `comptabilite.actions.ts` — COMMANDE, DEPENSE, LIQUIDITE, CREANCE, FONDS, DETTE |
| Page Cloture d'exercice | `/comptabilite/cloture` — stats commandes en attente, créances, dettes |

### Ce qui manque ❌

| Gap | Impact | Complexité à corriger |
|-----|--------|----------------------|
| **Bug export Excel** : `totalRecettes` dans `exportAnneeJournal` utilise la somme de `qte` au lieu de `totalAmount` | Chiffres d'affaires incorrects dans l'export | Faible — corriger une ligne dans `exports.actions.ts` |
| **Pas de marge brute par produit** — seul le CA est calculé, pas (CA - coût) | Impossible de savoir quel produit est rentable | Moyen — nécessite `coutUnitaire` sur Product |
| **Pas de performance par vendeur** | Tenant ne peut pas comparer ses vendeurs | Moyen — grouper Commandes par `agentId` |
| **Pas de comparaison de périodes** | Impossible de savoir si ça progresse | Moyen — paramètre `comparaison` dans `getDashboardData` |
| **Pas de top clients** sur dashboard | Seuls les top produits sont affichés | Faible — `$group` par `clientId` déjà possible |
| **Pas d'export PDF** | pdfmake installé mais aucune action PDF implémentée | Élevé — implémenter `exportPDF` dans exports.actions.ts |

### Pour atteindre 100 %

1. **Corriger le bug `totalRecettes`** en priorité (1 ligne)
2. Ajouter `coutUnitaire` sur Product pour calculer la marge
3. Segmenter le dashboard par vendeur et par boutique
4. Implémenter l'export PDF via pdfmake

---

## Bénéfice 4 — Préparer un dossier d'accès au crédit

### Score : 30 %

### Ce qui est implémenté ✅

| Feature | Preuve dans la codebase |
|---------|------------------------|
| Historique complet de transactions | `comptabilite.actions.ts` — 6 types couverts |
| Export Excel du journal | `exports.actions.ts` — `exportAnneeJournal` |
| Cloture d'exercice | `/comptabilite/cloture` — bilan de fin d'exercice |
| pdfmake installé | `package.json` — dépendance présente, non utilisée |

### Ce qui manque ❌

| Gap | Impact | Complexité à corriger |
|-----|--------|----------------------|
| **Pas d'export PDF** — pdfmake installé mais aucune action implémentée | Le "dossier" ne peut pas être remis à une institution | Élevé — implémenter `exportDossierFinancement` |
| **Bug `totalRecettes`** (voir Bénéfice 3) | Données financières incorrectes dans le dossier | Faible — corriger 1 ligne |
| **Pas de score de crédibilité** | L'argument différenciateur le plus fort n'existe pas encore | Très élevé — roadmap |
| **Format "dossier financement" inexistant** — aucune mise en page adaptée aux exigences des institutions | Le data brut Excel ne suffit pas à une banque ou MFI | Élevé — définir la structure + générer le PDF |
| **Pas de récapitulatif mensuel/trimestriel clair** | L'analyse de tendance n'est pas disponible | Moyen |

### Pour atteindre 100 %

1. **Corriger le bug `totalRecettes`** (prérequis)
2. Implémenter `exportDossierFinancement()` en PDF avec pdfmake (en-tête tenant, période, CA mensuel, dépenses, résultat net, ratio activité)
3. Roadmap : ajouter un score de crédibilité (fréquence × volume × régularité)

---

## Plan de correction prioritaire

### P0 — Correction immédiate (1 fichier, 1 ligne)

- [ ] **Corriger `totalRecettes`** dans `src/actions/exports.actions.ts` : remplacer la somme de `qte` par la somme de `totalAmount`

### P1 — Temps réel dashboard (1-2 jours)

- [ ] Connecter l'événement Pusher `commande.created` au composant dashboard (ajout d'un hook `usePusher` dans le Dashboard Tenant)
- [ ] Ajouter alertes seuil critique sur stock (champ `seuilCritique` + coloration dans StocksOverviewClient)

### P2 — Chiffres et exports (2-3 jours)

- [ ] Implémenter export PDF via pdfmake (`exportDossierFinancement`)
- [ ] Ajouter KPIs par vendeur sur le dashboard
- [ ] Ajouter top clients sur le dashboard

### P3 — Fidélisation clients (3-4 jours)

- [ ] Historique d'achats sur la fiche client
- [ ] Badge "inactif depuis X jours" basé sur `lastPurchaseDate`
- [ ] Top produits préférés par client

### P4 — Roadmap (score crédit, SMS ciblés)

- [ ] Score de crédibilité commerciale
- [ ] Envoi SMS déclenché sur segment clients

---

## Notes pour les agents

- Le flux de vente est **complet et sécurisé** : validation → stock atomique → transaction → Pusher. C'est la fondation solide sur laquelle tout le reste s'appuie.
- Le plus grand écart entre les promesses et la réalité est le **temps réel côté dashboard** : l'événement Pusher existe mais personne ne l'écoute pour mettre à jour les chiffres affichés.
- Le **bug `totalRecettes`** est le seul bug critique identifié. Il fausse tous les rapports financiers.
- L'export PDF est la seule vraie feature manquante "from scratch" — tout le reste est une extension de features existantes.
