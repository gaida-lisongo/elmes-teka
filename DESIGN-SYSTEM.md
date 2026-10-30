# ELMES-TEKA — Design System · Confiance v1.0

Référence unique pour tous les composants front-office et back-office.
Toute couleur, typographie, espacement ou composant doit respecter ce guide.

---

## 1. Palette officielle

| Token CSS           | Hex       | Rôle                                         |
|---------------------|-----------|----------------------------------------------|
| `--teka-primary`    | `#124A99` | Bleu confiance — CTA, boutons, liens actifs  |
| `--teka-accent`     | `#3988FF` | Bleu accent — icônes, détails, hover, badges |
| `--teka-ink`        | `#102B50` | Encre — fonds sombres, texte dark            |
| `--teka-surface`    | `#F2F6FC` | Fond clair — arrière-plans, cartes légères   |
| `--teka-white`      | `#FFFFFF` | Blanc pur                                    |

### Échelle brand Tailwind (`brand-*`)

| Classe           | Hex       | Usage                          |
|------------------|-----------|-------------------------------|
| `brand-25`       | `#F2F6FC` | Fond clair (= `--teka-surface`) |
| `brand-50`       | `#E8F1FC` | Arrière-plan hover léger       |
| `brand-100`      | `#D0E3F9` | Fond badge/tag discret         |
| `brand-200`      | `#A1C7F3` | Bordure légère                 |
| `brand-300`      | `#72ABEE` | Icône secondaire               |
| `brand-400`      | `#3988FF` | Accent (= `--teka-accent`)     |
| `brand-500`      | `#124A99` | **Primaire** (= `--teka-primary`) |
| `brand-600`      | `#0E3D80` | Hover bouton primaire          |
| `brand-700`      | `#0B2F62` | Texte lien actif mode sombre   |
| `brand-800`      | `#102B50` | Encre (= `--teka-ink`)         |
| `brand-900`      | `#081A33` | Fond section très sombre       |
| `brand-950`      | `#040D1A` | Fond extrême (rarement utilisé)|

---

## 2. Typographie

### Police principale : DejaVu Sans
- **Bold** → titres, boutons, chiffres clés
- **Regular** → textes courants, tableaux, légendes

### Fallback web
```css
font-family: 'DejaVu Sans', 'Outfit', system-ui, -apple-system, sans-serif;
```

### Hiérarchie
| Niveau    | Taille   | Poids | Interligne | Usage                    |
|-----------|----------|-------|------------|--------------------------|
| `h1`      | 36–48px  | Bold  | 1.2        | Titres hero              |
| `h2`      | 28–36px  | Bold  | 1.3        | Titres section           |
| `h3`      | 20–24px  | Bold  | 1.4        | Titres carte             |
| `body`    | 16px     | Regular | 1.6      | Corps de texte           |
| `small`   | 14px     | Regular | 1.5      | Légendes, labels         |
| `xs`      | 12px     | Regular | 1.4      | Badges, métadonnées      |

---

## 3. Logos et assets

Tous les fichiers sont dans `public/images/logo/`.

| Fichier                        | Usage                                       |
|-------------------------------|---------------------------------------------|
| `logo-horizontal-couleur.svg` | Navigation principale (clair)               |
| `logo-horizontal-blanc.svg`   | Navigation sur fond bleu/sombre             |
| `logo-horizontal-fond-bleu.svg` | Documents, en-têtes officiels             |
| `logo-vertical-couleur.svg`   | Couvertures, affiches                       |
| `symbole-couleur.svg`         | Favicon app, icône small nav (= `logo-icon.svg`) |
| `symbole-blanc.svg`           | Icône sur fonds colorés                     |
| `symbole-fond-bleu.svg`       | Auth page, carte de visite (= `auth-logo.svg`) |
| `icone-application.svg`       | PWA, store                                  |

### Règles logo
- Marge de protection : 1/4 hauteur du symbole sur chaque côté
- Taille minimale logo horizontal : 220px
- Favicons < 48px : toujours symbole blanc sur bleu confiance
- Ne pas étirer, incliner, colorer ou ajouter des ombres

### Favicons PWA
`public/favicon.ico`, `public/favicon.svg`, `public/apple-touch-icon.png`,
`public/icon-192.png`, `public/icon-512.png`, `public/site.webmanifest`

---

## 4. Composants UI

### Boutons

```tsx
// Primaire — fond bleu confiance
<button className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-2.5 rounded-lg transition-colors">
  Commencer
</button>

// Secondaire — outline
<button className="border border-brand-500 text-brand-500 hover:bg-brand-50 font-semibold px-5 py-2.5 rounded-lg transition-colors">
  En savoir plus
</button>

// Ghost — texte seul
<button className="text-brand-500 hover:text-brand-600 font-medium transition-colors">
  Annuler
</button>

// Danger
<button className="bg-error-500 hover:bg-error-600 text-white font-bold px-5 py-2.5 rounded-lg transition-colors">
  Supprimer
</button>
```

**Règles boutons** :
- Radius : `rounded-lg` (8px) pour les boutons standards, `rounded-full` pour les pill/CTA marketing
- Taille min touch target : 44×44px
- Texte : toujours blanc sur fond coloré ; jamais blanc sur `brand-400` (#3988FF) en petit texte

### Inputs / Champs de formulaire

```tsx
<div className="space-y-1.5">
  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
    Nom du produit
  </label>
  <input
    type="text"
    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 
               bg-white dark:bg-gray-900 px-3.5 py-2.5 text-base
               focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400
               placeholder:text-gray-400 transition"
    placeholder="Ex: Farine de maïs"
  />
</div>
```

**Règles inputs** :
- Focus ring : `ring-brand-400` (#3988FF) — jamais de couleur arbitraire
- Labels toujours visibles (pas de placeholder-only)
- Messages d'erreur directement sous le champ, en `text-error-500`
- Validation inline après blur, pas uniquement à la soumission

### Cartes

```tsx
// Carte standard
<div className="rounded-2xl border border-gray-200 dark:border-gray-800 
                bg-white dark:bg-gray-900 p-5 shadow-sm 
                hover:-translate-y-1 hover:shadow-md transition-all duration-200">
  {/* contenu */}
</div>

// Carte avec accent primaire (stat, KPI)
<div className="rounded-2xl bg-brand-500 text-white p-5">
  {/* contenu */}
</div>

// Carte fond clair
<div className="rounded-2xl bg-brand-25 border border-brand-100 p-5">
  {/* contenu */}
</div>
```

### Badges / Tags

```tsx
// Statut actif
<span className="inline-flex items-center gap-1 rounded-full bg-success-50 text-success-700 
                 dark:bg-success-500/12 dark:text-success-400 px-2.5 py-0.5 text-xs font-medium">
  Actif
</span>

// Catégorie brand
<span className="inline-flex items-center rounded-full bg-brand-50 text-brand-500 
                 dark:bg-brand-500/12 dark:text-brand-400 px-2.5 py-0.5 text-xs font-semibold">
  Stock
</span>
```

### DataTables

```tsx
// En-tête tableau
<th className="bg-brand-25 dark:bg-brand-900/30 text-xs font-semibold uppercase tracking-wider
               text-gray-500 dark:text-gray-400 px-4 py-3 text-left border-b border-gray-200 dark:border-gray-800">
  Produit
</th>

// Ligne tableau
<tr className="border-b border-gray-100 dark:border-gray-800 
               hover:bg-brand-25 dark:hover:bg-brand-900/20 transition-colors">
  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">…</td>
</tr>
```

### Animations

| Classe       | Rôle                             | Durée     |
|--------------|----------------------------------|-----------|
| `et-reveal`  | Apparition scroll (fade + slide) | 650ms     |
| `et-delay-1` | Délai 100ms                      | —         |
| `et-delay-2` | Délai 200ms                      | —         |
| `et-delay-3` | Délai 300ms                      | —         |
| `et-fade-up` | Keyframe montée + opacité        | 700ms     |
| `et-pulse`   | Pulsation (live dot)             | 1.8s loop |
| `et-bar-grow`| Barres qui poussent vers le haut | 800ms     |

**Règles animations** :
- Toujours respecter `prefers-reduced-motion`
- Entrées : `cubic-bezier(0.22, 1, 0.36, 1)` (spring)
- Sorties : plus rapides que les entrées
- Ne jamais animer `width` ou `height` (préférer `transform`)

---

## 5. Icônes

Utiliser **uniquement** les SVGs du dossier `/icons` du projet.
Ne jamais utiliser :
- emojis comme icônes
- caractères Unicode décoratifs
- bibliothèques externes sans instruction explicite

Couleur par défaut : `currentColor` pour hériter du contexte.
Accent icône : `#3988FF` (bleu accent).

---

## 6. Espacements

Basés sur une grille de 4px :

| Token   | Valeur | Usage typique                  |
|---------|--------|-------------------------------|
| `p-1`   | 4px    | Padding interne badge          |
| `p-2`   | 8px    | Gap entre icône et texte       |
| `p-3`   | 12px   | Padding bouton compact         |
| `p-4`   | 16px   | Padding carte compact          |
| `p-5`   | 20px   | Padding carte standard         |
| `p-6`   | 24px   | Padding section                |
| `p-8`   | 32px   | Padding section large          |
| `gap-2` | 8px    | Gap entre éléments             |
| `gap-4` | 16px   | Gap colonne                    |

---

## 7. Règles multi-tenant (rappel sécurité)

- Ne jamais faire confiance à `tenantId`, `storeId`, `userId` du client
- Toujours recalculer et vérifier côté serveur depuis la session
- Isoler les canaux Pusher par tenant : `private-tenant-{tenantId}`
- Ne jamais sérialiser de document Mongoose non sérialisé côté client

---

## 8. Plan de travail

- [x] Assets et logos officiels intégrés
- [x] Palette brand tokens mis à jour (`globals.css`)
- [x] Marketing CSS aligné sur la charte
- [ ] Back-office : sidebar et header avec logo officiel
- [ ] Front-office : landing page complète avec couleurs brand
- [ ] Composants communs : boutons, inputs, cartes, badges
- [ ] Police DejaVu Sans intégrée (ou fallback Outfit)
- [ ] Collecte d'images (Pexels/Unsplash — commerçants africains, marchés, boutiques)
- [ ] Retravail page par page : home, signin, signup, dashboard

---

*ELMES-TEKA · Confiance v1.0 · Octobre 2026*
