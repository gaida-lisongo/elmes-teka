# Prompt — Agent UI/UX Redesign : aligner l'interface sur les bénéfices ELMES-TEKA

## Contexte

Tu travailles sur ELMES-TEKA, un CRM multi-tenant de gestion commerciale pour entrepreneurs congolais. Stack : Next.js 15 App Router + TypeScript + TailAdmin v2.0. Branche de travail : `claude/jolly-volta-lbvtrg`.

**Avant toute modification, lis impérativement :**
1. `AGENTS.md` — règles de travail (réutiliser avant de créer, composants TailAdmin, icônes SVG, no-build)
2. `CONTEXT.md` — contexte métier complet (rôles Tenant/Saler, flux de travail)
3. `docs/codebase-evaluation.md` — évaluation des 4 bénéfices et leurs scores
4. `docs/presentation/04-benefices.md` — les 4 messages clés à incarner dans l'UI
5. `docs/research-motivations.md` — motivations des utilisateurs cibles (surtout #1 : anti-vol, #2 : supervision à distance)

**Principe directeur :** Chaque écran doit répondre à une douleur réelle de l'entrepreneur congolais. L'UI n'est pas décorative — elle est l'argument de vente le plus puissant du produit.

---

## Règles UI impératives (AGENTS.md)

- **Icônes** : uniquement les SVG dans `/src/icons/` — jamais d'émojis, jamais de librairie externe
- **Composants** : réutiliser les composants TailAdmin (`Button`, `Input`, `Label`, `Badge`, `Modal`, tableaux, cartes) — créer uniquement si aucun existant ne convient
- **Chargement des données** : côté serveur (Server Components) pour l'état initial — composants clients uniquement pour l'interactivité et Pusher
- **Layouts** : utiliser les layouts Next.js existants
- **Pas de build, pas de lint**

---

## Charte graphique

**Couleurs (dans `src/app/globals.css`) :**
- Primaire : `brand-500` = `#465fff`
- Navy (fonds sombres, cartes accent) : `brand-950` = `#161950`
- Succès/positif : `success-500` = `#12b76a`
- Alerte/attention : `warning-500` = `#f79009`
- Erreur/critique : `error-500` = `#f04438`
- Texte : `gray-900` / `gray-500`
- Fond : `white` / `gray-50`
- Bordures : `gray-100` / `gray-200`

**Police :** Outfit (déjà dans globals.css)

**Tokens de forme :** `rounded-xl` (cards), `rounded-2xl` (sections), `rounded-full` (badges/pills)

**Pattern KPI card :** fond blanc, bordure `gray-100`, `rounded-xl`, ombre `shadow-sm`, valeur en `text-title-md` `font-bold`, label en `text-theme-xs` `text-gray-500`

---

## Ordre de priorité des pages à refondre

| Priorité | Page | Route | Rôle ciblé |
|----------|------|-------|-----------|
| P1 | Dashboard Tenant | `/` | Tenant |
| P1 | Workspace Vendeur | `/(saler)/[slug]` | Saler |
| P2 | Stocks | `/stocks` | Tenant |
| P2 | Clients & Promotions | `/clients` | Tenant |
| P3 | Commandes | `/commandes` (si existe) | Tenant |
| P3 | Produits | `/produits` (si existe) | Tenant |

Traiter chaque page dans l'ordre. Ne pas passer à la suivante avant d'avoir terminé et documenté la précédente.

---

## P1 — Dashboard Tenant (`src/app/(admin)/page.tsx`)

### Problème actuel
Le dashboard agrège correctement les données mais ne communique pas visuellement les 4 bénéfices. Un entrepreneur qui ouvre le dashboard pour la première fois doit comprendre en 10 secondes l'état de son business.

### Ce que le redesign doit accomplir

#### Rangée 1 — KPIs critiques (4 cartes)
Chaque carte doit avoir : valeur principale, variation vs hier (+ ou - en %, coloré), label clair.
- **CA du jour** (USD + CDF, séparé si multicurrency) — couleur brand
- **Dépenses du jour** — couleur error si > seuil
- **Résultat net du jour** (CA - Dépenses) — vert si positif, rouge si négatif
- **Commandes du jour** (nombre de ventes) — couleur success

#### Rangée 2 — Supervision boutiques
Un tableau compact ou une grille de cards, une ligne par boutique, avec :
- Nom de la boutique
- CA du jour pour cette boutique
- Nombre de vendeurs actifs
- Indicateur stock (badge rouge si ≥ 1 produit en stock critique)

**Objectif :** L'entrepreneur voit d'un coup d'œil quelle boutique performe et laquelle a un problème.

#### Rangée 3 — Graphique mensuel (existant)
Conserver le `MonthlySalesChart` existant. Vérifier qu'il est bien lisible en dark mode.

#### Rangée 4 — Top Produits + Top Clients (côte à côte)
- Top 5 produits par CA (déjà présent via `RecentOrders`)
- Top 5 clients par CA (à ajouter — voir `docs/prompts/agent-backend-100pct.md` P3)

#### Bandeau d'alertes (si données disponibles)
En haut du dashboard, sous les KPIs, afficher un bandeau discret (non intrusif) si :
- Il y a des commandes au statut `PENDING` depuis plus de 24h
- Il y a des produits en stock critique
- Il y a des approvisionnements en attente de validation

**Fichiers à lire :**
- `src/app/(admin)/page.tsx`
- `src/lib/dashboard/data.ts`
- `src/components/ecommerce/EcommerceMetrics.tsx`
- `src/components/ecommerce/MonthlySalesChart.tsx`
- `src/components/ecommerce/RecentOrders.tsx`

---

## P1 — Workspace Vendeur

### Problème actuel
Le vendeur a besoin d'une interface de caisse simple et rapide. Explorer `src/app/(saler)/` pour comprendre l'état actuel.

### Ce que le redesign doit accomplir

#### Header contextuel
- Nom de la boutique (grand, visible)
- Exercice actif (ex : "Exercice 2026")
- Bouton de déconnexion discret

#### Zone de création de vente
C'est l'action principale — elle doit dominer l'écran.
- Recherche client (autocomplete existant)
- Ajout de produits : recherche rapide, quantité, prix affiché en temps réel
- Récapitulatif de la commande avec total bien visible
- Promotion appliquée automatiquement (affichée si applicable)
- Bouton "Valider la vente" en vert, grand, centré

#### Résumé de la session du jour
En bas ou en sidebar : CA réalisé par ce vendeur aujourd'hui, nombre de ventes, dernière vente enregistrée.

**Fichiers à explorer (lire avant de modifier) :**
- `src/app/(saler)/` — structure du workspace
- `src/actions/workspace.actions.ts` — `createSale`, `searchProducts`, `searchCustomers`

---

## P2 — Stocks (`src/app/(admin)/stocks/`)

### Problème actuel
Le tableau actuel (`StocksOverviewClient.tsx`) est fonctionnel mais ne communique pas le niveau de risque de chaque stock.

### Ce que le redesign doit accomplir

#### Métriques en haut
- Nombre total de références
- Valeur totale du stock (déjà présent)
- **Produits en stock critique** (badge rouge avec compteur) — nécessite `seuilCritique` sur Product (voir agent backend P1)
- Boutiques avec alertes actives

#### Tableau enrichi
Chaque ligne doit avoir :
- Boutique
- Produit
- Quantité — avec coloration : rouge si critique, orange si faible, vert si OK
- Prix unitaire
- Valeur totale
- Indicateur visuel du niveau (barre de progression ou pastille colorée)

#### Vue par boutique
Permettre de filtrer le tableau par boutique depuis un sélecteur en haut.

**Fichiers à lire :**
- `src/app/(admin)/stocks/StocksOverviewClient.tsx`
- `src/app/(admin)/stocks/page.tsx`
- `src/lib/models/Stock.ts`

---

## P2 — Clients & Promotions (`src/app/(admin)/clients/`)

### Problème actuel
La page `/clients` est en réalité une gestion de promotions. Le lien entre "client" et "fidélisation" n'est pas visible. Les métriques existent (`customers`, `buyingCustomers`, `inactiveCustomers`) mais ne sont pas mises en valeur.

### Ce que le redesign doit accomplir

#### Bandeau de métriques de fidélisation
Mettre en avant (visuellement fort) :
- Clients total
- Clients actifs (avec achat dans les 30 derniers jours)
- Clients inactifs (sans achat depuis > 30 jours) — avec couleur d'alerte
- CA cumulé clients

**Message implicite :** "X clients sont en train de vous quitter — agissez."

#### Cartes promotions améliorées
Chaque carte promotion doit afficher :
- Code + désignation
- Réduction %
- **Nombre de clients éligibles**
- **Nombre de clients ayant utilisé la promotion**
- Statut (badge couleur)
- Liens : "Voir les clients" + "Modifier" + "Archiver"

#### Page client individuel `/clients/[code]`
Afficher pour chaque client de la promotion :
- Nom, téléphone
- Date du dernier achat
- Nombre de commandes total
- CA total
- Badge "Inactif depuis X jours" si applicable

**Fichiers à lire :**
- `src/app/(admin)/clients/ClientsClient.tsx`
- `src/app/(admin)/clients/[code]/PromotionAudienceClient.tsx`
- `src/actions/promotions.actions.ts`

---

## Conventions de code à respecter

### Pattern composant client
```tsx
// Toujours : données initiales en props depuis le Server Component parent
export default function MonClient({ initialData }: { initialData: MonType }) {
  // interactivité uniquement
}
```

### Pattern KPI card (réutiliser le pattern existant dans EcommerceMetrics)
Avant de créer une KPI card, vérifier si `EcommerceMetrics` ou un composant similaire peut être réutilisé ou étendu.

### Couleurs d'état
- `text-success-500` / `bg-success-50` → positif, actif, OK
- `text-warning-500` / `bg-warning-50` → attention, à surveiller
- `text-error-500` / `bg-error-50` → critique, alerte, négatif
- `text-brand-500` / `bg-brand-50` → action primaire, info

### Badges de statut
Utiliser `rounded-full px-2 py-0.5 text-xs font-medium` avec les couleurs d'état ci-dessus.

---

## Ce qu'il ne faut PAS faire

- Ne pas créer de nouveaux composants UI génériques si TailAdmin en fournit déjà un équivalent
- Ne pas refactorer des pages non concernées par cette tâche
- Ne pas changer les routes ou les noms de Server Actions
- Ne pas ajouter d'animations JavaScript complexes
- Ne pas déplacer des données SSR vers useEffect
- Ne pas utiliser d'émojis comme icônes dans l'interface

---

## Rapport final attendu

Pour chaque page modifiée :
- Captures ou description de l'avant / après
- Fichiers modifiés (chemin complet)
- Nouvelles features UI ajoutées
- Points à tester manuellement
- Ce qui reste à faire (si des données backend manquent encore)

Documenter les résultats dans `docs/frontend-alignment.md` en mettant à jour le statut de chaque page (⬜ → ✅ ou ❌ avec raison).
