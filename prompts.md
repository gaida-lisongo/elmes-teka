on va maintenant faire aussi les schemas pour les exercices (schemas dependant de l'année):
- annee=>tenantId, debut, fin, slug
- commandes => [{product: productId, qte: number}], anneeId, clientId, currency, shopId, promotionId, status, reference
- depense => [{libelle, amount, status, observation}], anneeId, shopId, agentId, reference
- stock => [{product: prouctId, qte: number}], anneeId, shopId, designation?, description?, status, reference
- store => designation, description, coordonnes=[{title, content}], capitals=[{anneeId, amount, currency, status}], reference, caisses=[{anneeId, amount, currency, status}], photos?=[{title, url}]

on va maintenant faire aussi les schemas qui produisent de la valeur:
- customer=>name, phone, email?, matricule (via uuid), promotions?=[promotionId]
- product=>designation, categorie, photos?=[{title, url}], price=[{amount, currency}], code, description?=[{title, content}], status
- promotion=>designation, description, code, reduction, photo?

tu vas créer les schémas de l'application tout simplement, sans créer les actions serveurs, chaque schema égales un fichier que je vais directement télécharger
###############################################################################################################################
Voici maintenant le context de l'application: c'est un CRM made in congo créer par l'entreprise ELMES, nous sommes allée du constat que le produit telque Oddo n'est pas aligné aux réalités congolaise et à la culture congolaise, c'est pourquoi je vais maintenant créer une application qui va permettre, aux entrepreneurs congolais formel comme informel à pouvoir supervisé leur business, le logiciel à aussi pour but de simplifier et faciliter la création d'un bilan compatble pour les TPE, PME et informel et plus tard nous comptons bosser avec le micro-finance pour faciliter l'octroi des micro-credit, pour y arriver voici le workflow:
- L'entrepreneur crée un compte comme un ténant
- Une fois connecté comme ténant ce dernier peut supervisé ses boutiques, pour sa il doit crée des boutiques et y affecter des agents
- C'est à l'entrepreneur de créer les produits, et affecter des stocks, que plus tard le commercial pourra incrémenté lors de l'achat et qu'il pourra decrementer lors d'une vente
- Le tenant peut aussi créer des exercices (année) pour que les commerciaux puissent y faire des transactions
- Le Commercial lors de sa connexion il va accéder à son espace de travail et ne peux faire que des transactions sur la boutiques lui assigné tandis que le tenant va agréger chaque transaction
Voici en gros la plateforme (ELMES-TEKA), que je compte mettre en place avec le moins de compléxité possible, tu vas ici faire un fichiers AGENTS, et un fichier pour github copilot et codex afin qu'ils soient au courant du context de l'application et des spécifications suivantes:
* Ne jamais inventé la roues, reutiliser les endpoints, actions, utils, types, etc... existantes sur la codebase au maximum
* Ne jamais utilisé des émoji icone, car il y a un fichier /icons qui sont en faites des svg c'est ce qu'il faut utiliser à tout moment et en tout lieu
* Utiliser les formulaire à plusieurs étapes sans modérations et avec des indications, et pour les pages toujours fetché les données initials dans la parties serveurs et le passé à la partie clients, qui elle ne va que faire du chargement dynamic
* Ne jamais lancé de build, de test, de lint, juste me faire le rapport et moi même je vais tester si le code marche ou pas
* Toujours utiliser des Layout Page et ne rien crée comme composants de base car la template que j'utilise TailAdmin v2.0 a déjà des composants qu'ils faut reutiliser, c'est ne qu'en cas extême que l'on créra des composants

génére le fichier de context, agent et utilie à copilot et codex et je vais commencer à travailler
#######################################################################################################################################################
# SPRINT 1 — AUTHENTIFICATION, INSCRIPTION TENANT ET ADMIN SHELL

Tu travailles sur **ELMES-TEKA**, un CRM conçu par l’entreprise ELMES pour permettre aux entrepreneurs congolais, formels comme informels, de gérer leurs boutiques, commerciaux, produits, stocks, commandes, dépenses et exercices comptables.

Avant toute modification, lis obligatoirement les fichiers suivants :

* `/AGENTS.md`
* `/CONTEXT.md`
* `/.github/copilot-instructions.md`

Respecte strictement toutes les règles qui y sont définies.

## OBJECTIF DU SPRINT

Mettre en place le premier parcours fonctionnel de la plateforme :

1. inscription publique d’un entrepreneur comme `Tenant` ;
2. connexion d’un utilisateur existant ;
3. identification automatique de son profil `Tenant` ou `Saler` ;
4. création d’une session sécurisée par cookie ;
5. mise en place d’un `AdminShellProvider` ;
6. adaptation dynamique du shell TailAdmin selon le type de compte connecté.

---

# 1. RÈGLES GÉNÉRALES

* Ne jamais réinventer une fonctionnalité déjà présente dans la codebase.
* Rechercher et réutiliser les actions serveur, routes, utilitaires, types, composants, formulaires, layouts et services existants.
* Réutiliser les composants de la template TailAdmin v2.0.
* Ne créer un nouveau composant générique qu’en cas de nécessité réelle.
* Ne jamais utiliser d’emoji comme icône.
* Toujours utiliser les SVG disponibles dans `/icons`.
* Ne jamais lancer :

  * `npm run build` ;
  * `npm run lint` ;
  * des tests ;
  * une commande destructive.
* À la fin, produire uniquement un rapport détaillé des fichiers créés ou modifiés, des choix effectués et des points que l’utilisateur devra tester.
* Ne pas modifier inutilement les modèles existants.
* Utiliser uniquement les dépendances déjà installées.
* Utiliser `crypto` natif de Node.js pour le mot de passe et la session.
* Utiliser Cloudinary pour les fichiers et images.
* Utiliser des Server Actions pour les opérations métier internes.
* Les données initiales des pages doivent être récupérées dans les composants serveur, puis transmises aux composants clients.
* Les composants clients ne doivent gérer que :

  * les interactions ;
  * l’état local ;
  * les uploads ;
  * la recherche dynamique ;
  * les transitions d’étapes ;
  * la soumission des formulaires.

---

# 2. MODÈLES CONCERNÉS

Les modèles existants sont notamment :

## User

```ts
{
  pseudo: string;
  telephone: string;
  boutique?: ObjectId;
  email: string;
  secure: string;
  matricule: string;
  status: string;
}
```

## Tenant

```ts
{
  userId: ObjectId;
  storesId: ObjectId[];
  apiKey: string;
  apiSecret: string;
  slug: string;
  designation: string;
  logo?: string;
  description: Array<{
    title: string;
    content: string;
  }>;
  status: string;
  type: string;
  documents?: Array<{
    title: string;
    url: string;
  }>;
  email: string;
  telephone: string;
  nRef: string;
}
```

## Saler

```ts
{
  userId: ObjectId;
  storeId: ObjectId;
  status: string;
}
```

Ne crée pas de champ `role` directement dans `User`.

Le rôle actif doit être déterminé en recherchant l’existence du `userId` dans :

* `Tenant` ;
* ou `Saler`.

---

# 3. PAGE D’AUTHENTIFICATION

Mettre en place ou adapter la page d’authentification existante de TailAdmin.

La page doit contenir deux parcours :

* connexion ;
* création de compte entrepreneur.

Seul un entrepreneur peut créer son compte publiquement.

Un vendeur ne peut jamais s’inscrire lui-même. Son compte sera créé plus tard par son tenant.

Réutiliser le layout d’authentification de TailAdmin.

La partie gauche du template doit être redessinée pour correspondre à ELMES-TEKA.

Elle doit présenter clairement :

* ELMES-TEKA ;
* CRM made in Congo ;
* supervision des boutiques ;
* suivi des ventes et dépenses ;
* gestion des stocks ;
* préparation simplifiée des données comptables ;
* solution adaptée aux réalités des TPE, PME et activités informelles congolaises.

Ne pas remplacer inutilement toute la structure TailAdmin. Adapter le composant existant.

---

# 4. INSCRIPTION D’UN TENANT

Créer un formulaire d’inscription en trois étapes.

Le formulaire doit utiliser les composants TailAdmin existants.

Ajouter :

* indicateur de progression ;
* titres et descriptions par étape ;
* boutons précédent et suivant ;
* validation par étape ;
* résumé avant validation finale si cela s’intègre proprement ;
* conservation des valeurs lorsqu’on change d’étape ;
* messages d’erreur précis.

## Étape 1 — Identité

Champs :

* `User.pseudo` ;
* `User.telephone` ;
* `User.email`.

Contraintes :

* pseudo obligatoire ;
* téléphone obligatoire ;
* e-mail obligatoire et normalisé ;
* vérifier que le téléphone ou l’e-mail n’existe pas déjà ;
* ne jamais exposer des informations sensibles sur un utilisateur existant.

## Étape 2 — Marque ou entreprise

Champs :

* `Tenant.designation` ;
* `Tenant.description` ;
* `Tenant.type` ;
* `Tenant.documents` ;
* `Tenant.logo`.

Pour `Tenant.description`, utiliser le format attendu par le modèle :

```ts
[
  {
    title: string;
    content: string;
  }
]
```

Pour une inscription simple, le formulaire peut demander :

* un titre de présentation ;
* un contenu descriptif.

Le résultat doit ensuite être transformé en tableau.

Pour les documents :

```ts
[
  {
    title: string;
    url: string;
  }
]
```

Permettre l’ajout facultatif d’un ou plusieurs documents.

Chaque document doit avoir :

* un titre ;
* un fichier ou une capture ;
* une URL Cloudinary après upload.

Prévoir aussi le logo de la marque.

## Étape 3 — Sécurité

Champs :

* mot de passe ;
* confirmation du mot de passe ;
* photo de profil facultative du user ;
* confirmation finale.

Le mot de passe doit être haché avec `crypto.scrypt`.

Le format stocké doit permettre de conserver :

* l’algorithme ;
* le sel ;
* le hash.

Utiliser `crypto.timingSafeEqual` lors de la vérification du mot de passe.

La photo du profil peut nécessiter un champ dans `User`.

Avant d’ajouter ce champ, vérifier si un champ photo, avatar ou image existe déjà dans le modèle ou la codebase.

Réutiliser le champ existant s’il existe.

En l’absence totale de champ, ajouter un champ optionnel cohérent, par exemple :

```ts
photo?: string | null;
```

Ne pas créer plusieurs champs concurrents comme `avatar`, `photo`, `profileImage` et `image`.

---

# 5. UPLOAD CLOUDINARY

Rechercher le service Cloudinary déjà présent dans la codebase.

Le réutiliser obligatoirement.

Ne pas recréer une seconde configuration Cloudinary.

Les uploads concernés sont :

* photo de profil ;
* logo du tenant ;
* documents du tenant.

Les fichiers doivent être organisés dans des dossiers Cloudinary cohérents, par exemple :

```text
elmes-teka/users
elmes-teka/tenants/logos
elmes-teka/tenants/documents
```

Utiliser les conventions déjà présentes dans le projet si elles existent.

Valider :

* type de fichier ;
* taille ;
* présence du fichier ;
* résultat Cloudinary.

Ne sauvegarder en base que l’URL sécurisée ou l’identifiant réellement utile.

En cas d’échec de création du compte après upload, gérer autant que possible le nettoyage des fichiers déjà envoyés, en réutilisant les utilitaires Cloudinary existants.

---

# 6. CRÉATION DU COMPTE TENANT

Créer ou adapter une Server Action pour créer simultanément :

1. le document `User` ;
2. le document `Tenant`.

La création doit générer :

* `User.matricule` ;
* `Tenant.slug` ;
* `Tenant.nRef` ;
* `Tenant.apiKey` ;
* `Tenant.apiSecret`.

Utiliser :

* `uuid` lorsque pertinent ;
* `crypto.randomBytes` pour les secrets ;
* une génération de slug normalisée ;
* une vérification d’unicité.

Le `User.secure` doit contenir uniquement le hash structuré du mot de passe.

Ne jamais sauvegarder le mot de passe en clair.

Le tenant créé doit être lié au user par `Tenant.userId`.

Les champs suivants doivent être cohérents entre User et Tenant :

* e-mail ;
* téléphone.

Utiliser une transaction MongoDB si la connexion et l’infrastructure existantes la prennent déjà correctement en charge.

Sinon, mettre en place un mécanisme fiable de rollback manuel pour supprimer le `User` si la création du `Tenant` échoue.

Après création réussie :

* créer directement la session ;
* connecter le nouvel utilisateur comme `TENANT` ;
* le rediriger vers `/`.

---

# 7. CONNEXION

Le formulaire de connexion doit permettre à l’utilisateur de s’identifier avec l’un des identifiants suivants :

* pseudo ;
* téléphone ;
* e-mail.

Le mot de passe reste obligatoire.

Le champ principal ne doit pas être un simple input.

Créer un composant réutilisable nommé :

```text
UserSearch
```

Avant de le créer, vérifier qu’un composant similaire n’existe pas déjà.

## Fonctionnement de UserSearch

`UserSearch` est un champ hybride de type recherche et sélection.

Il doit :

* accepter du texte ;
* lancer une recherche après un nombre minimal de caractères ;
* rechercher par pseudo, téléphone ou e-mail ;
* utiliser un debounce raisonnable ;
* afficher une liste de résultats ;
* permettre de sélectionner un utilisateur ;
* afficher uniquement des informations non sensibles ;
* fermer la liste après sélection ;
* permettre de changer de sélection ;
* afficher un état de chargement ;
* afficher un état vide ;
* gérer les erreurs ;
* fonctionner au clavier autant que possible.

Une recherche ne doit jamais renvoyer :

* le mot de passe ;
* le hash ;
* `apiSecret` ;
* `apiKey` ;
* des documents privés ;
* toute autre donnée sensible.

Limiter le nombre de résultats.

La recherche doit être protégée contre les expressions régulières dangereuses et les injections.

## Informations utilisables dans les résultats

Afficher au maximum :

* pseudo ;
* téléphone partiellement masqué si nécessaire ;
* e-mail partiellement masqué si nécessaire ;
* type de compte détecté ;
* statut du compte.

## Détermination du type de compte

Après identification du user, rechercher :

* `Tenant.findOne({ userId })` ;
* sinon `Saler.findOne({ userId })`.

Le système doit déterminer automatiquement :

```ts
type AccountType = "TENANT" | "SALER";
```

Le choix manuel du type de compte ne doit pas être obligatoire si le système peut le déterminer automatiquement.

Si un sélecteur de type est conservé dans l’interface, il doit être utilisé uniquement comme filtre ou information visuelle, jamais comme source de vérité.

La source de vérité doit rester la base de données.

---

# 8. VÉRIFICATION DES IDENTIFIANTS

Lors de la soumission :

1. récupérer le user sélectionné ou rechercher l’identifiant saisi ;
2. récupérer explicitement le champ `secure` ;
3. vérifier le statut du user ;
4. comparer le mot de passe avec `crypto.scrypt` ;
5. utiliser `timingSafeEqual` ;
6. identifier le profil `Tenant` ou `Saler` ;
7. vérifier également le statut du profil ;
8. créer la session ;
9. rediriger vers `/`.

Toujours retourner un message générique en cas d’échec :

```text
Identifiant ou mot de passe incorrect.
```

Ne pas indiquer publiquement :

* que le user existe ;
* que le mot de passe seul est incorrect ;
* qu’un e-mail est enregistré ;
* qu’un pseudo précis est enregistré.

Les messages détaillés peuvent être enregistrés uniquement côté serveur.

---

# 9. SESSION AVEC CRYPTO ET COOKIE

Créer ou réutiliser le système de session basé sur :

* cookie HTTP-only ;
* signature HMAC avec `crypto` ;
* secret provenant des variables d’environnement.

Variable prévue :

```env
AUTH_SESSION_SECRET=
```

Le cookie doit utiliser :

```ts
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/"
}
```

Le payload doit rester minimal.

Exemple :

```ts
interface SessionPayload {
  userId: string;
  accountType: "TENANT" | "SALER";
  tenantId?: string;
  salerId?: string;
  storeId?: string;
  issuedAt: number;
  expiresAt: number;
}
```

Ne jamais mettre dans le cookie :

* mot de passe ;
* hash ;
* apiKey ;
* apiSecret ;
* documents ;
* données complètes du user ;
* données complètes du tenant.

Créer ou réutiliser des utilitaires clairement séparés :

* `signSession` ;
* `verifySession` ;
* `createSessionCookie` ;
* `getSession` ;
* `deleteSession`.

Ne pas dupliquer la logique de session dans plusieurs actions.

Prévoir également une action de déconnexion.

---

# 10. ADMIN SHELL PROVIDER

Créer ou adapter un provider nommé :

```text
AdminShellProvider
```

Son objectif est de fournir au shell de l’application les informations du compte actif.

Le provider ne doit pas être chargé avant que le serveur ait vérifié la session.

## Flux attendu

Dans le layout serveur protégé :

1. lire le cookie ;
2. vérifier la signature ;
3. vérifier l’expiration ;
4. récupérer le `User` ;
5. récupérer le profil actif ;
6. vérifier les statuts ;
7. construire un objet sérialisable ;
8. transmettre cet objet à `AdminShellProvider`.

Exemple de contexte :

```ts
interface AdminShellContextValue {
  user: {
    id: string;
    pseudo: string;
    email: string;
    telephone: string;
    matricule: string;
    photo?: string | null;
  };

  account: {
    type: "TENANT" | "SALER";
    tenantId?: string;
    salerId?: string;
    storeId?: string;
    designation?: string;
    logo?: string | null;
  };

  permissions: string[];
}
```

Le provider doit permettre aux composants clients d’accéder à ces données sans refaire des requêtes inutiles.

Créer un hook réutilisable :

```ts
useAdminShell()
```

Le hook doit retourner une erreur explicite s’il est utilisé en dehors du provider.

---

# 11. LAYOUT PROTÉGÉ

Utiliser les layouts Next.js et la structure existante de TailAdmin.

Ne pas créer un nouveau shell complet si le template en possède déjà un.

Adapter le layout principal pour :

* vérifier la session côté serveur ;
* rediriger vers la page de connexion si la session est absente ou invalide ;
* récupérer le profil actif ;
* fournir `AdminShellProvider` ;
* configurer la sidebar ;
* configurer le header ;
* afficher les informations du compte.

La page `/` doit être protégée.

Après connexion ou inscription, tous les utilisateurs sont redirigés vers :

```text
/
```

Le contenu de `/` peut être provisoire, mais doit être rendu dans le shell approprié.

---

# 12. SIDEBAR DYNAMIQUE

La sidebar doit dépendre du type de compte.

Réutiliser le composant de navigation TailAdmin existant.

Ne pas dupliquer deux sidebars entières.

Créer une configuration de menu filtrée selon `account.type`.

## Menu minimal Tenant

Le tenant peut voir, selon ce qui existe déjà :

* tableau de bord ;
* boutiques ;
* vendeurs ou agents ;
* produits ;
* stocks ;
* commandes ;
* dépenses ;
* clients ;
* promotions ;
* exercices ;
* rapports ;
* paramètres.

Ne pas créer toutes ces pages dans ce sprint.

Configurer uniquement les entrées pertinentes déjà disponibles ou prévoir proprement leur configuration sans produire de pages vides inutiles.

## Menu minimal Saler

Le vendeur peut voir uniquement les fonctionnalités de sa boutique :

* espace de travail ;
* commandes ou ventes ;
* clients ;
* stock de sa boutique, en lecture ou selon les permissions ;
* profil.

Il ne doit pas voir :

* gestion globale des boutiques ;
* création d’autres vendeurs ;
* paramètres du tenant ;
* données agrégées des autres boutiques ;
* apiKey ;
* apiSecret ;
* données d’autres stores.

La sécurité ne doit pas dépendre uniquement du menu.

Les pages et Server Actions doivent également vérifier les autorisations côté serveur.

---

# 13. HEADER DYNAMIQUE

Adapter le header existant de TailAdmin pour afficher :

* pseudo du user ;
* type du compte ;
* photo du profil si disponible ;
* désignation ou logo de la marque pour un tenant ;
* boutique assignée pour un vendeur, si l’information est disponible ;
* action de déconnexion.

Réutiliser les composants du header existant.

Utiliser les icônes du dossier `/icons`.

---

# 14. SÉPARATION SERVEUR/CLIENT

Respecter cette architecture :

## Côté serveur

* vérification de session ;
* accès MongoDB ;
* récupération du user ;
* récupération du profil ;
* contrôle des permissions ;
* création du compte ;
* authentification ;
* génération des identifiants ;
* création et suppression des cookies ;
* préparation des données initiales.

## Côté client

* formulaire multi-étapes ;
* aperçu d’images ;
* upload interactif ;
* recherche UserSearch ;
* ouverture et fermeture des menus ;
* transitions d’interface ;
* affichage des erreurs ;
* navigation après résultat d’une Server Action.

Ne jamais appeler Mongoose depuis un Client Component.

---

# 15. SÉCURITÉ

Appliquer obligatoirement :

* aucune donnée sensible envoyée au client ;
* aucun secret dans une variable `NEXT_PUBLIC_` ;
* aucun mot de passe en clair ;
* normalisation des e-mails ;
* normalisation des téléphones ;
* validation des ObjectId ;
* filtrage de toutes les requêtes par profil actif ;
* vérification des statuts ;
* limitation des résultats de recherche ;
* protection des recherches par regex ;
* cookie signé ;
* cookie HTTP-only ;
* expiration de session ;
* messages d’erreur non révélateurs ;
* suppression du champ `secure` dans les objets sérialisés.

Ne jamais se fier à un `tenantId`, `storeId`, `salerId` ou `userId` reçu directement du client sans le comparer aux informations de session.

---

# 16. TYPES ET NOMMAGE

Conserver les noms existants des modèles, même si certains termes sont imparfaits.

Le modèle vendeur s’appelle actuellement :

```text
Saler
```

Ne le renomme pas en `Seller`, `Salesman` ou `Commercial` dans ce sprint, sauf si toute la codebase utilise déjà un autre nom.

Créer des types partagés uniquement s’ils sont réellement réutilisés.

Éviter les types `any`.

Pour les objets transmis des Server Components aux Client Components :

* convertir les `ObjectId` en `string` ;
* convertir les `Date` en chaîne ISO si nécessaire ;
* ne transmettre que les champs utiles.

---

# 17. LIVRABLES ATTENDUS

Le sprint doit aboutir à :

1. une page de connexion TailAdmin adaptée à ELMES-TEKA ;
2. un formulaire d’inscription tenant en trois étapes ;
3. l’upload Cloudinary du profil, du logo et des documents ;
4. une Server Action de création `User + Tenant` ;
5. un composant réutilisable `UserSearch` ;
6. une Server Action ou un endpoint sécurisé de recherche utilisateur ;
7. une Server Action de connexion ;
8. une détection automatique `Tenant` ou `Saler` ;
9. une session sécurisée par cookie signé ;
10. une action de déconnexion ;
11. un layout protégé ;
12. un `AdminShellProvider` ;
13. un hook `useAdminShell` ;
14. une sidebar dynamique ;
15. un header dynamique ;
16. une redirection vers `/` après authentification.

---

# 18. MÉTHODE DE TRAVAIL

Avant d’écrire du code :

1. analyser la structure du projet ;
2. localiser les composants d’authentification TailAdmin ;
3. localiser les layouts ;
4. localiser la sidebar et le header ;
5. localiser les modèles Mongoose ;
6. localiser la connexion MongoDB ;
7. localiser le service Cloudinary ;
8. localiser les actions serveur existantes ;
9. localiser les utilitaires de session ou cookie ;
10. localiser le dossier `/icons`.

Ensuite :

1. réutiliser ce qui existe ;
2. modifier le minimum de fichiers ;
3. éviter les duplications ;
4. garder une architecture simple ;
5. ne pas anticiper les prochains sprints ;
6. ne pas créer les modules métiers complets de commandes, stocks ou dépenses maintenant.
#######################################################################################################################################################################
# SPRINT 2 — PATRIMOINE DU TENANT

Tu travailles sur **ELMES-TEKA**, un CRM made in Congo développé par l’entreprise ELMES pour permettre aux entrepreneurs congolais de superviser leurs boutiques, agents, produits, stocks, recettes, dépenses et exercices.

Avant toute modification, lis obligatoirement :

* `/AGENTS.md`
* `/CONTEXT.md`
* `/.github/copilot-instructions.md`

Analyse ensuite l’implémentation produite au Sprint 1, notamment :

* l’authentification ;
* la session signée par cookie ;
* `AdminShellProvider` ;
* `useAdminShell` ;
* les modèles Mongoose ;
* les Server Actions ;
* les services Cloudinary (dont l'intégration n'a pas recu car le url recu me donne une erreur 404 alors que dans une autre application center-research tout marchait correctement j'ai juste copier coller ici mais les url sont cassé et sur cloudinary je ne trouve pas les ressources) ;
* le service FlexPay ;
* les composants TailAdmin ;
* les composants de formulaire ;
* `UserSearch` ;
* la sidebar ;
* les drawers et modals déjà présents ;
* les utilitaires d’export ;
* les icônes du dossier `/icons`.

Ne recrée jamais une fonctionnalité déjà disponible.

---

# 1. OBJECTIF DU SPRINT

Mettre en place le module **Patrimoine** réservé au compte `TENANT`.

Les pages à réaliser sont :

```text
/agents
/annees
/products
/stores
```

Ces pages doivent permettre au tenant de gérer :

* ses agents ;
* ses exercices ;
* ses produits et services ;
* ses points de vente.

Le vendeur `Saler` ne doit pas accéder à ces pages.

Toutes les lectures et mutations doivent être isolées par le tenant authentifié.

---

# 2. RÈGLES ABSOLUES

Respecter strictement les règles suivantes :

* Ne faire que ce qui est demandé dans ce sprint.
* Ne pas développer les commandes, dépenses, stocks ou rapports complets au-delà des besoins des pages demandées.
* Ne jamais lancer de build.
* Ne jamais lancer de lint.
* Ne jamais lancer de tests.
* Ne jamais exécuter de commande destructive.
* Produire uniquement un rapport final pour que l’utilisateur teste lui-même.
* Réutiliser les composants TailAdmin v2.0.
* Réutiliser les services, actions, types, modèles, hooks et utilitaires existants.
* Ne jamais utiliser d’emoji comme icône.
* Toujours utiliser les SVG du dossier `/icons`.
* Toujours récupérer les données initiales côté serveur.
* Passer les données initiales aux composants clients.
* Réserver les Client Components aux interactions dynamiques.
* Utiliser des drawers pour les formulaires, détails et associations.
* Ne pas multiplier les modals lorsque le drawer est plus approprié.
* Toujours prévoir une pagination.
* Toujours afficher des métriques de synthèse en haut de chaque page.
* Toujours gérer les états :

  * chargement ;
  * vide ;
  * erreur ;
  * succès ;
  * suppression ;
  * recherche sans résultat.
* Ne jamais faire confiance à un `tenantId`, `storeId`, `userId`, `productId` ou `anneeId` reçu depuis le client.
* Toujours récupérer le tenant depuis la session sécurisée.
* Toute mutation doit vérifier côté serveur que la ressource appartient au tenant connecté.

---

# 3. ARCHITECTURE VISUELLE RÉUTILISABLE

Créer une page squelette réutilisable pour toutes les pages de gestion du patrimoine.

Avant de la créer, rechercher si un composant équivalent existe déjà.

Le composant peut être nommé selon les conventions existantes, par exemple :

```text
ResourcePageShell
ManagementPage
EntityPageShell
```

Ne pas imposer un nouveau nom si un composant similaire existe déjà.

La page squelette doit accepter des composants ou sections en entrée :

```ts
interface ResourcePageShellProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  metrics?: React.ReactNode;
  toolbar?: React.ReactNode;
  filters?: React.ReactNode;
  content: React.ReactNode;
  pagination?: React.ReactNode;
  drawer?: React.ReactNode;
}
```

La structure visuelle commune doit contenir :

1. titre de page ;
2. description ;
3. fil d’Ariane si disponible ;
4. métriques ;
5. barre de recherche et filtres ;
6. bouton d’action principal ;
7. grille ou liste de cartes ;
8. pagination ;
9. drawer ;
10. état vide.

Le but est de conserver une expérience homogène sur :

* `/agents` ;
* `/annees` ;
* `/products` ;
* `/stores`.

Les utilisateurs doivent retrouver la même logique de navigation sur chaque page.

---

# 4. DRAWERS

Tous les workflows de création, modification, détail et association doivent privilégier les drawers.

Le drawer doit :

* être accessible ;
* avoir un titre ;
* avoir une description ;
* avoir une action de fermeture ;
* fermer avec la touche Échap lorsque possible ;
* bloquer correctement le scroll d’arrière-plan ;
* conserver un z-index supérieur à la sidebar, au header et aux overlays du template ;
* ne jamais être caché par le menu ;
* être utilisable sur mobile ;
* gérer les formulaires multi-étapes ;
* afficher les erreurs d’action ;
* ne pas perdre les données en cas de passage entre étapes.

Réutiliser le composant Drawer existant.

Ne pas créer quatre implémentations différentes du même drawer.

---

# 5. PAGINATION ET FILTRES

Chaque page doit disposer d’une pagination côté serveur.

Utiliser les paramètres de recherche de l’URL, par exemple :

```text
?page=1&limit=12&search=&status=&sort=
```

Valider tous les paramètres.

Prévoir :

* recherche textuelle ;
* filtre par statut ;
* tri pertinent ;
* pagination ;
* nombre total de résultats ;
* page actuelle ;
* nombre total de pages.

La pagination doit rester cohérente après :

* création ;
* modification ;
* suppression ;
* filtrage ;
* recherche.

Ne pas charger toutes les collections dans le navigateur.

---

# 6. PERFORMANCE MONGOOSE

Utiliser Mongoose de manière performante.

Appliquer selon les besoins :

* `.lean()` pour les lectures ;
* `.select()` pour limiter les champs ;
* `.sort()` ;
* `.skip()` ;
* `.limit()` ;
* `countDocuments()` ;
* `aggregate()` pour les métriques, sommes, jointures et regroupements ;
* `$match` placé le plus tôt possible ;
* `$lookup` uniquement lorsque réellement utile ;
* `$group` pour les totaux ;
* `$facet` lorsque cela permet de récupérer données paginées et total dans une même requête ;
* index adaptés aux recherches réelles.

Ne pas utiliser `populate()` sans sélectionner les champs utiles.

Ne pas utiliser une agrégation complexe lorsqu’une requête simple indexée est suffisante.

Éviter :

* les requêtes N+1 ;
* les boucles contenant des requêtes ;
* la récupération de documents complets inutiles ;
* les agrégations sans filtrage tenant ;
* les recherches regex non sécurisées.

Les agrégations doivent toujours commencer par filtrer le `tenantId` ou les ressources appartenant au tenant.

---

# 7. MODIFICATIONS DES SCHÉMAS

## 7.1 Saler

Le modèle `Saler` doit contenir un champ obligatoire :

```ts
tenantId: Types.ObjectId;
```

Relation :

```ts
tenantId: {
  type: Schema.Types.ObjectId,
  ref: "Tenant",
  required: true,
  index: true
}
```

Le tenant ne peut lire, modifier ou supprimer que les vendeurs dont :

```ts
Saler.tenantId === session.tenantId
```

Le champ `storeId` doit permettre qu’un vendeur ne soit pas immédiatement assigné à une boutique.

Adapter le schéma de façon cohérente :

```ts
storeId?: Types.ObjectId | null;
```

et :

```ts
storeId: {
  type: Schema.Types.ObjectId,
  ref: "Store",
  default: null,
  index: true
}
```

Ajouter les index utiles, par exemple :

```ts
SalerSchema.index({ tenantId: 1, status: 1 });
SalerSchema.index({ tenantId: 1, storeId: 1 });
SalerSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
```

Vérifier la compatibilité avec les documents existants.

Ne pas supprimer brutalement les données existantes.

## 7.2 Product

Un produit doit appartenir à un tenant.

Vérifier si `Product` possède déjà un champ `tenantId`.

S’il n’existe pas, l’ajouter :

```ts
tenantId: Types.ObjectId;
```

Créer les index nécessaires :

```ts
ProductSchema.index({ tenantId: 1, status: 1 });
ProductSchema.index({ tenantId: 1, designation: 1 });
ProductSchema.index({ tenantId: 1, code: 1 }, { unique: true });
```

L’unicité du code doit être limitée au tenant, et non globale, sauf si la codebase impose déjà une autre règle métier.

## 7.3 Store

Un point de vente doit appartenir à un tenant.

Vérifier si `Store` possède déjà `tenantId`.

S’il n’existe pas, l’ajouter :

```ts
tenantId: Types.ObjectId;
```

Prévoir également les champs nécessaires au paiement de création sans dupliquer ceux qui existent déjà.

Selon la structure actuelle, utiliser ou ajouter des champs cohérents tels que :

```ts
payment?: {
  amount: number;
  currency: "USD" | "CDF";
  orderNumber: string;
  provider: "FLEXPAY";
  status: "PENDING" | "PAID" | "FAILED";
  paidAt?: Date | null;
}
```

ou une structure déjà existante dans la codebase.

La référence du point de vente et le `orderNumber` FlexPay doivent être associés de façon vérifiable.

## 7.4 Annee

Le modèle `Annee` contient déjà `tenantId`.

Vérifier ses index.

Une année doit être unique pour un tenant selon la logique actuelle, par exemple :

```ts
{ tenantId: 1, slug: 1 }
```

Vérifier que :

```ts
debut < fin
```

et empêcher des exercices incohérents.

---

# 8. PAGE `/agents`

## 8.1 Objectif

Permettre au tenant de gérer uniquement ses agents.

Fonctionnalités :

* liste paginée ;
* recherche ;
* filtres ;
* métriques ;
* création ;
* lecture ;
* modification ;
* suppression ;
* affectation à une boutique ;
* retrait d’une boutique ;
* activation ou suspension selon les statuts existants.

## 8.2 Métriques

Afficher au minimum :

* nombre total d’agents ;
* agents actifs ;
* agents non affectés ;
* agents affectés à une boutique.

Utiliser une agrégation filtrée par :

```ts
tenantId: session.tenantId
```

## 8.3 Cartes des agents

Créer une carte spécifique réutilisable.

Afficher uniquement les informations utiles :

* pseudo ;
* téléphone ;
* e-mail ;
* matricule ;
* statut ;
* boutique affectée ;
* date de création ;
* photo si disponible.

Actions :

* voir ;
* modifier ;
* affecter une boutique ;
* changer de boutique ;
* retirer de la boutique ;
* suspendre ou activer ;
* supprimer.

Utiliser les icônes existantes de `/icons`.

## 8.4 Création d’un agent

Le workflow commence par le composant `UserSearch` réalisé au Sprint 1.

Le tenant recherche un utilisateur par :

* pseudo ;
* téléphone ;
* e-mail.

### Cas 1 — Le user existe

Si le user existe :

1. récupérer son identifiant ;
2. vérifier qu’il n’est pas déjà `Saler` du même tenant ;
3. vérifier les règles si le user est déjà lié à un autre tenant ;
4. créer le profil `Saler` avec :

   * `userId` ;
   * `tenantId` de session ;
   * `storeId: null` ;
   * statut initial cohérent.

Le compte n’est pas assigné immédiatement à une boutique.

### Cas 2 — Le user n’existe pas

Transformer le drawer en formulaire en deux étapes.

#### Étape 1 — Création du User

Champs :

* pseudo ;
* téléphone ;
* e-mail ;
* mot de passe provisoire ou mécanisme existant ;
* photo facultative si le service existe.

Réutiliser les validations et fonctions du Sprint 1 :

* normalisation ;
* hashage `crypto.scrypt` ;
* génération du matricule ;
* contrôle d’unicité ;
* upload Cloudinary.

Ne pas recopier la logique d’authentification dans une nouvelle action.

Extraire ou réutiliser les utilitaires existants.

#### Étape 2 — Création du Saler

Après création du User :

* récupérer son `_id` ;
* créer `Saler` ;
* renseigner `tenantId` depuis la session ;
* laisser `storeId` à `null` ;
* appliquer le statut initial.

Prévoir un rollback si le User est créé mais que la création du Saler échoue.

## 8.5 Affectation à une boutique

L’affectation ne se fait pas lors de la création.

Depuis la carte de l’agent :

* bouton d’affectation ;
* ouverture d’un drawer ou d’une modal existante appropriée ;
* recherche ou sélection d’une boutique appartenant au tenant ;
* confirmation ;
* mise à jour du `storeId`.

Ne jamais permettre l’affectation à une boutique appartenant à un autre tenant.

Le serveur doit vérifier :

```ts
Store.findOne({
  _id: storeId,
  tenantId: session.tenantId
})
```

avant toute affectation.

## 8.6 Suppression

Avant suppression :

* vérifier l’appartenance au tenant ;
* afficher une confirmation ;
* décider selon les conventions existantes entre suppression définitive et désactivation.

Ne pas supprimer automatiquement le `User` lors de la suppression du profil `Saler`, sauf si une règle métier existante l’impose.

Par défaut, supprimer ou désactiver uniquement le profil vendeur.

---

# 9. PAGE `/annees`

## 9.1 Objectif

Permettre au tenant de créer et gérer ses exercices.

Fonctionnalités :

* liste paginée ;
* création ;
* modification ;
* suppression selon contraintes ;
* consultation ;
* métriques globales ;
* métriques par exercice ;
* export Excel du journal agrégé.

## 9.2 Métriques de page

Afficher au minimum :

* nombre total d’exercices ;
* exercice courant ;
* total des recettes sur l’ensemble des exercices ;
* total des dépenses sur l’ensemble des exercices ;
* résultat global estimé :

```text
recettes - dépenses
```

Respecter les devises.

Ne pas additionner USD et CDF sans conversion explicite.

Si plusieurs devises existent, afficher les totaux séparément.

## 9.3 Cartes des exercices

Chaque carte doit afficher :

* période ;
* slug ;
* statut si disponible ;
* total des recettes ;
* total des dépenses ;
* résultat ;
* nombre de commandes ;
* nombre de lignes de dépenses ;
* date de création.

Les recettes proviennent des commandes valides de l’exercice.

Les dépenses proviennent des documents `Depense` de l’exercice.

Analyser les schémas existants pour déterminer les statuts comptabilisés.

Ne pas compter :

* commandes annulées ;
* paiements échoués ;
* dépenses rejetées ;
* lignes inactives ;

sauf règle métier existante différente.

## 9.4 Agrégation des recettes

Calculer les recettes à partir des commandes de l’exercice.

Vérifier la structure réelle de `Commande`.

Si elle contient uniquement :

```ts
products: [
  {
    product: ObjectId;
    qte: number;
  }
]
```

sans prix figé à la vente, signaler dans le rapport que l’historique financier risque d’être incorrect si le prix du produit change.

Ne pas modifier le schéma au-delà de ce sprint sauf si l’export est impossible sans cette correction.

Si une amélioration minimale est nécessaire, conserver un prix unitaire figé dans chaque ligne de commande, selon les conventions existantes.

## 9.5 Agrégation des dépenses

Le modèle `Depense` contient des lignes :

```ts
[
  {
    libelle;
    amount;
    status;
    observation;
  }
]
```

Calculer les dépenses à partir des lignes valides.

Utiliser :

* `$unwind` ;
* `$match` ;
* `$group`.

Séparer les montants par devise si la devise est portée au niveau du document ou de la ligne.

## 9.6 Export Excel du journal

Depuis chaque carte, ajouter une action :

```text
Exporter le journal
```

Utiliser `exceljs`.

Réutiliser tout service d’export existant.

L’export doit agréger toutes les recettes et dépenses de l’exercice.

Créer un fichier professionnel comportant :

### Feuille 1 — Synthèse

* désignation du tenant ;
* exercice ;
* date de génération ;
* total recettes ;
* total dépenses ;
* résultat ;
* totaux par devise ;
* nombre de transactions ;
* nombre de boutiques concernées.

### Feuille 2 — Journal

Colonnes proposées :

* date ;
* type ;
* référence ;
* boutique ;
* agent ;
* libellé ;
* produit ou service ;
* quantité ;
* montant ;
* devise ;
* statut ;
* observation.

### Feuille 3 — Recettes

Détail des commandes.

### Feuille 4 — Dépenses

Détail des dépenses.

Le document doit avoir :

* titres ;
* en-têtes lisibles ;
* colonnes dimensionnées ;
* filtres ;
* dates formatées ;
* montants formatés ;
* ligne de total ;
* gel de l’en-tête ;
* nom de fichier explicite.

Exemple :

```text
journal-exercice-2026-elmes-teka.xlsx
```

L’export doit être généré côté serveur.

Ne pas charger toutes les données dans un Client Component avant l’export.

---

# 10. PAGE `/products`

## 10.1 Objectif

Permettre au tenant de gérer les produits et services commercialisés par sa marque.

Fonctionnalités :

* liste paginée ;
* recherche ;
* filtres ;
* création ;
* modification ;
* suppression ou archivage ;
* gestion des photos ;
* gestion des prix ;
* gestion du statut ;
* export de l’état des ventes par produit.

## 10.2 Isolation

Toutes les requêtes doivent filtrer :

```ts
tenantId: session.tenantId
```

Un tenant ne doit jamais voir ou modifier les produits d’un autre tenant.

## 10.3 Métriques

Afficher au minimum :

* nombre total de produits ;
* produits actifs ;
* produits inactifs ;
* services ;
* produits physiques si la distinction existe ;
* chiffre d’affaires généré par les produits ;
* produit le plus vendu.

Ne pas inventer un champ `type` si le schéma ne permet pas de distinguer produit et service.

Si cette distinction est indispensable et absente, proposer une adaptation minimale cohérente.

## 10.4 Cartes des produits

Chaque carte doit afficher :

* photo principale ;
* désignation ;
* catégorie ;
* code ;
* prix par devise ;
* statut ;
* quantité vendue ;
* chiffre d’affaires généré ;
* nombre de boutiques où le produit est disponible si calculable.

Actions :

* voir ;
* modifier ;
* gérer les photos ;
* exporter les ventes ;
* supprimer ou archiver.

## 10.5 Formulaire produit

Utiliser un drawer.

Le formulaire peut être multi-étapes lorsque cela améliore la compréhension.

Exemple :

### Étape 1 — Informations

* désignation ;
* catégorie ;
* code ;
* statut.

### Étape 2 — Tarification

* prix ;
* devise ;
* plusieurs prix si le schéma le permet.

### Étape 3 — Présentation

* descriptions ;
* photos Cloudinary.

Réutiliser le service Cloudinary existant.

## 10.6 Export de l’état des ventes

Depuis la carte d’un produit, permettre de générer un fichier Excel avec `exceljs`.

L’export doit contenir uniquement les ventes :

* du produit sélectionné ;
* appartenant au tenant ;
* sur les commandes autorisées ;
* filtrables éventuellement par exercice et boutique.

Prévoir au minimum :

### Feuille Synthèse

* produit ;
* code ;
* période ;
* quantité totale vendue ;
* chiffre d’affaires ;
* nombre de commandes ;
* boutiques concernées ;
* prix moyen si pertinent.

### Feuille Ventes

* date ;
* référence commande ;
* exercice ;
* boutique ;
* agent ;
* client ;
* quantité ;
* prix unitaire figé ;
* montant ;
* devise ;
* statut.

Ne jamais utiliser le prix actuel du produit pour recalculer une ancienne vente si un prix historique existe.

---

# 11. PAGE `/stores`

## 11.1 Objectif

Permettre au tenant de gérer ses points de vente.

Fonctionnalités :

* liste paginée ;
* création payante ;
* lecture ;
* modification ;
* suppression ou désactivation ;
* métriques ;
* consultation détaillée ;
* association de produits ;
* gestion des agents affectés si nécessaire ;
* statut de paiement.

## 11.2 Métriques

Afficher au minimum :

* nombre total de points de vente ;
* boutiques actives ;
* boutiques en attente de paiement ;
* boutiques inactives ;
* chiffre d’affaires global des boutiques ;
* boutique la plus performante ;
* nombre d’agents affectés.

Respecter les devises.

## 11.3 Cartes des points de vente

Afficher :

* désignation ;
* référence ;
* description courte ;
* coordonnées ;
* statut ;
* paiement ;
* nombre d’agents ;
* nombre de produits associés ;
* chiffre d’affaires ;
* dépenses ;
* résultat estimé ;
* photo principale si disponible.

Actions :

* voir ;
* modifier ;
* gestions des capitaux de départs pour chaque exercices
* associer des produits (CRUD des stocks);
* gérer les photos ;
* désactiver ;
* supprimer si autorisé.

Cliquer sur une carte doit ouvrir un drawer de détail.

## 11.4 Création en trois étapes

La création d’un point de vente coûte :

```text
50 USD
```

Pour un paiement en CDF, utiliser la variable d’environnement existante ou prévue :

```env
TAUX=
```

Ne jamais coder le taux directement dans le composant.

La conversion est :

```text
montantCDF = 50 × TAUX
```

Définir clairement si `TAUX` représente le nombre de CDF pour 1 USD.

Valider la valeur côté serveur.

### Étape 1 — Informations du point de vente

Champs selon le schéma existant :

* désignation ;
* description ;
* coordonnées ;
* photos facultatives ;
* autres champs strictement nécessaires.

Les coordonnées utilisent la structure :

```ts
[
  {
    title: string;
    content: string;
  }
]
```

Exemples :

* adresse ;
* commune ;
* ville ;
* téléphone ;
* repère.

Générer une référence unique de boutique.

Ne pas finaliser la boutique comme active avant confirmation du paiement.

### Étape 2 — Paiement FlexPay

Réutiliser le service FlexPay existant.

Ne pas recréer un second client FlexPay.

Adapter la logique à ELMES-TEKA.

Le tenant choisit :

* USD ;
* CDF.

Montants :

```text
USD = 50
CDF = 50 × TAUX
```

Créer la demande de paiement.

FlexPay retourne notamment un :

```text
orderNumber
```

Associer ce `orderNumber` :

* au paiement ;
* à la référence de la boutique ;
* au tenant ;
* à la tentative de création.

Ne pas faire confiance au statut renvoyé par le client.

Toutes les vérifications doivent se faire côté serveur via le service FlexPay.

La boutique peut être créée dans un état provisoire :

```text
PENDING_PAYMENT
```

ou utiliser le statut équivalent déjà existant.

Éviter les doublons lorsque l’utilisateur clique plusieurs fois.

Mettre en place une logique d’idempotence à partir de la référence ou du `orderNumber`.

### Étape 3 — Vérification et validation

À la troisième étape :

1. appeler le service de vérification FlexPay côté serveur ;
2. transmettre le `orderNumber` ;
3. vérifier le montant ;
4. vérifier la devise ;
5. vérifier le statut ;
6. vérifier que le paiement appartient au tenant et à la tentative concernée ;
7. marquer le paiement comme réussi ;
8. activer la boutique ;
9. enregistrer la date de paiement ;
10. afficher la confirmation.

Si le paiement n’est pas encore reçu :

* afficher un état clair ;
* permettre une nouvelle vérification ;
* ne pas créer une seconde boutique ;
* ne pas démarrer une nouvelle transaction automatiquement ;
* conserver la référence existante.

Si le paiement échoue :

* conserver une trace du statut ;
* permettre une nouvelle tentative selon le service existant ;
* éviter les doubles paiements.

## 11.5 Modification et suppression

Après création validée :

* modification des informations ;
* gestion du statut ;
* ajout ou suppression de photos ;
* suppression uniquement selon les contraintes métier.

Une boutique ayant :

* des commandes ;
* des dépenses ;
* des stocks ;
* des agents ;

ne doit pas être supprimée brutalement.

Privilégier :

* archivage ;
* désactivation ;
* soft delete si la codebase le permet.

## 11.6 Drawer de détail

Cliquer sur une carte ouvre un drawer affichant :

* informations générales ;
* coordonnées ;
* photos ;
* statut ;
* paiement ;
* capital ;
* caisses ;
* agents ;
* produits associés ;
* métriques principales.

Ne pas créer les fonctionnalités avancées qui ne sont pas demandées.

## 11.7 Association de produits

Depuis le drawer de la boutique, ajouter une section :

```text
Produits associés
```

Permettre :

* recherche des produits du tenant ;
* sélection multiple ;
* association ;
* retrait ;
* affichage des produits déjà associés.

Avant de modifier le schéma, rechercher comment les produits sont actuellement liés aux boutiques.

Le schéma `Stock` contient déjà :

```ts
shopId
products: [
  {
    product;
    qte;
  }
]
```

Ne pas créer une relation concurrente inutile.

Déterminer si l’association boutique-produit doit être représentée par :

* un stock initial ;
* une collection existante ;
* une relation déjà présente.

Pour une simple association sans quantité, utiliser la structure existante la plus cohérente.

Si `Stock` est utilisé :

* ne pas demander forcément une quantité à l’association initiale ;
* initialiser à zéro si la règle métier l’autorise ;
* ne créer qu’un document de stock cohérent par boutique et exercice selon le modèle actuel.

Ne pas inventer un nouveau modèle `StoreProduct` sans nécessité.

---

# 12. ACTIONS SERVEUR

Créer ou adapter des Server Actions clairement organisées.

Exemples fonctionnels :

```text
agents.actions.ts
annees.actions.ts
products.actions.ts
stores.actions.ts
exports.actions.ts
```

Respecter l’organisation existante.

Chaque action doit :

1. lire la session ;
2. exiger `accountType === "TENANT"` ;
3. récupérer `tenantId` depuis la session ;
4. valider les entrées ;
5. vérifier les ObjectId ;
6. vérifier l’appartenance des ressources ;
7. effectuer l’opération ;
8. retourner un résultat sérialisable ;
9. revalider les chemins nécessaires ;
10. ne jamais retourner de document Mongoose brut.

Créer un utilitaire central réutilisable si le projet n’en possède pas déjà :

```ts
requireTenantSession()
```

Il doit retourner au minimum :

```ts
{
  userId: string;
  tenantId: string;
}
```

Ne pas dupliquer la vérification de session dans toutes les actions si elle peut être centralisée.

---

# 13. AUTORISATIONS

Toutes les pages du sprint sont réservées au tenant.

Le serveur doit refuser un vendeur même s’il accède directement à l’URL.

Pour chaque ressource :

## Agent

```ts
{ _id: salerId, tenantId: session.tenantId }
```

## Année

```ts
{ _id: anneeId, tenantId: session.tenantId }
```

## Produit

```ts
{ _id: productId, tenantId: session.tenantId }
```

## Boutique

```ts
{ _id: storeId, tenantId: session.tenantId }
```

Les ressources liées doivent également appartenir au tenant.

Exemple : un produit associé à une boutique doit avoir le même `tenantId` que la boutique et la session.

---

# 14. VALIDATION ET TYPES

Réutiliser les solutions de validation existantes.

Ne pas installer de nouvelle librairie.

Valider côté serveur :

* chaînes ;
* e-mails ;
* téléphones ;
* statuts ;
* devises ;
* montants ;
* dates ;
* tableaux ;
* ObjectId ;
* fichiers ;
* ordre des dates ;
* montant FlexPay ;
* taux de conversion.

Éviter `any`.

Créer des types partagés lorsque plusieurs composants les utilisent.

Tous les objets transmis au client doivent être sérialisés :

* ObjectId en `string` ;
* Date en ISO ;
* Decimal en nombre ou chaîne selon la convention ;
* aucun document Mongoose brut.

---

# 15. ÉTATS VIDES

Chaque page doit avoir un état vide contextualisé.

Exemples :

## Agents

```text
Aucun agent n’est encore enregistré.
Créez votre premier agent pour commencer à organiser votre équipe.
```

## Années

```text
Aucun exercice n’est encore défini.
Créez un exercice pour organiser vos recettes et dépenses par période.
```

## Produits

```text
Aucun produit ou service n’est encore disponible.
Ajoutez ce que votre entreprise commercialise.
```

## Boutiques

```text
Aucun point de vente n’est encore enregistré.
Créez votre première boutique pour commencer la supervision.
```

Utiliser un bouton d’action pertinent.

Ne pas utiliser d’emoji.

---

# 16. RAFRAÎCHISSEMENT DES DONNÉES

Après une mutation réussie :

* utiliser `revalidatePath()` côté serveur ;
* mettre à jour l’état client si cela évite un rechargement inutile ;
* fermer le drawer seulement après confirmation ;
* afficher un message de succès ;
* conserver la recherche et la pagination lorsque possible.

Ne pas introduire Pusher dans ce sprint sauf si une fonctionnalité existante l’utilise déjà et que cela est strictement nécessaire.

---

# 17. FICHIERS EXCEL

Tous les exports doivent être générés côté serveur avec `exceljs`.

Ne pas exposer les données de plusieurs tenants.

Avant l’export :

* vérifier la session ;
* vérifier l’appartenance ;
* appliquer les filtres ;
* limiter la période si nécessaire ;
* utiliser les statuts comptables valides.

Les fichiers doivent être correctement nommés et avoir une présentation professionnelle.

Réutiliser les utilitaires existants pour :

* styles ;
* titres ;
* formats monétaires ;
* largeur des colonnes ;
* dates ;
* totaux ;
* téléchargement.

Si aucun utilitaire n’existe, créer un utilitaire minimal commun aux deux exports, sans construire un framework d’export complexe.

---

# 18. NAVIGATION

Ajouter les pages dans la sidebar du tenant :

* Agents ;
* Exercices ;
* Produits et services ;
* Points de vente.

Réutiliser les icônes disponibles dans `/icons`.

Ne pas afficher ces liens à un vendeur.

Ne pas créer une nouvelle sidebar.

Adapter la configuration dynamique réalisée au Sprint 1.

---

# 19. ORDRE D’IMPLÉMENTATION

Procéder dans cet ordre :

1. analyser l’existant ;
2. vérifier les modèles ;
3. adapter `Saler` avec `tenantId` et `storeId` nullable ;
4. vérifier ou ajouter `tenantId` dans `Product` et `Store` ;
5. ajouter les index utiles ;
6. créer ou adapter le contrôle central `requireTenantSession` ;
7. créer la page squelette réutilisable ;
8. vérifier le Drawer existant et son z-index ;
9. implémenter `/agents` ;
10. implémenter `/annees` ;
11. implémenter les exports d’exercice ;
12. implémenter `/products` ;
13. implémenter l’export des ventes d’un produit ;
14. implémenter `/stores` ;
15. intégrer FlexPay ;
16. implémenter l’association boutique-produits ;
17. adapter la sidebar ;
18. produire le rapport.

Ne pas commencer par créer de nombreux composants abstraits.

Créer les abstractions uniquement après avoir identifié les éléments réellement communs.

---

# 20. CRITÈRES DE VALIDATION

Le sprint est considéré comme terminé lorsque :

## Agents

* le tenant voit uniquement ses agents ;
* il peut créer un agent à partir d’un user existant ;
* il peut créer un nouveau user puis son profil Saler ;
* le vendeur est créé sans boutique ;
* le tenant peut ensuite l’affecter à une boutique ;
* aucune boutique étrangère n’est accessible.

## Années

* le tenant peut gérer ses exercices ;
* chaque carte affiche recettes, dépenses et résultat ;
* les calculs sont filtrés par tenant et exercice ;
* l’export Excel du journal fonctionne côté serveur.

## Produits

* le tenant peut gérer ses produits ;
* chaque produit appartient au tenant ;
* les cartes affichent des métriques de ventes ;
* un export Excel peut être généré par produit.

## Stores

* le tenant peut initier la création d’une boutique ;
* le prix est de 50 USD ;
* la conversion CDF utilise `TAUX` ;
* FlexPay existant est réutilisé ;
* le `orderNumber` est associé à la référence ;
* la création est validée uniquement après confirmation serveur ;
* les doubles créations et doubles paiements sont évités ;
* le drawer de détail permet l’association de produits.

## Interface

* même structure de page ;
* mêmes principes de cartes ;
* mêmes filtres ;
* mêmes paginations ;
* drawers cohérents ;
* z-index correct ;
* états vides présents ;
* métriques présentes ;
* responsive.

---

# 21. RAPPORT FINAL OBLIGATOIRE

Ne lance ni build, ni lint, ni tests.

À la fin, fournir un rapport avec exactement les rubriques suivantes :

## 1. Résumé des travaux

Décrire les fonctionnalités réalisées.

## 2. Schémas modifiés

Préciser chaque champ et index ajouté ou modifié.

## 3. Fichiers créés

Lister chaque fichier et sa responsabilité.

## 4. Fichiers modifiés

Lister chaque fichier et les changements effectués.

## 5. Éléments réutilisés

Lister les composants, services, actions, modèles, layouts et utilitaires existants réutilisés.

## 6. Page Agents

Décrire le CRUD, la création User/Saler et l’affectation à une boutique.

## 7. Page Exercices

Décrire les métriques, agrégations et export Excel.

## 8. Page Produits

Décrire le CRUD, les cartes, métriques et export des ventes.

## 9. Page Points de vente

Décrire le formulaire en trois étapes, FlexPay, la vérification et l’association des produits.

## 10. Sécurité multi-tenant

Expliquer comment toutes les lectures et mutations sont filtrées.

## 11. Agrégations et performances

Lister les principales requêtes complexes, index et optimisations utilisées.

## 12. Variables d’environnement

Lister uniquement les noms nécessaires, notamment :

```text
TAUX
```

ainsi que les variables FlexPay déjà utilisées.

Ne jamais afficher leurs valeurs.

## 13. Tests manuels à réaliser

Donner des scénarios précis et ordonnés pour les quatre pages.

## 14. Limites et points à surveiller

Signaler les éléments incomplets, migrations nécessaires, hypothèses de schéma, limites FlexPay ou problèmes d’historique des prix.

## 15. Commandes non exécutées

Confirmer explicitement qu’aucun build, lint ou test n’a été lancé.
