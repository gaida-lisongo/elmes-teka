# Prompt — Agent Backend : atteindre 100 % sur les 4 bénéfices ELMES-TEKA

## Contexte

Tu travailles sur ELMES-TEKA, un CRM multi-tenant de gestion commerciale pour entrepreneurs congolais (TPE/PME, secteur informel). Stack : Next.js 15 App Router + TypeScript + MongoDB/Mongoose + Pusher + TailAdmin v2.0. Branche de travail : `claude/jolly-volta-lbvtrg`.

**Avant toute modification, lis impérativement :**
1. `AGENTS.md` — règles de travail obligatoires (multi-tenant, sécurité, no-build, no-lint)
2. `CONTEXT.md` — contexte métier complet
3. `docs/codebase-evaluation.md` — évaluation détaillée avec scores actuels et gaps identifiés

L'évaluation a établi que la codebase livre actuellement **~44 %** des bénéfices promis. Ton objectif est d'implémenter les corrections et features manquantes pour atteindre 100 % sur chacun des 4 bénéfices.

---

## Règles impératives (extraites de AGENTS.md)

- **Jamais** de nouvelle connexion MongoDB — réutiliser `connectToDb()` existant
- **Jamais** publier un événement Pusher avant la réussite de l'écriture principale en base
- **Toujours** vérifier côté serveur : session → rôle → tenantId → storeId → anneeId
- **Jamais** faire confiance à un ID venant uniquement du client
- **Jamais** lancer `npm run build`, `npm run lint`, ou tout test/compilation
- Toujours réutiliser les modèles, helpers, actions et schémas existants avant d'en créer
- Canaux Pusher : `private-tenant-{tenantId}-commandes/depenses/stocks`

---

## Tâches par priorité

---

### P0 — Bug critique (1 fichier, ~1 ligne) — COMMENCER ICI

**Fichier :** `src/actions/exports.actions.ts`

**Problème :** Dans la fonction `exportAnneeJournal`, `totalRecettes` est calculé en additionnant les valeurs `qte` (quantités) au lieu de `totalAmount` (montants). Cela fausse l'ensemble des exports financiers.

**Correction attendue :** Localiser l'agrégation de `totalRecettes` dans cette fonction et remplacer la somme des quantités par la somme des `totalAmount` des Commandes.

**Test manuel attendu :** Exporter le journal d'un exercice et vérifier que la colonne "Recettes" de la feuille Synthèse affiche le chiffre d'affaires réel et non une somme de quantités.

---

### P1 — Temps réel dashboard (Bénéfice 1 — Superviser à 360°)

**Contexte :** L'événement Pusher `commande.created` est déjà publié après chaque vente dans `src/actions/workspace.actions.ts:333`. Le canal est `private-tenant-{tenantId}-commandes`. Mais le dashboard (`src/app/(admin)/page.tsx`) ne consomme pas cet événement — les KPIs ne se mettent pas à jour sans rechargement de page.

**Objectif :** Quand une vente est enregistrée dans n'importe quelle boutique du tenant, le dashboard tenant se met à jour en temps réel (CA du jour, dernier mouvement).

**Fichiers à lire avant de modifier :**
- `src/app/(admin)/page.tsx` — dashboard server component
- `src/lib/dashboard/data.ts` — `getDashboardData()` — logique d'agrégation
- `src/components/header/NotificationDropdown.tsx` — exemple de consommation Pusher côté client
- `src/lib/utils/realtime.ts` — `publishTenantEvent`

**Ce qui est attendu :**
1. Créer un composant client `DashboardRealtimeUpdater` qui s'abonne au canal `private-tenant-{tenantId}-commandes` et, à chaque événement `commande.created`, déclenche un `router.refresh()` pour recharger les données SSR
2. Intégrer ce composant dans le dashboard tenant
3. Ne pas re-implémenter la logique Pusher — utiliser le pattern de `NotificationDropdown.tsx`

**Test manuel :** Ouvrir le dashboard tenant dans un onglet, enregistrer une vente depuis le workspace vendeur dans un autre onglet, vérifier que les KPIs du dashboard se mettent à jour sans rechargement manuel.

---

### P1 — Alertes seuil critique stock (Bénéfice 1 — Superviser à 360°)

**Contexte :** Le modèle `Stock` (`src/lib/models/Stock.ts`) contient un tableau `stocks: [{product, qte}]`. Aucun seuil critique n'est défini. La page stocks (`src/app/(admin)/stocks/StocksOverviewClient.tsx`) affiche les quantités sans aucune alerte visuelle.

**Objectif :** Alerter visuellement quand un produit est en stock critique.

**Fichiers à lire avant de modifier :**
- `src/lib/models/Stock.ts` — schéma actuel
- `src/lib/models/Product.ts` — vérifier si `seuilCritique` existe déjà
- `src/app/(admin)/stocks/StocksOverviewClient.tsx` — composant à modifier

**Ce qui est attendu :**
1. Vérifier si `Product` a déjà un champ `seuilCritique`. S'il n'existe pas, l'ajouter (Number, default 0, optionnel) en préservant la compatibilité des documents existants
2. Dans `StocksOverviewClient`, afficher une pastille de couleur (rouge si `qte <= seuilCritique`, orange si `qte <= seuilCritique * 2`, vert sinon) sur chaque ligne de stock
3. Ajouter un compteur "X produits en stock critique" dans les métriques en haut de la page
4. Ne pas publier d'événement Pusher pour cette partie — c'est une lecture seule

**Test manuel :** Aller sur la page stocks, vérifier que les produits avec quantité faible sont signalés visuellement.

---

### P2 — Export PDF dossier financement (Bénéfice 4 — Dossier crédit)

**Contexte :** `pdfmake` est installé dans `package.json` mais aucune action PDF n'est implémentée. L'export Excel existe dans `src/actions/exports.actions.ts`. Les données sont disponibles via `getJournalOperations` dans `src/actions/comptabilite.actions.ts`.

**Objectif :** Permettre au tenant d'exporter un "Dossier Financement" en PDF — un document structuré qu'il peut remettre à une institution de microfinance.

**Fichiers à lire avant de modifier :**
- `src/actions/exports.actions.ts` — patterns d'export existants
- `src/actions/comptabilite.actions.ts` — `getJournalOperations`, `getClosureData`
- `src/lib/models/Commande.ts`, `Depense.ts` — schémas des transactions
- `src/app/(admin)/comptabilite/journal/page.tsx` — page qui appelle le journal

**Ce qui est attendu :**
1. Créer une Server Action `exportDossierFinancement(anneeId: string)` dans `exports.actions.ts`
2. Le PDF doit contenir : en-tête tenant (nom, logo si disponible), période de l'exercice, tableau mensuel (CA / Dépenses / Résultat net), liste des 10 meilleures ventes, total créances et dettes en cours
3. Utiliser `pdfmake` côté serveur (import dynamique pour éviter les problèmes SSR)
4. Retourner un `Buffer` encodé en base64 pour téléchargement côté client
5. Ajouter un bouton "Exporter le dossier PDF" sur la page `/comptabilite/journal`

**Test manuel :** Cliquer sur "Exporter le dossier PDF", vérifier que le fichier téléchargé est lisible et contient les données de l'exercice actif.

---

### P3 — Historique d'achats client (Bénéfice 2 — Fidéliser ses clients)

**Contexte :** Le modèle `Commande` a un index `{ clientId: 1, createdAt: -1 }` (voir `src/lib/models/Commande.ts`). La page `/clients/[code]` (`src/app/(admin)/clients/[code]/`) affiche les clients d'une promotion mais pas leur historique d'achats.

**Objectif :** Afficher l'historique des commandes pour chaque client sur la page promotion-audience.

**Fichiers à lire avant de modifier :**
- `src/app/(admin)/clients/[code]/page.tsx`
- `src/app/(admin)/clients/[code]/PromotionAudienceClient.tsx`
- `src/actions/promotions.actions.ts` — `getPromotionAudience`
- `src/lib/models/Commande.ts`

**Ce qui est attendu :**
1. Dans `getPromotionAudience`, enrichir chaque client avec : `lastPurchaseDate`, `totalOrders`, `totalRevenue` (calculés depuis les Commandes avec l'index existant)
2. Dans `PromotionAudienceClient`, afficher ces 3 informations sur chaque fiche client
3. Ajouter un badge "Inactif depuis X jours" si `lastPurchaseDate` > 30 jours
4. Ne pas modifier le schéma `Customer` — calculer les données depuis `Commande` à la volée

**Test manuel :** Ouvrir une promotion depuis `/clients`, vérifier que chaque client affiche sa date de dernier achat et le nombre de commandes.

---

### P3 — Top clients sur le dashboard (Bénéfice 3 — Connaître ses chiffres)

**Contexte :** Le dashboard affiche un top produits via `RecentOrders` mais pas de top clients. Les données sont disponibles en agrégeant `Commande` par `clientId`.

**Objectif :** Ajouter un widget "Top Clients" sur le dashboard tenant.

**Fichiers à lire avant de modifier :**
- `src/lib/dashboard/data.ts` — `getDashboardData()`
- `src/app/(admin)/page.tsx` — composition du dashboard
- `src/lib/models/Commande.ts`, `Customer.ts`

**Ce qui est attendu :**
1. Dans `getDashboardData()`, ajouter une agrégation `topClients` : les 5 clients avec le plus grand `totalAmount` sur l'exercice actif, avec leur nom et CA total
2. Créer un composant `TopClientsWidget` (ou réutiliser un composant existant similaire au ranking produits) pour afficher le résultat
3. Intégrer dans `page.tsx` à côté du ranking produits

**Test manuel :** Vérifier que le dashboard affiche les 5 meilleurs clients avec leur CA.

---

## Ordre d'exécution recommandé

1. P0 — Bug `totalRecettes` (5 min)
2. P1 — Alertes seuil critique (1h)
3. P1 — Temps réel dashboard (2h)
4. P2 — Export PDF (3h)
5. P3 — Historique client (1h)
6. P3 — Top clients dashboard (1h)

## Rapport final attendu

Pour chaque tâche accomplie, documenter dans `docs/backend-alignment.md` :
- ✅ Feature — fichiers modifiés — comportement attendu
- Les points que l'utilisateur doit tester manuellement
- Les éventuelles limites ou hypothèses

Ne pas modifier `docs/codebase-evaluation.md` — ce fichier est un snapshot historique.
