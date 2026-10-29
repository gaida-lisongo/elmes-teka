# Chapitre 2 — Protocole de travail

> Statut : 🟡 Brouillon initial — À valider avec l'utilisateur

---

## 2.1 Configuration de son workspace

**Titre de slide** : *Démarrez en 4 étapes — sans technicien*

**Étape 1 — Créer son compte Tenant**
L'entrepreneur s'inscrit sur ELMES-TEKA avec son matricule et mot de passe. Un seul compte, plusieurs boutiques.

**Étape 2 — Configurer ses points de vente**
Créer chaque boutique : nom, adresse, type d'activité. Chaque boutique est isolée mais agrégée dans le tableau de bord central.

**Étape 3 — Enregistrer produits et agents**
- Créer le catalogue produits avec prix d'achat, prix de vente, unité
- Créer les comptes des vendeurs (salers) et les affecter à une boutique
- Initialiser les stocks par boutique

**Étape 4 — Ouvrir un exercice**
Un exercice représente une période de gestion (ex : mois, trimestre, année). Toutes les transactions sont rattachées à un exercice actif.

---

## 2.2 Choix du plan d'abonnement

**Titre de slide** : *Un plan pour chaque taille d'entreprise*

> ⚠️ Note : Les plans réels restent à définir avec l'équipe ELMES. Ce brouillon propose une grille logique.

**Plan Starter** — Pour tester
- 1 boutique
- 2 vendeurs max
- Transactions illimitées
- Exportation basique

**Plan Pro** — Pour les PME actives
- Jusqu'à 5 boutiques
- Vendeurs illimités par boutique
- Dashboard temps réel complet
- Exportation Excel + PDF
- Historique financier 12 mois

**Plan Business** — Pour les groupes commerciaux
- Boutiques illimitées
- Agrégation multi-sites
- Rapports financiers avancés
- Scoring microfinance
- Support prioritaire

---

## 2.3 Suivi des transactions

**Titre de slide** : *Chaque vente enregistrée — en temps réel*

**Types de transactions supportées** :

| Type | Description | Effet stock |
|------|-------------|-------------|
| Vente | Produit vendu à un client | Décrément |
| Achat | Approvisionnement fournisseur | Incrément |
| Commande | Commande client en attente | Réservation |
| Dépense | Charge d'exploitation | Aucun |
| Inventaire | Régularisation de stock | Ajustement |
| Promotion | Vente à prix réduit | Décrément |

**Flux d'une vente** :
1. Le vendeur saisit les produits et la quantité
2. Le système vérifie la disponibilité du stock
3. La transaction est enregistrée et validée
4. Le stock est mis à jour automatiquement
5. Le tenant reçoit une notification temps réel sur son dashboard

---

## 2.4 État financier

**Titre de slide** : *Vos chiffres, toujours à portée de main*

**Tableau de bord Tenant** :
- Chiffre d'affaires global (toutes boutiques confondues)
- CA par boutique et par vendeur
- Marge brute par produit
- Évolution des ventes (graphique)
- Stock critique par boutique
- Top produits vendus
- Top clients

**Exports disponibles** :
- Relevé de transactions (Excel)
- État financier simplifié (PDF)
- Récapitulatif mensuel/trimestriel

---

## Notes de rédaction

- [ ] Confirmer les plans d'abonnement avec l'équipe ELMES (noms, prix en USD/CDF)
- [ ] Ajouter capture d'écran du formulaire d'ajout de boutique
- [ ] Préciser si la création d'exercice est manuelle ou automatique (mensuelle)
