# Plan de restructuration ELMES-TEKA
## Data Mining · IA Conseiller · Crédits · Onboarding

Date de rédaction : 31 octobre 2026
Validé par : gaida-lisongo

---

## Décisions validées

| # | Décision |
|---|---|
| 1 | Onboarding obligatoire si aucun exercice actif. Dashboard adaptatif par pack. |
| 2 | Migration : tous les anciens exercices actifs → Business. Compte inbtpkinshasa@gmail.com → Premium. Ajout de `activeAnneeId` sur Tenant pour le switch d'exercice. |
| 3 | Acquisition via codes promo gérés par l'admin plateforme (déjà en place). |
| 4 | Crédits IA liés à l'exercice. 100 crédits inclus en Premium. Recharge via FlexPay. Interface chatbot TailAdmin (patron visuel ShadCN sans la dépendance). |

---

## Modèles IA retenus

Fournisseur : **OpenRouter** (`https://openrouter.ai/api/v1`)
Variable d'environnement serveur : `OPENROUTER_API_KEY`

### Stratégie : modèles gratuits d'abord, modèle payant en fallback si quota dépassé

Les requêtes ELMES-TEKA sont courtes (~800 tokens entrée + 300 sortie).
Les modèles `:free` d'OpenRouter couvrent 100 % du besoin — **coût IA = $0**.

> **Limite des modèles :free** : 50 req/jour sans crédit, 1 000 req/jour dès que le compte
> OpenRouter a été rechargé de $10 minimum (une seule fois). Suffisant pour tous les tenants
> Premium combinés au démarrage.

### Modèles validés sur OpenRouter (1er novembre 2026)

| Variable | ID OpenRouter | Prix | Contexte | Paramètres actifs | Usage |
|---|---|---|---|---|---|
| `AI_MODEL_CHAT` | `nvidia/nemotron-3.5-lightning:free` | $0 | 1M | 3B/30B MoE | Chat rapide, quotidien |
| `AI_MODEL_ANALYSIS` | `nvidia/nemotron-3-ultra-550b-a55b:free` | $0 | 1M | 55B/550B MoE | Analyses complexes |
| `AI_MODEL_DOSSIER` | `nvidia/nemotron-3-ultra-550b-a55b:free` | $0 | 1M | 55B/550B MoE | Dossier financement |
| `AI_MODEL_FALLBACK` | `openrouter/free` | $0 | variable | auto | Auto-route si quota |

**Alternatifs si les modèles ci-dessus ne répondent pas bien en français :**

| ID | Prix | Note |
|---|---|---|
| `thinkingmachines/inkling:free` | $0 | 975B MoE, multilingue, conversationnel |
| `thinkingmachines/inkling-small:free` | $0 | 276B MoE, plus léger |
| `google/gemma-4-26b-a4b-it:free` | $0 | Google, multimodal, 262K ctx |
| `qwen/qwen3.5-flash-02-23` | ~$0.01/M | Payant, 1M ctx, si free insuffisant |

> **Test de validation** : avant déploiement, envoyer un prompt en français commercial
> congolais à chaque modèle candidat et comparer la qualité de la réponse.

### Règle de sélection automatique
```
type PromptType = "chat" | "analysis" | "dossier"

chat     → AI_MODEL_CHAT      (2 crédits/requête)
analysis → AI_MODEL_ANALYSIS  (5 crédits/requête)
dossier  → AI_MODEL_DOSSIER   (10 crédits/requête)

Si credits < 5 → fallback sur AI_MODEL_FALLBACK (chat uniquement)
```

### Budget simulé
100 crédits inclus ≈ 50 questions chat OU 20 analyses OU 10 dossiers.
Avec les modèles gratuits : **coût IA = $0** par exercice Premium.
Même à 1 000 tenants Premium actifs = **$0/mois** de coût IA (hors $10 unique de seuil).

---

## Correction fondamentale du flux

### Avant (incorrect)
```
Inscription → Choix pack → Paiement → Exercice
```

### Après (correct)
```
Inscription → Compte gratuit → ... → Créer exercice → Choisir pack → Paiement → Exercice actif
```

---

## Packs restructurés

### Starter — 50 $/exercice — "Gérer au quotidien"
- 1 boutique, vendeurs illimités
- Ventes, dépenses, stocks, clients
- Dashboard essentiel + alertes stock
- Export Excel (journal)

### Business — 120 $/exercice — "Comprendre et piloter"
- Tout Starter + multi-boutiques
- Analyses produits (matrice BCG simplifiée)
- Segmentation clients RFM
- Benchmark inter-boutiques
- Alertes risques (liquidité, concentration, rupture)
- Export PDF dossier financier (données brutes)

### Premium — 200 $/exercice — "Être conseillé et finançable"
- Tout Business
- Recommandations IA (produits, clients, marchés, risques)
- Assistant conversationnel avec historique
- Score de solvabilité calculé
- Dossier de financement enrichi (données + IA)
- 100 crédits IA inclus + recharge disponible

---

## Crédits IA

### Tarif des recharges (FlexPay)
| Pack | Crédits | Prix |
|---|---|---|
| Inclus Premium | 100 | offert |
| Mini | 50 | 2 $ |
| Standard | 200 | 6 $ |
| Pro | 500 | 12 $ |

### Coût par action
| Action | Crédits |
|---|---|
| Question libre à l'assistant | 2 |
| Analyse automatique complète | 5 |
| Génération dossier financement PDF enrichi | 10 |

### Champ ajouté sur Annee
```typescript
aiCredits: {
  total: number     // dotation initiale + recharges
  used: number      // consommés
  lastResetAt: Date // date de la dotation initiale
}
```

---

## Nouveau champ sur Tenant

```typescript
activeAnneeId?: Types.ObjectId  // exercice sélectionné par le tenant
```

Action `setActiveAnnee(anneeId)` :
1. Vérifie que l'exercice appartient au tenant et est ACTIVE+PAID
2. Met à jour `Tenant.activeAnneeId`
3. Revalidate `/dashboard` et `/annees`

Fallback : si `activeAnneeId` est null ou expiré → dernier exercice ACTIVE+PAID par date de fin décroissante.

---

## Nouvelles routes

| Route | Accès | Description |
|---|---|---|
| `/onboarding` | Tout tenant sans exercice actif | Wizard de démarrage |
| `/intelligence` | Business + Premium | Analyses mining |
| `/advisor` | Premium | Recommandations IA + chatbot |
| `/advisor/chat` | Premium | Assistant conversationnel |
| `/api/payments/flexpay/credits` | Serveur | Callback recharge crédits |

---

## Nouveaux fichiers

```
src/lib/mining/
  product-analysis.ts       vélocité, rotation, matrice BCG
  customer-rfm.ts           segmentation Recency/Frequency/Monetary
  store-benchmark.ts        comparaison inter-boutiques
  risk-detector.ts          liquidité, concentration, ruptures
  financial-solver.ts       score solvabilité, capacité crédit

src/lib/ai/
  context-builder.ts        assemble les insights pour le prompt
  llm-client.ts             appel OpenRouter sécurisé, sélection modèle

src/actions/
  advisor.actions.ts        recommandations + chat (Premium only)
  credits.actions.ts        déduire, recharger, consulter solde

src/app/(admin)/
  onboarding/page.tsx       wizard multi-étapes
  intelligence/page.tsx     dashboard mining (Business+)
  advisor/page.tsx          page conseiller + chatbot (Premium)

src/scripts/
  migrate-plans.ts          migration one-shot (à supprimer après)
```

---

## Fichiers existants à modifier

| Fichier | Modification |
|---|---|
| `src/lib/models/Annee.ts` | Ajouter champ `aiCredits` |
| `src/lib/models/User.ts` | Ajouter `activeAnneeId` sur ITenant |
| `src/lib/payments/plans.ts` | Mettre à jour descriptions des features |
| `src/app/(admin)/layout.tsx` | Ajouter routes Intelligence + Advisor dans le menu selon pack |
| `src/app/(admin)/dashboard/page.tsx` | Adapter les sections selon le pack de l'exercice actif |
| `src/actions/annees.actions.ts` | Ajouter `setActiveAnnee()` |
| `src/app/(admin)/(others-pages)/annees/AnneesClient.tsx` | Bouton "Activer pour travailler" |
| `src/app/(full-width-pages)/(auth)/signin/page.tsx` | Rediriger vers /onboarding si aucun exercice actif |

---

## Roadmap des sous-agents

### Agent 0 — Fondations
**Périmètre** : Migration, modèles, switch exercice, onboarding, dashboard adaptatif

Tâches :
- [ ] Exécuter `migrate-plans.ts` (one-shot)
- [ ] Ajouter `activeAnneeId` sur Tenant, `aiCredits` sur Annee
- [ ] Implémenter `setActiveAnnee()` dans `annees.actions.ts`
- [ ] Créer le wizard `/onboarding` (5 étapes)
- [ ] Adapter `layout.tsx` pour afficher Intelligence/Advisor selon pack
- [ ] Adapter le Dashboard pour masquer/afficher sections selon pack

Dépendances : aucune (fondation)
Priorité : **P0 — bloquant pour tous les autres**

---

### Agent 1 — Mining (sans IA)
**Périmètre** : Calculs statistiques purs MongoDB, page Intelligence

Tâches :
- [ ] `product-analysis.ts` (BCG, vélocité, tendance)
- [ ] `customer-rfm.ts` (segmentation RFM, clients à risque)
- [ ] `store-benchmark.ts` (ratios inter-boutiques)
- [ ] `risk-detector.ts` (liquidité, concentration, ruptures)
- [ ] `financial-solver.ts` (score solvabilité)
- [ ] Page `/intelligence` avec tableaux et alertes visuelles

Dépendances : Agent 0 terminé
Priorité : **P1**

---

### Agent 2 — IA et Crédits
**Périmètre** : LLM client, conseiller, chatbot, système de crédits

Tâches :
- [ ] `llm-client.ts` (appel OpenRouter, sélection modèle par type, quota)
- [ ] `context-builder.ts` (assemble insights de Agent 1)
- [ ] `advisor.actions.ts` (recommandations auto + chat, débit crédits)
- [ ] `credits.actions.ts` (consulter, déduire, déclencher recharge)
- [ ] Page `/advisor` (recommandations + chatbot TailAdmin)
- [ ] Modale de recharge quand crédits = 0

Dépendances : Agent 0 + Agent 1 terminés, `OPENROUTER_API_KEY` configurée
Priorité : **P2**

---

### Agent 3 — Dossier financement enrichi
**Périmètre** : PDF avec score + analyse IA

Tâches :
- [ ] Enrichir `exportDossierFinancement()` avec le score de `financial-solver.ts`
- [ ] Appel LLM pour rédiger l'analyse narrative du dossier
- [ ] Ajouter bouton "Générer dossier enrichi" dans `/advisor` (10 crédits)
- [ ] Route FlexPay `/api/payments/flexpay/credits` pour les recharges

Dépendances : Agent 0 + Agent 1 + Agent 2 terminés
Priorité : **P3**

---

## Variables d'environnement à ajouter

```dotenv
# OpenRouter (serveur uniquement, jamais NEXT_PUBLIC_)
OPENROUTER_API_KEY=sk-or-...

# Modèles (valeurs par défaut dans llm-client.ts si non définies)
# IDs validés sur OpenRouter le 1er novembre 2026 — gratuits
AI_MODEL_CHAT=nvidia/nemotron-3.5-lightning:free
AI_MODEL_ANALYSIS=nvidia/nemotron-3-ultra-550b-a55b:free
AI_MODEL_DOSSIER=nvidia/nemotron-3-ultra-550b-a55b:free
AI_MODEL_FALLBACK=openrouter/free
```

---

## Recette manuelle après implémentation

- [ ] Créer un compte neuf → doit atterrir sur /onboarding
- [ ] Compléter l'onboarding avec un pack Starter → dashboard Starter (sans Intelligence)
- [ ] Créer un second exercice Business → Intelligence apparaît dans le menu
- [ ] Activer l'exercice 2024 depuis /annees → le dashboard bascule sur 2024
- [ ] Passer à Premium → chatbot visible, compteur crédits affiché
- [ ] Envoyer 50 questions → crédits tombent à 0 → modale de recharge apparaît
- [ ] Vérifier qu'un tenant Starter ne peut pas appeler advisor.actions.ts directement
- [ ] Vérifier isolation tenant : un tenant ne voit pas les données d'un autre
