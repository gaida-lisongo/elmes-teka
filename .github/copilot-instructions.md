# GitHub Copilot Instructions — ELMES-TEKA

ELMES-TEKA est un CRM commercial créé par ELMES pour les entrepreneurs congolais formels et informels.

Lire et respecter `CONTEXT.md` et `AGENTS.md` avant de proposer ou modifier du code.

## Contexte métier

- Le `Tenant` est l’entrepreneur ou gestionnaire principal.
- Le `Saler` est un vendeur affecté à une seule boutique.
- Le tenant crée les boutiques, produits, exercices, stocks et comptes vendeurs.
- Le saler effectue uniquement les transactions de sa boutique.
- Le tenant agrège et supervise les transactions de toutes ses boutiques.
- Les données doivent toujours être isolées par tenant.
- Les transactions doivent être enregistrées en base avant toute notification Pusher.

## Règles de génération de code

- Réutiliser au maximum les fonctions, actions, endpoints, types, schémas, composants et utilitaires existants.
- Rechercher l’existant avant de créer un nouveau fichier.
- Ne pas réinventer une abstraction déjà disponible dans la codebase.
- Ne pas ajouter une dépendance lorsque les bibliothèques existantes ou Node.js couvrent déjà le besoin.
- Respecter strictement les conventions de nommage et l’organisation du projet.
- Produire du TypeScript typé et éviter `any` sauf impossibilité justifiée.
- Ne pas inventer des données, routes, rôles ou règles métier absentes du projet.

## Next.js

- Utiliser l’App Router.
- Charger les données initiales dans les Server Components.
- Passer les données initiales aux Client Components.
- Réserver les Client Components à l’interactivité, aux mutations et aux mises à jour dynamiques.
- Utiliser les Server Actions ou Route Handlers existants avant d’en créer de nouveaux.
- Toujours utiliser les layouts pour les structures partagées.
- Sérialiser les ObjectId, Date et documents Mongoose avant de les transmettre au client.

## Interface

- Le projet utilise TailAdmin v2.0.
- Réutiliser les composants fournis par TailAdmin.
- Ne pas créer de composants UI de base sans nécessité extrême.
- Ne jamais utiliser d’emojis comme icônes.
- Toujours chercher et utiliser les SVG disponibles dans `/icons`.
- Utiliser des formulaires multi-étapes pour les processus complexes.
- Chaque étape doit comporter un titre, une indication, une validation et une progression visible.

## Sécurité

- Vérifier l’utilisateur, le rôle, le tenant, la boutique et l’exercice côté serveur.
- Ne jamais faire confiance aux identifiants envoyés par le client sans vérification.
- Un saler ne peut agir que sur sa boutique assignée.
- Ne jamais exposer de secrets serveur.
- Ne jamais envoyer de hash, mot de passe, clé API privée ou document Mongoose brut au client.
- Utiliser `crypto` natif lorsque les utilitaires existants le prévoient.

## MongoDB et Mongoose

- Réutiliser la connexion existante.
- Réutiliser les modèles existants.
- Ne pas dupliquer une relation déjà présente sans justification.
- Ajouter des index uniquement pour des requêtes métier identifiées.
- Préserver la compatibilité des schémas existants.

## Temps réel

- Utiliser Pusher uniquement après la réussite de l’écriture en base.
- Utiliser des canaux privés isolés par tenant ou boutique.
- Le chargement initial provient toujours de MongoDB côté serveur.
- Pusher sert uniquement aux mises à jour dynamiques.

## Complexité

Toujours privilégier la solution la plus simple.

Ne pas introduire prématurément :

- microservices ;
- CQRS ;
- event sourcing ;
- repository pattern généralisé ;
- couches abstraites inutiles ;
- état global inutile ;
- composants génériques non réutilisés.

## Commandes interdites

Ne jamais lancer automatiquement :

- build ;
- lint ;
- tests ;
- compilation ;
- serveur de développement.

À la fin d’une tâche, produire un rapport avec :

- fichiers modifiés ;
- changements réalisés ;
- choix techniques ;
- vérifications manuelles à effectuer ;
- limites ou hypothèses éventuelles.
