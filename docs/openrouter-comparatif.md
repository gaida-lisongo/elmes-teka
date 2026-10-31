# Choix OpenRouter pour ELMES-TEKA

Recherche du 31 octobre 2026. Recommandations pour le chatbot Premium et les explications de gestion. Il s'agit d'une présélection documentée ; aucun test payant ni aucune évaluation sur données clients n'a été exécuté.

## Méthode

Comparer des versions précises, leurs tarifs d'entrée et sortie, leurs capacités d'outils/JSON, et le coût mesuré d'une tâche plutôt que le seul prix d'un token. Artificial Analysis a changé son Intelligence Index en v5 le 27 octobre 2026 : ne pas comparer directement ces scores aux anciens scores v4.1.

Les tarifs retenus proviennent de l'API publique OpenRouter `/api/v1/models`, consultée pendant cette livraison. Certaines cartes web donnent des minima différents : par exemple la carte DeepSeek affiche un minimum beaucoup plus faible que les 0,15/0,60 USD de l'API au moment de la consultation. La décision de production doit reprendre les prix du fournisseur effectivement choisi et ses paliers ; un minimum publicitaire n'est pas une garantie de facturation.

Sources : [catalogue API OpenRouter](https://openrouter.ai/api/v1/models), [méthode AA v5](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5), [classement AA](https://artificialanalysis.ai/leaderboards/models).

## Trois compromis retenus

USD par million de tokens, hors cache, taxes, frais de crédit, outils payants et éventuels paliers.

| Modèle et identifiant OpenRouter | Entrée | Sortie | Intelligence AA v5 | Positionnement proposé |
| --- | ---: | ---: | --- | --- |
| GLM 5.3 Flash — `z-ai/glm-5.3-flash` | 0,0163 | 0,1479 | 28 | Candidat au coût unitaire le plus bas pour synthèses, classification et réponses courantes |
| GPT-6 Luna — `openai/gpt-6-luna` | 0,10 | 0,50 | 28 en mode max | Candidat principal équilibré et fournisseur alternatif ; AA mesure environ 0,15 USD par tâche d'indice |
| DeepSeek V4.1 Flash 1017 — `deepseek/deepseek-v4.1-flash-1017` | 0,15 | 0,60 | 32 en mode max | Candidat pour analyses plus complexes, recommandations et rédaction du dossier |

Les modes de raisonnement sont importants : le score max n'est pas celui d'une requête sans raisonnement ou en low. D'après l'API consultée, GLM exige du raisonnement, alors que les deux autres permettent de le désactiver. Le classement AA donne environ 0,58 USD/tâche pour GLM et 0,60 pour DeepSeek, contre 0,15 pour Luna : le modèle au token le moins cher n'est donc pas nécessairement le moins cher par résultat.

Sources qualité et fonctionnalités : [GLM sur OpenRouter](https://openrouter.ai/z-ai/glm-5.3-flash), [GLM sur AA](https://artificialanalysis.ai/models/glm-5-3-flash), [Luna sur OpenRouter](https://openrouter.ai/openai/gpt-6-luna), [Luna sur AA](https://artificialanalysis.ai/models/gpt-6-luna/), [DeepSeek 1017 sur OpenRouter](https://openrouter.ai/deepseek/deepseek-v4.1-flash-1017), [DeepSeek 1017 sur AA](https://artificialanalysis.ai/models/deepseek-v4-1-flash-1017).

Ces trois modèles sont des candidats pratiques parmi les modèles examinés, pas une preuve d'optimalité sur tous les modèles disponibles. MiMo-V2.6-Flash (API : 0,14/0,28 USD ; AA environ 27) et Gemini 3.8 Flash (API : 0,825/4,125 USD ; AA environ 31 en high) ont aussi été examinés. Le premier est proche des options retenues ; le second revient sensiblement plus cher pour cette cible tarifaire. Les benchmarks généraux ne démontrent ni qualité en français commercial congolais, ni aptitude à décider d'un crédit.

## Recommandation de départ

Commencer l'évaluation avec **GPT-6 Luna comme référence**, GLM comme concurrent économique et DeepSeek 1017 comme concurrent orienté analyse. Ne pas activer un remplacement silencieux entre modèles de capacités différentes avant validation. Après essai, choisir un modèle principal et un secours ayant satisfait les mêmes critères.

Construire un jeu de 30 à 50 cas synthétiques ou anonymisés : promotions compatibles avec la marge, rupture de stock, boutiques comparées sur périodes comparables, USD/CDF séparés, données de charges incomplètes, dettes déjà engagées, refus de fournir un montant certain sans données suffisantes. Inclure des tentatives de lecture d'un autre tenant et des instructions malveillantes dans les libellés produits.

Mesurer : exactitude des chiffres déjà calculés par le serveur, références à la période et aux sources, respect du JSON/outils, qualité du français, taux d'informations inventées, latence, coût total y compris raisonnement et retries. Le critère de choix principal est le coût par réponse correcte répondant au besoin métier.

## Simulation de budget

Pour 200 demandes par tenant et par mois, chacune de 2 000 tokens entrants et 500 tokens sortants facturés :

| Modèle | Coût illustratif mensuel |
| --- | ---: |
| GLM | 0,02131 USD |
| Luna | 0,09 USD |
| DeepSeek | 0,12 USD hors pointe ; environ 0,24 USD si tarifs doublés |

Formule : `demandes × (tokensEntrée × prixEntrée + tokensSortie × prixSortie) / 1 000 000`.

Ce sont des simulations de tokens, pas des prévisions de facture. Si les 500 tokens désignent uniquement la réponse visible, il faut ajouter les tokens de raisonnement, les historiques renvoyés, les outils et les reprises. GLM exigeant du raisonnement, cette hypothèse est particulièrement importante. DeepSeek expose des plages horaires doublant certains prix ; Luna expose un palier pour les très grands prompts. Les quotas devront contrôler le coût effectivement enregistré, pas uniquement le nombre de messages.

Premium à 200 USD/an représente environ 16,67 USD/mois brut avant autres coûts. Une enveloppe IA initiale de 1 USD/mois/tenant peut être évaluée comme hypothèse de pilotage, sans la présenter comme quota commercial définitivement validé. Prévoir une limite globale de la clé et une limite par tenant.

## Configuration à préparer après choix

Aucune clé n'est ajoutée et aucun modèle n'est activé par ce document.

```dotenv
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-6-luna
OPENROUTER_API_KEY=<secret serveur à configurer>
```

Côté application :

1. Vérifier session, tenant et Premium actif à chaque demande.
2. Fixer l'URL OpenRouter côté serveur ; ne jamais la recevoir du navigateur.
3. Fournir uniquement des agrégats autorisés et un contexte borné. Conserver outils en lecture seule initialement.
4. Régler raisonnement et plafond de tokens explicitement par tâche ; vérifier le support réel du fournisseur avec `require_parameters`.
5. Exiger les politiques de données adaptées, par exemple `data_collection: "deny"` et ZDR si disponible ; si aucun fournisseur ne satisfait ces règles, expliquer l'indisponibilité plutôt que les relâcher silencieusement.
6. Définir timeout, limitation de débit, coût maximum par appel et par mois, et conservation/suppression de l'historique.
7. Journaliser modèle et fournisseur effectifs, usage et coût, sans secrets ni contenu financier brut dans les logs techniques.
8. Le serveur calcule les indicateurs et les scénarios de remboursement ; le modèle explique et rédige. Le tenant valide le dossier avant transmission.

Références : [routage et contraintes fournisseur](https://openrouter.ai/docs/guides/routing/provider-selection), [documentation OpenRouter](https://openrouter.ai/docs).
