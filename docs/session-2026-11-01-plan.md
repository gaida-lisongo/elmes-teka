# Plan d'implémentation — Session du 1er novembre 2026

**Auteur** : gaida-lisongo · Claude Code  
**Statut** : Décisions validées — prêt à implémenter dans une nouvelle session  
**Base** : branche `main` (inclut déjà le PR #11 `codex/business-packs-20261031`)

---

## 1. État des lieux au démarrage de cette session

### Ce qui est déjà en production (main, post PR #11)

| Fonctionnalité | État |
|---|---|
| Packs Starter / Business / Premium par exercice | ✅ Fait |
| Upgrade proraté signé + confirmation FlexPay | ✅ Fait |
| Isolation multi-tenant sécurisée (sessions, transactions) | ✅ Fait |
| Dépenses avec catégorie (loyer, salaires…) et nature fixe/variable | ✅ Fait |
| PDF financier pdfmake 0.3 (données brutes, sans IA) | ✅ Fait |
| Dashboard Tenant redesigné (KPIs jour, alertes, StoreSupervision, TopClients) | ✅ Fait |
| Stocks redesignés (ruptures, valorisation, filtre boutique) | ✅ Fait |
| Clients & Promotions redesignés | ✅ Fait |
| 17 tests paiement/sécurité passants | ✅ Fait |
| 186 erreurs lint restantes (no-explicit-any, JSX, set-state-in-effect) | ⚠️ Dette technique |

### Ce qui manque (décidé cette session)

- Wizard d'onboarding (aucun exercice actif → redirection)
- `activeAnneeId` sur Tenant + `aiCredits` sur Annee
- Module mining (analyses statistiques sans IA)
- Module IA + crédits (OpenRouter, modèles gratuits)
- Interface chatbot conseiller
- Dossier financement enrichi avec score IA
- Redesign complet du back-office (modernisation)
- Refonte section pricing du front-office

---

## 2. Décisions produit validées

### Flux correct

```
Inscription → Compte gratuit → [Onboarding obligatoire] → Créer exercice
→ Choisir pack → Paiement FlexPay → Exercice actif
```

Les packs ne sont **pas** proposés à l'inscription — seulement à la création d'un exercice.

### Packs (inchangés)

| Pack | Prix | Capacités |
|---|---|---|
| Starter | 50 $/exercice | Ventes, stocks, clients, dashboard opérationnel, export Excel |
| Business | 120 $/exercice | + Analyses mining (BCG, RFM, benchmark, risques) + Export PDF données |
| Premium | 200 $/exercice | + IA Conseiller (chatbot, recommandations, dossier enrichi) + 100 crédits IA inclus |

### Crédits IA (liés à l'exercice, pas au compte)

| Action | Coût crédits |
|---|---|
| Question libre au chatbot | 2 |
| Analyse automatique complète | 5 |
| Génération dossier financement enrichi | 10 |

Recharges FlexPay : 50 cr ($2) · 200 cr ($6) · 500 cr ($12)

### Modèles IA (OpenRouter, validés le 1er novembre 2026)

| Variable | Modèle | Prix | Usage |
|---|---|---|---|
| `AI_MODEL_CHAT` | `nvidia/nemotron-3.5-lightning:free` | $0 | Chat rapide (79 tok/s) |
| `AI_MODEL_ANALYSIS` | `nvidia/nemotron-3-ultra-550b-a55b:free` | $0 | Analyses complexes |
| `AI_MODEL_DOSSIER` | `nvidia/nemotron-3-ultra-550b-a55b:free` | $0 | Dossier financement |
| `AI_MODEL_FALLBACK` | `openrouter/free` | $0 | Auto-route si quota |

**Coût IA total = $0** jusqu'à ~600 tenants Premium actifs.  
Après seuil : $10 unique sur OpenRouter → quota passe de 50 à 1 000 req/jour.

### Variables d'environnement à ajouter

```dotenv
# Serveur uniquement — jamais NEXT_PUBLIC_
OPENROUTER_API_KEY=sk-or-...

AI_MODEL_CHAT=nvidia/nemotron-3.5-lightning:free
AI_MODEL_ANALYSIS=nvidia/nemotron-3-ultra-550b-a55b:free
AI_MODEL_DOSSIER=nvidia/nemotron-3-ultra-550b-a55b:free
AI_MODEL_FALLBACK=openrouter/free
```

---

## 3. Notions statistiques du module mining

Toutes ces formules sont **closed-form** : aucune librairie externe, calcul pur JS / pipeline MongoDB.

| Question métier | Notion | Formule clé |
|---|---|---|
| Prévision ventes S+1 | Régression linéaire OLS | `b = [nΣxy − ΣxΣy] / [nΣx² − (Σx)²]` |
| Qualité de la prévision | R² + RMSE | `R² = 1 − SS_res/SS_tot` |
| Intervalle de prédiction | Erreur de prévision | `ŷ ± 1.5 × RMSE` |
| Différence entre 2 groupes | t-test de Welch | `t = (x̄₁−x̄₂) / √(s₁²/n₁ + s₂²/n₂)` |
| Différence entre k groupes | ANOVA F-test | `F = SS_between/(k−1) / SS_within/(N−k)` |
| Identifier les paires | Cohen's d | `d = (μ₁−μ₂) / s_poolé` |
| Segmentation clients | RFM + terciles | Score 1-3 sur Recency, Frequency, Monetary |
| Instabilité produit | CV | `CV = σ/μ` |

---

## 4. Équipes et agents d'implémentation

### Organisation

```
┌─────────────────────────────────────────────────┐
│              Équipe 0 — Orchestrateur            │
│  • Valide le build après chaque équipe           │
│  • Vérifie l'isolation multi-tenant              │
│  • Lance pnpm build + pnpm lint avant tout PR    │
└──────────┬──────────┬──────────┬────────────────┘
           │          │          │
     Équipe 1    Équipe 2    Équipe 3    Équipe 4
   Fondations    Mining      IA+Crédits  Design
```

---

### Équipe 0 — Orchestrateur (transversal)

**Rôle** : coordination, build, lint, sécurité, cohérence.

- [ ] `pnpm build` doit passer en vert avant chaque PR
- [ ] `pnpm lint` — réduire les 186 erreurs restantes au fil des équipes
- [ ] Vérifier isolation tenant sur chaque nouvelle route/action
- [ ] Vérifier que `OPENROUTER_API_KEY` n'est jamais exposé côté client

---

### Équipe 1 — Fondations (bloquant pour tout le reste)

**Périmètre** : migration, switch d'exercice, onboarding, dashboard adaptatif.

#### Agent 1-A — Modèles + migration

Fichiers à modifier :

| Fichier | Modification |
|---|---|
| `src/lib/models/User.ts` | Ajouter `activeAnneeId?: Types.ObjectId` sur `ITenant` |
| `src/lib/models/Annee.ts` | Ajouter `aiCredits: { total: number; used: number; lastResetAt: Date }` |
| `src/scripts/migrate-plans.ts` | Script one-shot : tous les exercices actifs → Business ; compte `inbtpkinshasa@gmail.com` → Premium avec 100 crédits |

**Règle migration** : ne modifier que les exercices `ACTIVE` ou `COMPLETED`. Ne pas toucher aux exercices `PENDING` ou `CANCELLED`.

#### Agent 1-B — Switch d'exercice actif

Fichier : `src/actions/annees.actions.ts`

Nouvelle action `setActiveAnnee(anneeId: string)` :
1. Vérifie session tenant
2. Vérifie que l'exercice appartient au tenant et est `ACTIVE+PAID`
3. Met à jour `Tenant.activeAnneeId`
4. `revalidatePath("/dashboard")` + `revalidatePath("/annees")`

Fallback si `activeAnneeId` null : dernier exercice `ACTIVE+PAID` par `fin` décroissante.

Fichier : `src/app/(admin)/(others-pages)/annees/AnneesClient.tsx`  
Ajouter un bouton "Travailler sur cet exercice" qui appelle `setActiveAnnee`.

#### Agent 1-C — Wizard d'onboarding

Fichier : `src/app/(full-width-pages)/(auth)/signin/page.tsx`  
Rediriger vers `/onboarding` si `session.anneeActive === null`.

Fichier à créer : `src/app/(admin)/onboarding/page.tsx`

5 étapes :
1. Bienvenue + nom entreprise
2. Type d'activité (commerce, service, mixte)
3. Créer le premier exercice (dates)
4. Choisir le pack (Starter / Business / Premium)
5. Paiement FlexPay → redirection dashboard

Chaque étape valide avant de continuer. Conservation des données entre étapes (état local client).

#### Agent 1-D — Dashboard adaptatif

Fichier : `src/app/(admin)/layout.tsx`  
Ajouter dans le menu selon le pack de `activeAnneeId` :
- Business → section "Intelligence" (route `/intelligence`)
- Premium → section "Conseiller IA" (route `/advisor`)

Fichier : `src/app/(admin)/dashboard/page.tsx`  
Masquer les sections mining / IA si le pack de l'exercice actif ne les inclut pas.

---

### Équipe 2 — Mining (Business+)

**Périmètre** : analyses statistiques pures, pas d'IA, pas d'appel externe.

#### Agent 2-A — `product-analysis.ts`

Fichier : `src/lib/mining/product-analysis.ts`

```typescript
// Exports :
getProductVelocity(tenantId, anneeId, shopId?) → série hebdomadaire par produit
forecastNextWeek(series: number[]) → { forecast, rmse, r2, low, high }
getBCGMatrix(tenantId, anneeId) → { stars, cashCows, dogs, questionMarks }[]
```

Algorithme de prévision :
- Calcul OLS sur 8 semaines glissantes
- Si R² < 0.3 : fallback sur moyenne mobile pondérée (poids 4/4/3/3/2/2/1/1)
- Intervalle = ŷ ± 1.5 × RMSE

#### Agent 2-B — `customer-rfm.ts`

Fichier : `src/lib/mining/customer-rfm.ts`

```typescript
// Exports :
computeRFM(tenantId, anneeId) → { clientId, name, scoreR, scoreF, scoreM, segment }[]
compareSegments(rfmData) → { segments: SegmentStats[], fStat, hasDifference }
getTopSegmentPairs(segments) → { pair, cohenD, relative, detectable }[]
```

Segments définis :
- `333` → Champions
- score R+F ≥ 5 → Loyaux
- scoreR = 1 → À risque
- scoreM = 1 → Petits acheteurs
- reste → Potentiels

#### Agent 2-C — `store-benchmark.ts`

Fichier : `src/lib/mining/store-benchmark.ts`

```typescript
// Exports :
benchmarkStores(tenantId, anneeId) → {
  storeId, designation,
  caTotal, caMoyenJour, tendance,
  parProductCategory: { category, ca, share }[]
}[]
```

#### Agent 2-D — `risk-detector.ts`

Fichier : `src/lib/mining/risk-detector.ts`

```typescript
// Exports :
detectRisks(tenantId, anneeId) → {
  type: "RUPTURE" | "LIQUIDITE" | "CONCENTRATION" | "TENDANCE_BASSE",
  severity: "HIGH" | "MEDIUM" | "LOW",
  message: string,
  affectedItems: string[]
}[]
```

#### Agent 2-E — `financial-solver.ts`

Fichier : `src/lib/mining/financial-solver.ts`

```typescript
// Exports :
computeSolvabilityScore(tenantId, anneeId) → {
  score: number,          // 0–100
  components: {
    regularite: number,   // régularité des ventes
    croissance: number,   // tendance CA
    diversification: number, // concentration clients/produits
    marge: number,        // (CA − dépenses) / CA
  },
  interpretation: string
}
```

**Important** : le score est indicatif, calculé de façon déterministe. Pas de décision de crédit automatique. Toujours accompagné d'une mention de limitation.

#### Agent 2-F — Page `/intelligence`

Fichier : `src/app/(admin)/intelligence/page.tsx`

Sections :
- Forecasting produit (sélecteur boutique + produit + graphique prévision)
- Segmentation clients RFM (tableau des segments + indicateur de différence)
- Benchmark inter-boutiques (tableau comparatif)
- Alertes risques (liste avec sévérité)
- Score de solvabilité

---

### Équipe 3 — IA + Crédits (Premium)

**Dépend de** : Équipe 1 entièrement terminée + Équipe 2 entièrement terminée.

#### Agent 3-A — `llm-client.ts`

Fichier : `src/lib/ai/llm-client.ts`

```typescript
const MODEL_DEFAULTS = {
  chat:     process.env.AI_MODEL_CHAT     ?? "nvidia/nemotron-3.5-lightning:free",
  analysis: process.env.AI_MODEL_ANALYSIS ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
  dossier:  process.env.AI_MODEL_DOSSIER  ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
  fallback: process.env.AI_MODEL_FALLBACK ?? "openrouter/free",
}
// callLLM(type, systemPrompt, userPrompt) → string
// Gère : retry, timeout 30s, fallback si quota 429
```

**Sécurité** :
- `OPENROUTER_API_KEY` uniquement côté serveur
- Jamais de données tenant dans les headers
- Timeout 30s, retry ×2 sur 429 avec backoff

#### Agent 3-B — `context-builder.ts`

Fichier : `src/lib/ai/context-builder.ts`

Assemble le contexte métier pour le prompt :
- Appelle les fonctions de `src/lib/mining/`
- Produit un résumé structuré en texte (pas de JSON brut au LLM)
- Limite : 800 tokens d'entrée max
- Aucun mot de passe, secret, ou donnée d'un autre tenant

#### Agent 3-C — `advisor.actions.ts` + `credits.actions.ts`

Fichier : `src/actions/advisor.actions.ts`
- `getRecommendations(anneeId)` → recommandations automatiques (5 crédits)
- `sendChatMessage(anneeId, message, history)` → réponse chatbot (2 crédits)
- `generateEnrichedDossier(anneeId)` → narrative IA + score (10 crédits)
- Chaque action vérifie : session Premium + crédits suffisants + tenant isolé

Fichier : `src/actions/credits.actions.ts`
- `getCreditsBalance(anneeId)` → solde actuel
- `deductCredits(anneeId, amount)` → déduire
- `initiateRecharge(anneeId, pack)` → créer ordre FlexPay

#### Agent 3-D — Route FlexPay crédits

Fichier : `src/app/api/payments/flexpay/credits/route.ts`

Callback de confirmation de recharge crédits :
1. Vérifier signature FlexPay
2. Retrouver l'ordre par référence
3. Vérifier que l'exercice appartient au tenant de l'ordre
4. Incrémenter `Annee.aiCredits.total`
5. Marquer l'ordre comme confirmé (idempotent)

#### Agent 3-E — Page `/advisor`

Fichier : `src/app/(admin)/advisor/page.tsx`

Sections :
- Compteur crédits (badge en haut à droite)
- Recommandations automatiques (5 cartes max, bouton "Générer")
- Chatbot conversationnel avec historique (20 messages max)
- Modale de recharge si crédits = 0
- Bouton "Générer dossier enrichi" (10 crédits, désactivé si < 10)

---

### Équipe 4 — Design & Front-office (parallélisable avec Équipe 1)

> **Contexte** : le dashboard actuel ne ressemble pas au hero du front-office.  
> Le hero montre un back-office moderne, animé, avec des gradients et des cartes épurées.  
> La section pricing de la landing page est visuellement obsolète.

#### Agent 4-A — Modernisation du back-office

**Objectif** : aligner le look du back-office avec le niveau visuel du hero de la landing page.

Inspirations visuelles à appliquer :
- Cartes avec fond semi-transparent + bordure subtle
- KPI cards avec icônes SVG + tendance (flèche haut/bas + couleur)
- Graphiques avec gradients (pas de couleurs pleines) — Chart.js ou Recharts selon l'existant
- Sidebar avec indicateur actif animé (fond pill, transition smooth)
- Header avec breadcrumb + avatar + notification bell
- Tables avec `hover:bg-sidebar-hover` et lignes alternées subtiles
- Microanimations CSS : `transition-all duration-200`, `hover:scale-[1.01]`
- Badges de statut avec dot coloré animé (pulse pour ACTIVE)
- Skeleton loading au lieu de spinners
- Palette : garder la palette de `DESIGN-SYSTEM.md` — juste appliquer les tokens correctement

Fichiers concernés (ne pas tout recréer — modifier les composants existants) :
- `src/components/ecommerce/EcommerceMetrics.tsx` — cartes KPI modernes
- `src/components/ecommerce/MonthlySalesChart.tsx` — gradient fill + tooltip moderne
- `src/components/ecommerce/StoreSupervision.tsx` — cartes boutiques avec tendance
- `src/components/ecommerce/TopClients.tsx` — liste avec avatar initial + badge
- `src/app/(admin)/layout.tsx` — sidebar + header moderne
- `src/components/ui/` — boutons, badges, inputs si besoin de tokens uniformes

**Règle** : utiliser uniquement les SVG de `/icons`. Aucun emoji. Aucune librairie d'icônes externe.

#### Agent 4-B — Refonte section pricing (landing page)

**Problème** : la section pricing est visuellement pauvre et ne convainc pas.

**Objectif** : en faire une section qui donne envie de choisir un pack.

Structure à implémenter :
```
[Toggle mensuel / annuel]  ← si applicable plus tard

┌─────────────┐  ┌────────────────────────┐  ┌─────────────┐
│   Starter   │  │       Business         │  │   Premium   │
│   $50/an    │  │  ★ Recommandé $120/an  │  │  $200/an    │
│             │  │  (carte mise en avant) │  │             │
│ • Feature 1 │  │  • Feature 1           │  │ • Tout Biz  │
│ • Feature 2 │  │  • Feature 2           │  │ • + IA      │
│             │  │  • Feature 3           │  │ • + Dossier │
│ [Commencer] │  │  [Commencer →]         │  │ [Commencer] │
└─────────────┘  └────────────────────────┘  └─────────────┘
```

Éléments à soigner :
- Carte "Business" légèrement plus grande avec badge "Le plus populaire"
- Fond carte Premium avec gradient subtle (pas blanc uni)
- Checklist avec icône SVG check (pas `•`)
- Bouton CTA de chaque pack avec couleur distincte
- Section FAQ sous le pricing (3 questions clés)
- Note sous les cards : "Prix par exercice comptable, pas par mois"

Fichier à modifier : chercher la page landing existante (`src/app/(site)/` ou `src/app/(public)/`) et le composant pricing.

---

## 5. Fichiers à créer (résumé)

```
src/lib/mining/
  product-analysis.ts
  customer-rfm.ts
  store-benchmark.ts
  risk-detector.ts
  financial-solver.ts

src/lib/ai/
  context-builder.ts
  llm-client.ts

src/actions/
  advisor.actions.ts
  credits.actions.ts

src/app/(admin)/
  onboarding/page.tsx
  intelligence/page.tsx
  advisor/page.tsx

src/app/api/payments/flexpay/credits/route.ts

src/scripts/
  migrate-plans.ts
```

---

## 6. Fichiers existants à modifier

| Fichier | Équipe | Modification |
|---|---|---|
| `src/lib/models/User.ts` | 1-A | Ajouter `activeAnneeId` sur ITenant |
| `src/lib/models/Annee.ts` | 1-A | Ajouter `aiCredits` |
| `src/actions/annees.actions.ts` | 1-B | Ajouter `setActiveAnnee()` |
| `src/app/(admin)/(others-pages)/annees/AnneesClient.tsx` | 1-B | Bouton "Travailler sur cet exercice" |
| `src/app/(full-width-pages)/(auth)/signin/page.tsx` | 1-C | Redirect vers /onboarding si pas d'exercice actif |
| `src/app/(admin)/layout.tsx` | 1-D + 4-A | Menus conditionnels + modernisation sidebar |
| `src/app/(admin)/dashboard/page.tsx` | 1-D | Sections adaptatives selon pack |
| `src/components/ecommerce/EcommerceMetrics.tsx` | 4-A | KPI cards modernes |
| `src/components/ecommerce/MonthlySalesChart.tsx` | 4-A | Gradient + tooltip |
| `src/components/ecommerce/StoreSupervision.tsx` | 4-A | Cartes boutiques modernes |
| `src/components/ecommerce/TopClients.tsx` | 4-A | Liste avec avatar |
| Landing page — section pricing | 4-B | Refonte complète pricing |

---

## 7. Ordre d'exécution recommandé

```
Phase 1 (bloquant) :
  Équipe 1 — Fondations (1-A → 1-B → 1-C → 1-D)
  Équipe 4 — Design (en parallèle, aucune dépendance)

Phase 2 :
  Équipe 2 — Mining (après Équipe 1)

Phase 3 :
  Équipe 3 — IA + Crédits (après Équipe 1 + 2)

Phase 4 :
  Équipe 0 — Build + lint final + recette manuelle
```

---

## 8. Recette manuelle complète

- [ ] Nouveau compte → atterrit sur `/onboarding`
- [ ] Onboarding Starter → dashboard sans Intelligence ni Conseiller
- [ ] Créer exercice Business → "Intelligence" apparaît dans le menu
- [ ] Activer un exercice depuis `/annees` → dashboard bascule dessus
- [ ] Module mining : prévision semaine+1 pour un produit avec historique
- [ ] Module mining : segmentation RFM, différence entre segments affichée
- [ ] Passer à Premium → "Conseiller IA" apparaît, compteur 100 crédits
- [ ] Envoyer 50 messages → 0 crédits → modale de recharge
- [ ] Recharge 50 crédits via FlexPay → crédits remontés à 50
- [ ] Générer dossier enrichi → 10 crédits déduits
- [ ] Vérifier qu'un tenant Starter ne peut pas appeler `advisor.actions.ts` (403)
- [ ] Vérifier isolation tenant : tenant A ne voit pas les données de tenant B
- [ ] `OPENROUTER_API_KEY` absent des logs browser et des réponses client
- [ ] Landing page : section pricing lisible et convaincante sur mobile
- [ ] Back-office : microanimations fluides, pas de flash de layout

---

## 9. Note sur la fusion avec la branche codex

La branche `codex/business-packs-20261031` est **déjà fusionnée dans main** (PR #11 mergé).  
Il n'y a rien à fusionner. La session future part directement de `main`.

Points à ne pas casser lors de l'implémentation :
- La logique de prorata d'upgrade (signée côté serveur, vérifiée FlexPay)
- L'idempotence du callback FlexPay (replay de callback = pas de double crédit)
- L'index unique `{ shopId, reference }` sur Commande
- Les transactions MongoDB pour la création de boutiques
- Les endpoints `/api/agent/seed` et `/api/agent/setup` restent interdits en production

---

*Ce document est la source de vérité pour la prochaine session d'implémentation.*  
*Lire aussi : `docs/plan-restructuration.md` (détail IA), `docs/openrouter-models-nov2026.md` (modèles validés).*
