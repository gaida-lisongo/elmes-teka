# Abonnements, charges et assistant Premium

## État de cette livraison

Starter 50 USD, Business 120 USD, Premium 200 USD par exercice comptable. Les exercices restent calendaires comme dans le code existant : ce n'est pas encore un abonnement glissant de douze mois. Les anciens exercices sans formule sont interprétés Starter. Aucun document de production n'a été migré.

Le catalogue est partagé entre le site et la souscription. Codes promo et parrainage sont conservés à la création et appliqués au tarif du pack. L'upgrade conserve la date de fin et facture en USD la différence des tarifs catalogue multipliée par la fraction restante de l'exercice. Les remises initiales ne sont pas reconduites sur cette différence. Exemple à mi-exercice : Starter → Business = 35 USD ; Starter → Premium = 75 USD. Pas de downgrade ni de remboursement dans cette livraison.

Le devis est calculé côté serveur, signé et lié au tenant, à l’exercice, au pack source et cible et à la période. Il fige le montant dix minutes ; toute modification ou expiration le rend inutilisable. Une seule demande d'upgrade en attente par exercice ; activation après vérification FlexPay côté serveur, partagée entre callback et vérification manuelle. L'ancienne formule reste active pendant le paiement. Une réponse réseau indéterminée conserve la demande en attente pour éviter un double débit. Le numéro de transaction reçu permet une vérification manuelle ; un callback vérifié peut aussi rapprocher l’ordre à la référence signée. Ne pas réinitialiser manuellement sans vérifier le fournisseur. Les anciennes demandes sont conservées dans upgradeHistory lorsque le tenant lance un nouveau changement ; les replays de callback ne réactivent ni ne créditent deux fois. Les dates des exercices payés sont immuables ; leur suppression est interdite.

Les exports existants nécessitent Business ou Premium actif, vérifié côté serveur. Le helper prévoit aussi un accès IA réservé au Premium. Créer une boutique supplémentaire nécessite Business/Premium actif. Les boutiques historiques restent consultables. La création utilise une transaction MongoDB et un verrou d’écriture tenant pour sérialiser les créations concurrentes, y compris via l’API agent. Cela nécessite MongoDB en replica set (par exemple Atlas), comme les transactions de vente déjà existantes ; aucun fallback non atomique n’est exécuté. La matrice centrale PLAN_FEATURES distingue exports avancés, multi-boutiques et IA ; les fonctions de base restent communes aux trois packs. Les données des boutiques historiques restent lisibles, y compris pour les anciens tenants multi-boutiques Starter. L’accès aux exports est une capacité du tenant avec un pack actif : un tenant Business/Premium courant peut exporter ses exercices historiques, même créés sous Starter. Les exercices expirés ou futurs ne permettent pas de nouvelles transactions vendeur. L’API agent ne peut plus créer d’exercice gratuitement payé.

L'assistant, le scoring et la génération IA du dossier ne sont pas encore implémentés. Le PDF financier existant reste un export de données, accessible Business/Premium. Les cartes publiques signalent explicitement les fonctions IA à venir.

## Charges : réutiliser Depense

Le module existant gère les dépenses par boutique, exercice et devise, avec lignes et statuts. Cette livraison ajoute catégorie (loyer, salaires, services, transport, taxes, autres) et nature fixe/variable dans le schéma, la saisie et la lecture serveur. Les anciennes lignes sont interprétées autres/variables à la lecture, sans migration.

Avant de calculer une capacité de remboursement, ajouter :

- date de dépense et date de paiement effectif, distinctes de la date de saisie ;
- fréquence, prochaine échéance et fin de récurrence ;
- justificatifs et rapprochement des sorties de caisse ;
- échéancier des dettes, intérêts, mensualités et remboursements déjà effectués ;
- coûts d'achat réellement imputés aux produits vendus, prélèvements du propriétaire et réserves de trésorerie.

Éviter de compter à la fois l'achat de stock et son coût dans la marge puis dans les charges. Séparer dépenses engagées et dépenses payées. Conserver USD et CDF séparés, ou enregistrer un taux daté lors d'une conversion. Les cartes des exercices et le PDF financier séparent désormais USD et CDF. Le PDF utilise l’entreprise issue du tenant authentifié et les opérations mensuelles de chaque devise, sans conversion implicite. Le solde des opérations enregistrées n’est ni un bénéfice net ni une capacité de remboursement.

## Connexion LLM : étapes à réaliser ensemble

1. **Choisir le fournisseur et le modèle.** OpenRouter simplifie le démarrage ; Ollama exige un serveur avec RAM/GPU et un modèle adapté. Avec le déploiement Vercel actuel, Ollama doit tourner sur un serveur accessible en HTTPS avec authentification ; localhost sur Vercel ne désigne pas votre ordinateur.
2. **Configurer les secrets serveur.** Prévoir `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL` et `OPENROUTER_API_KEY` ou un jeton d'accès au serveur Ollama. Aucune clé `NEXT_PUBLIC_`. Fixer l'URL dans la configuration serveur, jamais depuis une requête client.
3. **Créer l'accès serveur au chatbot.** Vérifier session tenant et Premium actif à chaque demande, limiter la taille de l'entrée, les requêtes, le nombre de tokens, le budget mensuel et le délai du fournisseur. Refuser proprement si le fournisseur n'est pas configuré.
4. **Construire le contexte métier.** Requêtes MongoDB prédéfinies filtrées par le tenant issu de la session, la période et les boutiques autorisées. Fournir des agrégats et la période couverte ; ne jamais transmettre mots de passe, secrets ou l'ensemble de la base. Les libellés produits et messages sont des données non fiables, jamais des instructions.
5. **Ajouter l'interface Premium.** Historique chargé côté serveur, saisie client, réponse du serveur, affichage de la période et des sources, état de chargement et reprise en cas d'échec. Les outils du modèle sont en lecture seule pour la première version.
6. **Personnaliser.** Stocker les objectifs, préférences, langue et résumés validés dans le profil du tenant. Limiter la conservation et permettre la suppression. Aucun entraînement par tenant nécessaire pour cette première version.
7. **Ajouter les calculs financiers.** Un moteur déterministe et versionné calcule trésorerie disponible, engagements et scénarios de remboursement. Les pondérations du score doivent être définies avec un partenaire financier et validées sur des données représentatives. Le LLM explique les résultats ; il ne décide pas seul des chiffres.
8. **Préparer le dossier.** Réutiliser le PDF existant, joindre résultats, hypothèses, données manquantes et justificatifs. Générer un brouillon vérifié par le tenant avant transmission. L'estimation interne n'est pas une décision de crédit de l'institution.
9. **Valider.** Tester isolation entre deux tenants, expiration/downgrade, quota, indisponibilité fournisseur, données incomplètes, injection dans les libellés et reproductibilité des calculs.

À 200 USD/an, le revenu brut est d'environ 16,67 USD/mois par tenant Premium. Définir le budget IA après hébergement, paiement et support ; éviter une promesse de consommation illimitée. Mesurer d'abord le coût réel de conversations et dossiers avant de fixer les quotas.

## Recette manuelle

- Créer chaque formule avec et sans promotion, vérifier le montant envoyé à FlexPay, tester aussi CDF avec TAUX configuré.
- Confirmer et rejouer un callback : une seule activation ; vérifier qu'un autre tenant ne peut pas consulter/payer l'exercice.
- Comparer le prix d'upgrade affiché et facturé, tester devis falsifié/expiré, période future/expirée, paiement échoué, réponse réseau indéterminée et demandes simultanées.
- Vérifier qu’un exercice payé ne peut pas être déplacé vers une autre année ni supprimé, et qu’un vendeur ne peut pas écrire dans un exercice expiré.
- Vérifier deux créations simultanées de boutiques Starter sur un replica set : une seule première boutique créée.
- Vérifier les exports Starter refusés, Business/Premium acceptés, expiration refusée.
- Saisir une charge fixe et variable, vérifier catégorie/nature après rechargement et lecture des anciennes lignes.

## Vérifications automatiques

`node --test --test-isolation=none tests/payments/*.test.mjs tests/security/*.test.mjs` vérifie catalogue, validation des packs, prorata, devis signés, isolation des paiements, refus de faux ordres et replays de callback. Les tests de callback exécutent le module réel avec une base simulée, sans connexion à MongoDB ni paiement réseau. `npx tsc --noEmit` vérifie le typage. Aucun paiement réel n’a été déclenché pendant ces vérifications.

## Résultat des vérifications

Les 17 cas de test de paiement, devis, exports financiers et sécurité passent avec `--test-isolation=none`. Le typage et le lint ciblé des nouveaux modules de paiement sont valides. Le PDF pdfmake 0.3 a aussi été généré localement avec succès, sans accès réseau ou fichiers arbitraires. Les résultats finaux de build et lint global sont tenus par l’équipe orchestrateur. Aucun paiement réel, écriture de données de production ni appel LLM n’a été déclenché par les tests de cette livraison. La recette fournisseur/MongoDB replica set reste nécessaire avant déploiement.
