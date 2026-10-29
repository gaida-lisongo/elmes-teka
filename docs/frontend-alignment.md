# Frontend Alignment — ELMES-TEKA

Alignement de chaque écran sur les 4 bénéfices clés du produit :
1. **Supervision 360°** — voir tout ce qui se passe dans chaque boutique
2. **Fidéliser les clients** — récompenser les meilleurs acheteurs
3. **Connaître ses chiffres** — métriques claires en temps réel
4. **Accès au crédit** — prouver la santé financière de l'activité

---

## Statut par écran

| Écran | Route | Priorité | Statut | Bénéfices ciblés |
|---|---|---|---|---|
| Dashboard Tenant | `/` | P1 | ✅ Redesigné | 1, 3, 4 |
| Workspace Vendeur | (non trouvé) | P1 | ❌ Route absente | — |
| Stocks | `/stocks` | P2 | ✅ Redesigné | 1, 3 |
| Clients & Promotions | `/clients` | P2 | ✅ Redesigné | 2, 3 |
| Commandes | `/commandes` | P3 | ⬜ Non traité | 1, 3 |
| Produits | `/produits` | P3 | ⬜ Non traité | 3 |

---

## P1 — Dashboard Tenant (`/`)

### Fichiers modifiés
- `src/lib/dashboard/types.ts` — nouveaux types `TodayMetrics`, `StoreMetric`, `DashboardAlert`, `TopClientItem`
- `src/lib/dashboard/data.ts` — Promise.all étendu à 13 requêtes (today, stores, alerts, topClients)
- `src/components/ecommerce/EcommerceMetrics.tsx` — 4 KPI cards (CA, Dépenses, Résultat net, Ventes)
- `src/components/ecommerce/DashboardAlerts.tsx` — bandeau d'alertes (commandes pending, approvisionnements)
- `src/components/ecommerce/StoreSupervision.tsx` — tableau de supervision par boutique (TENANT only)
- `src/components/ecommerce/TopClients.tsx` — top 5 clients par CA
- `src/app/(admin)/page.tsx` — nouveau layout (Alerts → KPIs → StoreSupervision → Charts → TopClients)

### Ce que le redesign apporte
- **Supervision 360°** : tableau `StoreSupervision` montre CA, ventes et vendeurs actifs par boutique aujourd'hui
- **Connaître ses chiffres** : 4 KPI cards du jour (CA, dépenses, résultat net, nombre de ventes)
- **Accès au crédit** : TopClients prouve la fidélité et la récurrence
- **Alertes proactives** : `DashboardAlerts` signale les commandes en attente depuis 24h+

---

## P2 — Stocks (`/stocks`)

### Fichiers modifiés
- `src/app/(admin)/stocks/StocksOverviewClient.tsx` — redesign complet
- `src/app/(admin)/stocks/page.tsx` — inclut maintenant les items `qte === 0`

### Ce que le redesign apporte
- **Métriques enrichies** : lignes de stock, valorisation totale, nombre de boutiques, indicateur ruptures/faible/OK
- **Coloration sémantique** :
  - Rouge (`error`) : `qte === 0` → badge "Rupture"
  - Orange (`warning`) : `qte ≤ 5` → badge "Faible"
  - Normal : OK sans badge
- **Filtre boutique** : sélecteur affiché si plusieurs boutiques, filtre le tableau et recalcule les métriques
- **Pied de tableau** : valorisation totale de la sélection

### Limites / hypothèses
- Seuil critique fixé à 5 (pas de champ `seuilCritique` dans le modèle `Product`)
- Le filtre boutique est client-side (données déjà chargées côté serveur)

---

## P2 — Clients & Promotions (`/clients`)

### Fichiers modifiés
- `src/app/(admin)/clients/ClientsClient.tsx` — redesign complet

### Ce que le redesign apporte
- **KPI colorés** :
  - Neutre : total clients
  - Vert (`success`) : clients acheteurs avec pourcentage du total
  - Rouge (`error`) : sans achat avec badge "À réactiver"
  - Brand (`brand`) : CA cumulé + nombre de commandes
- **Cartes promotion enrichies** :
  - Badge de statut coloré (vert = Active, gris = Inactive)
  - 3 stats visuelles : réduction %, seuil produits, crédits actifs
  - Support optionnel `eligibleCount` / `usedCount` si fournis par la page
- **Typage TypeScript** : interfaces `PromotionItem`, `ClientMetrics`, `InitialData` remplacent `any`

---

## P1 — Workspace Vendeur

Route group `(saler)` introuvable dans `src/app/`. Le workspace vendeur n'existe pas encore comme route dédiée ou est servi via une autre structure. Traitement différé.

---

## P3 — Commandes & Produits

Non traités dans cette itération.
