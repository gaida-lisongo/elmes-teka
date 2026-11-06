# MEMOIRE.md — Ligne éditoriale du mémoire ISTA Kinshasa

> Ce fichier est lu par tous les agents IA qui contribuent à ce projet.
> Il définit la structure, les orientations scientifiques et les contraintes rédactionnelles du mémoire académique.
> **Toujours lire ce fichier avant toute action liée au mémoire.**

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
  1. Contexte et justification
  2. Problématique
  3. Questions de recherche
  4. Hypothèses
  5. Variables et indicateurs
  6. Objectifs de l'étude
  7. Méthodologie
  8. Délimitation du sujet
  9. Annonce du plan

CHAPITRE 1 — REVUE DE LA LITTÉRATURE
  1.1 Concepts de base : RFM, CRM, SaaS
  1.2 État de l'art sur la segmentation RFM
  1.3 Travaux antérieurs pertinents
  1.4 Positionnement de notre étude

CHAPITRE 2 — CADRE THÉORIQUE
  2.1 Modèle théorique retenu
  2.2 Présentation de la plateforme ELMES-TEKA
  2.3 Architecture SaaS multi-tenant et implications pour le RFM
  2.4 Formalisation des méthodes évaluées

CHAPITRE 3 — SIMULATION ET DISCUSSION
  3.1 Dispositif de simulation
  3.2 Données utilisées et génération du jeu de test
  3.3 Application des méthodes RFM
  3.4 Résultats
  3.5 Discussion

CONCLUSION GÉNÉRALE
  1. Synthèse des résultats
  2. Vérification des hypothèses
  3. Limites de l'étude
  4. Perspectives et recommandations

BIBLIOGRAPHIE
ANNEXES
```

---

## 4. Problématique (à préciser)

**Contexte :** Les entrepreneurs congolais utilisant ELMES-TEKA accumulent des données de transactions sans mécanisme d'analyse de leur clientèle. La segmentation RFM est une méthode éprouvée pour classifier les clients selon leur comportement d'achat (Récence, Fréquence, Montant).

**Question centrale :**
> Dans quelle mesure les méthodes de segmentation RFM sont-elles pertinentes, robustes et adaptées au contexte d'une plateforme SaaS multiclient (multi-tenant) comme ELMES-TEKA, opérant dans un environnement commercial informel congolais ?

**Questions spécifiques :**
1. Quelles méthodes de calcul du score RFM sont les plus adaptées à des données commerciales hétérogènes et partiellement informelles ?
2. Comment l'architecture multi-tenant d'ELMES-TEKA influence-t-elle la pertinence et l'isolation des segmentations RFM par tenant ?
3. Quels indicateurs permettent d'évaluer la qualité d'une segmentation RFM dans ce contexte ?

---

## 5. Hypothèses (à valider)

| ID | Hypothèse | Variable | Indicateur |
|---|---|---|---|
| H1 | La méthode RFM quintile produit des segments plus cohérents que la méthode RFM binaire pour les données d'ELMES-TEKA | Méthode de scoring (quintile vs binaire vs percentile) | Coefficient de silhouette, inertie intra-classe |
| H2 | L'architecture multi-tenant n'affecte pas la qualité de la segmentation RFM à l'intérieur d'un même tenant | Isolation multi-tenant | Variance inter-tenant vs intra-tenant |
| H3 | La segmentation RFM adaptée au contexte informel congolais permet d'identifier des profils clients significativement distincts | Paramètres RFM adaptés (seuils, pondérations) | Distinctivité des segments, taux de chevauchement |

---

## 6. Variables et indicateurs

### Variables indépendantes (causes)
- Méthode de calcul du score RFM (quintile, binaire, percentile, scoring personnalisé)
- Architecture de déploiement (multi-tenant vs mono-tenant)
- Caractéristiques des données (volume, hétérogénéité, complétude)

### Variables dépendantes (effets)
- Qualité de la segmentation (cohérence intra-segment, distinctivité inter-segments)
- Pertinence des segments pour les décisions commerciales
- Stabilité de la segmentation dans le temps

### Indicateurs de mesure
| Indicateur | Description | Cible |
|---|---|---|
| Coefficient de silhouette | Mesure la cohérence des clusters | > 0,5 = bon |
| Inertie intra-classe | Homogénéité à l'intérieur d'un segment | Minimiser |
| Score Davies-Bouldin | Séparation entre segments | Minimiser |
| Couverture client | % de clients correctement segmentés | > 90 % |
| Taux d'isolation tenant | % de données d'un tenant visibles à un autre | 0 % (sécurité) |

---

## 7. Méthodologie

**Type de recherche :** Quantitative, expérimentale par simulation

**Approche :**
1. Revue de la littérature sur RFM et SaaS multi-tenant
2. Formalisation des méthodes RFM à évaluer
3. Génération d'un jeu de données simulé représentatif d'ELMES-TEKA
4. Application des méthodes RFM sur le jeu de données
5. Évaluation comparative selon les indicateurs définis
6. Discussion et vérification des hypothèses

**Outils :** Python (pandas, scikit-learn), données issues de la plateforme ELMES-TEKA (simulées ou réelles anonymisées)

**Délimitation :**
- Périmètre : plateforme ELMES-TEKA, données transactionnelles
- Période : exercices disponibles dans la base de données
- Exclusions : prédiction, recommandation, ML avancé (hors scope de ce mémoire)

---

## 8. Consignes rédactionnelles pour les agents IA

### Ton et style
- Académique, neutre, précis
- Troisième personne ou passif scientifique
- Pas d'anglicismes non justifiés (préférer « locataire » ou conserver « tenant » en italique avec définition)
- Pas d'affirmations non sourcées

### Citations et références
- Format APA (auteur, année)
- Toute affirmation factuelle doit être sourcée
- Privilégier : articles scientifiques (Google Scholar, ResearchGate), thèses ISTA/UNIKIN/ISC, documentation officielle

### Structure des chapitres
- Chaque chapitre commence par une introduction (½ page) et se termine par une synthèse (½ page)
- Chaque section a un titre numéroté (1.1, 1.1.1, etc.)
- Les tableaux et figures sont numérotés et légendés
- Les acronymes sont définis à leur première occurrence

### Ce qu'il ne faut PAS faire
- Ne pas mélanger la méthodologie et les résultats
- Ne pas répéter dans le texte ce qui est déjà dans un tableau
- Ne pas utiliser de listes à puces dans le corps principal (réservées aux annexes)
- Ne pas formuler des hypothèses non testables

---

## 9. Fichiers LaTeX du mémoire

Dossier de travail : `/scratchpad/latex-projet/`

| Fichier | Rôle |
|---|---|
| `main.tex` | Document racine |
| `preambule.tex` | Packages, couleurs, mise en page |
| `page-garde.tex` | Page de titre officielle |
| `chapitres/00-introduction.tex` | Introduction générale |
| `chapitres/01-revue-litterature.tex` | Chapitre 1 |
| `chapitres/02-materiels-methodes.tex` | ⚠️ À renommer → `02-cadre-theorique.tex` |
| `chapitres/03-resultats.tex` | ⚠️ À fusionner avec `04-discussions.tex` → `03-simulation-discussion.tex` |
| `chapitres/04-discussions.tex` | ⚠️ À fusionner (voir ci-dessus) |
| `chapitres/05-conclusion.tex` | Conclusion générale |
| `biblio/references.bib` | Références bibliographiques |

### Restructuration à faire (priorité haute)
1. Renommer `02-materiels-methodes.tex` → `02-cadre-theorique.tex`
2. Fusionner `03-resultats.tex` + `04-discussions.tex` → `03-simulation-discussion.tex`
3. Mettre à jour `main.tex` pour refléter ces changements
4. Réécrire `chapitres/00-introduction.tex` selon le plan de l'introduction générale (§ 3 ci-dessus)

---

## 10. État d'avancement

| Tâche | Statut |
|---|---|
| Page de garde | ✅ Terminée |
| Restructuration du plan (demande directeur) | 🔄 En cours |
| Rédaction Introduction Générale | ⏳ À faire |
| Chapitre 1 — Revue de littérature | ⏳ À rédiger |
| Chapitre 2 — Cadre théorique | ⏳ À rédiger |
| Chapitre 3 — Simulation et discussion | ⏳ À rédiger |
| Conclusion Générale | ⏳ À rédiger |
| Bibliographie | ⏳ À compléter |

---

*Dernière mise à jour : 2026-11-06 — Révision suite aux demandes du directeur Prof. Ord. NTUMBA ILUNGA Alexis.*
