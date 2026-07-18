# AGENTS.md — Règles de travail pour ELMES-TEKA

## 1. Mission

Tu travailles sur ELMES-TEKA, un CRM de gestion commerciale conçu par ELMES pour les entrepreneurs congolais formels et informels.

Avant toute modification, lis `CONTEXT.md` afin de comprendre le contexte métier, les rôles, les workflows et les objectifs du produit.

## 2. Règle fondamentale : réutiliser avant de créer

Ne jamais réinventer ce qui existe déjà dans la codebase.

Avant de créer un fichier, un hook, une fonction, une action, un endpoint, un type, une interface, un composant ou un utilitaire :

1. rechercher une implémentation existante ;
2. vérifier si elle peut être réutilisée telle quelle ;
3. vérifier si elle peut être étendue sans casser les usages existants ;
4. créer une nouvelle abstraction uniquement si aucune solution existante n’est adaptée.

Toujours privilégier :

- les Server Actions existantes ;
- les Route Handlers existants ;
- les helpers existants ;
- les types existants ;
- les schémas Mongoose existants ;
- les composants TailAdmin déjà présents ;
- les layouts existants ;
- les conventions déjà utilisées dans le projet.

## 3. Interface utilisateur

### Icônes

Ne jamais utiliser :

- des emojis comme icônes ;
- des caractères Unicode décoratifs ;
- une bibliothèque d’icônes externe sans instruction explicite.

Toujours utiliser les SVG disponibles dans le dossier `/icons`.

Avant d’ajouter une icône, rechercher d’abord une icône existante dans `/icons`.

### Composants

Le projet utilise TailAdmin v2.0.

Ne pas recréer des composants UI de base déjà fournis par la template, notamment :

- boutons ;
- champs ;
- cartes ;
- tableaux ;
- modales ;
- badges ;
- menus ;
- alertes ;
- breadcrumbs ;
- loaders ;
- composants de navigation.

Créer un nouveau composant UI générique uniquement dans un cas exceptionnel et après avoir confirmé qu’aucun composant existant ne répond au besoin.

### Layouts et pages

Toujours utiliser les layouts Next.js.

Les pages doivent être organisées selon la structure App Router :

- `layout.tsx` pour la structure partagée ;
- `page.tsx` pour la composition de page ;
- composants clients uniquement lorsque l’interactivité l’exige.

Éviter les pages monolithiques et éviter également le découpage excessif en micro-composants inutiles.

## 4. Chargement des données

Chaque page doit charger ses données initiales côté serveur.

Le serveur doit :

- authentifier l’utilisateur ;
- vérifier le rôle ;
- vérifier le tenant ;
- filtrer les données autorisées ;
- charger les données initiales ;
- sérialiser les ObjectId et Date ;
- transmettre les données au composant client.

Le composant client doit uniquement gérer :

- l’interactivité ;
- les mutations ;
- le chargement dynamique ;
- les événements Pusher ;
- les mises à jour optimistes si elles sont sûres ;
- l’état local de l’interface.

Ne pas déplacer tout le chargement initial dans `useEffect` lorsque les données peuvent être chargées côté serveur.

## 5. Formulaires

Utiliser largement les formulaires à plusieurs étapes lorsque cela améliore la compréhension.

Chaque formulaire complexe doit :

- être divisé en étapes logiques ;
- afficher le titre de l’étape ;
- afficher une courte indication ;
- indiquer la progression ;
- valider l’étape avant de continuer ;
- permettre de revenir à l’étape précédente ;
- conserver les données déjà saisies ;
- afficher des messages d’erreur compréhensibles ;
- éviter de demander trop d’informations sur un seul écran.

Ne pas utiliser un formulaire multi-étapes pour une action triviale comportant seulement un ou deux champs.

## 6. Règles métier multi-tenant

Toute fonctionnalité doit respecter l’isolation des données.

### Tenant

Le tenant peut gérer uniquement :

- ses boutiques ;
- ses vendeurs ;
- ses produits ;
- ses exercices ;
- ses stocks ;
- ses clients ;
- ses promotions ;
- ses transactions.

### Saler

Le saler peut agir uniquement :

- dans sa boutique assignée ;
- sur les exercices autorisés ;
- sur les opérations prévues pour son rôle.

Ne jamais faire confiance à un `tenantId`, `storeId`, `userId` ou `anneeId` provenant uniquement du client.

Toujours recalculer ou vérifier ces identifiants côté serveur à partir de la session et des relations en base.

## 7. Base de données

Réutiliser la connexion Mongoose existante.

Ne jamais ouvrir une nouvelle connexion MongoDB dans chaque fichier.

Respecter les modèles et noms de références existants.

Avant de modifier un schéma :

- vérifier les usages existants ;
- préserver la compatibilité lorsque possible ;
- éviter les duplications de données ;
- ajouter des index uniquement lorsqu’ils servent une requête réelle ;
- ne pas exposer les secrets avec `select: true` ;
- sérialiser les documents avant de les passer aux composants clients.

## 8. Transactions et stocks

Une opération commerciale doit suivre cet ordre :

1. valider les entrées ;
2. vérifier l’utilisateur et ses autorisations ;
3. vérifier la boutique ;
4. vérifier l’exercice ;
5. vérifier les produits ;
6. vérifier la disponibilité du stock si nécessaire ;
7. enregistrer la transaction ;
8. mettre à jour le stock ;
9. publier l’événement temps réel ;
10. retourner une réponse sérialisable.

Ne jamais publier un événement Pusher avant la réussite de l’écriture principale en base.

## 9. Pusher

Pusher sert à notifier les clients connectés.

Toujours utiliser des canaux privés pour les données commerciales sensibles.

Les canaux doivent être isolés par tenant et, lorsque nécessaire, par boutique.

Exemples :

- `private-tenant-{tenantId}` ;
- `private-store-{storeId}`.

Ne jamais envoyer dans un événement :

- un mot de passe ;
- un hash ;
- un secret API ;
- une clé privée ;
- des données d’un autre tenant ;
- un document Mongoose non sérialisé.

## 10. Sécurité

Utiliser le module `crypto` natif de Node.js pour le hashage et les signatures selon les utilitaires existants.

Ne jamais stocker un mot de passe en clair.

Ne jamais exposer :

- `MONGODB_URI` ;
- `PUSHER_SECRET` ;
- `CLOUDINARY_API_SECRET` ;
- `AUTH_SESSION_SECRET` ;
- `apiSecret` d’un tenant.

Les variables publiques doivent être explicitement préfixées avec `NEXT_PUBLIC_` et ne contenir aucun secret.

## 11. Complexité

Choisir la solution la plus simple qui respecte le besoin.

Ne pas introduire sans nécessité :

- microservices ;
- CQRS ;
- event sourcing ;
- repository pattern généralisé ;
- dependency injection complexe ;
- abstractions génériques prématurées ;
- architecture distribuée ;
- état global pour des données locales ;
- nouvelles dépendances pour un besoin déjà couvert.

## 12. Exécution des commandes

Ne jamais lancer :

- `npm run build` ;
- `npm run lint` ;
- `npm test` ;
- `pnpm build` ;
- `pnpm lint` ;
- `yarn build` ;
- toute commande de test, de lint ou de compilation.

Ne pas lancer automatiquement de serveur de développement.

Après une modification, fournir uniquement un rapport clair indiquant :

- les fichiers modifiés ;
- les fonctionnalités ajoutées ;
- les choix techniques ;
- les points que l’utilisateur doit tester manuellement ;
- les éventuelles limites ou hypothèses.

## 13. Comportement attendu

Ne pas modifier des fichiers non concernés sans justification.

Ne pas renommer des routes, modèles ou fonctions existantes sans nécessité.

Ne pas supprimer du code existant simplement parce qu’une autre approche semble préférable.

Ne pas ajouter de données fictives dans les pages réelles.

Ne pas inventer des exigences métier absentes du contexte.

En cas d’ambiguïté, choisir l’option qui :

1. respecte la structure existante ;
2. réduit la complexité ;
3. protège l’isolation multi-tenant ;
4. reste cohérente avec ELMES-TEKA ;
5. nécessite le moins de changements transversaux.
