# Équipes IA — livraison des packs

## Organisation

Trois équipes sont actives pour cette livraison, sous coordination de l'agent principal. Les fichiers sont partagés ; chaque équipe annonce sa portée et communique ses changements de contrat avant de modifier un fichier possédé par une autre équipe.

| Équipe | Responsabilités | Livrable attendu |
| --- | --- | --- |
| Orchestrateur | Contrôle des autres équipes, build, tests, audit de sécurité et qualité, cohérence logique et mathématique | Verdict de validation étayé, blocages identifiés avant fusion vers main |
| front-dev | Pages publiques, packs, CTA, inscription et choix de formule | Parcours public cohérent avec le catalogue et DESIGN-SYSTEM.md |
| back-dev | Espace authentifié, paiement, droits, upgrade et dépenses | Autorisations côté serveur, facturation vérifiable, historique et tests métier |

## Contrat produit

- Starter : 50 USD ; Business : 120 USD ; Premium : 200 USD.
- Dans l'architecture actuelle, tarif par exercice comptable calendaire ; l'échéance doit être visible avant paiement. Aucun renouvellement tacite ou douze mois glissants à promettre.
- Codes promo et parrainage restent dans le parcours existant.
- Upgrade uniquement vers une formule supérieure, avec prix calculé côté serveur et activation après confirmation fournisseur.
- Une interface cachée ou désactivée ne remplace pas une autorisation serveur.
- DESIGN-SYSTEM.md reste la référence de design ; aucun téléchargement de Google Fonts nécessaire.
- Les fonctions IA restent annoncées comme à venir tant que le fournisseur, le budget et le parcours réel ne sont pas implémentés.

## Contrôles avant intégration

L'orchestrateur vérifie les résultats réels du typage, du build, du lint et des tests. Les erreurs préexistantes doivent être distinguées des régressions ; les règles de lint ne sont pas désactivées pour obtenir artificiellement un résultat vert.

La revue métier inclut les devises, les arrondis, les dates d'échéance, le prorata, les répétitions et appels concurrents, les montants reçus par le fournisseur, les permissions des tenants et vendeurs, et les voies d'activation gratuite contournant le paiement.

Les endpoints de test ne doivent pas permettre d'effacer ou de fabriquer des données commerciales en production. Aucun endpoint de seed ni aucun paiement réel ne doit être exécuté pour valider cette livraison.

Le score financier ne peut pas être évalué comme fonction opérationnelle avant que les règles métier, les données requises et leur validation ne soient définies. Le LLM expliquera des calculs déterministes versionnés ; il ne sera pas la source des montants.
