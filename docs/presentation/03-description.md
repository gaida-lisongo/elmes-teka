# Chapitre 3 — Description fonctionnelle

> Statut : 🟡 Brouillon initial — À valider avec l'utilisateur

---

## 3.1 Gestion de la trésorerie

**Titre de slide** : *Votre trésorerie — transparente et traçable*

**Ce que fait ELMES-TEKA** :
- Enregistre chaque entrée d'argent (vente, encaissement commande)
- Enregistre chaque sortie d'argent (achat fournisseur, dépense)
- Calcule la balance en temps réel : Recettes − Dépenses = Résultat net
- Alerte en cas de solde critique
- Produit un journal de caisse consultable à tout moment

**Pour l'entrepreneur** :
- Savoir exactement combien d'argent a été généré, quand, et par qui
- Identifier les produits et boutiques les plus rentables
- Détecter les anomalies (ventes non enregistrées, sorties non justifiées)
- Préparer ses déclarations fiscales avec un historique fiable

**Indicateurs affichés** :
- Revenus du jour / semaine / mois
- Dépenses du jour / semaine / mois
- Résultat net de la période
- Comparaison avec la période précédente

---

## 3.2 Gestion des stocks

**Titre de slide** : *Plus jamais une rupture de stock surprise*

**Ce que fait ELMES-TEKA** :
- Suit les niveaux de stock en temps réel par boutique et par produit
- Décrémente automatiquement lors des ventes validées
- Incrémente lors des approvisionnements confirmés
- Alerte quand un produit dépasse le seuil critique configuré
- Permet les inventaires périodiques avec régularisation

**Mouvement de stock** :

```
Approvisionnement → Stock disponible → Vente → Stock restant
                         ↓
                    Alerte seuil minimum
                    Inventaire / régularisation
```

**Avantages** :
- Évite les ventes à découvert (produits épuisés)
- Détecte les écarts suspects entre stock théorique et physique
- Permet d'anticiper les besoins de réapprovisionnement
- Donne une visibilité sur la valeur des marchandises en boutique

---

## 3.3 Gestion des clients

**Titre de slide** : *Connaître ses clients pour mieux les fidéliser*

**Ce que fait ELMES-TEKA** :
- Crée et enrichit une base client (nom, contact, localisation)
- Rattache chaque transaction à un client identifié
- Calcule l'historique d'achats par client
- Identifie les clients fidèles et les clients inactifs
- Permet de cibler des promotions personnalisées

**Profil client** :
- Nom et coordonnées
- Date du premier achat
- Fréquence d'achat
- Montant total dépensé
- Produits préférés
- Solde crédit/avance (si applicable)

**Outils de fidélisation** :
- Promotions ponctuelles ciblées
- Notifications lors d'offres spéciales
- Suivi des commandes en cours

---

## 3.4 Gestion administrative

**Titre de slide** : *L'administratif simplifié — sans comptable dédié*

**Ce que fait ELMES-TEKA** :
- Centralise les informations de toutes les boutiques en un seul endroit
- Gère les comptes des agents commerciaux (création, affectation, désactivation)
- Produit les documents de gestion courants
- Maintient un journal d'audit des actions sensibles

**Documents générés automatiquement** :
- Bon de commande
- Facture simplifiée
- Récapitulatif de caisse journalier
- Rapport de performance vendeur
- État de stock par boutique
- Bilan mensuel simplifié

**Gestion des droits** :
- Tenant : accès complet à toutes les boutiques et données
- Saler : accès limité à sa boutique et ses exercices actifs
- Aucune donnée d'un autre tenant n'est visible

---

## Notes de rédaction

- [ ] Vérifier que les documents listés (bon de commande, facture) sont déjà implémentés ou en cours
- [ ] Préciser si le journal d'audit est accessible dans l'UI actuelle
- [ ] Ajouter des captures d'écran pour chaque module une fois les pages redesignées
