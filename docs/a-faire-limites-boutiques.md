# À faire — limites de boutiques par formule

> Note du 1er novembre 2026, sur proposition d'un partenaire. **Rien n'est encore implémenté.**

## Décision à appliquer

| Formule  | Boutiques autorisées       |
|----------|----------------------------|
| Starter  | 1 (inchangé)               |
| Business | **3 maximum**              |
| Premium  | **Illimitées**             |

Aujourd'hui, Business et Premium autorisent tous deux un nombre illimité de boutiques.

## Ce qu'il faudra modifier

1. **Règle métier** — `src/lib/payments/plans.ts`
   - Ajouter la limite par formule à côté de `PLAN_FEATURES`, par exemple `maxStores: 1 | 3 | null` (`null` = illimité).
   - Mettre à jour les textes `features` de `PLANS` : « Jusqu'à 3 boutiques » (Business) et « Boutiques illimitées » (Premium).

2. **Contrôle à la création** — `src/lib/payments/store-access.ts` (`createStoreWithinPlan`)
   - Aujourd'hui, seule l'existence d'une boutique est testée (`Store.exists`) : il faudra compter les boutiques du tenant dans la transaction existante et comparer au `maxStores` de la formule active.
   - Garder la transaction et le verrou `storeCreationVersion`, qui empêchent de contourner la limite par des créations simultanées.
   - Message d'erreur clair : « Votre formule Business permet 3 boutiques. Passez à Premium pour en ajouter. »

3. **Textes publics**
   - `src/app/(marketing)/page.tsx` : la carte Business affiche « Multi-boutiques illimitées », à remplacer par « Jusqu'à 3 boutiques » et à ajouter sur la carte Premium.
   - `src/components/marketing/HeroSection.tsx` : « Multi-boutiques dès Business » et « Plusieurs boutiques et rapports avancés avec Business et Premium ».
   - `src/components/auth/SignUpForm.tsx` affiche `PLANS[...].features` : suivra automatiquement l'étape 1.

4. **Interface gestionnaire**
   - Page Points de vente : afficher le compteur (« 2 / 3 boutiques ») et proposer le passage à Premium quand la limite est atteinte.

5. **Supports**
   - Diapositive « Trois formules » de `docs/presentation/guides-utilisateurs/` et guide en ligne (`src/content/guide.ts`, rubrique points de vente).

## Questions à trancher avant de coder

- **Comptes existants** : que faire d'un tenant Business qui a déjà plus de 3 boutiques ? (garder ses boutiques actuelles mais bloquer les nouvelles est l'option la moins brutale).
- **Boutiques archivées** : comptent-elles dans la limite ? (proposition : non, seules les boutiques actives).
- **Passage de Premium à Business** à l'exercice suivant : les boutiques au-delà de 3 restent-elles consultables en lecture seule ?
- **Prix** : la limite change la valeur de Business ; les tarifs (50 / 120 / 200 USD) restent-ils les mêmes ?

## Tests à prévoir

- Business : création de la 3e boutique acceptée, de la 4e refusée, y compris avec deux créations simultanées.
- Premium : création au-delà de 3 acceptée.
- Starter : comportement actuel conservé (1 boutique).
- Un tenant ne peut pas contourner la limite avec un exercice non payé ou expiré.
