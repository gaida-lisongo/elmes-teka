# Intégration FlexPay

Les PDF officiels FlexPay (Mobile Money v1.5, Carte v1.2) sont confidentiels (propriété d'Infoset sarl).
Ils sont placés dans ce dossier **en local uniquement** et exclus de git (`.gitignore`), le dépôt étant public.
Les demander à l'équipe ELMES.

## Variables d'environnement (Vercel)

| Variable | Rôle |
|----------|------|
| `FLEX_HOST_PAYMENT_MOBILE` | URL complète de la collecte, ex. `https://backend.flexpay.cd/api/rest/v1/paymentService`. Le pay out en est déduit (`…/merchantPayOutService`). Un hôte seul est aussi accepté. |
| `FLEX_HOST_PAYMENT_CARD` | URL complète du paiement carte, ex. `https://cardpayment.flexpay.cd/v1.1/pay`. |
| `FLEX_HOST_CHECK` | URL de base du check, ex. `https://backend.flexpay.cd/api/rest/v1/check/` ; le code ajoute `{orderNumber}`. |
| `FLEX_MERCHANT` | Code marchand. |
| `FLEX_TOKEN` | Token, au format `Bearer xxxx` (le préfixe est ajouté s'il manque). |
| `AUTH_SESSION_SECRET` | Déjà existant : sert aussi à signer la clé de l'URL de callback. |

`PAYMENT_API_URL` (ancien intermédiaire Supabase) n'est plus utilisé.

## Flux

```
Action serveur (createAnnee, initiatePromotionRecharge…)
  └─ initiateCollection()  POST paymentService { merchant, type: 1, phone 243…, reference, amount, currency, callbackUrl }
        ← { code: "0", orderNumber }              → orderNumber enregistré, statut PENDING
  … le client valide le push sur son téléphone …
FlexPay ─► POST /api/payments/flexpay/callback?ref={reference}&key={hmac}
  1. clé HMAC vérifiée (FlexPay ne signe pas ses callbacks)
  2. statut relu via GET check/{orderNumber} (le corps du callback n'est pas cru)
  3. mise à jour idempotente (uniquement si encore PENDING)
  4. événement Pusher private-tenant-{tenantId}-paiements / payment.updated
```

Le bouton « Vérifier le paiement » reste disponible en secours et utilise la même logique
(`src/lib/payments/flexpay-results.ts`).

## Références de transaction

| Préfixe | Objet | Effet du succès |
|---------|-------|-----------------|
| `ANNEE-{anneeId}` | Abonnement annuel d'un exercice | Exercice `ACTIVE` |
| `PROMO-{code}-{hex}` | Recharge de crédits SMS d'une promotion | Crédits ajoutés |

## Codes FlexPay utiles

- Réponse d'initiation : `code` `0` = requête envoyée, `1` = problème.
- `transaction.status` du check : `0` succès · `1` échec · `2` en attente · `3`/`4` remboursement · `5` annulée par le marchand.

## Fichiers

- `src/lib/utils/payment.service.ts` — appels FlexPay, URL de callback signée.
- `src/lib/payments/flexpay-results.ts` — application des statuts en base.
- `src/app/api/payments/flexpay/callback/route.ts` — webhook.

## Limites connues

- Le paiement par carte (`initiateCardPayment`) est prêt côté service mais n'est encore branché à aucun écran.
- Le pay out n'a pas d'appelant ; un callback dont la référence n'a pas de préfixe connu est accepté puis ignoré.
