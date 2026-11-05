# Rapport — Exploration complète du dossier `projet-memoire/`

**Date :** 5 novembre 2026  
**Objet :** Synthèse de tout ce qui a été lu dans le dossier Google Drive `projet-memoire/`  
**Rédigé par :** Claude Sonnet 4.6, session `https://claude.ai/code/session_01CjEe18r1VkHYDeAsK3dPRo`

---

## Table des matières

1. [Structure du dossier](#1-structure-du-dossier)
2. [Contexte du projet ELMES-TEKA](#2-contexte-du-projet-elmes-teka)
3. [Framing du mémoire de Nathan](#3-framing-du-mémoire-de-nathan)
4. [Résultats expérimentaux](#4-résultats-expérimentaux)
5. [Module `customer-rfm.ts` — Analyse complète](#5-module-customer-rfmts--analyse-complète)
6. [Défauts identifiés par l'audit](#6-défauts-identifiés-par-laudit)
7. [Fiches de lecture (`fiches/`)](#7-fiches-de-lecture-fiches)
8. [Ressources épistémologiques (`cours/`)](#8-ressources-épistémologiques-cours)
9. [Instructions et jury (`instructions/`)](#9-instructions-et-jury-instructions)
10. [Liste des travaux à analyser (`liste/`)](#10-liste-des-travaux-à-analyser-liste)
11. [Sous-dossiers en cours d'exploration](#11-sous-dossiers-en-cours-dexploration)
12. [Synthèse critique et recommandations](#12-synthèse-critique-et-recommandations)

---

## 1. Structure du dossier

```
projet-memoire/
├── LISEZ-MOI.md
├── Rapport_Resultats_Cadrage_Redaction_Memoire_ELMES_TEKA_2026-11-02.md
├── Synthese_Cadrage_Memoire_Segmentation_ELMES_TEKA_2026-11-02.md
├── Fiche_Synthese_Sujet_B_Segmentation_RFM_ELMES_TEKA_2026-11-02.md
├── Rapport_Cadrage_Sujets_ELMES_TEKA_2026-11-02.md
├── Rapport_Audit_Approfondi_ELMES_TEKA_2026-11-02.md
├── Synthese_Cadrage_Memoire_ELMES_TEKA.md
├── Constat_ELMES_TEKA_Intelligence_Economique_2026-11-02.md
│
├── cours/                 # 8 PDFs — épistémologie et méthodes de recherche
├── fiches/                # 10 fiches de lecture (9 .md + 1 PDF)
├── instructions/          # 2 fichiers — instructions ChatGPT + jury Claude
├── liste/                 # 1 fichier — liste des travaux à analyser
├── contenu/               # documents de travail du jury [exploration en cours]
├── recherche/             # corpus de recherche [exploration en cours]
└── version-v2/            # [non exploré à la date de rédaction]
```

**Fichiers spéciaux (mimeType vidéo dans Drive, récupérés via download) :**
- `customer-rfm.ts` — `video/vnd.dlna.mpeg-tts` → TypeScript réel de 744 lignes

**Autres fichiers repérés mais non lus :**
- `analyse_rfm.ipynb` — Notebook Jupyter (523 KB)
- `ELMES_TEKA_Resultats_Mission_RFM_2026-11-02.zip` — archive (~54 MB)
- `Analyse_methodologique_et_simulation_RFM_2026-11-05_v2.md` — méthodologie v2
- Plusieurs PDFs RFM académiques (`rfm-transitions.pdf`, `rfm-amount-sensitivity.pdf`, etc.)

---

## 2. Contexte du projet ELMES-TEKA

ELMES-TEKA est un **CRM SaaS de gestion commerciale** conçu par ELMES pour les **entrepreneurs congolais formels et informels** (République Démocratique du Congo).

### Architecture technique

| Couche | Choix |
|--------|-------|
| Framework | Next.js (App Router) |
| Langage | TypeScript |
| Base de données | MongoDB (Mongoose) |
| Temps réel | Pusher |
| Images | Cloudinary |
| Authentification | Session + secret côté serveur |

### Rôles métier

| Rôle | Périmètre |
|------|-----------|
| **Tenant** | Propriétaire : gère ses boutiques, vendeurs, produits, exercices, stocks, clients, promotions, transactions |
| **Saler** | Vendeur : agit dans sa boutique assignée et sur les exercices autorisés |

### Modules de mining embarqués

- `customer-rfm.ts` — segmentation RFM clients
- `financial-solver.ts` — analyse financière
- `risk-detector.ts` — détection de risque
- `product-analysis.ts` — analyse produits
- `store-benchmark.ts` — benchmark boutiques
- `context-builder.ts` — construction de contexte IA

**Commit de référence des expériences :** `b062a93a7be96d082dee9afe66b9f4f1f9ebecaa`

---

## 3. Framing du mémoire de Nathan

### 3.1 Sujet retenu — Sujet B, Variante 2

Parmi trois sujets envisagés (A : prévision des ventes, B : valeur prospective RFM, C : fiabilité du diagnostic), le **Sujet B Variante 2 (ANOVA / montant continu)** a été retenu comme le plus direct pour l'évaluation statistique.

**Question centrale :**  
> La segmentation RFM produite par ELMES-TEKA permet-elle de distinguer des groupes de clients significativement différents en termes de chiffre d'affaires, et cette distinction est-elle robuste aux perturbations courantes des données commerciales ?

### 3.2 Positionnement épistémologique

| Couche | Choix |
|--------|-------|
| Paradigme | **Pragmatisme** |
| Stratégie | **DSR** (Design Science Research) |
| Raisonnement | **Abductif** |
| Mode d'évaluation | **Quantitatif** |

Références clés : Hevner 2004, Peffers 2007.

### 3.3 Les trois hypothèses de travail

**H1 — Conformité :**  
L'implémentation de `computeRFM` est conforme aux spécifications RFM théoriques, à une tolérance d'arrondi machine près.  
*(Références : `customer-rfm.ts` lignes 465–535)*

**H2 — Robustesse conditionnelle :**  
La segmentation produite est stable sous perturbations monétaires de faible amplitude (±1 %) dans les conditions de population testées.

**H3 — Pertinence prospective (conditionnelle) :**  
Dans un corpus simulé à distribution maîtrisée, les groupes RFM présentent des différences de CA statistiquement significatives et d'amplitude détectable (d de Cohen > 0,5).  
Conditionnelle sur données longitudinales réelles (non simulées).

### 3.4 Délais estimés par sujet

| Sujet | Durée estimée |
|-------|--------------|
| A — Prévision ventes | 5–10 jours |
| **B — Valeur prospective RFM** | **9–17 jours** |
| C — Fiabilité diagnostic | 15–28 jours |

---

## 4. Résultats expérimentaux

### 4.1 Protocole Monte Carlo

- **1 200 corpus initiaux** × 10 variantes de perturbation × 100 répétitions = **12 000 essais**
- **Tailles testées :** 3, 10, 50, 200 clients
- **Profils :** `regular`, `skewed`, `ties`
- **Perturbations :**
  - Bruit monétaire : ±1 %, ±5 %, ±20 %
  - Bruit date : ±1 jour, ±7 jours
  - Doublons : 1 %, 5 %
  - Commandes manquantes : 1 %, 5 %

### 4.2 État du build au commit de référence

- 13 tests Node + 3 tests Python → **tous passés** ✅
- 17 tests app existants → **tous passés** ✅
- Lint global → **198 erreurs dans des fichiers non modifiés** ⚠️ (lint préexistant)

### 4.3 Résultats par hypothèse

| Hypothèse | Résultat | Détail |
|-----------|---------|--------|
| **H1** | Non confirmée entièrement | 200/12 000 essais avec ≥1 centime de déviation ; 489 occurrences de score M modifié ; 2 changements de label de segment |
| **H2** | Confirmée conditionnellement | Pour bruit monétaire ±1 %, 0 changement de segment dans les 4 cellules principales |
| **H3** | Conditionnelle | Requiert données longitudinales réelles ; non testable sur simulation seule |

---

## 5. Module `customer-rfm.ts` — Analyse complète

**Localisation :** `src/lib/mining/customer-rfm.ts`  
**Taille :** 744 lignes, ~28 KB  
**Dépendances :** `mongoose`, `@/lib/utils/db`, `@/lib/models/Commande`, `@/lib/models/Customer`

### 5.1 BLOC 1 — Helpers RFM (lignes 1–26)

```typescript
// Seuils terciles : T1 = percentile 33.3%, T2 = percentile 66.6%
function tercile(values: number[]): [number, number]

// Score ascendant : valeur élevée → score élevé (Fréquence, Monétaire)
function scoreAsc(value: number, t1: number, t2: number): 1 | 2 | 3

// Score descendant : valeur faible (récente) → score élevé (Récence)
function scoreDesc(value: number, t1: number, t2: number): 1 | 2 | 3
```

### 5.2 BLOC 2 — Fonctions mathématiques spéciales (lignes 28–150)

Toutes implémentées **from scratch**, sans dépendance externe :

| Fonction | Algorithme | Précision |
|----------|-----------|-----------|
| `logGamma(z)` | Lanczos g=7 | ~15 chiffres |
| `incompleteBeta(x, a, b)` | Méthode de Lentz (fraction continuée) | EPS 3e-10 |
| `gammaLowerSeries(a, x)` | Développement en série | EPS 3e-14 |
| `gammaUpperCF(a, x)` | Fraction continuée | EPS 1e-10 |
| `gammaUpperReg(a, x)` | Sélection auto série / CF | — |
| `fPValue(F, df1, df2)` | Via `incompleteBeta` | — |
| `chiSquaredPValue(chi2, df)` | Via `gammaUpperReg` | — |
| `tDistPValue(t, df)` | Via `incompleteBeta` | — |
| `normalSurvival(z)` | A&S 26.2.17 | erreur max ~7.5e-8 |

### 5.3 BLOC 3 — Tests statistiques (lignes 152–372)

#### `jarqueBera(values)` (lignes 162–173)

Test de normalité de Jarque-Bera.  
- H₀ : distribution normale
- Statistique : `JB = n/6 · (γ₁² + γ₂²/4) ~ χ²(2)`
- Fiable seulement pour n ≥ 20 (champ `reliable`)
- Retourné avec `{statistic, pValue, reliable}`

#### `leveneTest(groups)` (lignes 180–203)

Test de Levene-Brown-Forsythe (variante médiane).  
- H₀ : homogénéité des variances
- Plus robuste que Bartlett aux écarts à la normalité
- Retourne `{statistic: W, df1: k-1, df2: N-k, pValue}`

#### `kruskalWallis(groups)` (lignes 210–248)

Test non paramétrique de Kruskal-Wallis avec correction ex-aequo.  
- H₀ : distributions identiques entre k groupes
- Statistique H corrigée : `H / (1 - Σ(t³-t)/(N³-N))`
- Retourne `{statistic, df: k-1, pValue}`

#### `dunnBonferroni(groups, names)` (lignes 255–305)

Post-hoc de Dunn avec correction de Bonferroni.  
- Utilisé après un Kruskal-Wallis significatif
- Statistique z sur rangs moyens ; `pAdj = min(1, pRaw × numPairs)`
- Champ `statLabel: "z"`

#### `bonferroniTPosthoc(segments, msWithin, dfWithin)` (lignes 312–338)

Post-hoc Bonferroni-t pour ANOVA homoscédastique.  
- Approximation conservatrice du Tukey HSD sans distribution q
- Champ `statLabel: "t"`

#### `gamesHowellPosthoc(segments)` (lignes 345–372)

Post-hoc Games-Howell pour ANOVA hétéroscédastique.  
- Degrés de liberté de Welch-Satterthwaite
- **Correction Bonferroni** (non conforme : Games-Howell standard utilise la distribution q du studentized range)
- Champ `statLabel: "t_WS"`

### 5.4 BLOC 4 — Types publics (lignes 374–469)

```typescript
export interface RFMEntry {
  clientId: string;         // ObjectId.toString()
  name: string;
  scoreR: 1 | 2 | 3;
  scoreF: 1 | 2 | 3;
  scoreM: 1 | 2 | 3;
  segment: string;          // "Champions" | "Loyaux" | "À risque" | "Petits acheteurs" | "Potentiels"
  totalRevenue: number;     // arrondi à 2 décimales
  orderCount: number;
  lastOrderDate: string;    // ISO 8601
}

export interface SegmentStats {
  name: string;
  count: number;
  avgRevenue: number;
  stdDevRevenue: number;    // estimateur corrigé de Bessel (n-1)
}

export interface SegmentComparisonResult {
  segments: SegmentStats[];
  normality: NormalityResult;
  homoscedasticity: HomoscedasticityResult;
  selectedMethod: "anova" | "kruskal-wallis";
  methodReason: string;
  anova: AnovaResult | null;
  kruskalWallis: KruskalWallisResult | null;
  hasDifference: boolean;
  circularityNote: string;  // avertissement circularité M/CA
}
```

### 5.5 BLOC 5 — Fonctions exportées (lignes 471–743)

#### `computeRFM(tenantId, anneeId): Promise<RFMEntry[]>` (lignes 475–536)

Pipeline :
1. Connexion MongoDB via `connectToDb()`
2. Agrégation des commandes (`status: CONFIRMED | PAID | DELIVERED`) par client
3. Calcul des terciles pour R, F, M séparément
4. Attribution des scores (R → `scoreDesc`, F/M → `scoreAsc`)
5. Attribution du segment via règle séquentielle :

```
rfmKey === "333"       → "Champions"
scoreR + scoreF >= 5   → "Loyaux"
scoreR === 1           → "À risque"
scoreM === 1           → "Petits acheteurs"
sinon                  → "Potentiels"
```

#### `compareSegments(rfmData): SegmentComparisonResult` (lignes 554–708)

Pipeline de décision automatique :
1. Stats intra-segment (moyenne, écart-type Bessel)
2. Résidus poolés = valeur – moyenne de son segment
3. Jarque-Bera sur résidus (n ≥ 8 requis)
4. Levene-Brown-Forsythe sur groupes bruts
5. Branchement :
   - `normality.reject === true` → Kruskal-Wallis + Dunn-Bonferroni
   - Sinon + `homoscedasticity.reject === true` → ANOVA + Games-Howell
   - Sinon → ANOVA + Bonferroni-t
6. `circularityNote` = avertissement sur la circularité M/CA (toujours présent)

#### `getTopSegmentPairs(segments)` (lignes 716–743)

Taille d'effet **d de Cohen poolé (Hedges 1981)** pour chaque paire de segments :

```
s_poolé = sqrt(((n1-1)*s1² + (n2-1)*s2²) / (n1+n2-2))
d = |μ1 - μ2| / s_poolé
detectable = |d| > 0.5
```

Retourne les 5 paires les plus discriminantes, triées par |d| décroissant.

---

## 6. Défauts identifiés par l'audit

Source : `Rapport_Audit_Approfondi_ELMES_TEKA_2026-11-02.md`

### 6.1 Défauts dans `customer-rfm.ts`

| # | Type | Localisation | Description | Gravité |
|---|------|-------------|-------------|---------|
| 1 | **Circularité** | `compareSegments` | M calculé sur `totalRevenue`, puis `totalRevenue` comparé par segment. Résultats exploratoires seulement. | **Majeure** |
| 2 | **Interprétation abusive** | `compareSegments` | Normalité non rejetée ≠ normalité prouvée. Confusion fréquente mais documentée. | Modérée |
| 3 | **ANOVA classique** | `compareSegments` | Utilisée malgré hétéroscédasticité possible (Welch ANOVA non implémentée). | Modérée |
| 4 | **Games-Howell non conforme** | `gamesHowellPosthoc` | Utilise stat t de Welch-Satterthwaite + Bonferroni au lieu de la distribution q du studentized range. Approximation conservative mais non standard. | Modérée |
| 5 | **Variance nulle** | `gamesHowellPosthoc` | Segments de taille 1 ignorés silencieusement (`continue` si `count < 2`). | Mineure |
| 6 | **Arrondi prématuré** | Blocs 3 et 5 | `Math.round` sur statistiques intermédiaires avant inférence. | Mineure |

### 6.2 Défauts dans d'autres modules (audit étendu)

Défauts signalés également dans :
- `financial-solver.ts`
- `risk-detector.ts`
- `product-analysis.ts`
- `context-builder.ts`

(Détails dans le rapport d'audit complet)

---

## 7. Fiches de lecture (`fiches/`)

### 7.1 Scoring de crédit — Commerçants informels

**Fiche n°3 — Kazimoto (2023), UCT/Nomanini (Lesotho)**
- **Modèle retenu :** LR2 (1 variable : historique de remboursement)
- **Résultat :** Gini 0.6143 sur 19 marchands test (5 défaillants)
- **Corpus :** 62 marchands totaux
- **Limite :** 0 défaillant identifié au seuil 0.5 — modèle trop conservateur

**Fiche n°4 — Oindi (2024), Strathmore**
- **Algorithmes :** RF, XGBoost, LightGBM, CatBoost, AdaBoost
- **Accuracy :** 86 % (RF et CatBoost)
- **Données :** Bondora (Estonie), **pas Kenya**
- **Défauts critiques :**
  - SMOTE appliqué avant le split train/test → **data leakage**
  - Labels TP/FP inversés dans la présentation
  - Choix du modèle non justifié par les données propres
  - Pas de baseline de comparaison

### 7.2 Microfinance et crédit à Kinshasa

**Fiche CR-01 — CERISE/MFC, SPI4 (2016)**
- Webinaire sur le prêt responsable (SPI4)
- Checklist évaluation capacité de remboursement : flux trésorerie entreprise + ménage
- Pertinence : ELMES-TEKA voit seulement l'activité commerciale, pas les dettes ménage ni les crédits externes

**Fiche CR-02 — MicroSave Toolkit individuel (2007)**
- Flux net = CA net entreprise + revenus nets ménage = revenu total net
- Principe clé : *"what repays the loan is cash"* — distingue ventes cash des ventes totales
- Session 5 (analyse cashflow, pp. 69-85) : non lue

**Fiche CR-03 — SLE Kinshasa (2014), KfW/Advans**
- Score de risque de surendettement : **6.04/10**
- 57 % des clients en retard → niveau de surendettement
- Volatilité des revenus : rapport 2.4:1
- **Pas de bureau de crédit opérationnel** à Kinshasa
- Pertinence directe pour les paramètres de simulation

**Fiche CR-04 — Katengu (2009), 18 institutions financières Kinshasa**
- Obstacle principal au financement PME : **absence de données financières** (pas de comptes publiés)
- 12 sur 18 IF accordent des prêts PME
- Lecture partielle (chapitre 4 seulement)

### 7.3 LLMs pour le crédit

**Fiche CR-05 — Béas-Díaz/CMF Chile (2024)**
- LightGBM : **AUROC 81.7 %**
- LLMs sans fine-tuning : ~69-73 % AUROC
- LLMs avec fine-tuning : ~78-80 % AUROC
- Stabilité à température 0 : prédictions quasi-identiques
- **Conclusion : sans fine-tuning, LLMs significativement inférieurs aux modèles classiques**

**Fiche CR-06 — Golec/AlabdulJalil (2025), QMUL/Boğaziçi/Kuwait**
- Revue systématique PRISMA : 60 études (doublons suspectés)
- Taxonomie : encodeurs (BERT, FinBERT), décodeurs (GPT), pipelines hybrides, LLMs finance spécialisés
- Lacunes identifiées : reproductibilité, robustesse, benchmarks, hallucinations, coût/latence

### 7.4 Fiches initiales (structure)

**Fiche n°1 — Zerrouk (2025), Tlemcen**
- IA pour analyse d'exigences logicielles
- Critique : pas d'hypothèse, pas d'évaluation, pas de question de recherche claire
- Usage : modèle de structure de fiche seulement

**Fiche n°2 — Belhadj (2025), Tlemcen**
- Plateforme éducative LLM + Moodle
- LLaMA via Groq API > BART > TextRank
- Évaluation faible : 1 document, sans référence humaine
- Positionnement épistémique : pragmatisme + DSR + composante post-positiviste

---

## 8. Ressources épistémologiques (`cours/`)

8 PDFs couvrant l'épistémologie et les méthodes de recherche :

| Fichier | Source | Contenu principal |
|---------|--------|------------------|
| Cours épistémologie et méthodes | (inconnu) | 10 p. — 3 niveaux (épistémo/méthodologie/technique), 3 raisonnements (déduction/induction/abduction), 8 courants dont DSR. Réf. : Hevner 2004, Peffers 2007 |
| `9782130776284.pdf` | Virieux-Reymond (PUF, 1972) | "Introduction à l'Épistémologie" — Lalande, historique sciences |
| Méthode de Recherche en Informatique | Tshikutu A.B. (HAL 2024) | 47 p. — courants épistémiques, rédaction scientifique, structure TFC/mémoire, LaTeX |
| `epistemologie.pdf` | (inconnu) | 9.8 MB — trop grand, diagramme induction/déduction visible |
| `master-1-epistemologie.pdf` | (inconnu) | 57 MB — **non lu** (trop grand) |
| `cours1.pdf` | F. Boulier (Polytech Lille, 2022) | Inductivisme, falsificationisme (Popper), paradigmes de Kuhn, révolution copernicienne |
| `8_2020_05_15.pdf` | Assie + Kouassi (CCIP Abidjan) | 20 chapitres — stratégies de vérification, structure mémoires/TFC, formulation hypothèses, variables |
| Cours BAC1-2026 | E. NGOYI ILUNGA (UNIKAB) | Recherche fondamentale / appliquée / technologique, revue littérature APA/IEEE |

---

## 9. Instructions et jury (`instructions/`)

### 9.1 `Instructions_du_projet.md` — Rôle ChatGPT directeur de recherche

Format de fiche standardisé en **9 sections** :

| Section | Description |
|---------|-------------|
| Contexte | Cadre général de la recherche |
| Problématique | Question posée |
| Hypothèses | H0, H1... |
| Question centrale | 1 question principale |
| Objectifs | Objectifs généraux et spécifiques |
| Méthodologie | Approche épistémique |
| Techniques | Outils et méthodes |
| Résultats | Findings quantitatifs/qualitatifs |
| Conclusion | Apport et limites |

Marqueurs : `[E]` = explicite dans le texte, `[I]` = inféré par l'analyste.  
Analyse épistémique : **5 arguments textuels** requis pour valider le positionnement.

### 9.2 `JURY_Claude.md` — Rôle jury académique strict

**5 critères d'évaluation :**
1. Richesse bibliographique
2. Rigueur épistémologique et méthodologique
3. Cohérence interne
4. Structure logique
5. Distance entre résultats et objectifs annoncés

**Notation :** /10 forme + /10 fond  
Documents de travail dans le sous-dossier `contenu/`.

---

## 10. Liste des travaux à analyser (`liste/`)

Fichier : `Liste à jour — mémoires et thèses à analyser.md`

### 10.1 Corpus principal (10 mémoires retenus)

| # | Auteur | Institution | Thème | Statut |
|---|--------|-------------|-------|--------|
| 1 | Zerrouk (2025) | Tlemcen | IA + exigences logicielles | ✅ Fiche n°1 faite |
| 2 | Belhadj (2025) | Tlemcen | LLMs éducatif + Moodle | ✅ Fiche n°2 faite |
| 3 | Kazimoto (2023) | UCT/Nomanini | Scoring crédit informel (Lesotho) | ✅ Fiche n°3 faite |
| 4 | Oindi (2024) | Strathmore | Scoring crédit mobile (Bondora) | ✅ Fiche n°4 faite |
| 5 | Lubbers | Utrecht | (en attente) | ⏳ |
| 6 | Zhang | Macquarie | (en attente) | ⏳ |
| 7 | Gathu | Strathmore | (en attente) | ⏳ |
| 8 | Ntoutoume | Dakar | (en attente) | ⏳ |
| 9 | Edarazi | UCLouvain | (en attente) | ⏳ |
| 10 | Nyangena | Strathmore | (en attente) | ⏳ |

### 10.2 Articles supplémentaires

- Ng et al. (2025, arXiv) — LLMs et crédit
- Wang et al. (2020, AAAI) — (thème à confirmer)
- Hurlin et Pérignon (2019, HAL) — (thème à confirmer)

---

## 11. Sous-dossiers en cours d'exploration

Au moment de la rédaction de ce rapport, trois agents parallèles exploraient les sous-dossiers suivants :

| Sous-dossier | Agent | État |
|-------------|-------|------|
| `contenu/` | a9c4f1c52a382b5de | En cours — documents de travail du jury |
| `recherche/` | a6836b58f8dc6ded5 | En cours — corpus de recherche |
| `version-v2/` | — | Non exploré |

Ces sous-dossiers pourraient contenir des plans de mémoire, des brouillons de chapitres, ou des bibliographies détaillées. Ce rapport sera mis à jour une fois leurs contenus disponibles.

---

## 12. Synthèse critique et recommandations

### 12.1 Ce que le projet fait bien

1. **Pipeline statistique complet** implémenté sans dépendance externe — toutes les fonctions (logGamma, incompleteBeta, Jarque-Bera, Levene-Brown-Forsythe, Kruskal-Wallis, Dunn-Bonferroni) sont vérifiables et auditables.

2. **Circularité documentée** dans `circularityNote` présent dans `SegmentComparisonResult` — honnêteté intellectuelle notable, qui protège contre une sur-interprétation des résultats.

3. **Isolation multi-tenant stricte** — `tenantId`, `anneeId` vérifiés côté serveur via la session, jamais depuis le client seul.

4. **Build stable** — 13 tests Node + 3 tests Python + 17 tests app = tous passés au commit de référence.

5. **Monte Carlo bien dimensionné** — 12 000 essais suffisants pour détecter des effets sur les tailles 50 et 200 clients.

### 12.2 Ce qui doit être corrigé

**Priorité haute :**

| Problème | Correction proposée |
|----------|-------------------|
| Games-Howell non conforme (Bonferroni au lieu de distribution q) | Implémenter approximation de Pearson-Hartley ou correction d'Hochberg pour la distribution q(k, dfWS) |
| H1 non confirmée entièrement (2 changements de segment sur 12 000) | Accepter H1 avec tolérance explicite ε (ex. ε < 0.1 %) plutôt que zéro déviation |
| Interprétation abusive "normalité non rejetée = normale" | Reformuler en "absence de preuve de non-normalité" dans les résultats |

**Priorité moyenne :**

| Problème | Correction proposée |
|----------|-------------------|
| H2 testée seulement pour ±1 % | Étendre à ±5 % et ±20 % pour délimiter le domaine de robustesse |
| Arrondi prématuré dans les statistiques intermédiaires | Supprimer `Math.round` des étapes intermédiaires, ne garder que sur les résultats finaux |

### 12.3 Pour la suite du mémoire

1. **Lire les 6 mémoires restants** de la liste : Lubbers, Zhang, Gathu, Ntoutoume, Edarazi, Nyangena
2. **Lire `Analyse_methodologique_et_simulation_RFM_2026-11-05_v2.md`** — version actualisée de la méthodologie
3. **Lire `analyse_rfm.ipynb`** — notebook Jupyter d'analyse complémentaire
4. **Validation H3** — obtenir des données longitudinales réelles ou concevoir un protocole de séparation temporelle t0/t1
5. **Cadre théorique** — intégrer Ng et al. (2025), Wang et al. (2020) pour la partie LLMs et crédit
6. **Défaut Games-Howell** — corriger avant la soutenance si les tests post-hoc sont cités dans le mémoire

### 12.4 Tableau de bord de l'état d'avancement

| Élément | État |
|---------|------|
| Sujet et question de recherche | ✅ Arrêtés |
| Positionnement épistémologique | ✅ Pragmatisme + DSR + abductif |
| Hypothèses H1, H2, H3 | ✅ Formulées |
| H1 testée expérimentalement | ✅ Résultat : non confirmée entièrement |
| H2 testée expérimentalement | ✅ Résultat : confirmée pour ±1 % |
| H3 | ⏳ Conditionnelle — données longitudinales manquantes |
| Corpus bibliographique | 4/10 fiches faites |
| Rédaction du mémoire | ⏳ En cours (selon sous-dossiers `contenu/`) |

---

*Rapport généré le 5 novembre 2026 par exploration automatisée du dossier Google Drive `projet-memoire/`.  
Agent : Claude Sonnet 4.6 — session `https://claude.ai/code/session_01CjEe18r1VkHYDeAsK3dPRo`*
