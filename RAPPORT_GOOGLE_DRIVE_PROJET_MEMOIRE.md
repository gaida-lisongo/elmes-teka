# Rapport de lecture — Google Drive `projet-memoire/`

**Date de lecture :** 5 novembre 2026  
**Source :** Google Drive — dossier `projet-memoire/` (ID : `1MtYSfYny8IMhqqU28Uc0rX7ZeVo7dPhe`)  
**Auteur du rapport :** Claude (agent coordinateur + sous-agents)

---

## Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble)
2. [Racine du dossier — fichiers principaux](#2-racine)
3. [Module `customer-rfm.ts` — analyse complète](#3-module-rfm)
4. [Dossier `contenu/` — projet LaTeX du mémoire](#4-contenu)
5. [Dossier `recherche/` — protocole expérimental](#5-recherche)
6. [Dossier `cours/` — corpus épistémologique](#6-cours)
7. [Dossiers `liste/`, `fiches/`, `instructions/`](#7-liste-fiches-instructions)
8. [Synthèse : état du mémoire au 5 novembre 2026](#8-synthese)
9. [Points de vigilance et lacunes identifiées](#9-vigilance)

---

## 1. Vue d'ensemble du projet

**ELMES-TEKA** est une plateforme SaaS de gestion commerciale pour les micro et petites entreprises formelles et informelles de la République démocratique du Congo (RDC). Elle a été conçue par ELMES.

Le **mémoire de master** en cours vise à évaluer expérimentalement la conformité et la robustesse du module de segmentation RFM intégré dans ELMES-TEKA. Il s'inscrit dans le cadre du **Master complémentaire en Informatique — Génie logiciel** à l'**Institut supérieur de techniques appliquées (ISTA), Kinshasa**.

**Sujet exact :**  
*Évaluation expérimentale de la conformité et de la robustesse d'une segmentation RFM dans un SaaS de gestion : cas d'ELMES-TEKA*

**Référence de code fixe :**  
Commit `b062a93a7be96d082dee9afe66b9f4f1f9ebecaa` — blob du module testé : `f3238c2b3f060d737ba621887f034f11bde8fc61`

**Arbre du dossier Drive :**

```
projet-memoire/
├── [RACINE — 8 fichiers .md]
├── cours/              ← 8 PDFs d'épistémologie et méthodes
├── contenu/            ← Projet LaTeX complet du mémoire (36 pages compilées)
├── recherche/          ← Protocole expérimental + résultats 12 000 essais
│   └── ELMES_TEKA_Mission_RFM/   ← sous-dossier protocole
├── liste/              ← Bibliographie et corpus de lecture
├── fiches/             ← Fiches de lecture (Zerrouk, Belhadj, Kazimoto, Oindi, etc.)
├── instructions/       ← Instructions du projet + document jury
└── version-v2/         ← (non complètement exploré)
```

---

## 2. Racine du dossier — fichiers principaux

### 2.1 `LISEZ-MOI.md` (1,5 Ko)

Guide d'export du projet « memoire-nathan » (31 oct 2026). Décrit la structure des sous-dossiers (`instructions/`, `cours/`, `fiches/`, `liste/`). Note les doublons dans les fiches Kazimoto et les liens internes qui ne fonctionnent pas hors de claude.ai. Document de navigation interne.

---

### 2.2 `Rapport_Resultats_Cadrage_Redaction_Memoire_ELMES_TEKA_2026-11-02.md` (16 Ko)

**Document clé.** Rapport de synthèse post-campagne (2 nov 2026). Contient :

**Plan d'expérience :**
- 12 000 essais = 1 200 corpus × 10 variantes
- Tailles : 3 / 10 / 50 / 200 clients
- Profils : `regular`, `skewed`, `ties`
- Perturbations : bruit monétaire ±1/5/20 %, bruit date ±1/7 jours, doublons 1/5 %, commandes manquantes 1/5 %

**Résultats :**
- 200 essais (1,667 %) présentent au moins un écart avec la référence exacte en centimes
- 489 écarts de score M (dimension monétaire)
- 2 écarts d'étiquette de segment
- **H1 non pleinement confirmée** (conformité complète non établie)
- **H2 confirmée** pour le bruit ±1 % dans 4 cellules principales (n=50 et 200, profils `regular` et `skewed`)

**Plan du mémoire :** Introduction → Ch.1 Matériels/Méthodes → Ch.2 Revue Littérature → Ch.3 Résultats → Ch.4 Discussions → Conclusion → Références → Annexes.

---

### 2.3 `Synthese_Cadrage_Memoire_Segmentation_ELMES_TEKA_2026-11-02.md` (13 Ko)

**Document de cadrage.** ELMES-TEKA a 3 finalités :
1. Structurer les données commerciales pour la microfinance
2. Supervision multi-sites à distance
3. Aide à la décision commerciale par IA

Le module ciblé est `customer-rfm.ts` lignes L465–L535. Circularité documentée aux lignes L449–L461. Les hypothèses H1/H2/H3 y sont définies. La monnaie est traitée comme monodevise par analyse, avec un historique minimum de 8 semaines.

---

### 2.4 `Fiche_Synthese_Sujet_B_Segmentation_RFM_ELMES_TEKA_2026-11-02.md` (16 Ko)

Trois variantes de sujets possibles pour l'étude :
- **Variante 1** : prédiction de réachat (binaire, régression logistique, AUC)
- **Variante 2** : dépenses futures (CA futur, ANOVA Welch) ← sujet retenu
- **Variante 3** : valeur incrémentale vs règle simple (AUC, R+F vs R+F+M)

Tableau de 9 notions statistiques. Note que l'implémentation Games-Howell existante utilise Bonferroni-t, pas le studentized range.

---

### 2.5 `Rapport_Cadrage_Sujets_ELMES_TEKA_2026-11-02.md` (22 Ko)

Trois sujets complets avec hypothèses, variables, effort estimé :
- **Sujet A** — Prévision des ventes : 5–10 jours, haute faisabilité
- **Sujet B** — Valeur prospective RFM : 9–17 jours, faisabilité moyenne ← **sujet retenu**
- **Sujet C** — Robustesse diagnostics/alertes : 15–28 jours

---

### 2.6 `Rapport_Audit_Approfondi_ELMES_TEKA_2026-11-02.md` (32 Ko)

Audit technique complet de la codebase. Problèmes identifiés par priorité :

**P0 (critiques) :**
- Agrégations monétaires sans séparation USD/CDF
- Advisor AI : contexte générique, score 60 par défaut si non trouvé
- Circularité RFM : M construit sur CA, comparé sur CA
- Score de solvabilité non calibré

**P1 (importants) :**
- Moteur de risque : ratio=0 quand CA=0 (faux négatif)
- Stock agrégé sans filtre boutique
- ANOVA avec hétéroscédasticité
- Games-Howell : utilise Bonferroni-t, pas le studentized range
- p-values arrondies avant comparaison à 0,05
- Poids OLS `[4,4,3,3,2,2,1,1]` : ordre inversé (l'achat le plus ancien a le plus grand poids)
- RMSE d'OLS réutilisé quand la moyenne mobile est le prédicateur

**P2 (mineurs) :**
- Code produit globalement unique (bloque multi-tenant)
- Stock sans tenantId

---

### 2.7 `Synthese_Cadrage_Memoire_ELMES_TEKA.md` (9 Ko)

Positionnement épistémologique : **Pragmatisme + DSR (Hevner 2004) + Raisonnement abductif**.

3 stratégies d'évaluation :
1. Monte-Carlo (cohérence/robustesse)
2. Validation rétrospective (précision)
3. Évaluation statistique/utilisateur

Hypothèses simplificatrices : monodevise par analyse, 8 semaines d'historique minimum, terciles comme seuils.

---

### 2.8 `Constat_ELMES_TEKA_Intelligence_Economique_2026-11-02.md` (21 Ko)

Premier constat de l'intelligence économique (8h24, 2 nov 2026). Analyse des fichiers : `product-analysis.ts`, `customer-rfm.ts`, `financial-solver.ts`, `risk-detector.ts`, `store-benchmark.ts`, `intelligence/page.tsx`, modèles Mongoose, `advisor.actions.ts`, `context-builder.ts`.

Tableau de validité : interne/prédictive = Faible/Non démontrée.

---

## 3. Module `customer-rfm.ts` — analyse complète

**Fichier :** `customer-rfm.ts` (28 Ko, ID : `1cZxKojOUDFtZyZSfD0yNYbjIyCt_vvtl`)  
**Note :** Classifié comme `video/vnd.dlna.mpeg-tts` par Google Drive (extension `.ts` = MPEG transport stream). Téléchargé via `download_file_content` et décodé base64.

### 3.1 Imports

```typescript
import { Types } from "mongoose";
import connectToDb from "@/lib/utils/db";
import Commande from "@/lib/models/Commande";
import Customer from "@/lib/models/Customer";
```

### 3.2 Structure (5 blocs)

**BLOC 1 — Helpers RFM**
- `tercile(values: number[])` : calcule les seuils T1 = `sorted[⌊n/3⌋]` et T2 = `sorted[⌊2n/3⌋]`
- `scoreAsc(value, t1, t2)` : 1 si ≤ t1, 2 si ≤ t2, 3 sinon (pour F et M)
- `scoreDesc(value, t1, t2)` : 1 si ≥ t2, 2 si ≥ t1, 3 sinon (pour R — la récence inversée)

**BLOC 2 — Fonctions mathématiques spéciales**
Implémentations from scratch de :
- `logGamma()` — approximation de Lanczos (g=7, précision ~15 chiffres)
- `incompleteBeta()` — méthode de Lentz (fraction continuée)
- `gammaLowerSeries()` / `gammaUpperCF()` / `gammaUpperReg()` — gamma incomplète
- `fPValue()` — p-value unilatérale F(df1, df2)
- `chiSquaredPValue()` — p-value χ²(df)
- `tDistPValue()` — p-value bilatérale t(df)
- `normalSurvival()` — approximation A&S 26.2.17 (erreur max ~7,5e-8)
- `median()` — médiane

Sources déclarées : Abramowitz & Stegun (1964), Press et al. (2007), Lanczos (1964), Lentz (1976), Royston (1992).

**BLOC 3 — Tests statistiques**
- `jarqueBera()` — Normalité JB (n/6 × (skew² + exKurt²/4) ~ χ²(2)). Fiable pour n ≥ 20.
- `leveneTest()` — Levene-Brown-Forsythe (variante médiane). Plus robuste que Bartlett.
- `kruskalWallis()` — Kruskal-Wallis avec correction pour les ex æquo.
- `dunnBonferroni()` — Post-hoc Dunn + correction Bonferroni (après KW).
- `bonferroniTPosthoc()` — Post-hoc Bonferroni-t (ANOVA homoscédastique).
- `gamesHowellPosthoc()` — ⚠️ **NOM TROMPEUR** : utilise Welch-Satterthwaite df + t-distribution + correction Bonferroni. Ce n'est **pas** la vraie procédure Games-Howell (qui utilise le studentized range q).

**BLOC 4 — Types publics exportés**
```typescript
export interface RFMEntry { clientId, name, scoreR|F|M (1|2|3), segment, totalRevenue, orderCount, lastOrderDate }
export interface SegmentStats { name, count, avgRevenue, stdDevRevenue }
export interface PosthocPair { pair, stat, statLabel ("t"|"t_WS"|"z"), pAdjusted, significant }
export interface NormalityResult { method, statistic, pValue, reliable, reject, note }
export interface HomoscedasticityResult { method, statistic, df1, df2, pValue, reject, note }
export interface AnovaResult { fStat, dfBetween, dfWithin, pValue, significant, posthocMethod, posthoc }
export interface KruskalWallisResult { statistic, df, pValue, significant, posthoc }
export interface SegmentComparisonResult { segments, normality, homoscedasticity, selectedMethod, methodReason, anova, kruskalWallis, hassDifference, circularityNote }
```

**BLOC 5 — Fonctions exportées**

**`computeRFM(tenantId, anneeId)`** :
1. Connexion MongoDB
2. Agrégation `Commande` (statuts CONFIRMED/PAID/DELIVERED) → `{totalRevenue, orderCount, lastOrderDate}` par `clientId`
3. Terciles sur R (jours depuis dernier achat), F (nb commandes), M (CA total)
4. Attribution des segments :
   - `333` → **Champions**
   - `scoreR + scoreF ≥ 5` → **Loyaux**
   - `scoreR === 1` → **À risque**
   - `scoreM === 1` → **Petits acheteurs**
   - else → **Potentiels**

**`compareSegments(rfmData: RFMEntry[])`** :
Pipeline statistique automatique :
1. Stats intra-segment (moyenne, écart-type Bessel)
2. Test JB normalité sur résidus poolés
3. Test Levene-BF homoscédasticité
4. Décision :
   - Normalité rejetée → Kruskal-Wallis + Dunn-Bonferroni
   - Normalité OK + hétéroscédasticité → ANOVA + Games-Howell (⚠️ approximation)
   - Normalité OK + homoscédasticité → ANOVA + Bonferroni-t
5. Constante `circularityNote` explicite : *"la dimension M est construite à partir de totalRevenue, la même variable comparée ici"*

**`getTopSegmentPairs(segments)`** :
Cohen's d poolé (Hedges 1981) pour chaque paire. Top 5 paires par |d|. `detectable: true` si |d| > 0,5.

### 3.3 Faille de circularité (documentée)

La fonction `compareSegments` compare `totalRevenue` entre segments. Or la dimension M du segment RFM est construite à partir de `totalRevenue`. Ce cercle est **explicitement documenté** dans le code (constante `CIRCULARITY`) et dans les fichiers de cadrage (lignes L449–L461). Les résultats sont donc exploratoires seulement — toute validation prospective nécessite une séparation temporelle t0/t1.

---

## 4. Dossier `contenu/` — projet LaTeX du mémoire

**ID Drive :** `1YxhQHMTb8Ad8QKlObRYK3E9dWi5ZScRP`  
**Contenu :** Projet LaTeX complet du mémoire. 47 fichiers lus.  
**Statut compilation :** ✅ `latexmk -pdf main.tex` — 36 pages (pdfLaTeX, TeX Live 2023, 2 nov 2026).

### 4.1 Structure du projet LaTeX

```
contenu/
├── main.tex                    ← Point d'entrée
├── README.md                   ← Documentation du projet
├── VERIFICATION.md             ← Log de compilation
├── ORDRE_REDACTION.md          ← Plan de travail de l'auteur
├── LIRE_EN_PREMIER.md          ← Guide livraison archive
├── .latexmkrc                  ← Config pdfLaTeX
├── .gitignore                  ← Exclusions Git
├── configuration/
│   ├── preambule.tex           ← Packages, macros, langues
│   └── metadonnees.tex         ← Titre, auteur, établissement
├── chapitres/
│   ├── 00-introduction.tex     ← Introduction générale
│   ├── 01-materiels-methodes.tex
│   ├── 02-revue-litterature.tex
│   ├── 03-resultats.tex
│   ├── 04-discussions.tex
│   └── 05-conclusion.tex
├── annexes/
│   ├── annexe-a-protocole.tex
│   ├── annexe-b-resultats-reproductibilite.tex
│   ├── PROVENANCE_ANNEXES.md
│   ├── VERIFICATION_ANNEXES.md
│   └── sources-simulation/     ← Copies compactes
├── bibliographie/
│   └── references.bib          ← 16 entrées APA 7 vérifiées
├── figures/
│   └── README.md               ← Aucune figure expérimentale encore importée
└── memoire-v1.pdf              ← Version antérieure (491 Ko, 21 pages)
```

### 4.2 Métadonnées du mémoire

```latex
\etablissement{Institut supérieur de techniques appliquées --- Kinshasa}
\formation{Master complémentaire en Informatique --- Génie logiciel}
\titreMemoire{Évaluation expérimentale de la conformité et de la robustesse
              d'une segmentation RFM dans un SaaS de gestion : cas d'ELMES-TEKA}
\auteurMemoire{[Nom complet de l'auteur]}       % À confirmer
\directeurMemoire{[Nom, grade et fonction]}     % À confirmer
\anneeAcademique{[Année académique]}            % À confirmer
```

### 4.3 Résumé des chapitres

#### Introduction générale (13 Ko)

**Contexte :** l'économie congolaise est portée par des micro et petites entreprises dont les données commerciales restent sur papier. Le SaaS ELMES-TEKA répond à ce besoin mais son module RFM n'a pas encore été évalué formellement.

**Problématique :** comment mesurer la conformité algorithmique d'un module de segmentation client intégré dans une plateforme de gestion réelle ?

**Contributions annoncées :**
1. Protocole de simulation Monte-Carlo structuré (cadre ADEMP)
2. Identification des configurations dégénérées (profil `ties`, n=3)
3. Première caractérisation quantitative des limites du module

**Limites annoncées :** simulation synthétique, pas d'accès MongoDB réel, pas de validation terrain auprès de vrais clients congolais.

---

#### Chapitre 1 — Matériels et méthodes (22 Ko)

Suit le cadre **ADEMP** (Morris 2019) : Objectifs, Mécanismes générateurs, Cibles, Méthodes, Mesures de performance.

**Positionnement épistémologique :**
- DSR (Hevner 2004) : ELMES-TEKA est l'artefact ; l'évaluation est l'étape *evaluate* du cycle de vie
- Posture pragmatique : vérité = utilité pratique + cohérence instrumentale
- Raisonnement hypothético-déductif pour les deux hypothèses

**Hypothèses :**
- **H1** (conformité) : critère d'acceptation = taux de non-conformité ≤ 2 %, aucun contre-exemple dans les cas manuels
- **H2** (robustesse) : pour les 4 cellules ciblées (n=50/200 × regular/skewed), bruit ±1 % — borne haute IC 95 % ≤ 5 % pour les clients éloignés des seuils

**Variables indépendantes :** taille corpus (3/10/50/200), profil (regular/skewed/ties), scénario de perturbation (10 scenarios)
**Variables dépendantes :** taux de non-conformité, taux de changement de segment

**Environnement technique :** JavaScript (Node.js), Python (référence), cadre ADEMP.

---

#### Chapitre 2 — Revue de la littérature (27 Ko)

**Section 1 :** Le petit commerce congolais et le déficit d'outils adaptés (double monnaie USD/CDF, absence de CRM adapté)

**Section 2 :** Le modèle RFM — 3 familles :
1. RFM **comportemental** (Hughes 1994 ; Fader, Hardie & Lee 2005) : terciles sur données historiques
2. RFM **probabiliste** (BG/NBD, Pareto/NBD) : modélisation CLV
3. RFM **hybride** (clustering + RFM)

Limites documentées : circularité, sensibilité aux seuils, dépendance au contexte marché.

**Section 3 :** Critères d'évaluation d'un module de segmentation (sans anticiper les résultats)

**Section 4 :** Simulation Monte-Carlo et cadre ADEMP (Morris 2019). Configurations dégénérées susceptibles d'affecter la stabilité : n très petit, profil ties.

**Références citées :** Fader/Hardie/Lee 2005, Salminen et al. (Suomi), Morris 2019, Hevner 2004, Peffers 2008.

---

#### Chapitre 3 — Présentation des résultats (21 Ko)

**Cibles mesurées :**
1. Conformité à la référence indépendante (Python centimes entiers)
2. Robustesse aux perturbations

**Résultats H1 :**
- 12 000 essais → 200 non-conformes = **1,667 %** (IC MC 95 % : [1,448 % ; 1,904 %])
- 489 écarts de score M, 2 écarts d'étiquette
- Borne supérieure de l'IC < 2 % → la valeur n'est pas un artefact d'échantillonnage
- **H1 : non pleinement confirmée** (borne inférieure IC > 0 %)

**Résultats H2 (robustesse ±1 %) :**
| Taille | Profil | Résultat |
|--------|--------|---------|
| 50 | regular | compatible (0,000 %) |
| 50 | skewed | compatible (0,000 %) |
| 200 | regular | compatible (0,000 %) |
| 200 | skewed | compatible (0,000 %) |

**Sensibilité (exemple n=200 regular) :**
| Scénario | Taux moyen de changement | IC MC 95 % |
|----------|--------------------------|------------|
| amount_noise_1pct | 0,055 % | [0,018 ; 0,092] |
| amount_noise_5pct | 0,265 % | [0,194 ; 0,336] |
| amount_noise_20pct | 0,925 % | [0,787 ; 1,063] |
| date_noise_1day | 0,970 % | [0,826 ; 1,114] |
| date_noise_7days | 4,685 % | [4,348 ; 5,022] |
| duplicates_1pct | 1,275 % | [0,972 ; 1,578] |
| duplicates_5pct | 4,120 % | [3,770 ; 4,470] |
| missing_orders_1pct | 1,921 % | [1,627 ; 2,215] |
| missing_orders_5pct | 7,395 % | [6,965 ; 7,825] |

**Dégénérescence :** profil `ties` → 1 catégorie unique quelle que soit la taille. Profils `regular`/`skewed` avec n=50/200 → 5 catégories.

---

#### Chapitre 4 — Discussions (25 Ko)

**H1 (conformité) :**
- Taux = 1,667 % (IC borne sup < 2 %) → objectif opérationnel non atteint mais borne sup < 2 %
- 489 écarts sur M liés à l'arithmétique flottante binaire (accumulation JavaScript vs centimes entiers Python)
- Ce n'est pas "200 bugs de production" : les doubles de test utilisent une accumulation JS, pas `$sum` MongoDB réel
- **Ne pas corriger l'artefact et prétendre avoir testé la version initiale**

**H2 (robustesse) :**
- IC de largeur nulle (taux = 0 dans les 4 cellules) ne prouve pas une probabilité exactement nulle
- "Compatible" = critère opérationnel du protocole satisfait dans les mécanismes simulés
- La robustesse est **conditionnelle** : elle ne tient que dans le domaine défini (±1 %, clients éloignés des seuils)

**Hors domaine :** dégénérescence avec n=3, profil `ties` → catégorie unique stable mais triviale. Clients proches des seuils → instables même avec bruit minimal.

**Validité interne :** référence clarifiée *après* les premiers écarts (non préenregistrée pour la mesure de conformité monétaire). Protocole non ajusté pour H2.

**Validité externe :** simulation synthétique USD uniquement → pas de représentativité des vrais clients congolais (USD/CDF, pratiques locales).

---

#### Chapitre 5 — Conclusion générale (12 Ko)

**Rappel de la démarche :** DSR, cycle *evaluate*, ADEMP, 12 000 essais.

**Résultats essentiels :**
- H1 : non-conformité = 1,667 % (arithmétique flottante) — conformité complète non établie
- H2 : compatibilité dans 4 cellules restreintes — robustesse conditionnelle démontrée
- Dégénérescence documentée (n=3, profil ties)

**Contribution :**
1. Protocole ADEMP adapté à l'évaluation d'un module SaaS en production
2. Première quantification des limites de `computeRFM`
3. Base méthodologique pour améliorer le module (précision monétaire, cas dégénérés)

**Perspectives :**
- Reproduction sur MongoDB réel avec types numériques effectifs
- Séparation temporelle t0/t1 pour valider la circularité RFM
- Extension avec données bidevises (USD+CDF)

---

### 4.4 Bibliographie (`references.bib`, 16 entrées)

Compilée le 2 nov 2026. Norme APA 7 (BibTeX). Toutes les entrées lues intégralement sauf mention contraire.

| ID | Auteurs | Titre (abrégé) | Statut |
|----|---------|----------------|--------|
| A01 | Fader, Hardie & Lee (2005) | RFM and CLV: Iso-Value Curves | LU_INTEGRALEMENT |
| A02 | Salminen, Mustak, Sufyan | (RFM article) | — |
| A03–A05 | (3 articles) | — | — |
| M01 | Rajendran (2023) | Customer Segmentation RFM Clustering | — |
| M02–M03 | (2 mémoires MSc) | — | — |
| T01 | Yoseph | Market Intelligence | — |
| B01–B05 | (5 livres) | — | — |
| C01–C02 | Morris 2019 / Peffers 2008 | ADEMP / DSR | — |

⚠️ Note de l'audit : une entrée avait un titre corrigé par rapport au candidat initial (l'AUDIT-A avait substitué le titre du papier BG/NBD — corrigé dans le fichier final).

---

### 4.5 Annexes

#### Annexe A — Protocole, variables et cas de conformité

Contient :
- Périmètre : simulation uniquement, pas d'enquête terrain
- Configuration de la campagne : date d'observation fixe (1er oct 2026), graine maître 20261102, générateur Mulberry32, USD uniquement
- 4 tailles × 3 profils × 10 scénarios
- 9 cas manuels (tous satisfaits)
- Règles RFM complètes
- Dictionnaire des variables
- Cas détaillé à 6 clients

#### Annexe B — Résultats complémentaires et reproductibilité

- Bilan : 200/12000 essais non-conformes (1,667 %)
- **Premier contre-exemple :** `n3-ties-r16-amount_noise_1pct`, graine corpus 20461118, graine perturbation 30461137
  - 3 clients × 3 commandes
  - Clients 00001 et 00002 ont chacun somme = 30,05 USD → score M différent en JavaScript (flottant binaire)
- 4 cellules H2 : taux moyen = 0,000 %
- 120 lignes de résultats de changement

---

## 5. Dossier `recherche/` — protocole expérimental

**ID Drive :** `1sz2csGl06I9rXN5647jp0uwfeSIeuMep`

### 5.1 Structure

```
recherche/
├── LIRE_EN_PREMIER.md          ← Guide d'entrée dans l'archive
├── SHA256SUMS.json             ← Empreintes des 19 fichiers sources compacts
├── package.json                ← ELMES-TEKA v2.3.0 (Next.js, React 19, Mongoose 9.7.4, Pusher)
├── REVISION.txt                ← Hash de révision
├── Analyse_methodologique_...v2.md  ← Synthèse des échanges méthodo
├── analyse_trials_csv.py       ← Script d'analyse de trials.csv
├── desc_et_probabilites.py     ← Stats descriptives population simulée
├── resim.py                    ← Re-simulation personnelle Claude (≠ données auteur)
├── INVENTAIRE_CORPUS_V3/V2_2026-11-04.md
├── INDEX_CORPUS.md
├── ANALYSE_FICHES_ET_ORIENTATION.md
├── NEUF_NOTIONS_ET_FONDEMENTS.md
└── ELMES_TEKA_Mission_RFM/     ← (non complètement exploré)
    ├── protocole/
    │   ├── README.md           ← Protocole complet
    │   ├── RESULTATS.md        ← Résultats officiels
    │   ├── VALIDATION.md       ← Vérification du dispositif
    │   ├── REFERENCE_REVIEW.md ← Traçabilité de la référence
    │   ├── SUITE_CODEX.md      ← Consigne de reprise pour Codex
    │   ├── CANDIDATS_BIBLIOGRAPHIQUES.bib
    │   ├── config/protocol-v1.json
    │   ├── lib/engine.mjs + generator.mjs
    │   ├── fixtures/conformity.mjs
    │   ├── run.mjs             ← Lance la campagne Monte-Carlo
    │   ├── analyze.py + write_report.py
    │   ├── build_notebook.py
    │   ├── notebooks/analyse_rfm.ipynb
    │   ├── results/run-v1/     ← 12 fichiers bruts vérifiés
    │   └── tests/
```

### 5.2 `RESULTATS.md` — résultats officiels

- 12 000 essais, 9 cas manuels (0 échec)
- **H1 :** 200 essais (1,667 %) avec au moins un écart
- **H2 :** 4 cellules compatibles (taux = 0,000 %)
- Dégénérescence : profil `ties` → 1 catégorie quelle que soit la taille
- **Avertissement critique :** les 200 écarts = arithmétique flottante JavaScript vs centimes Python ; *"ne pas annoncer 200 bugs de production"*

### 5.3 `VALIDATION.md` — vérification du dispositif

| Test | Résultat |
|------|----------|
| `node --test research/protocole/tests/*.test.mjs` | 13 tests ✅ |
| `python -m unittest` (3 tests Python) | ✅ |
| `pnpm test` (17 tests applicatifs) | ✅ |
| `pnpm build` | ✅ |
| ESLint nouveaux fichiers .mjs | ✅ |
| `pnpm lint` global | ❌ 198 erreurs + 32 avertissements (fichiers existants inchangés) |
| Campagne Monte-Carlo | 12 000 essais, 12 fichiers vérifiés par empreinte |

**Particularités :** sockets Jupyter non disponibles → notebook exécuté en mode `--inprocess` (IPython inline). Premiers lots bruts rejetés (intégrité), régénérés avec mêmes paramètres.

### 5.4 `REFERENCE_REVIEW.md` — traçabilité

La première analyse relevait **189 essais** avec écarts (virgule flottante Python simple). Examen d'un contre-exemple (`30.02` vs `30.020000000000003`) → la référence a été **révisée en version 1.1** : somme exacte en centimes entiers. Cette révision est **post-observation** (après les premiers écarts). Elle ne concerne que la mesure de conformité monétaire ; les données brutes, scénarios et critères H2 n'ont pas été modifiés.

### 5.5 `SUITE_CODEX.md` — consigne de reprise pour Codex

Document adressé à Codex (OpenAI) pour reprendre le travail. Contient :
- Branche : `protocole`
- Ne pas recréer les données brutes existantes
- Ne pas corriger l'artefact avant de tester la version initiale
- Prochaine priorité : **reproduction MongoDB** réelle avec vrais types numériques
- Retour attendu : commit testé, tableau de conformité, contre-exemples, figures, notebook, PR brouillon

### 5.6 `package.json` — dépendances ELMES-TEKA

```json
{
  "name": "free-nextjs-admin-dashboard",
  "version": "2.3.0",
  "dependencies": {
    "next": "^16.4.3",
    "react": "^19.2.0",
    "mongoose": "^9.7.4",
    "pusher": "^5.3.4",
    "pusher-js": "^8.5.0",
    "cloudinary": "^2.10.0",
    "apexcharts": "^4.7.0"
  }
}
```

### 5.7 `Analyse_methodologique_et_simulation_RFM_2026-11-05_v2.md`

Document de synthèse des échanges méthodologiques (5 nov 2026). Contient un tableau de provenance des données :
- **[code]** : lu dans `customer-rfm.ts` ou `analyze.py`
- **[données]** : calculé sur `trials.csv` (12 000 lignes, lues en entier)
- **[manuscrit]** : énoncé dans la v2 (`ELMES_TEKA_V2_Enrichie.pdf`)
- **[ma simulation]** : re-simulation Claude d'après le §1.9 de la v2 ≠ données auteur
- **[I]** : interprétation Claude, à discuter

**⚠️ Note importante :** ce document précise que `resim.py` est une re-simulation personnelle de Claude, pas les données de l'auteur.

---

## 6. Dossier `cours/` — corpus épistémologique

**ID Drive :** `1KwBUYt_n-7dHuIqY1wlVZo0ddxBCdXgH`  
8 fichiers PDF, pas de sous-dossiers.

| # | Fichier | Taille | Contenu résumé |
|---|---------|--------|----------------|
| 1 | `Cours — Épistémologie et méthodes de recherche en ingénierie.pdf` | 336 Ko | 10 pages. 3 niveaux (épistémologie/méthodologie/techniques), 8 courants épistémologiques, guide 6 étapes pour choisir sa posture. Références : Hevner 2004, Peffers 2007, Popper, Kuhn. ⚠️ Citations de mémoire, à vérifier. |
| 2 | `9782130776284.pdf` | 2,6 Mo | "Introduction à l'Épistémologie" Virieux-Reymond, PUF 1972. Manuel classique. Définition Lalande, distinction méthodologie/gnoséologie, histoire des sciences. |
| 3 | `Méthode de Recherche en Informatique.pdf` | 2,3 Mo | Tshikutu Anaclet Bikengela, HAL 2024. 47 pages. Courants (Bernard, Popper, Kuhn), structure TFC/mémoire, LaTeX. |
| 4 | `epistemologie.pdf` | 9,8 Mo | Contenu largement tronqué. "Épistémologie pour les sciences de l'éducation". Diagramme induction/déduction visible. |
| 5 | `master-1-epistemologie.pdf` | 57 Mo | Trop grand → contenu vide retourné. |
| 6 | `cours1.pdf` | 3,3 Mo | Polytech Lille — François Boulier, 2022. Inductivisme, falsificationisme (Popper), théorie de Kuhn, révolution copernicienne. |
| 7 | `8_2020_05_15!01_44_44_AM.pdf` | 1 Mo | ECOLE PRATIQUE/CCIP Abidjan (Assie + Kouassi). 20 chapitres : définition recherche, stratégies de vérification, structure mémoire, hypothèses, variables, bibliographie. |
| 8 | `1017321705-Cours-de-Methodes-de-Recherches-en-Informatique-BAC1-2026.pdf` | 702 Ko | UNIKAB (Ngoyi Ilunga, MAJ nov 2025). Méthodes quantitatives/qualitatives, APA/IEEE, analyse résultats (SPSS, Python). |

---

## 7. Dossiers `liste/`, `fiches/`, `instructions/`

### 7.1 `liste/` — corpus de lecture

**Fichier clé :** `Liste à jour — mémoires et thèses à analyser.md`

Corpus établi le 28 oct 2026. Deux fiches déjà faites (Zerrouk, Belhadj). 10 nouveaux travaux retenus.

**Travaux retenus :**
| # | Auteur (année) | Sujet | Niveau |
|---|---------------|-------|--------|
| 3 | Kazimoto (2023) | Credit Scoring des commerçants informels (Nomanini, Lesotho) | MPhil UCT économie |
| 4 | Oindi (2024) | (application web déployée) | — |
| 5 | Belhadj (2025) | Plateforme éducative interactive | Mémoire Tlemcen |
| 6+ | Zhang (LLM transactions bancaires) | — | — |
| 7+ | Salminen et al. | Customer segmentation RFM | — |

⚠️ Note : *"la plupart de ces travaux relèvent de la finance plutôt que du développement logiciel. Aucun mémoire trouvé sur la RDC ou l'Afrique centrale."*

### 7.2 `fiches/` — fiches de lecture

**12 fiches lues :**

**Fiche n°1 — Zerrouk (2025)** : *Developing an AI-Based Approach for Project Requirements Analysis*, Tlemcen. Approche IA pour l'analyse des exigences. Modèle ML. Lien DSR + évaluation par expérimentation.

**Fiche n°2 — Belhadj (2025)** : *Conception et développement d'une plateforme éducative interactive*, Tlemcen. Développement logiciel pédagogique. Méthode orientée évaluation.

**Fiche n°3 — Kazimoto (2023)** : *Using Supervised Learning Methods to Credit Score Informal Merchants*, MPhil UCT. Commerçants informels (Nomanini, Lesotho), régression logistique + SVM. Meilleur modèle : historique de crédit seulement (Gini 0,6143).

**Fiche n°4 — Oindi (2024)** : Application web déployée pour micro-entreprises.

**Fiches CR-01 à CR-06 :** corpus de recherche ELMES-TEKA :
- CR-01 : SPF3/CERISE/MFC (2016) — microfinance
- CR-02 : MicroSave Toolkit (2007) — outils gestion PME africaines
- CR-03 : SLE Kinshasa (2014) — commerce informel Kinshasa
- CR-04 : Katengu (2009) — économie RDC
- CR-05 : Beas Diaz & CMF (2024) — CRM et segmentation
- CR-06 : Golec & AlabdulJalil (2025) — IA et gestion commerciale

### 7.3 `instructions/` — instructions et jury

**`Instructions_du_projet.md`** : règles de travail de l'environnement claude.ai pour ce projet spécifique.

**`JURY_Claude.md`** : document définissant les critères d'évaluation du travail. Contient probablement les consignes de l'encadreur ou les critères de la soutenance.

---

## 8. Synthèse : état du mémoire au 5 novembre 2026

### 8.1 Ce qui est fait

✅ **Protocole expérimental** : complet, verrouillé, reproduisible (12 000 essais, 12 fichiers vérifiés par empreinte SHA-256)  
✅ **Campagne Monte-Carlo** : exécutée, résultats conservés  
✅ **Projet LaTeX** : 36 pages compilées, tous les chapitres structurés  
✅ **Introduction** : contextualisée (RDC, micro-entreprises, lacune des CRM)  
✅ **Chapitre 1** (Méthodes) : DSR, ADEMP, hypothèses, variables, protocole  
✅ **Chapitre 2** (Revue) : RFM (3 familles), contexte congolais, évaluation par simulation  
✅ **Chapitre 3** (Résultats) : chiffres vérifiés (1,667 %, 4 cellules H2, sensibilité)  
✅ **Chapitre 4** (Discussions) : H1/H2 interprétés, limites de validité identifiées  
✅ **Conclusion** : contribution, limites, perspectives  
✅ **Annexes** : protocole détaillé + résultats complémentaires  
✅ **Bibliographie** : 16 entrées APA 7 vérifiées  
✅ **Corpus de lecture** : fiches de lecture établies  

### 8.2 Ce qui reste à faire

🔄 **Figures expérimentales** : non encore importées dans le projet LaTeX  
🔄 **Références dans le texte** : bibliographie désactivée (`\bibliographieActivefalse`)  
🔄 **Validation MongoDB réelle** : reproduction avec vrais types numériques (`$sum` MongoDB)  
🔄 **Métadonnées personnelles** : auteur, directeur, année académique non renseignés  
🔄 **Conventions typographiques françaises** : nécessitent `texlive-lang-french`  
🔄 **Lecture intégrale** du corpus bibliographique (16 entrées partiellement lues)  

### 8.3 Ordre de rédaction retenu par l'auteur

| Rang | Partie | Priorité |
|------|--------|---------|
| 1 | Ch.3 Résultats | Tableaux vérifiés, figures, constats |
| 2 | Ch.2 Revue Littérature | Sources lues, comparaison critique |
| 3 | Ch.4 Discussions | Réponse H1/H2, comparaison travaux |
| 4 | Ch.1 Matériels/Méthodes | Description fidèle post-résultats |
| 5 | Introduction | Cohérente avec travail effectivement fait |
| 6 | Conclusion | Sans nouvelles preuves |

---

## 9. Points de vigilance et lacunes identifiées

### 9.1 Failles scientifiques dans le code

| Problème | Localisation | Impact |
|---------|-------------|--------|
| **Circularité RFM** | `compareSegments()` : M construit sur CA, comparé sur CA | Résultats exploratoires seulement (documenté) |
| **Games-Howell ≠ Games-Howell** | `gamesHowellPosthoc()` : utilise t, pas studentized range | Sous-approximation conservative |
| **p-values arrondies avant test** | ANOVA/tests | Peut créer des décisions incorrectes aux frontières |
| **Poids OLS inversés** | `financial-solver.ts` | Plus ancien = poids le plus élevé |
| **Pas de séparation USD/CDF** | `computeRFM` | Monnaie mixte peut biaiser les scores M |

### 9.2 Limites de la campagne Monte-Carlo

- Simulation synthétique uniquement (pas de vraies données clients)
- Double JavaScript, pas `$sum` MongoDB réel → 200 écarts attribués à l'arithmétique flottante
- Référence clarifiée *après* observation des premiers écarts (non préenregistrée pour la mesure monétaire)
- Profil `ties` complètement dégénéré (1 catégorie) → ne représente pas un cas d'usage réel

### 9.3 Lacunes bibliographiques

- Aucun travail trouvé sur la RDC ou l'Afrique centrale
- 16 entrées vérifiées, mais plusieurs `PARTIELLEMENT_LU` ou à lire
- `resim.py` = re-simulation de Claude ≠ données officielles de l'auteur

### 9.4 Risques pour la soutenance

- **Non-indépendance de la référence** : la première référence (virgule flottante) a dû être révisée post-observation → à mentionner explicitement comme limite méthodologique
- **IC de largeur nulle pour H2** : ne prouve pas une probabilité exactement nulle, seulement la compatibilité avec le protocole dans les mécanismes simulés
- **Lint global rouge** : 198 erreurs ESLint dans les fichiers existants inchangés → distinguer des nouveaux ajouts

---

*Rapport généré le 5 novembre 2026 par Claude (agent coordinateur + sous-agents Google Drive).*  
*Dossiers non complètement explorés : `version-v2/`*
