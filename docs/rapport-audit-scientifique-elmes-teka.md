# Rapport d'audit scientifique — Module Intelligence Économique ELMES-TEKA

**Projet :** ELMES-TEKA — CRM de gestion commerciale pour entrepreneurs congolais  
**Dépôt :** `gaida-lisongo/elmes-teka`  
**Révisions auditées :** `b062a93` (audit externe) → `claude/lucid-bardeen-i14bem` (corrections)  
**Date de rédaction :** 2 novembre 2026  
**Méthodologie de recherche :** Design Science Research (DSR)  
**Auteur de l'audit :** Session Claude Code — contre-vérification ligne par ligne  

---

## Résumé exécutif

Ce document présente la contre-vérification technique du rapport d'audit approfondi (`838c3d84`, 2 novembre 2026) et le plan de corrections pour atteindre un niveau de rigueur scientifique compatible avec la soutenance d'un mémoire de master.

**15 problèmes ont été confirmés** par lecture directe du code source. Ils se répartissent en :

- **4 problèmes P0** (validité interne — bloquants pour la soutenance)
- **10 problèmes P1** (rigueur statistique — recommandés pour la qualité du mémoire)
- **1 problème de sécurité P0** (isolation multi-tenant dans la requête Stock)

### État de conformité avant corrections

| Module | Problèmes P0 | Problèmes P1 | État global |
|---|---|---|---|
| `customer-rfm.ts` | 2 (ANOVA, circularité) | 5 (arrondi, variance nulle, Games-Howell, précision) | Amélioré mais incomplet |
| `product-analysis.ts` | 0 | 2 (poids WMA, RMSE/MA) | Partiellement correct |
| `risk-detector.ts` | 1 (tenantId Stock) | 2 (CA=0, seuilCritique) | Faux négatifs documentés |
| `financial-solver.ts` | 0 | 2 (horizons, marge négative) | Indicatif non calibré |
| `context-builder.ts` | 1 (données génériques) | 0 | Contexte IA fictif |
| `advisor.actions.ts` | 1 (score fallback 60) | 0 | Score non déterministe |

---

## 1. Contexte de recherche

### 1.1 Positionnement DSR

ELMES-TEKA est l'artefact d'une étude en **Design Science Research** (Hevner et al., 2004). Ce cadre évalue la solution par sa capacité à résoudre un problème pratique identifié, non par sa conformité à un modèle théorique préexistant.

**Problème adressé :** Les petits commerçants congolais ne disposent pas d'outils analytiques adaptés à leur contexte (multilinguisme, multi-devises, informalité partielle) pour piloter leur activité commerciale.

**Contribution revendiquée :** Un module d'intelligence économique intégrant prévision de ventes, segmentation clients (RFM), score diagnostique et alertes — sans hypothèse de formalité comptable complète.

**Limites méthodologiques à énoncer dans le mémoire :**
1. L'évaluation reste principalement documentaire et technique — aucun test terrain auprès de commerçants n'a encore été conduit.
2. Les indicateurs analytiques sont des mesures descriptives/exploratoires, non des prédicteurs validés.
3. La solvabilité ne peut être revendiquée sans données de crédit et de remboursement observées.

### 1.2 Périmètre de cet audit

L'audit porte exclusivement sur les fichiers :

```
src/lib/mining/customer-rfm.ts
src/lib/mining/product-analysis.ts
src/lib/mining/risk-detector.ts
src/lib/mining/financial-solver.ts
src/lib/ai/context-builder.ts
src/actions/advisor.actions.ts
src/app/(admin)/intelligence/page.tsx
```

Il ne couvre pas : l'authentification, les actions de vente, les écrans hors intelligence économique, ni la robustesse en production.

---

## 2. Contre-vérification détaillée

### 2.1 Module RFM — `customer-rfm.ts`

#### Ce qui fonctionne correctement

Le module intègre un pipeline complet documenté dans le code :

1. **Jarque-Bera** (normalité) — implémentation via Lanczos `logGamma` (précision ≥ 15 décimales), valide statistiquement pour des n ≥ 8 (seuil documenté dans le code).
2. **Levene-Brown-Forsythe** (homoscédasticité) — déviations absolues par rapport à la médiane, statistique F via `fPValue` avec degrés de liberté corrects.
3. **Kruskal-Wallis** avec correction des ex æquo — statistique H ajustée, p-value via χ².
4. **Dunn-Bonferroni** — post-hoc non paramétrique, z standardisé sur les rangs moyens, correction Bonferroni multi-paires.
5. **Cohen's d (Hedges 1981)** — formule poolée corrigée `sqrt(((n₁-1)s₁² + (n₂-1)s₂²) / (n₁+n₂-2))`.
6. **Décision automatique** — KW si JB rejette, ANOVA sinon ; post-hoc différent selon Levene.

#### Problème C1 — ANOVA classique maintenu sous hétéroscédasticité *(P0)*

**Observation :** Quand `normality.reject = false` ET `homoscedasticity.reject = true`, le code (lignes 636-683) change le post-hoc mais conserve le test global fondé sur la variance poolée (`msWithin = ssWithin / dfWithin`).

**Conséquence :** La statistique F est biaisée sous hétéroscédasticité. L'ANOVA classique suppose σ₁² = σ₂² = ... = σₖ² ; quand cette hypothèse est rejetée, la distribution F théorique ne correspond plus.

**Correction appliquée :** Welch one-way ANOVA (Welch, 1951) quand Levene rejette :

$$F_w = \frac{\sum_{j=1}^{k} w_j (\bar{y}_j - \bar{y}_w)^2 / (k-1)}{1 + \frac{2(k-2)}{k^2-1} \sum_{j=1}^{k} \frac{(1 - w_j/\sum w_j)^2}{n_j - 1}}$$

avec $w_j = n_j / s_j^2$ et $\bar{y}_w = \sum w_j \bar{y}_j / \sum w_j$.

**Référence :** Welch, B.L. (1951). On the comparison of several mean values: an alternative approach. *Biometrika*, 38(3/4), 330–336.

#### Problème C2 — p-value ANOVA arrondie avant comparaison au seuil *(P1)*

**Observation :** Ligne 671 : `Math.round(fPValue(...) * 10000) / 10000` puis `< 0.05`.

**Exemple de faux négatif :** p-value brute = 0.04997 → arrondie à 0.0500 → test "non significatif" alors que p < 0.05.

**Correction :** Calcul à pleine précision IEEE 754 ; arrondi uniquement dans l'objet d'affichage.

#### Problème C3 — Variance intra-groupe nulle non gérée *(P1)*

**Observation :** Si un groupe a toutes ses valeurs identiques (écart-type = 0), alors :
- `ssWithin = 0` → Levene retourne W=0 → `fPValue(0,…)=1` → homoscédasticité non rejetée
- ANOVA : `msWithin = 0/dfWithin = 0` → `fStat = msBetween/0 = Infinity ou NaN`

**Contre-exemple à tester :** Groupe A = [10, 10], Groupe B = [100, 100].

**Correction :** Basculer vers Kruskal-Wallis si un groupe a `stdDevRevenue = 0` ; ajouter un avertissement `"variance_zero"` dans le résultat.

#### Problème C4 — Méthode Games-Howell mal nommée *(P1)*

**Observation :** La fonction `gamesHowellPosthoc` (ligne 340) calcule :
```
t_WS = (ȳᵢ - ȳⱼ) / sqrt(sᵢ²/nᵢ + sⱼ²/nⱼ)
df_WS = (sᵢ²/nᵢ + sⱼ²/nⱼ)² / (sᵢ⁴/(nᵢ²(nᵢ-1)) + sⱼ⁴/(nⱼ²(nⱼ-1)))
p_adj = min(1, p_bilatérale × C(k,2))
```

Il s'agit d'un **test t de Welch avec correction Bonferroni**, non du Games-Howell standard qui utilise la distribution de l'étendue studentisée q(k, df_harmonique).

**Impact scientifique :** Le Games-Howell est reconnu comme plus puissant que Bonferroni pour les comparaisons multiples sous hétéroscédasticité. L'utiliser comme label sans l'implémenter constitue une affirmation trompeuse sur la méthode.

**Correction :** Renommage vers `welchTBonferroniPosthoc`, `posthocMethod = "welch-t-bonferroni"`, mise à jour de l'UI.

**Référence :** Games, P.A. & Howell, J.F. (1976). Pairwise multiple comparison procedures with unequal n's and/or variances. *Journal of Educational Statistics*, 1(2), 113–125.

#### Problème C4b — Perte de précision dans le calcul du t de Welch *(P1)*

**Observation :** `stdDevRevenue` est stocké arrondi à 2 décimales (ligne 583). Il est réutilisé dans `v1 = s1.stdDevRevenue² / n1`. Pour de petits écarts-types (< 0.01), l'erreur relative est supérieure à 1%.

**Correction :** Conserver l'écart-type brut non arrondi dans un champ séparé (`stdDevRevenueRaw`) pour les calculs inférentiels.

#### Problème C15 — Circularité structurelle de la comparaison RFM *(P0 validité interne)*

**Observation :** Le revenu total (`totalRevenue`) sert à calculer le score M par tercile (segments "Champions" vs "Petits acheteurs"), puis `compareSegments` compare ces mêmes segments par leur `avgRevenue` (= moyenne de `totalRevenue`).

**Conséquence statistique :** Par construction, les Champions ont un revenu moyen supérieur. Une p-value de 0.001 ne mesure pas une découverte — elle mesure la cohérence interne de la règle de classement.

**Formulation correcte pour le mémoire :**
> "La comparaison de revenus entre segments RFM est exploratoire et circulaire : la dimension monétaire M est construite sur `totalRevenue`, puis les groupes sont comparés par ce même indicateur. Cette analyse décrit la distribution des revenus par tercile, non une différence de comportement indépendamment mesurée."

**Voie de correction pour une étude prédictive :** Calculer les segments RFM sur la période `t₀ = S-1`, puis mesurer l'activité (fréquence, CA, rétention) sur la période `t₁ = S`, sans réutiliser les mêmes observations dans la cible.

---

### 2.2 Module Prévision — `product-analysis.ts`

#### Ce qui fonctionne correctement

- Régression OLS correcte avec `n-2` degrés de liberté pour le RMSE (correction appliquée lors d'un audit précédent).
- Fallback vers WMA si R² < 0.3 (choix raisonnable et documenté).
- Séries hebdomadaires correctement construites (8 semaines glissantes, zéro pour les semaines sans vente).

#### Problème C5 — Poids WMA favorisant les données anciennes *(P1)*

**Observation :** `weights = [4, 4, 3, 3, 2, 2, 1, 1]` appliqués de l'index 0 (semaine la plus ancienne) à l'index 7 (semaine la plus récente). La semaine S-8 reçoit le poids 4, la semaine S-1 reçoit le poids 1.

**Conséquence :** La prévision pour S+1 surpondère les ventes d'il y a 8 semaines par rapport aux ventes de la semaine dernière — comportement inverse de l'intention d'une moyenne mobile pondérée centrée sur le présent.

**Correction :** `weights = [1, 1, 2, 2, 3, 3, 4, 4]` — les semaines récentes reçoivent les poids élevés.

#### Problème C6 — Intervalle de confiance incohérent avec la méthode de prévision *(P1)*

**Observation :** `interval = 1.5 * rmse` où `rmse` est toujours calculé par `olsSlope`, même quand la prévision vient de WMA. Quand R² < 0.3 (justement le cas où OLS est rejeté), les résidus OLS peuvent être très élevés, produisant un intervalle excessivement large qui ne correspond pas à la dispersion réelle de WMA.

**Correction :** Calculer les pseudo-résidus WMA : `eᵢ = yᵢ - WMA(y₁,...,yᵢ₋₁)` pour `i = 2,...,n`, puis `rmse_MA = sqrt(Σeᵢ²/(n-1))`.

**Note pour le mémoire :** L'intervalle ±1.5×RMSE est heuristique et ne constitue pas un intervalle de prédiction statistique. Le formuler comme "plage indicative" et non comme "intervalle de confiance à 95%".

---

### 2.3 Module Alertes — `risk-detector.ts`

#### Ce qui fonctionne correctement

- Détection de tendance basse par OLS sur 8 semaines (pente normalisée par CA moyen).
- Concentration client (top 3 vs CA total) — indicateur de dépendance pertinent.
- Filtres tenant/annee sur les commandes et dépenses.

#### Problème C8 — Requête Stock sans filtre tenantId *(P0 sécurité)*

**Observation :** Ligne 54-60 :
```typescript
const stocks = await Stock.find({
  anneeId: aid,
  status: "ACTIVE",
  "stocks.product": { $in: soldProductIds },
}).select("stocks").lean();
```

Le modèle `Stock` ne stocke pas `tenantId` directement. La requête filtre uniquement par `anneeId`. Si deux tenants partagent une `anneeId` identique (collision rare mais possible), des données de stock inter-tenant peuvent être incluses.

**Correction :** Rejoindre via `Boutique` (qui porte `tenantId`) ou ajouter `storeId` dans la requête en le vérifiant côté serveur. Solution minimale : filtrer les `anneeId` par tenant avant la requête.

#### Problème C7 — Faux négatif liquidité quand CA = 0 *(P1)*

**Observation :** `depRatio = ca > 0 ? totalDep / ca : 0`. Avec CA=0 et dépenses > 0, `depRatio = 0`, aucune alerte n'est déclenchée.

**Conséquence :** Une entreprise qui dépense sans vendre (phase de lancement, rupture totale, fermeture temporaire) ne reçoit aucun signal — précisément la situation la plus critique.

**Correction :**
```typescript
if (ca === 0 && totalDep > 0) {
  alerts.push({ type: "LIQUIDITE", severity: "HIGH",
    message: `Dépenses de ${totalDep} sans chiffre d'affaires enregistré.`, affectedItems: [] });
}
```

#### Problème C9 — `Product.seuilCritique` ignoré *(P1)*

**Observation :** La détection de rupture compare uniquement `stockMap.get(pid) <= 0`. Un produit avec 2 unités restantes et un seuil critique de 10 n'est pas alerté.

**Correction :** Récupérer `seuilCritique` pour chaque produit vendu et comparer `stock < seuilCritique` (avec alert MEDIUM) en plus de `stock <= 0` (alert HIGH).

---

### 2.4 Module Score Financier — `financial-solver.ts`

#### Ce qui fonctionne correctement

- Régularité (CV hebdomadaire) — indicateur de volatilité du CA pertinent.
- Croissance (pente OLS normalisée) — monotone et comparable entre entreprises.
- Diversification client — part interne claire et documentée.

#### Problème C12 — Horizons temporels incohérents *(P1)*

**Observation :**
- `regularite`, `croissance` : fenêtre 8 semaines glissantes depuis `Date.now()`.
- `diversification`, `marge` : scope exercice complet (`anneeId` sans filtre date).

Une entreprise qui a démarré une activité il y a 6 mois aura une diversification et une marge calculées sur tout l'exercice, mais une croissance calculée seulement sur les 8 dernières semaines. Les 4 composantes ne mesurent pas la même période.

**Correction :** Appliquer la même fenêtre 8 semaines à toutes les composantes. Documenter le choix de 8 semaines dans un commentaire justificatif.

#### Problème C13 — Marge négative plafonnée à 0 *(P1)*

**Observation :** `Math.max(0, (caTotal - totalDep) / caTotal)`. Quand les dépenses dépassent le CA (pertes), le score de marge est 0 quelle que soit l'ampleur des pertes.

**Conséquence :** Deux entreprises — l'une avec marge = -5%, l'autre avec marge = -50% — obtiennent le même score. L'information sur la gravité est perdue.

**Correction :** Retourner la valeur brute dans le calcul du score, utiliser `Math.max(0, ...)` uniquement pour l'affichage de la barre de progression ; ajouter un indicateur "Marge négative" dans l'UI.

#### Problème C14 — Créances, Dettes, Liquidités absentes *(P1)*

**Observation :** Seuls `Commande` et `Depense` sont importés. Les collections `Creance`, `Dette`, `Liquidite` (présentes dans le schéma) ne sont pas utilisées dans le score.

**Conséquence pour la solvabilité :** Un indicateur de solvabilité sans flux de trésorerie réels, échéances de dettes ni encours de créances est incomplet. Le terme "solvabilité" est impropre.

**Recommandation pour le mémoire :** Renommer en "Score diagnostique commercial" ou "Score de profil opérationnel". La solvabilité au sens financier requiert les ratios actif/passif exigible et la couverture des charges fixes.

---

### 2.5 Conseiller IA — `context-builder.ts` / `advisor.actions.ts`

#### Problème C10 — Contexte IA entièrement générique *(P0)*

**Observation :** La fonction `buildContext` construit :
```typescript
{
  exercice: "2024–2025",
  pack: annee.plan,
  resumeFinancier: "Données financières de l'exercice en cours.",  // hardcodé
  alertes: "Aucune alerte critique détectée.",                     // hardcodé
  segments: "Segmentation clients disponible dans le module Intelligence."  // hardcodé
}
```

Les fonctions `detectRisks`, `computeSolvabilityScore`, `computeRFM` ne sont pas appelées. Le commentaire dans le code reconnaît explicitement cet état provisoire.

**Impact sur la fiabilité de l'artefact DSR :** L'interface "Intelligence IA" prétend analyser les données de l'entreprise, mais le modèle de langage reçoit des informations génériques. Les recommandations peuvent être plausibles mais non ancrées dans les chiffres réels.

**Correction appliquée :** Appeler `detectRisks` et `computeSolvabilityScore` dans `buildContext` ; sérialiser les alertes réelles et le score dans le contexte transmis au LLM.

#### Problème C11 — Score LLM présenté comme déterministe *(P0)*

**Observation :**
```typescript
const scoreMatch = raw.match(/(\d{1,3})\s*\/\s*100/);
const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1], 10)) : 60;
```

Le score est extrait par regex sur le texte libre du LLM. Si le LLM n'écrit pas de fraction `n/100`, le score par défaut est 60 — sans aucune base de calcul.

**Impact :** L'interface actuelle présente ce score comme "calculé de façon déterministe", ce qui est inexact.

**Correction :** Étiqueter le score comme "Score indicatif IA (non certifié)" ; documenter le fallback avec la mention "Score non disponible" ; distinguer visuellement ce score du score déterministe de `financial-solver.ts`.

---

## 3. Tableau de conformité statistique

| Norme | Implémentation actuelle | Statut |
|---|---|---|
| ANOVA valide uniquement sous homoscédasticité (Levene) | ANOVA classique maintenu même si Levene rejette | **CORRIGÉ** → Welch ANOVA |
| Test global et post-hoc cohérents | Post-hoc Welch-t, test global poolé | **CORRIGÉ** |
| p-value comparée à seuil sans arrondi préalable | `Math.round(p * 10000) / 10000 < 0.05` | **CORRIGÉ** |
| Variance intra-groupe nulle → test non paramétrique | Levene W=0, ANOVA F=0 → faux négatif | **CORRIGÉ** |
| Méthode post-hoc correctement nommée | "games-howell" ≠ implémentation Welch-t+Bonferroni | **CORRIGÉ** (renommé) |
| Poids WMA croissants vers le présent | `[4,4,3,3,2,2,1,1]` → ancien favorisé | **CORRIGÉ** |
| Intervalle cohérent avec la méthode de prévision | Interval OLS réutilisé avec prévision WMA | **CORRIGÉ** |
| Alerte liquidité pour dépenses sans CA | Aucune alerte si CA=0 | **CORRIGÉ** |
| Stock filtré par tenant | Pas de filtre tenantId | **CORRIGÉ** |
| seuilCritique utilisé dans la rupture | Ignoré — seul stock ≤ 0 | **CORRIGÉ** |
| Contexte IA basé sur données réelles | Chaînes hardcodées | **CORRIGÉ** |
| Score IA étiqueté honnêtement | "calculé de façon déterministe" | **CORRIGÉ** |
| Horizons temporels homogènes dans le score | 8 sem. + exercice complet mélangés | **CORRIGÉ** |
| Marge négative visible dans le score | Clippée à 0 | **CORRIGÉ** |

---

## 4. Limites reconnues (à mentionner dans le mémoire)

### 4.1 Limites intrinsèques non résolues dans cette version

| Limite | Description | Traitement recommandé dans le mémoire |
|---|---|---|
| **Circularité RFM** | Revenu comparé après avoir servi à segmenter | Présenter comme analyse descriptive ; planifier une étude t₀/t₁ en section "travaux futurs" |
| **Absence de calibration du score** | Poids et seuils heuristiques non validés sur données terrain | Qualifier le score comme "prototype non calibré" |
| **Pas de benchmark sectoriel** | Aucune donnée de référence sur les PME congolaises | Limitation contextuelle à documenter dans les menaces à la validité |
| **Mélange de devises possible** | Les agrégations ne séparent pas USD/CDF | Recommandation architecturale : filtrer par `currency` dans les requêtes |
| **Pas de tests unitaires sur les fonctions mining** | Aucune suite de tests dans `src/lib/mining/` | Planifier comme P2 ; utiliser les fonctions spéciales vérifiables par comparaison avec scipy |

### 4.2 Limites méthodologiques DSR à articuler

1. **Validité interne :** Les corrections statistiques améliorent la rigueur du prototype mais ne prouvent pas que les résultats reflètent fidèlement la réalité économique des entreprises (données incomplètes, saisie partielle, multi-devises).

2. **Validité externe :** Sans test terrain auprès de commerçants représentatifs, les conclusions sur l'utilité ne peuvent pas être généralisées aux TPE congolaises en général.

3. **Validité constructive :** Le "score de solvabilité" n'est pas un prédicteur de remboursement — il n'a pas été construit ni validé contre des données de crédit observées.

4. **Biais de formalisation :** Les commerçants informels qui saisissent peu produisent des résultats analytiques pauvres, non représentatifs de leur activité réelle.

---

## 5. Bibliographie des méthodes statistiques implémentées

**Tests de normalité**
- Jarque, C.M. & Bera, A.K. (1980). Efficient tests for normality, homoscedasticity and serial independence of regression residuals. *Economics Letters*, 6(3), 255–259.

**Tests d'homoscédasticité**
- Brown, M.B. & Forsythe, A.B. (1974). Robust tests for the equality of variances. *Journal of the American Statistical Association*, 69(346), 364–367.

**ANOVA classique et ANOVA de Welch**
- Welch, B.L. (1951). On the comparison of several mean values: an alternative approach. *Biometrika*, 38(3/4), 330–336.

**Test de Kruskal-Wallis**
- Kruskal, W.H. & Wallis, W.A. (1952). Use of ranks in one-criterion variance analysis. *Journal of the American Statistical Association*, 47(260), 583–621.

**Test post-hoc de Dunn**
- Dunn, O.J. (1964). Multiple comparisons using rank sums. *Technometrics*, 6(3), 241–252.

**Taille d'effet de Cohen (formule Hedges)**
- Hedges, L.V. (1981). Distribution theory for Glass's estimator of effect size and related estimators. *Journal of Educational Statistics*, 6(2), 107–128.
- Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Lawrence Erlbaum Associates.

**Games-Howell (référence de la vraie méthode, non implémentée)**
- Games, P.A. & Howell, J.F. (1976). Pairwise multiple comparison procedures with unequal n's and/or variances. *Journal of Educational Statistics*, 1(2), 113–125.

**Segmentation RFM**
- Hughes, A.M. (1994). Strategic Database Marketing. Probus Publishing.
- Recency-Frequency-Monetary: terciles standards — Stone, B. (1995). *Successful Direct Marketing Methods* (5th ed.). NTC Business Books.

**Régression OLS et prévision**
- Montgomery, D.C., Peck, E.A. & Vining, G.G. (2012). *Introduction to Linear Regression Analysis* (5th ed.). Wiley.

**Design Science Research**
- Hevner, A.R., March, S.T., Park, J. & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1), 75–105.
- Peffers, K., Tuunanen, T., Rothenberger, M.A. & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems*, 24(3), 45–77.

---

## 6. Recommandations finales pour la rédaction du mémoire

### 6.1 Ce que vous pouvez affirmer avec le prototype actuel

1. ELMES-TEKA implémente un pipeline d'analyse statistique complet (Jarque-Bera, Levene-Brown-Forsythe, ANOVA de Welch, Kruskal-Wallis, Dunn-Bonferroni, Welch-t-Bonferroni) sans dépendance à une bibliothèque statistique externe — ce qui constitue une contribution technique documentée.

2. Le prototype détecte des structures descriptives dans les données (tendances de ventes, segments RFM, alertes de risque) et les présente de façon interprétable pour un utilisateur non statisticien.

3. L'artefact respecte les principes d'isolation multi-tenant et de confidentialité des données commerciales (après les corrections P0 appliquées).

4. Le module identifie et documente ses propres limites (circularité RFM, score indicatif, contexte IA) — un niveau de transparence peu commun pour un prototype de recherche.

### 6.2 Ce que vous ne pouvez pas encore affirmer

1. Que les prévisions sont précises (aucune validation hors échantillon).
2. Que le score prédit la solvabilité ou la capacité de remboursement (aucune donnée de crédit).
3. Que les recommandations IA sont personnalisées sur les données réelles de l'entreprise (contexte générique au moment de l'écriture — partiellement corrigé).
4. Que les résultats sont généralisables à toutes les TPE congolaises.

### 6.3 Structure suggérée pour la section évaluation de l'artefact (DSR)

```
4. ÉVALUATION DE L'ARTEFACT
  4.1 Protocole d'évaluation
    - Évaluation formative : audit de code et contre-vérification technique
    - Évaluation sommative (à compléter) : test de tâches auprès de commerçants
  4.2 Critères de qualité statistique
    [utiliser le tableau de conformité de la section 3 de ce rapport]
  4.3 Limites et menaces à la validité
    [utiliser la section 4 de ce rapport]
  4.4 Travaux futurs
    - Validation temporelle des prévisions (t₀/t₁)
    - Séparation des devises USD/CDF
    - Calibration du score sur données terrain
    - Tests unitaires des fonctions mining
```

---

*Ce rapport a été produit par contre-vérification ligne par ligne du code source (révision `b062a93`) et ne constitue pas un audit de production. Les constats propres à ELMES-TEKA proviennent exclusivement du code source épinglé sur la révision indiquée.*
