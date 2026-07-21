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
#######################################################################
#######################################################################
#########################################################################
# SPRINT 3 — TRANSACTIONS, STOCKS, CLIENTS ET TEMPS RÉEL

Tu travailles sur **ELMES-TEKA**, un CRM made in Congo développé par l’entreprise ELMES pour permettre aux entrepreneurs congolais de superviser leurs boutiques, agents, produits, stocks, recettes, dépenses, clients et exercices comptables.

Avant toute modification, lis obligatoirement :

* `/AGENTS.md`
* `/PROJECT_CONTEXT.md`
* `/.github/copilot-instructions.md`

Analyse ensuite les réalisations des Sprints 1 et 2, en particulier :

* l’authentification ;
* la session signée par cookie ;
* `AdminShellProvider` ;
* `useAdminShell` ;
* les contrôles `TENANT` et `SALER` ;
* les modèles `User`, `Tenant`, `Saler`, `Store`, `Annee`, `Commande`, `Depense`, `Stock`, `Customer`, `Product` et `Promotion` ;
* les Server Actions existantes ;
* les composants TailAdmin ;
* la page squelette réutilisable ;
* les drawers ;
* les composants de recherche ;
* les services Cloudinary ;
* les services Pusher ;
* les utilitaires PDF ;
* les icônes du dossier `/icons`.

Ne recrée jamais une fonctionnalité déjà présente.

---

# 1. CORRECTION MÉTIER À CONSIDÉRER

Le paiement de 50 USD ne se fait plus à la création d’un point de vente.

Le paiement doit être effectué à la création ou à l’activation d’un exercice comptable `Annee`.

Ne réintroduis aucun paiement dans le workflow de création d’une boutique.

Le Sprint 3 ne doit pas modifier cette nouvelle règle métier, sauf pour vérifier qu’un vendeur ne peut effectuer une transaction que dans un exercice actif et validé.

---

# 2. OBJECTIF DU SPRINT

Mettre en place les principales pages de travail du vendeur `Saler`.

Pages à réaliser :

```text
/commandes/[slug]
/payments/[slug]
/stocks/[slug]
/clients
```

Le paramètre `slug` représente la boutique ou le contexte de travail actif selon la convention déjà utilisée dans la codebase.

Le vendeur ne peut travailler que sur :

* la boutique qui lui est affectée ;
* les exercices actifs de son tenant ;
* les produits appartenant à son tenant et disponibles dans sa boutique ;
* les clients accessibles dans le périmètre autorisé.

Le tenant doit recevoir en temps réel les événements importants grâce à Pusher.

---

# 3. RÈGLES ABSOLUES

Respecter strictement les règles suivantes :

* Ne faire que ce qui est demandé dans ce sprint.
* Ne jamais lancer de build.
* Ne jamais lancer de lint.
* Ne jamais lancer de tests.
* Ne jamais exécuter de commande destructive.
* Produire uniquement un rapport final.
* Réutiliser les composants TailAdmin v2.0.
* Réutiliser les services, actions, types, modèles, hooks et utilitaires existants.
* Ne jamais utiliser d’emoji comme icône.
* Toujours utiliser les SVG disponibles dans `/icons`.
* Toujours récupérer les données initiales côté serveur.
* Passer les données initiales aux composants clients.
* Réserver les Client Components aux interactions dynamiques.
* Utiliser des drawers pour les workflows de création, modification et détail.
* Toujours prévoir pagination, recherche, filtres et métriques.
* Toujours vérifier l’appartenance au tenant et à la boutique côté serveur.
* Ne jamais utiliser un `tenantId`, `storeId`, `salerId`, `anneeId`, `productId`, `customerId`, `commandeId` ou `stockId` reçu du client comme source de vérité.
* Toujours récupérer les identifiants autorisés à partir de la session et du profil `Saler`.
* Persister les données avant d’émettre un événement Pusher.
* Ne jamais considérer Pusher comme la source officielle des données.
* MongoDB reste la source de vérité.
* Ne pas ajouter de nouvelle dépendance.
* Réutiliser `pdfmake`, `pusher`, `pusher-js`, `mongoose`, `uuid`, `crypto` et les autres bibliothèques déjà installées.

---

# 4. CONTRÔLE CENTRAL DU VENDEUR

Créer ou réutiliser un utilitaire central, par exemple :

```ts
requireSalerSession()
```

Il doit :

1. lire et vérifier la session ;
2. exiger `accountType === "SALER"` ;
3. récupérer le profil `Saler` ;
4. vérifier que le vendeur est actif ;
5. vérifier qu’il possède une boutique affectée ;
6. récupérer la boutique ;
7. vérifier que la boutique est active ;
8. vérifier que `Saler.tenantId === Store.tenantId` ;
9. retourner un objet minimal sérialisable.

Exemple :

```ts
interface SalerWorkContext {
  userId: string;
  salerId: string;
  tenantId: string;
  storeId: string;
  storeSlug: string;
}
```

Pour les pages contenant `[slug]`, vérifier obligatoirement que :

```ts
slug === store.slug
```

ou utiliser la convention réelle de la codebase.

Un vendeur ne doit jamais pouvoir modifier l’URL pour accéder à une autre boutique.

---

# 5. EXERCICE ACTIF

Toutes les transactions doivent être liées à un exercice `Annee`.

Avant de permettre :

* une commande ;
* une dépense ;
* une demande d’approvisionnement ;

le serveur doit vérifier qu’un exercice est :

* associé au tenant ;
* actif ;
* validé ;
* payé si la nouvelle règle métier exige un paiement ;
* couvrant la date actuelle, si cette règle est appliquée.

Créer ou réutiliser un utilitaire :

```ts
getActiveAnneeForTenant()
```

ou :

```ts
requireActiveAnnee()
```

Ne jamais accepter directement un `anneeId` envoyé par le client sans vérification.

Si aucun exercice actif n’est disponible, afficher un état bloquant clair :

```text
Aucun exercice actif n’est disponible pour enregistrer cette opération.
Contactez le gestionnaire de votre entreprise.
```

Le vendeur peut consulter les données existantes selon les autorisations, mais ne peut pas créer de nouvelle transaction sans exercice actif.

---

# 6. ARCHITECTURE COMMUNE DES PAGES

Réutiliser la page squelette créée au Sprint 2.

Chaque page doit contenir :

1. titre ;
2. description ;
3. informations de la boutique active ;
4. informations de l’exercice actif ;
5. métriques ;
6. recherche ;
7. filtres ;
8. action principale ;
9. cartes ou tableau ;
10. pagination ;
11. drawer ;
12. état vide ;
13. états de chargement et erreur.

Les composants de cartes doivent être spécifiques à la ressource, mais utiliser la même structure visuelle.

---

# 7. PUSHER ET TEMPS RÉEL

Réutiliser la configuration Pusher existante.

Ne pas recréer de client ou serveur Pusher en parallèle.

Utiliser des canaux privés si l’infrastructure actuelle les prend en charge.

Convention recommandée :

```text
private-tenant-{tenantId}-commandes
private-tenant-{tenantId}-depenses
private-tenant-{tenantId}-stocks
```

Événements recommandés :

```text
commande.created
commande.updated
commande.deleted

depense.created
depense.updated
depense.deleted

stock.requested
stock.updated
stock.deleted
```

Respecter les conventions existantes si elles diffèrent.

Chaque payload doit être minimal.

Exemple :

```ts
interface RealtimeTransactionPayload {
  id: string;
  reference: string;
  tenantId: string;
  storeId: string;
  salerId: string;
  anneeId: string;
  status: string;
  createdAt: string;
}
```

Ne jamais envoyer via Pusher :

* hash ;
* mot de passe ;
* apiKey ;
* apiSecret ;
* données complètes du client ;
* documents sensibles ;
* informations inutiles.

L’ordre obligatoire est :

```text
Validation
→ Persistance MongoDB
→ Génération éventuelle du document
→ Émission Pusher
→ Réponse au client
```

Si Pusher échoue après la persistance :

* ne pas annuler la transaction métier ;
* journaliser l’erreur côté serveur ;
* retourner le succès métier avec un avertissement interne si nécessaire.

---

# 8. PAGE `/commandes/[slug]`

## 8.1 Objectif

Permettre au vendeur de gérer les recettes ou ventes de sa boutique.

Fonctionnalités :

* création ;
* lecture ;
* modification selon les règles métier ;
* suppression ou annulation ;
* recherche ;
* filtres ;
* pagination ;
* métriques ;
* génération de facture PDF ;
* notification Pusher au tenant.

Le terme métier affiché dans l’interface peut être :

```text
Ventes
```

ou :

```text
Recettes
```

Conserver le nom du modèle `Commande` dans le code.

## 8.2 Isolation

Chaque requête doit être filtrée avec au minimum :

```ts
{
  tenantId: session.tenantId,
  shopId: session.storeId
}
```

Si `Commande` ne contient pas encore `tenantId`, l’ajouter afin de faciliter l’isolation et les agrégations.

Ajouter aussi `agentId` ou `salerId` si ce champ n’existe pas et s’il est nécessaire pour identifier le vendeur ayant créé la transaction.

Structure recommandée :

```ts
tenantId: ObjectId;
agentId: ObjectId;
```

Ne pas créer plusieurs champs concurrents pour la même information.

## 8.3 Correction du schéma des lignes de commande

Une ligne de commande doit figer les informations financières au moment de la vente.

Vérifier le schéma existant.

Chaque ligne doit contenir au minimum :

```ts
{
  product: ObjectId;
  designation: string;
  code?: string;
  qte: number;
  unitPrice: number;
  currency: string;
  reduction?: number;
  total: number;
}
```

Ne pas recalculer une ancienne facture à partir du prix actuel du produit.

Conserver un snapshot minimal du produit dans la commande :

* désignation ;
* code ;
* prix unitaire ;
* devise ;
* réduction appliquée ;
* total.

La commande doit également conserver :

```ts
subtotal: number;
discountAmount: number;
totalAmount: number;
currency: string;
```

Si plusieurs devises dans une même commande ne sont pas autorisées, bloquer l’ajout de produits utilisant une autre devise.

Ne pas mélanger USD et CDF dans un même total.

## 8.4 Métriques

Afficher au minimum :

* nombre de ventes du jour ;
* chiffre d’affaires du jour ;
* chiffre d’affaires de l’exercice ;
* panier moyen ;
* ventes annulées ;
* produit le plus vendu.

Respecter les devises.

Si la boutique traite plusieurs devises, afficher les totaux séparément.

## 8.5 Cartes ou tableau des commandes

Afficher :

* référence ;
* client ;
* téléphone ;
* date ;
* nombre de produits ;
* montant total ;
* devise ;
* statut ;
* vendeur ;
* promotion appliquée ;
* disponibilité de la facture.

Actions :

* voir ;
* télécharger ou régénérer la facture ;
* modifier si autorisé ;
* annuler ;
* supprimer uniquement si les règles le permettent.

Une vente validée ne doit pas être supprimée brutalement si elle a déjà influencé le stock ou les rapports.

Privilégier un statut :

```text
CANCELLED
```

ou l’équivalent existant.

## 8.6 Drawer de création en trois étapes

### Étape 1 — Client

Créer ou réutiliser un composant de recherche client par téléphone.

Nom possible :

```text
CustomerSearch
```

Avant de le créer, rechercher un composant équivalent.

Le vendeur saisit le numéro de téléphone.

La recherche doit :

* normaliser le numéro ;
* être debouncée ;
* limiter les résultats ;
* ne retourner aucune information sensible ;
* rechercher dans le tenant autorisé ;
* afficher le nom, téléphone, e-mail éventuel et matricule ;
* permettre la sélection.

#### Cas 1 — Client trouvé

Récupérer :

* `_id` ;
* nom ;
* téléphone ;
* e-mail ;
* matricule ;
* promotions associées.

Passer à l’étape 2.

#### Cas 2 — Client introuvable

Afficher un formulaire de création :

* nom ;
* téléphone déjà renseigné ;
* e-mail facultatif.

À la validation :

1. vérifier une nouvelle fois que le client n’existe pas ;
2. créer le client ;
3. générer son matricule avec `uuid` selon le schéma existant ;
4. récupérer son `_id` ;
5. conserver ses informations pour la facture ;
6. passer à l’étape 2.

Le client doit appartenir au tenant.

Si le schéma `Customer` ne possède pas `tenantId`, l’ajouter.

Ajouter les index utiles :

```ts
CustomerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ tenantId: 1, name: 1 });
```

L’unicité du téléphone doit être limitée au tenant, sauf règle métier contraire.

### Étape 2 — Produits

Créer ou réutiliser un composant de recherche produit.

Recherche par :

* code ;
* désignation.

La recherche doit être limitée :

* au tenant ;
* à la boutique ;
* aux produits actifs ;
* aux produits disponibles dans le stock de la boutique ;
* à l’exercice actif si le modèle de stock dépend de l’année.

Afficher :

* photo ;
* désignation ;
* code ;
* prix ;
* devise ;
* quantité disponible ;
* éventuelle promotion.

Le vendeur sélectionne un produit puis renseigne :

* quantité.

Avant l’ajout dans l’état local, vérifier :

* quantité supérieure à zéro ;
* stock suffisant ;
* produit actif ;
* devise compatible avec la commande ;
* produit non dupliqué ou fusionner les quantités selon la UX choisie.

Conserver les lignes de commande dans un state local.

Permettre :

* ajout ;
* modification de quantité ;
* suppression d’une ligne ;
* visualisation du sous-total.

Ne modifier aucun stock à cette étape.

### Étape 3 — Résumé et facture

Afficher un résumé complet :

* client ;
* téléphone ;
* matricule ;
* boutique ;
* vendeur ;
* exercice ;
* produits ;
* quantités ;
* prix unitaires ;
* sous-total ;
* promotion ;
* réduction ;
* total ;
* devise ;
* référence provisoire.

Vérifier les promotions du client.

Appliquer uniquement les promotions :

* actives ;
* associées au client ;
* compatibles avec la commande ;
* appartenant au tenant ;
* valides selon leurs règles ;
* non expirées si des dates existent.

Ne pas faire confiance au calcul du navigateur.

À la validation finale, le serveur doit recalculer :

* prix ;
* quantité disponible ;
* promotion ;
* réduction ;
* sous-total ;
* total ;
* devise.

Le serveur reste la source de vérité.

## 8.7 Persistance atomique de la commande

Lors de la création :

1. vérifier la session ;
2. vérifier la boutique ;
3. vérifier l’exercice ;
4. vérifier le client ;
5. vérifier chaque produit ;
6. vérifier les stocks ;
7. recalculer les montants ;
8. générer la référence ;
9. créer la commande ;
10. décrémenter les stocks ;
11. générer la facture ;
12. émettre Pusher.

Utiliser une transaction MongoDB lorsque l’infrastructure existante le permet.

La création de la commande et le décrément du stock doivent être atomiques.

Empêcher les stocks négatifs.

Utiliser une mise à jour conditionnelle ou une transaction.

Exemple de condition :

```ts
{
  _id: stockId,
  tenantId,
  shopId,
  anneeId,
  "products.product": productId,
  "products.qte": { $gte: requestedQuantity }
}
```

Adapter à la structure réelle.

Si un produit n’a plus assez de stock au moment de la validation, refuser toute la commande.

## 8.8 Génération de la facture avec pdfmake

Réutiliser les utilitaires `pdfmake` existants.

La facture doit être générée côté serveur.

Elle doit contenir :

* logo du tenant si disponible ;
* désignation de la marque ;
* informations de la boutique ;
* référence ;
* date ;
* exercice ;
* vendeur ;
* informations client ;
* tableau des produits ;
* quantité ;
* prix unitaire ;
* réduction ;
* total ;
* devise ;
* mentions ou pied de page.

Le fichier doit avoir un nom clair :

```text
facture-{reference}.pdf
```

Décider selon l’architecture existante si la facture est :

* retournée directement ;
* stockée sur Cloudinary ;
* ou stockée via un service existant.

Ne pas dupliquer les fichiers inutilement.

Si l’URL de facture est persistée dans la commande, prévoir un champ cohérent :

```ts
invoice?: {
  url: string;
  publicId?: string;
  generatedAt: Date;
}
```

Ne pas exposer de fichier d’un autre tenant.

## 8.9 Pusher commande

Après création réussie :

Canal :

```text
private-tenant-{tenantId}-commandes
```

Événement :

```text
commande.created
```

Payload minimal :

```ts
{
  id,
  reference,
  storeId,
  salerId,
  customerName,
  totalAmount,
  currency,
  status,
  createdAt
}
```

---

# 9. PAGE `/depenses/[slug]`

## 9.1 Clarification métier


Dans l’interface, afficher :

```text
Dépenses
```

Ne pas renommer la route dans ce sprint sauf si la codebase prévoit déjà `/depenses/[slug]`.

Ne pas confondre :

* paiement FlexPay de l’exercice ;
* paiement d’un client ;
* dépense opérationnelle.

Cette page concerne uniquement les dépenses opérationnelles.

## 9.2 Objectif

Permettre au vendeur de gérer les dépenses de sa boutique.

Fonctionnalités :

* création ;
* lecture ;
* modification ;
* suppression ou annulation ;
* recherche ;
* filtres ;
* pagination ;
* métriques ;
* notification Pusher.

## 9.3 Isolation

Chaque dépense doit contenir ou permettre de retrouver :

* `tenantId` ;
* `anneeId` ;
* `shopId` ;
* `agentId` ;
* `reference`.

Si `tenantId` n’existe pas dans `Depense`, l’ajouter.

Le vendeur ne peut voir que les dépenses :

```ts
{
  tenantId: session.tenantId,
  shopId: session.storeId
}
```

Selon la règle métier, il peut voir :

* toutes les dépenses de sa boutique ;
* ou uniquement celles qu’il a créées.

Appliquer la règle déjà définie dans la codebase.

En l’absence de règle, permettre la lecture des dépenses de la boutique, mais limiter modification et suppression à l’auteur ou au tenant.

## 9.4 Métriques

Afficher au minimum :

* dépenses du jour ;
* dépenses de l’exercice ;
* nombre de dépenses ;
* dépense moyenne ;
* dépenses en attente ;
* catégorie ou libellé principal.

Respecter les devises.

## 9.5 Formulaire

Utiliser un drawer.

Le formulaire doit permettre plusieurs lignes :

```ts
[
  {
    libelle: string;
    amount: number;
    status: string;
    observation?: string;
  }
]
```

Ajouter ou utiliser le champ devise au niveau cohérent du schéma.

Le formulaire doit permettre :

* ajout d’une ligne ;
* suppression d’une ligne ;
* total dynamique ;
* devise ;
* observation ;
* résumé final.

Le serveur doit recalculer le total.

Ne jamais accepter un montant négatif ou nul.

## 9.6 Persistance et événement

À la validation :

1. vérifier la session ;
2. vérifier la boutique ;
3. vérifier l’exercice ;
4. valider les lignes ;
5. générer la référence ;
6. persister la dépense ;
7. émettre Pusher.

Canal :

```text
private-tenant-{tenantId}-depenses
```

Événement :

```text
depense.created
```

Payload :

```ts
{
  id,
  reference,
  storeId,
  salerId,
  totalAmount,
  currency,
  status,
  createdAt
}
```

---

# 10. PAGE `/stocks/[slug]`

## 10.1 Objectif

Permettre au vendeur de gérer les demandes d’approvisionnement et les mouvements de stock de sa boutique.
Pour y arriver on va créer un schema pour faire une demande d'approvisionnement, que le tenant va recevoir en notification (au niveau de son Header, pour validation et laquelle validation va incrementé la quantité en stock pour l'année d'exercice pris en charge par la demande d'approvisionnement)
Le vendeur peut faire du CRD selon la demande :

* créer ;
* lire ;
* supprimer ou annuler une demande encore en attente.

Le vendeur ne peut pas valider lui-même un approvisionnement.

La validation appartient au tenant.

## 10.2 Statuts

Prévoir ou réutiliser des statuts cohérents :

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

Une création faite par le vendeur doit être :

```text
PENDING
```

Le stock disponible ne doit pas être incrémenté tant que le tenant n’a pas validé l’approvisionnement.

## 10.3 Distinction indispensable

Ne pas confondre :

* stock disponible ;
* demande d’approvisionnement ;
* mouvement de stock ;
* inventaire.

Analyser le modèle `Stock`.

Si le modèle actuel représente uniquement un état de stock, ne pas l’utiliser directement comme demande sans conserver une distinction claire.

La solution minimale peut être :

```ts
type StockOperationType =
  | "INITIAL"
  | "SUPPLY_REQUEST"
  | "SUPPLY"
  | "SALE"
  | "ADJUSTMENT";
```

ou utiliser une collection existante de mouvement.

Ne pas créer une architecture comptable complexe.

Mais il doit être possible de distinguer une demande en attente du stock réellement disponible.

## 10.4 Schéma recommandé si nécessaire

Si aucune structure adaptée n’existe, ajouter des champs minimaux à `Stock` ou créer un modèle cohérent selon l’architecture existante :

```ts
{
  tenantId: ObjectId;
  anneeId: ObjectId;
  shopId: ObjectId;
  agentId: ObjectId;
  products: [
    {
      product: ObjectId;
      qte: number;
    }
  ];
  type: "SUPPLY_REQUEST" | "SUPPLY" | "ADJUSTMENT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reference: string;
  designation?: string;
  description?: string;
}
```

Ne pas incrémenter le stock actif à la création d’une demande.

Le tenant validera l’approvisionnement dans un sprint ou workflow dédié.

## 10.5 Métriques

Afficher :

* nombre de produits disponibles ;
* quantité totale en stock ;
* demandes en attente ;
* demandes approuvées ;
* produits en rupture ;
* produits à stock faible.

Le seuil de stock faible doit utiliser une règle existante.

Ne pas inventer une valeur arbitraire globale si aucun seuil n’existe.

## 10.6 Drawer de création

Le vendeur recherche les produits par :

* code ;
* désignation.

Il ajoute :

* produit ;
* quantité demandée.

Permettre plusieurs produits dans une demande.

Afficher un résumé avant validation.

À la validation :

1. vérifier la session ;
2. vérifier la boutique ;
3. vérifier l’exercice ;
4. vérifier chaque produit ;
5. générer une référence ;
6. créer une demande `PENDING` ;
7. émettre Pusher.

## 10.7 Suppression

Le vendeur peut supprimer ou annuler uniquement une demande :

* qu’il a créée ;
* appartenant à sa boutique ;
* encore en statut `PENDING`.

Une demande approuvée ou rejetée ne doit pas être supprimée.

## 10.8 Pusher stock

Canal :

```text
private-tenant-{tenantId}-stocks
```

Événement :

```text
stock.requested
```

Payload :

```ts
{
  id,
  reference,
  storeId,
  salerId,
  productCount,
  status,
  createdAt
}
```

---

# 11. PAGE `/clients`

## 11.1 Objectif

Permettre au vendeur de consulter et gérer les clients du tenant, avec :

* liste paginée ;
* recherche ;
* filtres ;
* métriques ;
* historique des commandes ;
* gestion des promotions associées ;
* fiche client détaillée.

Le vendeur ne doit pas voir les clients d’un autre tenant.

## 11.2 Schéma Customer

Le client doit être lié au tenant.

Vérifier ou ajouter :

```ts
tenantId: Types.ObjectId;
```

La structure attendue est :

```ts
{
  tenantId;
  name;
  phone;
  email?;
  matricule;
  promotions?: ObjectId[];
}
```

Ajouter les index utiles :

```ts
CustomerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ tenantId: 1, matricule: 1 }, { unique: true });
CustomerSchema.index({ tenantId: 1, name: 1 });
```

## 11.3 Métriques

Afficher au minimum :

* nombre total de clients ;
* nouveaux clients de l’exercice ;
* clients ayant commandé ;
* clients sans commande ;
* meilleur client par chiffre d’affaires ;
* montant moyen par client.

Respecter les devises.

## 11.4 Cartes clients

Chaque carte doit afficher :

* nom ;
* téléphone ;
* e-mail ;
* matricule ;
* nombre de commandes ;
* chiffre d’affaires cumulé ;
* dernière commande ;
* promotions associées ;
* boutique de dernière activité si pertinente.

Actions :

* voir les commandes ;
* voir le détail ;
* associer une promotion ;
* retirer une promotion ;
* modifier les informations ;
* créer une nouvelle vente pour ce client si cela s’intègre sans dépasser le sprint.

## 11.5 Drawer de détail

Cliquer sur une carte ouvre un drawer.

Sections :

### Informations

* nom ;
* téléphone ;
* e-mail ;
* matricule ;
* date de création.

### Historique des commandes

Afficher les commandes paginées ou limitées :

* référence ;
* date ;
* boutique ;
* montant ;
* devise ;
* statut ;
* facture.

Utiliser une agrégation.

Ne pas effectuer une requête par commande.

### Promotions

Afficher :

* promotions associées ;
* réduction ;
* code ;
* statut ;
* action de retrait.

## 11.6 Association d’une promotion

Le vendeur peut rechercher les promotions du tenant.

Filtrer :

* promotions actives ;
* promotions appartenant au tenant ;
* promotions non déjà associées ;
* promotions encore valides si des dates existent.

Permettre :

* sélection ;
* association ;
* retrait.

Ne jamais associer une promotion d’un autre tenant.

## 11.7 Application de la promotion à la facture

Lors de la création d’une commande :

1. récupérer les promotions du client côté serveur ;
2. vérifier leur validité ;
3. appliquer la règle autorisée ;
4. recalculer la réduction ;
5. figer la promotion utilisée dans la commande.

La commande doit conserver un snapshot minimal :

```ts
promotion?: {
  promotionId: ObjectId;
  designation: string;
  code: string;
  reduction: number;
  discountAmount: number;
}
```

Ne pas recalculer une ancienne facture si la promotion est modifiée plus tard.

## 11.8 Règle en cas de plusieurs promotions

Ne pas cumuler plusieurs promotions sans règle métier explicite.

En l’absence de règle existante :

* sélectionner une seule promotion ;
* proposer la plus avantageuse ;
* permettre au vendeur de confirmer celle appliquée ;
* recalculer et vérifier côté serveur.

Signaler cette hypothèse dans le rapport final.

---

# 12. CRUD ET STATUTS

## Commandes

Privilégier :

* création ;
* lecture ;
* modification avant validation seulement ;
* annulation après validation ;
* suppression uniquement des brouillons si les brouillons existent.

## Dépenses

Privilégier :

* création ;
* lecture ;
* modification avant validation ;
* annulation ou suppression selon statut.

## Stocks

Permettre :

* création de demande ;
* lecture ;
* annulation d’une demande en attente.

## Clients

Permettre :

* création ;
* lecture ;
* modification ;
* association de promotions.

Ne pas supprimer un client ayant des commandes.

Privilégier archivage ou statut inactif si le modèle le permet.

---

# 13. REQUÊTES MONGOOSE ET PERFORMANCE

Utiliser :

* `.lean()` ;
* `.select()` ;
* `aggregate()` ;
* `$match` en première étape ;
* `$facet` pour pagination et total ;
* `$lookup` ciblé ;
* `$unwind` uniquement si nécessaire ;
* `$group` pour les métriques ;
* `$project` pour réduire les données ;
* index composés.

Éviter :

* les requêtes N+1 ;
* les `populate()` non limités ;
* les boucles de requêtes ;
* le chargement complet des historiques ;
* les regex non sécurisées ;
* les agrégations sans `tenantId` et `storeId`.

Créer une fonction d’échappement pour les recherches regex si elle n’existe pas.

## Index recommandés

Adapter selon les schémas réels.

### Commande

```ts
CommandeSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
CommandeSchema.index({ tenantId: 1, clientId: 1, createdAt: -1 });
CommandeSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
CommandeSchema.index({ tenantId: 1, agentId: 1, createdAt: -1 });
```

### Depense

```ts
DepenseSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
DepenseSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
DepenseSchema.index({ tenantId: 1, agentId: 1, createdAt: -1 });
```

### Stock

```ts
StockSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, status: 1 });
StockSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
StockSchema.index({ tenantId: 1, agentId: 1, createdAt: -1 });
```

### Customer

```ts
CustomerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ tenantId: 1, matricule: 1 }, { unique: true });
```

---

# 14. SERVEUR ET CLIENT

## Server Components

Ils doivent :

* vérifier la session ;
* récupérer la boutique ;
* récupérer l’exercice actif ;
* charger les métriques ;
* charger les données paginées ;
* sérialiser les résultats ;
* transmettre les données initiales.

## Server Actions

Elles doivent :

* vérifier la session ;
* vérifier le rôle ;
* vérifier le tenant ;
* vérifier la boutique ;
* vérifier l’exercice ;
* valider les entrées ;
* recalculer les montants ;
* persister ;
* revalider les pages ;
* émettre Pusher après persistance.

## Client Components

Ils doivent gérer :

* drawer ;
* étapes ;
* recherche dynamique ;
* sélection client ;
* sélection produit ;
* état local des lignes ;
* aperçu de facture ;
* affichage des résultats ;
* interactions de pagination et filtres.

Ne jamais appeler Mongoose depuis un Client Component.

---

# 15. RÉSULTATS D’ACTIONS

Créer ou réutiliser un type commun :

```ts
type ActionResult<T> =
  | {
      success: true;
      message: string;
      data: T;
    }
  | {
      success: false;
      message: string;
      errors?: Record<string, string>;
    };
```

Ne jamais retourner directement un document Mongoose.

Convertir :

* ObjectId en chaîne ;
* Date en ISO ;
* Decimal en valeur sérialisable.

---

# 16. RÉFÉRENCES

Générer des références uniques et lisibles.

Exemples :

```text
CMD-2026-XXXXXX
DEP-2026-XXXXXX
STK-2026-XXXXXX
CLI-XXXXXXXX
```

Respecter les conventions existantes.

Utiliser `uuid` ou `crypto.randomBytes` selon l’utilitaire déjà présent.

L’unicité doit être vérifiée dans le périmètre du tenant.

---

# 17. UX MOBILE ET TERRAIN

La plateforme est destinée à des vendeurs pouvant travailler principalement avec un téléphone.

Les formulaires doivent :

* avoir des champs suffisamment grands ;
* limiter la saisie inutile ;
* afficher les prix et quantités clairement ;
* conserver l’état lors d’un changement d’étape ;
* permettre la correction d’une ligne ;
* afficher un résumé avant validation ;
* prévenir les doubles clics ;
* désactiver le bouton pendant l’enregistrement ;
* afficher les erreurs près des champs ;
* fonctionner sur petits écrans.

Les drawers doivent utiliser toute la largeur disponible sur mobile.

Le tableau de facture doit devenir une liste lisible sur petit écran si nécessaire.

---

# 18. ÉTATS VIDES

## Commandes

```text
Aucune vente n’a encore été enregistrée pour cette boutique.
Créez une vente pour commencer le suivi des recettes.
```

## Dépenses

```text
Aucune dépense n’a encore été enregistrée.
Ajoutez une dépense pour garder une vue fiable sur les sorties de caisse.
```

## Stocks

```text
Aucune demande d’approvisionnement n’a encore été créée.
Créez une demande lorsque la boutique doit recevoir de nouvelles marchandises.
```

## Clients

```text
Aucun client n’est encore enregistré.
Les clients créés pendant une vente apparaîtront également ici.
```

Ne pas utiliser d’emoji.

---

# 19. NAVIGATION DU VENDEUR

Adapter la sidebar du vendeur avec :

* Espace de travail ;
* Ventes ;
* Dépenses ;
* Stocks ;
* Clients ;
* Profil.

Les liens dynamiques doivent utiliser le slug de sa boutique :

```text
/commandes/{slug}
/payments/{slug}
/stocks/{slug}
/clients
```

Ne jamais permettre au vendeur de choisir arbitrairement une autre boutique.

---

# 20. ORDRE D’IMPLÉMENTATION

Procéder dans cet ordre :

1. analyser l’existant ;
2. vérifier le contrôle de session vendeur ;
3. vérifier l’exercice actif ;
4. adapter les schémas et index ;
5. ajouter `tenantId` aux modèles qui en ont besoin ;
6. adapter la structure historique des lignes de commande ;
7. créer ou réutiliser `CustomerSearch` ;
8. créer ou réutiliser la recherche produit ;
9. implémenter `/commandes/[slug]` ;
10. implémenter la génération PDF ;
11. intégrer Pusher pour les commandes ;
12. implémenter `/payments/[slug]` ;
13. intégrer Pusher pour les dépenses ;
14. implémenter `/stocks/[slug]` ;
15. intégrer Pusher pour les stocks ;
16. implémenter `/clients` ;
17. intégrer les promotions dans les commandes ;
18. adapter la navigation vendeur ;
19. produire le rapport final.

Ne pas créer des abstractions lourdes avant d’avoir identifié les besoins communs.

---

# 21. CRITÈRES DE VALIDATION

## Commandes

* le vendeur ne travaille que dans sa boutique ;
* un exercice actif est obligatoire ;
* le client est recherché par téléphone ;
* un client absent peut être créé ;
* les produits sont recherchés par code ou désignation ;
* les quantités sont validées ;
* le stock est vérifié côté serveur ;
* les prix sont figés ;
* les promotions sont appliquées côté serveur ;
* la commande et le stock sont mis à jour atomiquement ;
* une facture PDF est générée ;
* le tenant reçoit l’événement Pusher.

## Dépenses

* le vendeur ne voit que les dépenses autorisées ;
* un exercice actif est obligatoire ;
* les lignes sont validées ;
* le total est recalculé côté serveur ;
* la dépense est persistée ;
* le tenant reçoit l’événement Pusher.

## Stocks

* une demande créée par un vendeur est en attente ;
* le stock actif n’est pas incrémenté avant validation ;
* le vendeur peut annuler uniquement une demande en attente ;
* le tenant reçoit l’événement Pusher.

## Clients

* les clients sont isolés par tenant ;
* les commandes apparaissent dans le drawer ;
* les promotions peuvent être associées et retirées ;
* une promotion valide peut être appliquée à une facture ;
* l’historique ne change pas si la promotion est modifiée plus tard.

## Interface

* pages paginées ;
* métriques présentes ;
* drawers cohérents ;
* responsive ;
* états vides ;
* recherche et filtres ;
* z-index correct ;
* composants TailAdmin réutilisés ;
* aucune icône emoji.

---

# 22. RAPPORT FINAL OBLIGATOIRE

Ne lance ni build, ni lint, ni tests.

À la fin, fournir un rapport avec exactement les rubriques suivantes :

## 1. Résumé des travaux

Décrire les fonctionnalités réalisées.

## 2. Schémas modifiés

Lister les champs, snapshots financiers, statuts et index ajoutés ou adaptés.

## 3. Fichiers créés

Lister chaque fichier et sa responsabilité.

## 4. Fichiers modifiés

Lister chaque fichier et les changements apportés.

## 5. Éléments réutilisés

Lister les composants, actions, services, hooks, layouts, utilitaires PDF, Pusher et composants TailAdmin réutilisés.

## 6. Contrôle du vendeur

Expliquer la validation de session, de boutique, de tenant et d’exercice actif.

## 7. Page Commandes

Décrire le drawer en trois étapes, la création client, la recherche produit, les promotions, la persistance et la facture PDF.

## 8. Page Dépenses

Décrire le CRUD, les lignes, les métriques et l’événement Pusher.

## 9. Page Stocks

Décrire les demandes d’approvisionnement, les statuts et la séparation entre demande et stock disponible.

## 10. Page Clients

Décrire les cartes, l’historique des commandes et les promotions.

## 11. Temps réel Pusher

Lister les canaux, événements et payloads créés ou réutilisés.

## 12. Sécurité multi-tenant

Expliquer les filtres appliqués à chaque ressource.

## 13. Transactions et cohérence du stock

Expliquer comment les stocks négatifs et les ventes concurrentes sont évités.

## 14. Génération PDF

Décrire la facture, son stockage et les champs persistés.

## 15. Agrégations et performances

Lister les principales agrégations, index et optimisations.

## 16. Hypothèses métier

Signaler notamment :

* règle appliquée lorsque plusieurs promotions existent ;
* droits de modification des dépenses ;
* distinction demande de stock et stock disponible ;
* règle de devise d’une commande.

## 17. Variables d’environnement

Lister uniquement les noms nécessaires, sans afficher leurs valeurs.

## 18. Tests manuels à réaliser

Donner des scénarios ordonnés pour les quatre pages, incluant les cas d’erreur.

## 19. Limites et points à surveiller

Signaler les migrations, historiques existants, limites PDF, limites Pusher et décisions restantes.

## 20. Commandes non exécutées

Confirmer explicitement qu’aucun build, lint ou test n’a été lancé.
##########
non pas besoin de sender_id dans un envoi simple voici un exemple =>
const response = await fetch('https://api.coussema.com/v1/sms/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer VOTRE_CLE_API',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '243837509125',
    message: 'Votre code de vérification est 1234.'
  })
});

le test doit être en GET et non en POST et voici la reponse => {
  "success": false,
  "status": 400,
  "requestId": "d7d976e0-ca26-4ad5-a277-006cb2f38655",
  "error": "Invalid SenderId: ce Sender ID n’est pas autorisé pour cette organisation.",
  "data": {
    "error": "Invalid SenderId: ce Sender ID n’est pas autorisé pour cette organisation.",
    "code": "sender_id_missing",
    "requestId": "d7d976e0-ca26-4ad5-a277-006cb2f38655"
  }
}
###############################################################################
curl -X POST "http://localhost:3000/api/sms/test/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean Client",
    "phone": "243XXXXXXXXX",
    "promotionCode": "PROMO-VIP"
  }'
  ##############################################
  regarde le travail que tu as fait l'app est mort: 
✓ Starting...
✓ Ready in 1558ms
○ Compiling /signin ...
🔹 [MongoDB] Nouvelle connexion établie avec succès.
(node:8088) [MONGOOSE] Warning: mongoose: Duplicate schema index on {"email":1} for model "User". This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8088) [MONGOOSE] Warning: mongoose: Duplicate schema index on {"telephone":1} for model "User". This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
 GET /signin 307 in 53s (compile: 29.0s, render: 23.6s)
 GET / 307 in 17.2s (compile: 2.3s, render: 14.8s)
 GET /signin 307 in 999ms (compile: 6ms, render: 993ms)
 GET / 307 in 1781ms (compile: 21ms, render: 1760ms)
 GET /signin 307 in 1029ms (compile: 5ms, render: 1025ms)
 GET / 307 in 2.4s (compile: 12ms, render: 2.4s)
 GET /signin 307 in 2.0s (compile: 5ms, render: 2.0s)
 GET / 307 in 1568ms (compile: 14ms, render: 1554ms)
 GET /signin 307 in 1285ms (compile: 7ms, render: 1278ms)
 GET / 307 in 1992ms (compile: 13ms, render: 1978ms)
 GET /signin 307 in 2.6s (compile: 6ms, render: 2.6s)
 GET / 307 in 2.0s (compile: 13ms, render: 1989ms)
 GET /signin 307 in 1328ms (compile: 4ms, render: 1325ms)
 GET / 307 in 3.0s (compile: 11ms, render: 2.9s)
 GET /signin 307 in 1374ms (compile: 4ms, render: 1370ms)
 GET / 307 in 10.4s (compile: 12ms, render: 10.4s)
 GET /signin 307 in 2.3s (compile: 4ms, render: 2.3s)
 GET / 307 in 2.3s (compile: 17ms, render: 2.3s)
 GET /signin 307 in 1770ms (compile: 5ms, render: 1765ms)
 GET / 307 in 3.3s (compile: 18ms, render: 3.3s)
 GET / 307 in 1702ms (compile: 25ms, render: 1676ms)
 GET /signin 307 in 1039ms (compile: 4ms, render: 1035ms)
 GET / 307 in 2.3s (compile: 15ms, render: 2.3s)
 GET /signin 307 in 2.3s (compile: 4ms, render: 2.3s)
 GET / 307 in 1576ms (compile: 18ms, render: 1558ms)
 GET /signin 307 in 3.7s (compile: 4ms, render: 3.7s)
 GET / 307 in 1240ms (compile: 13ms, render: 1226ms)
 GET /signin 307 in 953ms (compile: 5ms, render: 948ms)
 GET / 307 in 1468ms (compile: 13ms, render: 1455ms)
 GET /signin 307 in 982ms (compile: 4ms, render: 978ms)
 GET / 307 in 1797ms (compile: 11ms, render: 1786ms)
 GET /signin 307 in 1121ms (compile: 4ms, render: 1117ms)
 GET / 307 in 2.3s (compile: 12ms, render: 2.3s)
 GET /signin 307 in 1328ms (compile: 4ms, render: 1325ms)
 GET / 307 in 1530ms (compile: 11ms, render: 1519ms)
 GET /signin 307 in 945ms (compile: 4ms, render: 941ms)



##############################
mais toutes les pages du vendeur reviennet
  systématiquent sur la page racine qu'est ce qui se
  passe, regle se problème, car je dois finir le developpeent de l'application dans 15minutes:
 POST /signin 200 in 3.7s (compile: 5ms, render: 3.7s) GET / 200 in 1361ms (compile: 13ms, render: 1348ms)
 GET / 200 in 1273ms (compile: 12ms, render: 1261ms)
 GET /stocks/2024-2025 200 in 2.0s (compile: 41ms, render: 1971ms)
 GET / 200 in 2.6s (compile: 18ms, render: 2.6s)
 GET / 200 in 944ms (compile: 12ms, render: 932ms)
 GET /depenses/2024-2025 200 in 3.9s (compile: 2.3s, render: 1608ms)
 GET / 200 in 940ms (compile: 17ms, render: 923ms)
 GET / 200 in 3.8s (compile: 30ms, render: 3.8s)
 GET /commandes/2025-2026 200 in 4.0s (compile: 2.8s, render: 1111ms)
 GET / 200 in 1386ms (compile: 26ms, render: 1360ms)
 GET / 200 in 1434ms (compile: 22ms, render: 1413ms)
 GET / 200 in 3.1s (compile: 14ms, render: 3.1s)
 GET / 200 in 1257ms (compile: 16ms, render: 1241ms)
⚠ Cross origin request detected from 172.20.10.2 to /_next/* resource. In a future major version of Next.js, you will need to explicitly configure "allowedDevOrigins" in next.config to allow this.
Read more: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 POST / 200 in 513ms (compile: 15ms, render: 498ms)
 GET /agents 200 in 1717ms (compile: 727ms, render: 990ms)
