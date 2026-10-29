# Agent Backend — Alignement API et données

> Objectif : vérifier et compléter les APIs/données pour que toutes les features de la présentation soient fonctionnelles.

---

## Statut global

| Feature présentée | Implémentée ? | Priorité |
|-------------------|---------------|---------|
| Vente → décrement stock automatique | ⬜ À vérifier | P1 |
| Dashboard temps réel (Pusher) | ⬜ À vérifier | P1 |
| Alertes stock critique | ⬜ À vérifier | P2 |
| Historique financier exportable (Excel) | ⬜ À vérifier | P2 |
| Historique financier exportable (PDF) | ⬜ À vérifier | P2 |
| Segmentation clients (actifs/inactifs) | ⬜ À vérifier | P3 |
| Promotions ciblées par client | ⬜ À vérifier | P3 |
| Score de crédibilité commerciale | ⬜ Non implémenté | P4 (roadmap) |
| Journal d'audit des actions | ⬜ À vérifier | P3 |

---

## P1 — Flux de vente complet

### Ce que la présentation promet
1. Vendeur saisit les produits
2. Système vérifie disponibilité stock
3. Transaction enregistrée et validée
4. Stock mis à jour automatiquement
5. Notification temps réel au tenant

### À vérifier côté backend
- [ ] Server Action de création de vente : vérifie-t-elle le stock avant commit ?
- [ ] La mise à jour du stock est-elle atomique avec la transaction ?
- [ ] L'événement Pusher est-il publié uniquement après succès en base ?
- [ ] Canal Pusher correct : `private-tenant-{tenantId}` ou `private-store-{storeId}` ?

---

## P1 — Dashboard temps réel

### Ce que la présentation promet
- Notifications instantanées sur chaque vente dans n'importe quelle boutique
- Données mises à jour sans rechargement de page

### À vérifier
- [ ] Quels événements Pusher sont publiés et sur quels canaux ?
- [ ] Le frontend est-il abonné aux bons canaux ?
- [ ] Les données affichées correspondent-elles aux données réelles en base ?

---

## P2 — Exports Excel/PDF

### Ce que la présentation promet
- Relevé de transactions exportable
- État financier simplifié en PDF
- Récapitulatif mensuel/trimestriel

### À vérifier
- [ ] ExcelJS est installé — quels exports sont déjà implémentés ?
- [ ] pdfmake est installé — quels PDFs sont déjà générés ?
- [ ] Identifier les endpoints d'export existants dans `src/app/api`

---

## P3 — Scoring et historique financier (roadmap)

### Ce que la présentation promet
> "6 mois d'utilisation = dossier financier pour microcrédit"

### Ce qui est nécessaire
- [ ] Définir les métriques du score (fréquence, volume, régularité)
- [ ] Créer un endpoint `GET /api/tenant/:id/score` qui calcule le score
- [ ] Produire un rapport PDF "dossier financement" à partir de l'historique

> ⚠️ Cette feature est en roadmap. Ne pas implémenter avant validation par l'utilisateur.

---

## Notes pour l'Agent Backend

- Stack : Next.js 15 App Router + MongoDB/Mongoose + Pusher
- Jamais de nouvelle connexion MongoDB par fichier — réutiliser la connexion existante
- Toujours vérifier : session → rôle → tenantId → storeId → anneeId côté serveur
- Jamais publier un événement Pusher avant la réussite de l'écriture principale
- Ne pas modifier les schémas Mongoose sans vérifier les usages existants

---

## Démarrage recommandé

1. Lire `AGENTS.md` et `CONTEXT.md`
2. Explorer `src/app/api` et `src/lib/models` (ou `src/models`)
3. Commencer par auditer le flux de vente (P1)
4. Documenter les résultats dans ce fichier avec la mention ✅ ou ❌ + notes
