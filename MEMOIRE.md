# MEMOIRE.md — Ligne éditoriale du mémoire académique

> Ce fichier est lu par tous les agents IA qui contribuent à ce projet.
> Il définit la structure, les orientations scientifiques et les contraintes rédactionnelles du mémoire.
> **Toujours lire ce fichier avant toute action liée au mémoire.**
> Dernière mise à jour : 2026-11-06 — Révision suite aux demandes du directeur + recherche éditoriale.

---

## 1. Identification

| Champ | Valeur |
|---|---|
| Auteure | LISONGO BAÏTA Gaïda |
| Institution | Institut Supérieur des Techniques Appliquées — ISTA / Ndolo, Kinshasa |
| Département | Informatique de Gestion |
| Grade visé | Licencié en Informatique de Gestion |
| Promoteur | Prof. Ord. NTUMBA ILUNGA Alexis |
| Co-promoteur | Prof. Ass. MENI BABAKIDI Narcisse |
| Année académique | 2025 – 2026 |

---

## 2. Titre officiel

> **Évaluation des méthodes de segmentation RFM dans un contexte SaaS multiclient : cas de la plateforme ELMES-TEKA**

---

## 3. Plan officiel (imposé par le directeur)

```
INTRODUCTION GÉNÉRALE
  0.1  Problématique
  0.2  Hypothèses de travail
  0.3  Choix et intérêt du sujet
       0.3.1  Choix du sujet
       0.3.2  Intérêt du sujet (personnel / scientifique / socio-économique)
  0.4  Objectifs de l'étude
  0.5  Variables de l'étude
  0.6  Indicateurs de mesure
  0.7  Délimitation du sujet
       0.7.1  Délimitation spatiale
       0.7.2  Délimitation temporelle
       0.7.3  Délimitation dans le domaine
  0.8  Méthodes et techniques utilisées
       0.8.1  Méthodes
       0.8.2  Techniques
  0.9  Difficultés rencontrées
  0.10 Subdivision du travail

CHAPITRE 1 — REVUE DE LA LITTÉRATURE
  1.1  Commerce électronique et CRM en Afrique subsaharienne
  1.2  Le modèle RFM : origines, évolutions, variantes
       1.2.1  RFM classique (Hughes, 1994)
       1.2.2  RFM étendu
       1.2.3  RFM + clustering (k-means, clustering hiérarchique)
  1.3  SaaS multi-tenant : architecture et enjeux de données
       1.3.1  Définition et caractéristiques
       1.3.2  Isolation des données et contraintes de segmentation
  1.4  Synthèse et positionnement de notre étude

CHAPITRE 2 — CADRE THÉORIQUE
  2.1  Cadre conceptuel de la segmentation RFM
       2.1.1  Définition des variables (R, F, M)
       2.1.2  Méthodes de scoring adoptées
       2.1.3  Grille d'interprétation des segments
  2.2  Modèle théorique adapté à ELMES-TEKA
       2.2.1  Contraintes multi-tenant sur le calcul RFM
       2.2.2  Adaptation des seuils au contexte congolais
  2.3  Hypothèses opérationnelles
  2.4  Outils et environnement technique

CHAPITRE 3 — SIMULATION ET DISCUSSION
  3.1  Présentation des données utilisées
       3.1.1  Source : plateforme ELMES-TEKA
       3.1.2  Structure des données (Transaction, Client, Boutique, Exercice)
       3.1.3  Nettoyage et préparation des données
  3.2  Application de la segmentation RFM
       3.2.1  Calcul des scores R, F, M par client et par tenant
       3.2.2  Résultats de la segmentation (tableaux, visualisations)
  3.3  Évaluation des résultats
       3.3.1  Validation statistique (silhouette, Davies-Bouldin)
       3.3.2  Interprétation métier des segments
       3.3.3  Confrontation aux hypothèses
  3.4  Discussion
       3.4.1  Limites du modèle RFM dans le contexte ELMES-TEKA
       3.4.2  Perspectives d'amélioration

CONCLUSION GÉNÉRALE
  1. Synthèse des résultats
  2. Vérification des hypothèses (H1, H2, H3 — confirmées / infirmées)
  3. Limites de l'étude
  4. Perspectives et recommandations

BIBLIOGRAPHIE
ANNEXES
  Annexe A — Protocole de simulation
  Annexe B — Résultats détaillés
```

> **Note structurelle :** Ce plan est conforme à la tradition académique congolaise enrichie d'une dimension quantitative (simulation/évaluation). Il distingue « Revue de littérature » (ce que les auteurs disent) du « Cadre théorique » (le modèle conceptuel qu'on adopte) et du « Simulation et discussion » (mise en œuvre et évaluation sur ELMES-TEKA).

---

## 4. Problématique

### 4.1 Contexte et constat (à développer dans le texte)

Dans l'ère du commerce numérique, la gestion de la relation client constitue un levier stratégique décisif pour la compétitivité des entreprises. Les plateformes SaaS multi-tenant, qui servent simultanément plusieurs entrepreneurs depuis une infrastructure commune, font face à un défi particulier : comment permettre à chaque tenant de comprendre le comportement de ses propres clients, sans outrepasser les limites de l'isolation des données propre à une architecture multi-tenant ?

En République Démocratique du Congo, où la majorité des transactions commerciales restent informelles ou semi-formelles, la plateforme ELMES-TEKA constitue un cas d'usage singulier. Elle collecte des données transactionnelles réelles pour des entrepreneurs congolais dont les comportements clients différent fondamentalement des modèles occidentaux sur lesquels la littérature RFM s'est essentiellement construite.

### 4.2 Question centrale

> Dans quelle mesure les méthodes de segmentation RFM sont-elles pertinentes et efficaces pour catégoriser les clients des entrepreneurs utilisant la plateforme ELMES-TEKA dans un contexte SaaS multiclient ?

### 4.3 Questions spécifiques

1. Quels sont les scores RFM caractéristiques des clients de la plateforme ELMES-TEKA et quels segments comportementaux en émergent ?
2. Les segments RFM obtenus permettent-ils d'identifier des profils clients stables et cohérents au regard des réalités commerciales congolaises ?
3. Comment l'architecture multi-tenant d'ELMES-TEKA influence-t-elle la mise en œuvre et l'interprétation des résultats de la segmentation RFM ?

---

## 5. Hypothèses de travail

> **Style académique congolais :** Les hypothèses ne prennent PAS la forme H0/H1 statistique. Ce sont des *affirmations provisoires* numérotées, qui seront « confirmées ou infirmées » à la conclusion (source : Grawitz, 1971 ; WINGENGA).

### Citation méthodologique obligatoire

> *« L'hypothèse est une proposition de réponse à la question posée. Elle tend à formuler une relation entre les faits significatifs et à sélectionner les faits observés. »* — Madeleine GRAWITZ, *Méthodes des sciences sociales*, Dalloz, Paris, 1971.

### H1 — Hypothèse principale

> La segmentation RFM appliquée aux données transactionnelles de la plateforme ELMES-TEKA permet d'identifier des groupes de clients statistiquement distincts et commercialement significatifs, même dans un contexte de commerce informel congolais.

### H2 — Hypothèse secondaire

> Les scores de récence (R) et de fréquence (F) constituent des indicateurs plus discriminants que le score monétaire (M) pour caractériser les clients des entrepreneurs congolais utilisant ELMES-TEKA, en raison de la faiblesse du pouvoir d'achat et de la variabilité saisonnière des revenus.

### H3 — Hypothèse secondaire

> L'architecture multi-tenant d'ELMES-TEKA ne compromet pas la validité de la segmentation RFM à l'échelle d'un tenant individuel, à condition que l'isolation des données soit respectée et que le volume de transactions par boutique soit suffisant pour calibrer les seuils de scoring.

---

## 6. Variables de l'étude

### 6.1 Variable indépendante (VI)

**La méthode de segmentation RFM choisie**, comprenant :
- Sous-variables : méthode de scoring (quintiles, k-means, scoring 1–5, scoring pondéré)
- Paramètre de pondération : R=1/F=1/M=1 par défaut, ou pondérations différenciées

### 6.2 Variable dépendante (VD)

**La qualité et la pertinence de la segmentation obtenue**, comprenant :
- Nombre de segments distincts et cohérents
- Coefficient de silhouette des clusters
- Taux de couverture (% clients classés)
- Stabilité temporelle des segments

### 6.3 Variables de contrôle

- Volume de données par tenant (nombre de clients, nombre de transactions)
- Période d'exercice (saisonnalité congolaise : rentrée scolaire, fêtes de fin d'année)
- Type de commerce (détail, gros, service)
- Isolement multi-tenant (garantie que les données d'un tenant n'influencent pas les seuils d'un autre)

---

## 7. Indicateurs de mesure

### 7.1 Indicateurs RFM (calculés par client et par tenant dans ELMES-TEKA)

| Dimension | Définition | Mesure dans ELMES-TEKA |
|---|---|---|
| **Récence (R)** | Nombre de jours depuis la dernière transaction | Champ `derniere_vente` par tenant et boutique |
| **Fréquence (F)** | Nombre total de transactions sur la période | Nombre de lignes `Transaction` pour ce client |
| **Montant (M)** | Somme totale dépensée sur la période | Agrégat `montantTotal` des transactions du client |
| **Score RFM composite** | R×W_r + F×W_f + M×W_m | Calculé avec poids W_r, W_f, W_m |

### 7.2 Indicateurs de performance de la segmentation

| Indicateur | Description | Interprétation |
|---|---|---|
| Coefficient de silhouette | Cohésion et séparation des clusters | > 0,5 = bon ; > 0,7 = excellent |
| Indice de Davies-Bouldin | Séparation des clusters | Plus bas = meilleur |
| Inertie intra-classe | Homogénéité à l'intérieur d'un segment | Minimiser |
| Taux de rétention par segment | % clients du segment actifs à T+1 exercice | Stabilité temporelle |
| Panier moyen par segment | M / F | Valeur client moyenne |

### 7.3 Indicateurs qualitatifs

- **Pertinence managériale** : les segments sont-ils interprétables par un entrepreneur non-expert ?
- **Faisabilité locale** : les données nécessaires sont-elles disponibles dans ELMES-TEKA ?
- **Équité inter-tenant** : un tenant avec peu de clients obtient-il des segments valides ?
- **Taux d'isolation tenant** : % de données d'un tenant visibles à un autre (cible : 0 %)

---

## 8. Méthodologie

**Type de recherche :** Quantitative, expérimentale par simulation

**Méthodes :**
- Méthode analytique — analyse des données transactionnelles d'ELMES-TEKA
- Méthode comparative — comparaison des variantes de scoring RFM
- Méthode de simulation — calcul des scores RFM sur données réelles ou simulées

**Techniques :**
- Analyse documentaire (revue de littérature)
- Observation directe de la plateforme ELMES-TEKA
- Traitement statistique des données (Python : pandas, scikit-learn)

**Délimitation :**
- Spatiale : plateforme ELMES-TEKA, RDC
- Temporelle : données des exercices disponibles (2024–2025)
- Domaine : segmentation comportementale (non segmentation démographique) ; pas de ML prédictif (hors scope)

---

## 9. Consignes rédactionnelles pour les agents IA

### 9.1 Ton et registre

- Registre académique francophone congolais : phrases formelles, formulations impersonnelles, citations d'auteurs
- Toujours définir un concept avant de l'utiliser (ex : *tenant*, *RFM*, *SaaS*)
- Troisième personne ou passif scientifique
- Pas d'anglicismes non justifiés (préférer la traduction ou mettre le terme en italique avec définition)
- Pas d'affirmations non sourcées

### 9.2 Citations obligatoires dans l'introduction

| Objet | Auteur recommandé |
|---|---|
| Définition de l'hypothèse | GRAWITZ Madeleine, *Méthodes des sciences sociales*, Dalloz, 1971 |
| Définition de la recherche scientifique | PINTO Roger & GRAWITZ Madeleine |
| Définition CRM / RFM | Hughes A.M. (1994) ou ResearchGate 2016 |
| Contexte TIC en Afrique | Auteur africain ou rapport ITU/OCDE Afrique |

### 9.3 Phrase d'accroche recommandée

> « La maîtrise du comportement client constitue aujourd'hui l'un des enjeux stratégiques majeurs de toute entreprise soucieuse de sa pérennité. Dans les économies émergentes comme celle de la République Démocratique du Congo, où l'essor des solutions numériques de gestion commerciale transforme progressivement les pratiques des entrepreneurs, la question de la segmentation client par des méthodes éprouvées se pose avec une acuité nouvelle. »

### 9.4 Originalité à mettre en avant

- **Contexte local** : RDC, entrepreneurs formels ET informels (différent des études occidentales)
- **Architecture SaaS multi-tenant** : peu étudié dans la littérature africaine
- **Données réelles** : simulation sur données de production ELMES-TEKA (pas un dataset Kaggle)
- **Enjeu pratique** : résultats exploitables par les entrepreneurs congolais

### 9.5 Ce qu'il ne faut PAS faire

- Ne pas mélanger la méthodologie et les résultats
- Ne pas répéter dans le texte ce qui est déjà dans un tableau
- Ne pas utiliser des listes à puces dans le corps principal (réservées aux annexes)
- Ne pas formuler des hypothèses non testables
- Ne pas utiliser le style H0/H1 statistique — utiliser H1, H2, H3 comme affirmations provisoires

---

## 10. Structure des fichiers LaTeX

Dossier de travail : `/scratchpad/latex-projet/` (dans le répertoire de travail temporaire de la session)

| Fichier actuel | Rôle | Action requise |
|---|---|---|
| `main.tex` | Document racine | Mettre à jour les `\input` |
| `preambule.tex` | Packages, couleurs, mise en page | Conserver tel quel |
| `page-garde.tex` | Page de titre officielle | ✅ Terminée |
| `chapitres/00-introduction.tex` | Introduction générale | ⚠️ **Réécrire** (plan 0.1–0.10) |
| `chapitres/01-revue-litterature.tex` | Chapitre 1 | ⚠️ Rédiger selon §3 du plan |
| `chapitres/02-materiels-methodes.tex` | — | ⚠️ **Renommer** → `02-cadre-theorique.tex` |
| `chapitres/03-resultats.tex` | — | ⚠️ **Fusionner** avec `04-discussions.tex` → `03-simulation-discussion.tex` |
| `chapitres/04-discussions.tex` | — | ⚠️ Voir ci-dessus |
| `chapitres/05-conclusion.tex` | Conclusion générale | ⚠️ Rédiger (vérification H1/H2/H3) |
| `biblio/references.bib` | Références bibliographiques | ⚠️ Compléter avec sources ci-dessous |

### Restructuration prioritaire

1. Renommer `02-materiels-methodes.tex` → `02-cadre-theorique.tex`
2. Fusionner `03-resultats.tex` + `04-discussions.tex` → `03-simulation-discussion.tex`
3. Mettre à jour `main.tex` pour refléter ces changements
4. Réécrire `chapitres/00-introduction.tex` selon le plan §3 (points 0.1 à 0.10)

---

## 11. Sources bibliographiques de référence

| # | Référence | Usage |
|---|---|---|
| 1 | GRAWITZ Madeleine, *Méthodes des sciences sociales*, Dalloz, Paris, 1971 | Définition hypothèse (intro) |
| 2 | HUGHES A.M., *Strategic Database Marketing*, McGraw-Hill, 1994 | Origine du modèle RFM |
| 3 | ResearchGate, *A review of the application of RFM model*, 2016 | État de l'art RFM |
| 4 | ResearchGate, *Customer lifetime value determination based on RFM model*, 2016 | Variables RFM |
| 5 | LIMEKA LI-MABILA, *Conception et réalisation d'un SI de gestion académique — ISC/KIN*, memoireonline.com, 2003 | Modèle intro congolais |
| 6 | NDONTONI NZENZO, *Influence de la politique tarifaire sur la croissance — REGIDESO*, ULK Kinshasa, 2011 | Modèle problématique |
| 7 | MUNTU MWAMBA Edouard, *SI de gestion des clients — AMI-LABO/GOMA*, ISC-Goma, 2012-2013 | Modèle intro congolais |
| 8 | Optimove, *RFM Segmentation, Analysis & Model Marketing*, 2024 | Définition RFM |

---

## 12. État d'avancement

| Tâche | Statut |
|---|---|
| Page de garde | ✅ Terminée — logo ISTA sur Drive |
| Ligne éditoriale (MEMOIRE.md) | ✅ Établie |
| Recherche de mémoires similaires | ✅ Terminée |
| Restructuration LaTeX (renommages + fusions) | ⏳ À faire |
| Rédaction Introduction Générale (points 0.1–0.10) | ⏳ À faire |
| Chapitre 1 — Revue de littérature | ⏳ À rédiger |
| Chapitre 2 — Cadre théorique | ⏳ À rédiger |
| Chapitre 3 — Simulation et discussion | ⏳ À rédiger |
| Conclusion Générale | ⏳ À rédiger |
| Bibliographie (references.bib) | ⏳ À compléter |
