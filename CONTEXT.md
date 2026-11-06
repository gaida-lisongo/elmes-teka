# ELMES-TEKA — Contexte fonctionnel et technique

## 1. Présentation du produit

ELMES-TEKA est un CRM de gestion commerciale conçu en République démocratique du Congo par l’entreprise ELMES.

Le projet part du constat que plusieurs solutions internationales de gestion, notamment Odoo, ne sont pas toujours alignées avec les réalités économiques, culturelles et opérationnelles des entrepreneurs congolais, particulièrement les TPE, PME et acteurs du secteur informel.

ELMES-TEKA doit proposer une expérience simple, accessible et adaptée aux usages locaux afin de permettre aux entrepreneurs congolais de superviser leurs activités commerciales avec le minimum de complexité.

## 2. Vision

La plateforme doit permettre aux entrepreneurs formels et informels de :

- gérer une ou plusieurs boutiques ;
- affecter des vendeurs à chaque boutique ;
- créer et administrer les produits ;
- suivre les stocks par boutique et par exercice ;
- enregistrer les ventes, achats, commandes et dépenses ;
- agréger les transactions de toutes les boutiques ;
- produire progressivement des états de gestion et des bilans simplifiés ;
- constituer à terme un historique financier exploitable par des institutions de microfinance pour faciliter l’analyse et l’octroi de microcrédits.

## 3. Utilisateurs principaux

### Tenant

Le tenant représente l’entrepreneur ou le gestionnaire principal du business.

Il peut :

- créer et administrer son compte ;
- créer plusieurs boutiques ;
- affecter des agents commerciaux aux boutiques ;
- créer les produits ;
- définir les prix des produits ;
- créer des exercices de gestion ;
- affecter des stocks aux boutiques ;
- suivre les ventes, achats, dépenses et commandes ;
- agréger les données de toutes ses boutiques ;
- suivre les performances globales et individuelles ;
- consulter les états financiers et indicateurs de gestion.

### Saler

Le saler représente le vendeur ou agent commercial affecté à une boutique.

Il peut :

- se connecter avec son matricule et son mot de passe ;
- accéder uniquement à la boutique qui lui est affectée ;
- effectuer des transactions dans les exercices actifs autorisés ;
- enregistrer les ventes, achats, commandes ou mouvements permis ;
- consulter les informations nécessaires à son travail ;
- incrémenter le stock lors d’un approvisionnement autorisé ;
- décrémenter le stock lors d’une vente validée.

Le saler ne doit jamais avoir accès aux données globales d’un autre tenant ni aux boutiques auxquelles il n’est pas affecté.

## 4. Workflow principal

1. L’entrepreneur crée un compte tenant.
2. Le tenant se connecte avec son matricule et son mot de passe.
3. Le tenant crée une ou plusieurs boutiques.
4. Le tenant crée les comptes des commerciaux et les affecte à une boutique.
5. Le tenant crée les produits et leurs prix.
6. Le tenant crée un exercice de gestion.
7. Le tenant initialise ou affecte les stocks par boutique et par exercice.
8. Le commercial se connecte à son espace de travail.
9. Le commercial enregistre les transactions de sa boutique.
10. Le stock est incrémenté lors des approvisionnements et décrémenté lors des ventes.
11. Les transactions remontent en temps réel vers le tableau de bord du tenant.
12. Le tenant consulte les agrégations, états, indicateurs et historiques.

## 5. Architecture métier actuelle

### Utilisateurs

- User
- Tenant
- Saler

### Organisation

- Store
- Annee

### Valeur commerciale

- Customer
- Product
- Promotion

### Exercices et transactions

- Commande
- Depense
- Stock

## 6. Principes de conception

### Simplicité

La plateforme doit rester simple à comprendre pour un entrepreneur ne disposant pas nécessairement d’une formation comptable ou informatique avancée.

### Adaptation locale

Les workflows, libellés, devises, numéros de téléphone, habitudes commerciales et cas d’usage doivent rester compatibles avec les réalités congolaises.

### Sécurité multi-tenant

Toutes les données doivent être isolées par tenant.

Chaque requête métier doit vérifier au minimum :

- l’utilisateur connecté ;
- son rôle ;
- son tenant ;
- sa boutique ;
- l’exercice concerné ;
- son autorisation à consulter ou modifier la ressource.

### Source de vérité

MongoDB est la source officielle des données.

Pusher est utilisé uniquement pour notifier les interfaces qu’une donnée a changé. Les événements temps réel ne remplacent jamais la persistance en base.

### Évolutivité raisonnable

Le projet doit rester modulaire sans introduire prématurément des architectures complexes.

Ne pas mettre en place de microservices, event sourcing, CQRS ou couches abstraites inutiles sans besoin fonctionnel clair.

## 7. Stack technique

- Next.js avec App Router
- TypeScript
- MongoDB
- Mongoose
- Pusher côté serveur
- Pusher JS côté client
- Cloudinary
- Nodemailer
- UUID
- ExcelJS
- pdfmake
- crypto natif de Node.js pour le hashage et la signature
- TailAdmin v2.0 pour l’interface
- Déploiement sur Vercel

## 8. Authentification

L’utilisateur se connecte uniquement avec :

- son matricule ;
- son mot de passe.

Après validation du mot de passe, le système détermine automatiquement si l’utilisateur est :

- tenant ;
- saler.

La redirection et les autorisations dépendent du profil détecté.

## 9. Temps réel

Lorsqu’un commercial enregistre une transaction :

1. la transaction est validée côté serveur ;
2. elle est enregistrée en base ;
3. les stocks ou agrégats concernés sont mis à jour ;
4. un événement Pusher est publié ;
5. le tableau de bord du tenant reçoit l’événement ;
6. l’interface met à jour les données dynamiques sans recharger toute la page.

Les pages doivent toujours charger leurs données initiales côté serveur.

## 10. Objectif à long terme

ELMES-TEKA doit devenir un outil de gestion commercial et financier local capable de produire un historique fiable de l’activité des TPE, PME et commerçants informels.

À terme, cet historique pourra soutenir :

- la création de bilans simplifiés ;
- la préparation de dossiers de financement ;
- l’analyse des flux commerciaux ;
- l’évaluation de la capacité de remboursement ;
- les partenariats avec les microfinances.
