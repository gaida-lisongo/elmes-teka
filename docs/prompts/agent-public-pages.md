# Prompt — Agent Public Pages : créer les pages publiques ELMES-TEKA

## Contexte

Tu travailles sur ELMES-TEKA, un CRM multi-tenant de gestion commerciale pour entrepreneurs congolais. Stack : Next.js 15 App Router + TypeScript + TailAdmin v2.0. Branche de travail : `claude/jolly-volta-lbvtrg`.

**Avant toute modification, lis impérativement :**
1. `AGENTS.md` — règles de travail obligatoires
2. `CONTEXT.md` — contexte métier
3. `docs/presentation/04-benefices.md` — les 4 bénéfices à mettre en avant
4. `docs/research-motivations.md` — les motivations réelles des entrepreneurs cibles

Tu dois créer les pages publiques de la plateforme : landing page (home), à propos, et améliorer les pages d'authentification. Ces pages sont la vitrine commerciale du produit — elles doivent convaincre en moins de 30 secondes.

---

## Règles impératives

- **Icônes** : uniquement les SVG dans `/src/icons/` ou des SVG inline — jamais d'émojis, jamais de bibliothèque externe
- **Composants** : réutiliser les composants TailAdmin existants (`Button`, `Input`, `Label`) pour les formulaires
- **Données** : aucune donnée fictive dans les pages réelles — utiliser des statistiques issues de `docs/research-motivations.md`
- **Pas de build, pas de lint**
- **Chargement des données** : si une page nécessite des données (ex. : compteur d'utilisateurs), charger côté serveur uniquement

---

## Charte graphique

**Couleurs (définies dans `src/app/globals.css`) :**
- Primaire (brand) : `brand-500` = `#465fff`, `brand-950` = `#161950` (navy très sombre)
- Succès/Vert CTA : `success-500` = `#12b76a`
- Texte principal : `gray-900` = `#101828`
- Texte secondaire : `gray-500` = `#667085`
- Fond : `white` / `gray-50`

**Typographie :** police Outfit (déjà configurée dans globals.css via `--font-outfit`)

**Espacements et radii :** `rounded-xl`, `rounded-2xl` — style TailAdmin

**Logo :** disponible dans `/public/images/logo/` : `logo.svg` (clair), `logo-dark.svg`, `auth-logo.svg` (version blanche pour fond sombre)

---

## Structure des pages à créer

### 1. Route group `(marketing)`

Créer `src/app/(marketing)/layout.tsx` — layout partagé pour toutes les pages publiques.

**Ce layout doit contenir :**
- Un header fixe avec : logo ELMES-TEKA, navigation (Bénéfices, À propos), boutons "Connexion" et "Commencer" (CTA vert)
- Un footer avec : logo, liens navigation, copyright ELMES
- Pas de sidebar, pas de navbar admin

---

### 2. Page d'accueil `src/app/(marketing)/page.tsx`

**Objectif :** Convaincre un entrepreneur congolais informel de créer un compte en moins de 30 secondes.

**Sections (dans l'ordre) :**

#### 2.1 Hero
- Fond : `brand-950` (navy sombre) avec dégradé radial subtil
- Badge : "CRM Made in Congo" (petit, en capsule)
- H1 : **"Gérez toutes vos boutiques depuis votre téléphone"**
- Sous-titre : "ELMES-TEKA est la plateforme de gestion commerciale conçue pour les entrepreneurs congolais. Ventes, stocks, clients, dépenses — tout en temps réel, depuis n'importe où."
- CTA primaire (vert) : "Créer mon compte gratuitement" → `/signup`
- CTA secondaire (bordure blanche) : "Se connecter" → `/signin`
- Mention en-dessous : "Démarrage en moins de 15 minutes · Aucune installation requise · Disponible sur mobile"

#### 2.2 Bande de statistiques
- Fond `gray-50`, 4 colonnes
- Statistiques issues de `docs/research-motivations.md` :
  - "99 %" — des unités économiques en RDC sont informelles
  - "81 %" — des MPME n'ont pas de logiciel de stocks
  - "57 %" — des MPME ont du mal à collecter leurs données
  - "15 min" — pour démarrer sur ELMES-TEKA

#### 2.3 Section 4 bénéfices (id="benefices")
- Titre : "Ce que vous gagnez dès le premier mois"
- Grille 2×2 de cards (1 colonne sur mobile)
- Chaque card contient : icône colorée (SVG inline), label catégorie, headline, description (2-3 lignes), stat citée en encadré italique
- Les 4 bénéfices et leurs messages sont dans `docs/presentation/04-benefices.md`
- Couleurs d'accent : brand pour "Superviser", success pour "Fidéliser", orange pour "Chiffres", blue-light pour "Crédit"

#### 2.4 Section "Comment ça marche" (3 étapes)
- Fond `gray-50`
- Étape 01 : Créez votre compte — "Renseignez votre entreprise et ajoutez vos boutiques. Moins de 15 minutes."
- Étape 02 : Ajoutez vos produits — "Catalogue, prix en USD ou CDF, stocks initiaux."
- Étape 03 : Vendez et supervisez — "Vos vendeurs saisissent les ventes. Vous voyez tout en temps réel."

#### 2.5 CTA final
- Fond `brand-950`
- Titre : "Prêt à reprendre le contrôle de votre commerce ?"
- Sous-titre : "Rejoignez les entrepreneurs congolais qui digitalisent leur activité."
- Bouton vert : "Créer mon compte gratuitement" → `/signup`

---

### 3. Page À propos `src/app/(marketing)/about/page.tsx`

**Objectif :** Expliquer qui est ELMES et pourquoi ELMES-TEKA a été créé.

**Sections :**

#### 3.1 Hero
- Fond `brand-950`
- Titre : "Construire l'infrastructure de données du commerce congolais"
- Sous-titre : "ELMES-TEKA est né d'un constat simple : 99 % des entrepreneurs congolais gèrent leur activité sans outil. Nous changeons ça."

#### 3.2 Mission
- Titre : "Notre mission"
- Corps : "Permettre à tout entrepreneur congolais — qu'il soit formel ou informel — d'accéder aux outils de gestion qu'utilisent les grandes entreprises, adaptés à sa réalité."
- 3 valeurs en cards : Accessibilité · Fiabilité · Pertinence locale

#### 3.3 Problème résolu
- Titre : "Le problème que nous résolvons"
- 4 stats clés (depuis `docs/research-motivations.md`) avec icône + chiffre + description
- Clore avec : "Ce n'est pas un problème de compétences. C'est un problème d'outils."

#### 3.4 Le produit
- Titre : "Ce qu'est ELMES-TEKA"
- Liste des modules : Gestion des ventes · Stocks · Clients · Dépenses · Comptabilité simplifiée · Exports financiers
- CTA : "Voir les bénéfices" → `/#benefices`

#### 3.5 CTA
- Même CTA que la home

---

### 4. Améliorer le layout auth existant `src/app/(full-width-pages)/(auth)/layout.tsx`

Le layout actuel est sobre mais peut être renforcé. **Modifier uniquement le panneau droit** (fond `brand-950`) pour mieux aligner le message sur les 4 bénéfices.

**Remplacer les 3 bullets actuelles par :**
```
"Sachez exactement ce qui se vend — même à distance."
"Identifiez vos meilleurs clients automatiquement."
"Votre journal financier, exportable en un clic."
```

**Ajouter sous ces bullets :**
- Un encadré subtil avec la stat clé : "81 % des MPME congolaises n'ont pas encore d'outil de gestion des stocks."
- Un lien "← Retour à l'accueil" qui pointe vers `/`

---

## Fichiers à créer / modifier

| Action | Fichier |
|--------|---------|
| Créer | `src/app/(marketing)/layout.tsx` |
| Créer | `src/app/(marketing)/page.tsx` |
| Créer | `src/app/(marketing)/about/page.tsx` |
| Modifier | `src/app/(full-width-pages)/(auth)/layout.tsx` |

---

## Ce qu'il ne faut PAS faire

- Ne pas créer de composants UI génériques inutiles — utiliser les classes Tailwind directement sur les éléments HTML pour les sections marketing
- Ne pas inventer des features qui n'existent pas dans la plateforme
- Ne pas créer de page de pricing (les tarifs ne sont pas définis)
- Ne pas créer de page de blog
- Ne pas utiliser d'animations complexes (framer-motion, etc.) — transitions CSS simples uniquement
- Ne pas ajouter de dépendances externes

---

## Rapport final attendu

- Liste des fichiers créés/modifiés
- Captures ou description de chaque section créée
- Points à tester manuellement (navigation mobile, dark mode, liens)
- Tout ce qui n'a pas pu être implémenté et pourquoi
