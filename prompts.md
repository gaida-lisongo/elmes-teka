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