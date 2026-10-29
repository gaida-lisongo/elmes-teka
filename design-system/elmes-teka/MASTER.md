# ELMES-TEKA — Design System MASTER
> Generated: 2026-10-29 · Skill: ui-ux-pro-max · Stack: Next.js 15 / TailAdmin v2.0 / Tailwind CSS

---

## 1. Profil produit

| Attribut | Valeur |
|---|---|
| **Type produit** | B2B Service + Financial Dashboard (CRM) |
| **Audience** | Entrepreneurs congolais (TPE/PME/informel) |
| **Contexte** | Usage bureau + mobile, réseau parfois lent |
| **Stack** | Next.js 15 App Router · TypeScript · Tailwind CSS · TailAdmin v2.0 |
| **Densité** | Dense / Dashboard (8–32 px spacing scale) |
| **Motion** | Standard — transitions et micro-interactions légères |
| **Variance** | Équilibrée / moderne (pas trop austère, pas trop flashy) |

---

## 2. Style directeur

| Priorité | Style | Application |
|---|---|---|
| **Principal** | Minimalism & Swiss Style | Structure, grilles, typographie, espacement |
| **Secondaire** | Flat Design | Icônes SVG plates, boutons nets, pas de gradients inutiles |
| **Accent** | Micro-interactions | Feedback état, hover, loaders, transitions de page |

**Anti-patterns à éviter :**
- Aucun emoji comme icône (toujours SVG depuis `/icons`)
- Pas de gradients complexes sur les cartes de données
- Pas de border-radius > 8 px sur les composants de tableau
- Pas de motion > 300 ms sur les actions critiques (transactions)

---

## 3. Palette de couleurs

Basée sur **B2B Service** + ajustements contexte africain (soleil, contraste fort).

### Tokens CSS

```css
:root {
  /* Brand primaires */
  --color-primary:        #0F172A;   /* Bleu nuit profond — identité ELMES */
  --color-primary-dark:   #020617;   /* Hover / actif */
  --color-primary-light:  #E8ECF1;   /* Fond léger primaire */

  /* Action / CTA */
  --color-action:         #0369A1;   /* Bleu CTA — boutons principaux */
  --color-action-hover:   #0284C7;
  --color-action-text:    #FFFFFF;

  /* Secondaire */
  --color-secondary:      #334155;   /* Texte secondaire, libellés */
  --color-muted:          #475569;   /* Sous-titres, placeholders */
  --color-border:         #E2E8F0;   /* Séparateurs, bordures */

  /* Backgrounds */
  --color-bg:             #F8FAFC;   /* Page background */
  --color-bg-card:        #FFFFFF;   /* Cartes, panneaux */
  --color-bg-sidebar:     #0F172A;   /* Sidebar sombre */

  /* États sémantiques */
  --color-success:        #22C55E;   /* Ventes confirmées, stock OK */
  --color-success-bg:     #F0FDF4;
  --color-warning:        #F59E0B;   /* Commandes en attente, stock faible */
  --color-warning-bg:     #FFFBEB;
  --color-danger:         #DC2626;   /* Erreurs, dettes échues */
  --color-danger-bg:      #FEF2F2;
  --color-info:           #0EA5E9;   /* Notifications neutres */
  --color-info-bg:        #F0F9FF;

  /* Texte */
  --color-text-primary:   #0F172A;
  --color-text-secondary: #475569;
  --color-text-disabled:  #94A3B8;
  --color-text-inverse:   #FFFFFF;

  /* Overlay dark mode sidebar */
  --color-sidebar-text:   #CBD5E1;
  --color-sidebar-active: #FFFFFF;
  --color-sidebar-hover:  #1E293B;
}
```

### Palette réduite (charte couleur)

| Rôle | Hex | Usage |
|---|---|---|
| Primary | `#0F172A` | Brand, sidebar, titres H1 |
| Action | `#0369A1` | CTA, liens, boutons principaux |
| Success | `#22C55E` | Ventes, paiements, stock positif |
| Warning | `#F59E0B` | En attente, stock faible |
| Danger | `#DC2626` | Erreurs, dettes, alertes |
| Background | `#F8FAFC` | Corps de page |
| Card | `#FFFFFF` | Cartes, tableaux |
| Border | `#E2E8F0` | Séparateurs |
| Text | `#0F172A` / `#475569` | Titres / corps |

---

## 4. Typographie

**Système adopté : Minimal Swiss (Inter seul)**

```css
/* Import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;

  /* Échelle typographique — Dense dashboard */
  --text-xs:   0.75rem;   /* 12px — labels, badges */
  --text-sm:   0.875rem;  /* 14px — cellules tableau, sous-textes */
  --text-base: 1rem;      /* 16px — corps */
  --text-lg:   1.125rem;  /* 18px — sous-titres carte */
  --text-xl:   1.25rem;   /* 20px — titres section */
  --text-2xl:  1.5rem;    /* 24px — titres page */
  --text-3xl:  1.875rem;  /* 30px — KPI chiffres clés */

  /* Poids */
  --font-normal:    400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;

  /* Line-height */
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed:1.625;
}
```

**Règles typographiques :**
- Minimum 14 px pour les cellules de tableau (lisibilité basse résolution)
- Titres de page : `text-2xl font-semibold text-primary`
- Libellés de champ : `text-sm font-medium text-secondary`
- Montants/KPI : `text-3xl font-bold text-primary` (chiffres en Inter toujours)
- Devise CDF / USD toujours en `font-medium text-muted` à côté du montant

---

## 5. Espacement (Dense Dashboard)

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

**Règles layout :**
- Padding interne carte : `p-4` (16 px) ou `p-6` (24 px)
- Gap entre cartes KPI : `gap-4` (16 px)
- Padding page (contenu principal) : `px-6 py-5`
- Hauteur ligne tableau : `h-12` (48 px) minimum — doigts sur mobile

---

## 6. Border-radius

| Composant | Radius | Tailwind |
|---|---|---|
| Bouton | 6 px | `rounded-md` |
| Carte / panneau | 8 px | `rounded-lg` |
| Badge / tag | 4 px | `rounded` |
| Input | 6 px | `rounded-md` |
| Modal | 12 px | `rounded-xl` |
| Avatar | 50 % | `rounded-full` |
| Tableau | 0 px | aucun radius |

---

## 7. Ombres

```css
:root {
  --shadow-sm:  0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04);
  --shadow-card: 0 1px 3px 0 rgba(0,0,0,0.08);
}
```

---

## 8. Motion / Animations

**Niveau : Standard** — transitions contextuelles, micro-interactions légères.

```css
:root {
  --duration-fast:   150ms;  /* Hover, focus */
  --duration-base:   250ms;  /* Transitions UI */
  --duration-slow:   350ms;  /* Slide modales, panels */
  --ease-default:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out:        cubic-bezier(0, 0, 0.2, 1);
}
```

**Règles :**
- Hover bouton : `transition: background-color 150ms ease`
- Ouverture modal : `slide-in 250ms ease-out`
- Toast notification : `slide-from-right 250ms ease-out`
- Skeleton loader : `pulse 1.5s ease-in-out infinite`
- Toujours respecter `@media (prefers-reduced-motion: reduce)`

---

## 9. Composants clés — Conventions ELMES-TEKA

### Cartes KPI
```
bg-white rounded-lg shadow-card p-6
  ├── Icône SVG 20×20 (color: --color-action)
  ├── Libellé: text-sm font-medium text-muted
  ├── Valeur: text-3xl font-bold text-primary
  └── Delta: text-sm (vert si positif, rouge si négatif)
```

### Tableau de données
```
rounded-lg overflow-hidden border border-border
  ├── Thead: bg-primary-light text-sm font-semibold text-secondary
  ├── Tbody: bg-white divide-y divide-border
  ├── Tr hover: hover:bg-slate-50
  └── Td: text-sm text-primary py-3 px-4
```

### Badges de statut
```
PAID / DELIVERED  → bg-success-bg text-success (rounded px-2 py-0.5 text-xs font-medium)
PENDING           → bg-warning-bg text-warning
CONFIRMED         → bg-info-bg text-info
CANCELLED         → bg-danger-bg text-danger
```

### Boutons
```
Primary:   bg-action text-white hover:bg-action-hover rounded-md px-4 py-2 text-sm font-semibold
Secondary: bg-white text-primary border border-border hover:bg-bg rounded-md px-4 py-2 text-sm
Danger:    bg-danger text-white hover:bg-red-700 rounded-md px-4 py-2 text-sm font-semibold
```

---

## 10. Layout — Structure de page TailAdmin

```
<html>
  <body class="bg-bg font-sans text-text-primary">
    <aside>  ← Sidebar bg-primary (#0F172A), largeur 260px desktop
    <main>
      <header> ← Topbar bg-white border-b border-border h-16
      <section class="px-6 py-5">
        <PageHeader />   ← Titre + breadcrumb
        <KPIRow />       ← 4 cartes KPI gap-4 grid-cols-4
        <ContentGrid />  ← Tableau + carte latérale
      </section>
    </main>
  </body>
</html>
```

---

## 11. Icônes

Uniquement les SVG du dossier `/icons` du projet.

**Tailles standard :**
- Navigation sidebar : `w-5 h-5`
- Boutons d'action : `w-4 h-4`
- KPI cards : `w-6 h-6`
- Illustrations vides (`empty state`) : `w-12 h-12` ou `w-16 h-16`

---

## 12. Accessibilité (WCAG AA minimum)

- Ratio de contraste texte/fond : minimum **4.5:1** (texte normal), **3:1** (grand texte)
- Tous les boutons iconiques ont un `aria-label`
- Focus ring visible : `focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2`
- Formulaires : label explicite lié par `htmlFor` / `id`
- Erreurs : message près du champ, pas uniquement en haut de page

---

## 13. Règles d'implémentation Next.js

- Server Components par défaut, `'use client'` uniquement pour l'interactivité
- Données initiales chargées côté serveur (auth + tenant + role vérifiés)
- `loading.tsx` pour chaque route avec skeleton approprié
- `error.tsx` pour capturer les erreurs de route
- Composants client poussés aussi bas que possible dans l'arbre

---

## 14. Anti-patterns globaux

- ❌ Emoji comme icône
- ❌ Bibliothèque d'icônes externe (Heroicons, Lucide) — utiliser `/icons`
- ❌ `margin: auto` sur un layout dense dashboard
- ❌ `position: fixed` pour les toasts (utiliser le système TailAdmin existant)
- ❌ Couleurs hardcodées dans les composants (toujours utiliser les tokens CSS)
- ❌ Gradient sur les boutons principaux
- ❌ Texte < 12 px dans les tableaux
- ❌ Données du client transmises sans vérification côté serveur

---

*Pour les pages spécifiques, voir `design-system/elmes-teka/pages/`*
