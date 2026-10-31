# Validation des packs — équipe Orchestrateur

Date : 31 octobre 2026. Environnement de vérification : Node.js 24.19.0, Next.js 16.4.3. Revue coordonnée avec les équipes front-dev et back-dev ; aucune fusion, aucun déploiement et aucun paiement réel effectués par l'Orchestrateur.

## Verdict

**Build, typage et 17 tests réels réussis. Changements prêts pour revue sur la branche de travail ; pas de fusion automatique dans main.** Le lint global reste rouge et la recette fonctionnelle avec MongoDB/FlexPay n'a pas été exécutée. Cette vérification ciblée n'est ni un audit de sécurité exhaustif ni une validation d'un modèle de crédit.

## Commandes et résultats

| Vérification | Commande | Résultat |
|---|---|---|
| Production | `npm run build` | Réussite, compilation, typage et génération des routes. |
| Typage séparé | `npx tsc --noEmit` | Réussite. |
| Tests métier et sécurité | `npm test` | 17 cas, 17 réussis, 0 échec. |
| Lint global | `npm run lint -- --format json` | 186 erreurs et 29 avertissements ; règle conservées actives. |
| Audit dépendances production | `npm audit --omit=dev --json --cache /tmp/elmes-npm-cache` | 5 alertes : 0 critique, 1 élevée, 4 modérées. |
| Smoke HTTP production hors base | Script local `work/smoke-http.py` | 5/5 assertions réussies ; serveur temporaire arrêté. |
| Intégrité du diff | `git diff --check` | Réussite. |

Le lint de départ comptait 272 erreurs et 30 avertissements. Le résultat final représente 86 erreurs supprimées et un avertissement supprimé, sans désactiver les règles. Les 186 erreurs restantes se répartissent en 157 `no-explicit-any`, 19 apostrophes JSX non échappées, 7 `set-state-in-effect` et 3 appels impurs pendant le rendu. Elles concernent notamment des écrans et utilitaires historiques et empêchent d'annoncer une qualité globale verte.

Le script `npm test` utilise `node --test --test-isolation=none tests/payments/*.test.mjs tests/security/*.test.mjs`. Dans cet environnement, les processus Node enfants perdaient leurs sorties ; le runner par défaut ne montrait que des noms de fichiers. L'exécution sans isolation a révélé un véritable échec Excel, ensuite corrigé dans le harnais de test : le passage entre contextes VM cassait les contrôles `instanceof Array` d'ExcelJS. Les assertions métier ont été conservées. Le résultat 17/17 provient bien de l'exécution des assertions, pas seulement du chargement des fichiers. La commande a été validée sous Node 24 ; vérifier le support du drapeau si une autre version est utilisée en CI.

Les scripts npm exécutent les mêmes opérations applicatives que les scripts pnpm. Le client pnpm de l'environnement avait un problème de cache SQLite dans son chemin par défaut. Le lockfile pnpm a néanmoins été régénéré avec le client direct et des caches temporaires, sans désactiver sa vérification de chaîne d'approvisionnement.

## Build, design et polices

- Suppression des imports `next/font/google` et du téléchargement de Poppins/Outfit.
- Utilisation de la pile du `DESIGN-SYSTEM.md` : DejaVu Sans, Outfit si disponible localement, puis polices système. Aucune nouvelle police téléchargée ou ajoutée.
- Le script de build utilise Webpack, déjà configuré dans le projet. Turbopack échouait dans le sandbox lorsque PostCSS essayait d'ouvrir un port local.
- `experimental.useTypeScriptCli=false` active le contrôle via l'API TypeScript ; `workerThreads=true` évite les sous-processus défaillants. Le typage reste contrôlé, sans `ignoreBuildErrors`. Deux workers limitent l'utilisation des ressources.
- Le layout public est dynamique : les promotions sont chargées à la requête, sans dépendance à MongoDB pendant le build. Cela remplace le pré-rendu des pages publiques avec rafraîchissement de 300 secondes : davantage de rendu serveur à prévoir. Les codes promo restent présents et aucune donnée fictive n'a remplacé les données réelles.
- L'avertissement Next.js sur la convention historique `middleware` demeure ; il ne bloque pas le build.

## Contrôles de sécurité et de logique

Corrections vérifiées par revue et tests ciblés :

- Catalogue partagé Starter 50 USD, Business 120 USD, Premium 200 USD ; validation stricte des noms de packs.
- Prorata déterministe au centime, périodes invalides/futures/expirées et downgrade refusés ; année bissextile couverte.
- Devis d'upgrade signé, lié au tenant, exercice, formule source, cible, montant et dates ; expiration de dix minutes. Un prix modifié côté client n'accorde aucun droit.
- Confirmation de paiement liée à la référence et à l'ordre vérifiés côté prestataire ; replay idempotent, état atomique relu avant d'annoncer l'activation, conservation des demandes précédentes. En cas de résultat réseau ambigu, aucune nouvelle tentative automatique susceptible de débiter deux fois.
- Créations de boutiques sérialisées dans une transaction MongoDB pour empêcher le contournement simultané de la limite Starter ; dépend d'une topologie MongoDB compatible transactions.
- Suppression du chemin agent permettant de créer directement un exercice ACTIVE/PAID gratuitement ; contrôles de propriété et d'abonnement appliqués aux chemins concernés.
- Les outils `/api/agent/seed` et `/api/agent/setup` sont interdits en production, même avec une clé. Hors production ils nécessitent un environnement development/test, `AGENT_TOOLS_ENABLED=true` et la clé agent. Ces endpoints n'ont pas été exécutés pendant la validation.
- Les sessions rejettent les signatures modifiées, segments supplémentaires, rôles inconnus et horodatages absents/invalides. Une clé agent Unicode incorrecte ne provoque plus d'exception de comparaison cryptographique.
- Chaque mutation tenant revérifie en base l'utilisateur actif et la relation entre le tenant et l'utilisateur de session ; un ancien jeton d'utilisateur suspendu ne suffit plus.
- Les dates d'exercices déjà payés ou avec paiement en cours ne peuvent pas être déplacées pour prolonger gratuitement les droits ; suppression d'un exercice payé ou contenant des données refusée.
- Exports financiers contrôlés côté serveur ; recettes nettes après remise, entreprise correcte et séparation USD/CDF couvertes. PDF adapté à l'API pdfmake 0.3 ; génération locale minimale vérifiée par back-dev, sans chargement distant de ressources.

Les charges disposent de catégories et d'une nature fixe/variable. Cela ne suffit pas à calculer une capacité de remboursement : dates de paiement, dettes, échéanciers, marges et prélèvements doivent encore être complétés. Aucun score économique arbitraire, montant de crédit automatique ou décision d'institution financière n'est activé. Un solde de gestion ne constitue pas une capacité de remboursement.

## Dépendances et alertes restantes

L'audit initial du lockfile production signalait **25 alertes : 2 critiques, 20 élevées et 3 modérées**. Le runtime contenait déjà Next 16.4.3 tandis que le lockfile npm contenait 16.1.6 ; les versions reproductibles ont été alignées.

Corrections :

- Minimum Next 16.4.3 et configuration ESLint correspondante.
- Nodemailer 10.3.1 ; l'API SMTP `createTransport` utilisée reste compatible, typage et build réussis. Aucun e-mail réel envoyé.
- PostCSS 8.5.32 et mises à jour compatibles de Browserslist/brace-expansion.
- Sharp 0.35.5 via la dépendance native prévue par Next 16.4.3 ; aucun override incompatible de Sharp.
- Retrait de Swiper, inutilisé dans les composants et imports, ainsi que de ses styles orphelins.
- `package-lock.json` et `pnpm-lock.yaml` synchronisés ; aucune commande `audit fix --force` utilisée.

Il reste cinq alertes dans la chaîne **ExcelJS → archiver/readdir-glob/minimatch/uuid** : une élevée sur minimatch et quatre modérées sur les packages concernés. L'outil propose un retour à ExcelJS 3.4.0, qui n'est pas appliqué : ce n'est pas une mise à jour compatible du module d'export existant. Le flux de l'application génère des archives Excel côté serveur avec des chemins internes ; aucune fonctionnalité d'import XLSX ou de glob fourni par l'utilisateur n'a été trouvée dans ce périmètre. Cela réduit l'exposition aux vecteurs signalés sans faire disparaître les alertes. Le remplacement de la chaîne d'archivage mérite une tâche séparée et des tests de compatibilité des exports.

Autre risque économique hérité : la vérification `uses/maxUses` d'un code promo et l'incrément de ses utilisations après paiement ne constituent pas une réservation atomique. Sous concurrence, un quota de promotion peut être dépassé. Aucun mécanisme complexe de réservation de paiement différé n'a été ajouté dans cette livraison.

## Smoke HTTP sans accès à la base

Root a lancé temporairement le serveur de production, puis l'a arrêté après cinq contrôles réussis :

- `POST /api/agent/annees` → 403, aucune activation gratuite.
- `POST /api/agent/seed` → 404 en production.
- `POST /api/agent/setup` → 404 en production.
- `GET /annees` sans session → 307 vers `/signin`.
- `GET /signup?plan=BUSINESS` → 200 avec Business sélectionné dans le HTML serveur.

Résultats locaux : `work/smoke-http.json`. Aucun accès à la base, aucune écriture et aucun paiement pour ces contrôles. Ce smoke HTTP ne remplace pas une recette visuelle dans un navigateur ni les tests authentifiés avec données réelles de recette.

## Limites de la validation et conditions avant main

La base Atlas n'était pas joignable depuis les essais de pré-rendu de cet environnement. Le build final n'effectue pas d'accès MongoDB grâce au rendu public à la requête. Les tests métier utilisent des doubles contrôlés ; aucune fixture destructive n'a été appliquée à une base existante.

Restent à réaliser dans un environnement de recette isolé :

1. Tests MongoDB avec deux tenants, comptes suspendus, expiration et concurrence réelle de création de boutiques.
2. Paiements FlexPay de recette, confirmations/replays, échec, réponse réseau perdue et rapprochement par numéro d'ordre.
3. Vérification des codes promo, CDF avec taux valide/invalide et limites concurrentes de promotions.
4. Recette navigateur responsive et parcours complet choix du pack → inscription → activation → upgrade, ainsi que refus des accès Starter aux fonctions Business/Premium.
5. Traitement de la dette de lint globale avant d'exiger une CI entièrement verte, et suivi explicite des alertes ExcelJS résiduelles.

La revue technique peut avancer sur une branche ou une PR. **La fusion main et la mise en production ne sont pas validées par ce rapport tant que les critères de recette et de qualité convenus ne sont pas satisfaits.**
