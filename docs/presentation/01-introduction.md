# Chapitre 1 — Introduction

> Statut : 🟡 Brouillon initial — À valider avec l'utilisateur

---

## 1.1 Contexte

**Titre de slide** : *L'Afrique centrale se digitalise — ses entrepreneurs aussi*

**Contenu** :

La République Démocratique du Congo compte plusieurs millions de TPE et PME, dont une large partie opère dans le secteur informel ou semi-formel.

Ces entrepreneurs :
- gèrent plusieurs boutiques, parfois dans des zones différentes
- emploient des vendeurs et agents commerciaux
- font face à des pertes dues au manque de traçabilité
- n'ont pas accès aux outils financiers formels (crédits, bilans)

ELMES est une entreprise congolaise née de ce constat, avec l'ambition de **numériser la gestion commerciale locale** de manière simple et adaptée.

---

## 1.2 Problèmes identifiés

**Titre de slide** : *Les solutions existantes ne sont pas faites pour nous*

**Problème 1 — Complexité**
Les ERP internationaux (Odoo, SAP) sont trop complexes pour un commerçant sans formation comptable. L'interface, les concepts et les workflows ne correspondent pas aux usages locaux.

**Problème 2 — Coût**
Les licences et frais de déploiement des solutions professionnelles sont inaccessibles pour les TPE congolaises.

**Problème 3 — Inadaptation culturelle**
Les devises, les habitudes d'achat/vente, les structures d'entreprise et les flux financiers congolais ne sont pas pris en compte par les outils internationaux.

**Problème 4 — Perte de contrôle**
Sans outil de suivi : vols non détectés, stocks mal tenus, vendeurs non supervisés, trésorerie opaque, impossibilité de croître ou d'obtenir un financement.

---

## 1.3 Objectifs

**Titre de slide** : *ELMES-TEKA — La réponse locale à un besoin local*

**Objectif 1 — Accessibilité**
Rendre la gestion commerciale professionnelle accessible à tout entrepreneur congolais, formel ou informel.

**Objectif 2 — Simplicité**
Interface pensée pour des utilisateurs sans formation informatique avancée : navigation intuitive, workflows courts, terminologie locale.

**Objectif 3 — Contrôle en temps réel**
L'entrepreneur supervise toutes ses boutiques depuis un seul tableau de bord, avec des notifications instantanées sur chaque vente ou mouvement de stock.

**Objectif 4 — Historique financier**
Constituer un historique fiable et vérifiable de l'activité commerciale, utilisable comme dossier pour accéder au financement bancaire ou aux microcrédits.

---

## 1.4 Architecture de la plateforme

**Titre de slide** : *Une architecture SaaS multi-tenant sécurisée*

**Schéma** :

```
Tenant (Entrepreneur)
  └── Boutique A        ←→ Saler 1, Saler 2
  └── Boutique B        ←→ Saler 3
  └── Dashboard global  ←→ Transactions temps réel (Pusher)
        └── États financiers
        └── Stocks agrégés
        └── Rapports
```

**Points clés** :
- Données **100% isolées** entre tenants (multi-tenant sécurisé)
- Déploiement cloud sur Vercel (disponible partout, sans installation)
- Synchronisation **temps réel** entre boutiques et tableau de bord
- Exportable en Excel et PDF pour les états financiers

---

## Notes de rédaction

- [ ] Ajouter des chiffres sur le nombre d'entreprises informelles en RDC (recherche à faire)
- [ ] Ajouter un visuel de l'interface principale du dashboard sur la slide 1.3
- [ ] Valider la terminologie "tenant/saler" vs "entrepreneur/vendeur" pour le public
