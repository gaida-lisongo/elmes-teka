# Agent Frontend — Alignement UI/UX

> Objectif : aligner les pages ELMES-TEKA sur les promesses de la présentation.
> Ordre de priorité : Login → Dashboard Tenant → Stores → Dashboard Saler → Commandes → Produits → Clients → Stock

---

## Statut global

| Page | Statut actuel | Cible | Priorité |
|------|---------------|-------|---------|
| Login / Authentification | ⬜ Non audité | UX fluide, branded | P1 |
| Dashboard Tenant | ⬜ Non audité | KPIs clairs, temps réel | P1 |
| Gestion des Stores | ⬜ Non audité | Vue multi-boutiques intuitive | P2 |
| Dashboard Saler | ⬜ Non audité | Espace de travail vendeur simple | P2 |
| Commandes | ⬜ Non audité | Saisie rapide, validation visuelle | P3 |
| Produits | ⬜ Non audité | Catalogue clair, stock visible | P3 |
| Clients | ⬜ Non audité | Fiche client, historique, segmentation | P4 |
| Stock | ⬜ Non audité | Niveaux visuels, alertes | P4 |

---

## P1 — Login

### Ce que la présentation promet
- Démarrage en moins de 15 minutes
- Interface accessible sans formation

### Ce que l'UI doit montrer
- Formulaire épuré : matricule + mot de passe
- Logo ELMES-TEKA visible et rassurant
- Message d'accueil contextuel
- Gestion d'erreur claire (mauvais identifiants, compte inactif)
- Redirection automatique selon le rôle (tenant → dashboard tenant, saler → dashboard saler)

### Tâches techniques
- [ ] Auditer la page Login actuelle (`src/app/(auth)/login`)
- [ ] Vérifier la gestion des erreurs côté client
- [ ] S'assurer que la redirection post-login est correcte pour chaque rôle

---

## P1 — Dashboard Tenant

### Ce que la présentation promet
- Supervision de toutes les boutiques depuis un seul endroit
- Chiffre d'affaires global et par boutique
- Alertes temps réel
- Marge brute, top produits, top clients

### Ce que l'UI doit montrer
- Cartes KPI : CA global, CA du jour, Dépenses, Résultat net
- Liste des boutiques avec statut (actif, stock critique)
- Graphique d'évolution des ventes
- Dernières transactions en temps réel
- Alertes stock critique

### Tâches techniques
- [ ] Auditer le dashboard tenant actuel
- [ ] Identifier les KPIs manquants vs promis dans la présentation
- [ ] Vérifier les composants Pusher (temps réel fonctionnel ?)
- [ ] Ajouter les graphiques manquants

---

## Notes pour l'Agent Frontend

- Stack : Next.js 15 App Router + TailAdmin v2.0 + TypeScript
- Icônes : SVG dans `/icons` uniquement — pas d'emojis
- Composants existants TailAdmin à réutiliser avant de créer
- Données initiales : chargement SSR (Server Components), mutations via Server Actions
- Ne jamais utiliser `useEffect` pour le chargement initial

---

## Démarrage recommandé

1. Lire `AGENTS.md` et `CONTEXT.md`
2. Auditer `src/app/(admin)` et `src/app/(full-width-pages)`
3. Commencer par Login (P1), puis Dashboard Tenant (P1)
4. Soumettre chaque page modifiée pour validation avant de passer à la suivante
