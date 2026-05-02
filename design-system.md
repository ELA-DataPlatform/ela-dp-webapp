# ELA DP — Design System Specification

> **Contexte** : Style visuel de référence inspiré de PowlFuel (data dashboard utilitaire raffiné). 
> **Cible** : Application web de quantified-self (running + musique) avec données denses, cartes, séries temporelles.  
> **Stack cible** : Next.js 15+ / React 19 / Tailwind CSS 4 / shadcn/ui / TypeScript.  
> **Public** : Agent IA frontend (Claude Code, v0, Cursor). Ce document est la source de vérité unique.

---

## 1. Philosophie de design

### Principes fondateurs

1. **La donnée est le héros.** Tout élément visuel qui ne sert pas la lecture des données est supprimé. Pas de gradient, pas d'ombre portée décorative, pas d'illustration, pas d'icône superflue.
2. **Monochrome avec accents fonctionnels.** L'interface est en niveaux de gris. La couleur n'apparaît QUE pour : (a) un état actif unique (bleu d'accent), (b) des données métier qui ont une couleur intrinsèque (logo de marque, statut sémantique).
3. **Densité assumée.** L'espace est précieux mais l'air est nécessaire. On préfère une grande quantité d'information bien hiérarchisée à une UI aérée et pauvre.
4. **Hiérarchie par la typographie, pas par la couleur.** La taille, le poids, l'espacement et la casse créent la structure. Le gris sert à graduer l'importance.
5. **Monospace pour tout ce qui est chiffré ou technique.** Les nombres, codes, raccourcis clavier, timestamps utilisent une police mono pour permettre la comparaison visuelle (alignement vertical des chiffres).
6. **Pas de skeuomorphisme, pas de neumorphisme.** Bordures fines, fonds plats, coins légèrement arrondis ou carrés.
7. **Mouvement minimal.** Les transitions servent à indiquer un changement d'état (hover, active, loading), jamais à "impressionner". Durée : 100-200ms, easing standard.

### Anti-patterns à éviter absolument

- ❌ Gradients (sauf cas très spécifique de map overlay)
- ❌ Drop shadows colorées ou diffuses (`shadow-xl`, `shadow-2xl`)
- ❌ Icônes décoratives à côté des labels
- ❌ Couleurs vives multiples dans un même écran
- ❌ Animations de type "fade-in séquentiel" sur le chargement
- ❌ Bordures de plus de 1px (sauf cas exceptionnel)
- ❌ Border-radius > 12px
- ❌ Polices "personnalité" (serif fantaisie, display script)
- ❌ Texte centré (sauf pour les états vides ou les modales courtes)
- ❌ Boutons "3D" avec ombre interne ou highlight

---

## 2. Design Tokens

### 2.1 Palette de couleurs

Toutes les couleurs sont définies en **OKLCH** pour garantir une perception uniforme entre clair et foncé. Format : `oklch(L C H)` où L = lightness 0-1, C = chroma, H = hue.

```css
:root {
  /* === NEUTRES (mode clair) === */
  --color-bg: oklch(0.99 0 0);              /* #FCFCFC - fond principal, pas un blanc pur */
  --color-bg-subtle: oklch(0.975 0 0);      /* #F8F8F8 - fond sidebar, panneaux */
  --color-bg-muted: oklch(0.96 0 0);        /* #F2F2F2 - hover sur lignes de tableau */
  --color-bg-elevated: oklch(1 0 0);        /* #FFFFFF - cartes, modales (au-dessus du bg) */

  --color-border: oklch(0.92 0 0);          /* #E8E8E8 - bordures par défaut */
  --color-border-strong: oklch(0.85 0 0);   /* #D6D6D6 - bordures de focus, séparateurs forts */

  --color-fg: oklch(0.18 0 0);              /* #232323 - texte principal, JAMAIS du noir pur */
  --color-fg-muted: oklch(0.45 0 0);        /* #6B6B6B - texte secondaire, labels */
  --color-fg-subtle: oklch(0.62 0 0);       /* #969696 - texte tertiaire, métadonnées */
  --color-fg-disabled: oklch(0.78 0 0);     /* #C2C2C2 - texte désactivé */

  /* === ACCENT UNIQUE === */
  /* Bleu utilisé UNIQUEMENT pour : état actif, focus ring, sélection, lien primaire */
  --color-accent: oklch(0.55 0.22 255);     /* #2563EB - blue-600 équivalent */
  --color-accent-hover: oklch(0.50 0.22 255); /* hover sur accent */
  --color-accent-bg: oklch(0.97 0.03 255);  /* fond très clair avec teinte accent */
  --color-accent-fg: oklch(1 0 0);          /* texte sur accent */

  /* === SÉMANTIQUE (usage strict, voir section 6) === */
  --color-success: oklch(0.62 0.18 145);    /* vert - performance OK, status up */
  --color-warning: oklch(0.72 0.18 75);     /* ambre - attention, dégradation légère */
  --color-danger: oklch(0.58 0.22 25);      /* rouge - erreur, alerte forte */

  /* === DATA VIZ (séries temporelles) === */
  /* Palette ordonnée pour graphiques : du plus important (foncé) au moins important */
  --color-chart-1: oklch(0.18 0 0);         /* série principale = couleur du texte */
  --color-chart-2: oklch(0.55 0.22 255);    /* série secondaire = accent */
  --color-chart-3: oklch(0.62 0 0);         /* série tertiaire = gris moyen */
  --color-chart-4: oklch(0.78 0 0);         /* série quaternaire = gris clair */
  /* En cas de besoin de couleur supplémentaire, utiliser les couleurs sémantiques */
}

/* === MODE SOMBRE === */
[data-theme="dark"] {
  --color-bg: oklch(0.14 0 0);              /* #1A1A1A - fond principal */
  --color-bg-subtle: oklch(0.17 0 0);       /* #232323 - fond sidebar */
  --color-bg-muted: oklch(0.20 0 0);        /* #2A2A2A - hover */
  --color-bg-elevated: oklch(0.18 0 0);     /* #262626 - cartes */

  --color-border: oklch(0.25 0 0);          /* #3D3D3D */
  --color-border-strong: oklch(0.32 0 0);   /* #4F4F4F */

  --color-fg: oklch(0.95 0 0);              /* #F0F0F0 - JAMAIS du blanc pur */
  --color-fg-muted: oklch(0.70 0 0);        /* #A8A8A8 */
  --color-fg-subtle: oklch(0.55 0 0);       /* #828282 */
  --color-fg-disabled: oklch(0.38 0 0);     /* #5C5C5C */

  --color-accent: oklch(0.65 0.20 255);     /* bleu plus clair en dark pour contraste */
  --color-accent-hover: oklch(0.72 0.18 255);
  --color-accent-bg: oklch(0.25 0.05 255);
  --color-accent-fg: oklch(1 0 0);

  --color-success: oklch(0.68 0.16 145);
  --color-warning: oklch(0.78 0.16 75);
  --color-danger: oklch(0.65 0.20 25);

  --color-chart-1: oklch(0.95 0 0);
  --color-chart-2: oklch(0.65 0.20 255);
  --color-chart-3: oklch(0.65 0 0);
  --color-chart-4: oklch(0.45 0 0);
}
```

### 2.2 Typographie

**Polices** :
- **Sans-serif** : `Geist` (premier choix) ou `Inter` (fallback). Le système utilise une seule famille pour toutes les tailles.
- **Monospace** : `Geist Mono` (premier choix) ou `JetBrains Mono` (fallback).

```css
:root {
  --font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;

  /* === ÉCHELLE DE TAILLE (modular scale 1.125) === */
  --text-2xs: 0.6875rem;   /* 11px - métadonnées extrêmes, badges */
  --text-xs: 0.75rem;      /* 12px - labels, eyebrow text, small caps */
  --text-sm: 0.8125rem;    /* 13px - texte secondaire, contenu de table dense */
  --text-base: 0.875rem;   /* 14px - texte par défaut (PAS 16px, c'est trop) */
  --text-md: 1rem;         /* 16px - titres de section */
  --text-lg: 1.125rem;     /* 18px - titres de page */
  --text-xl: 1.375rem;     /* 22px - titres de hero */
  --text-2xl: 1.75rem;     /* 28px - métriques principales (KPI cards) */
  --text-3xl: 2.25rem;     /* 36px - rare, dashboard summary uniquement */

  /* === POIDS === */
  --font-weight-normal: 400;
  --font-weight-medium: 500;       /* labels, boutons */
  --font-weight-semibold: 600;     /* titres, valeurs importantes */
  /* PAS de bold (700) ou plus — trop lourd pour ce style */

  /* === LINE HEIGHTS === */
  --leading-tight: 1.2;            /* titres, KPIs */
  --leading-normal: 1.4;            /* texte courant */
  --leading-relaxed: 1.6;           /* paragraphes longs (rare) */

  /* === LETTER SPACING === */
  --tracking-tight: -0.02em;        /* gros titres */
  --tracking-normal: 0;
  --tracking-wide: 0.04em;          /* small caps */
  --tracking-wider: 0.08em;         /* eyebrow text, section headers */
}
```

**Règles d'usage de la typographie** :

| Cas d'usage | Police | Taille | Poids | Casse | Tracking |
|---|---|---|---|---|---|
| Titre de page | Sans | `lg` | `semibold` | normale | `tight` |
| Titre de section | Sans | `md` | `semibold` | normale | `normal` |
| **Eyebrow / Section header** | Sans | `2xs` | `medium` | UPPERCASE | `wider` |
| Label de formulaire | Sans | `xs` | `medium` | normale | `normal` |
| Texte courant | Sans | `base` | `normal` | normale | `normal` |
| Texte secondaire | Sans | `sm` | `normal` | normale | `normal` |
| Métadonnée | Sans | `xs` | `normal` | normale | `normal` |
| **Métrique principale (KPI)** | Mono | `2xl` | `medium` | normale | `tight` |
| **Métrique en table** | Mono | `sm` | `normal` | normale | `normal` |
| **Code, raccourci clavier** | Mono | `xs` | `medium` | normale | `normal` |
| **Timestamp** | Mono | `xs` | `normal` | normale | `normal` |
| Bouton | Sans | `sm` | `medium` | normale | `normal` |
| Badge / Pill | Sans | `xs` | `medium` | normale | `normal` |

**RÈGLE D'OR** : Tout nombre destiné à être lu (métrique, prix, distance, durée, BPM, allure) utilise `font-mono` + `font-variant-numeric: tabular-nums`. Pas d'exception.

```css
/* À appliquer sur tout conteneur de chiffres */
.numeric {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "zero" 1;
}
```

### 2.3 Espacement

Système basé sur une unité de **4px** (0.25rem). Échelle restreinte volontairement.

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px  - espace entre icône et texte */
  --space-2: 0.5rem;    /* 8px  - padding interne minimum */
  --space-3: 0.75rem;   /* 12px - gap entre éléments proches */
  --space-4: 1rem;      /* 16px - padding standard */
  --space-5: 1.25rem;   /* 20px - rare */
  --space-6: 1.5rem;    /* 24px - séparation entre sections proches */
  --space-8: 2rem;      /* 32px - séparation entre sections */
  --space-10: 2.5rem;   /* 40px - rare */
  --space-12: 3rem;     /* 48px - séparation entre grandes zones */
  --space-16: 4rem;     /* 64px - hero sections */
  --space-20: 5rem;     /* 80px - rare */
}
```

**Règles d'application** :
- Padding interne d'un bouton : `space-2` (vertical) `space-3` (horizontal)
- Padding interne d'une card : `space-4` ou `space-6`
- Gap entre items d'une liste : `space-3`
- Gap entre sections d'une page : `space-8` à `space-12`
- Padding d'une page : `space-6` (mobile) à `space-8` (desktop)

### 2.4 Bordures et rayons

```css
:root {
  --border-width: 1px;          /* JAMAIS plus que 1px sauf cas exceptionnel */
  --border-width-strong: 2px;   /* uniquement pour focus ring */

  --radius-none: 0;
  --radius-xs: 2px;             /* badges très petits */
  --radius-sm: 4px;             /* boutons, inputs, badges */
  --radius-md: 6px;             /* cards, panels — VALEUR PAR DÉFAUT */
  --radius-lg: 8px;             /* grandes cards, modales */
  --radius-xl: 12px;            /* rare — modales pleine largeur */
  --radius-full: 9999px;        /* avatars circulaires, pills */
}
```

### 2.5 Ombres

Utilisation très restreinte. Préférer toujours une bordure à une ombre.

```css
:root {
  /* Ombre minimale pour les éléments flottants (popover, dropdown, tooltip) */
  --shadow-sm: 0 1px 2px 0 oklch(0 0 0 / 0.05);
  --shadow-md: 0 2px 8px -2px oklch(0 0 0 / 0.08), 0 1px 2px 0 oklch(0 0 0 / 0.04);
  --shadow-lg: 0 8px 24px -8px oklch(0 0 0 / 0.12), 0 2px 4px 0 oklch(0 0 0 / 0.04);

  /* Pour les modales uniquement */
  --shadow-modal: 0 24px 48px -12px oklch(0 0 0 / 0.20);
}
```

**Règle** : Une card de contenu n'a JAMAIS d'ombre. Elle a une bordure 1px ou un fond légèrement différent du fond parent. Les ombres sont réservées aux éléments en `position: absolute|fixed` qui flottent au-dessus du contenu (popover, dropdown, modale, tooltip).

### 2.6 Transitions

```css
:root {
  --duration-fast: 100ms;       /* hover sur lien */
  --duration-base: 150ms;       /* hover sur bouton, transitions courantes */
  --duration-slow: 200ms;       /* changement de panneau, ouverture de menu */
  
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);    /* standard pour entrées */
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);     /* sorties */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1); /* mouvements bidirectionnels */
}
```

**Propriétés à animer** : `opacity`, `transform`, `background-color`, `border-color`, `color`. **JAMAIS** `width`, `height`, `top/left` (utiliser `transform: translate()`).

---

## 3. Layout et grille

### 3.1 Structure générale

L'application suit un layout en **trois zones** classique pour un dashboard data :

```
┌──────────────────────────────────────────────────────────┐
│ TOP BAR (optionnelle, 48px)                              │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  SIDEBAR   │  MAIN CONTENT                               │
│  320-400px │  flex-1                                     │
│            │                                             │
│            │  (peut contenir: map full-bleed,            │
│            │   tableau dense, dashboard de cards,        │
│            │   vue détail d'une activité, etc.)          │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

**Largeurs** :
- Sidebar gauche : `360px` par défaut, redimensionnable de `280px` à `480px`
- Top bar : `48px` (si présente)
- Aucune largeur max imposée sur le main content (full bleed)

### 3.2 Page sans sidebar (vue détail, settings)

Pour les pages de contenu non-dashboard, utiliser un container centré :

```css
.container-prose { max-width: 720px; margin: 0 auto; padding: var(--space-8) var(--space-6); }
.container-default { max-width: 1200px; margin: 0 auto; padding: var(--space-8) var(--space-6); }
.container-wide { max-width: 1440px; margin: 0 auto; padding: var(--space-8) var(--space-6); }
```

### 3.3 Grille interne

Pour les dashboards : grille CSS de 12 colonnes avec gap de `space-4` (16px).

```css
.grid-dashboard {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--space-4);
}
```

Les cards de KPI occupent typiquement 3 ou 4 colonnes. Les graphiques principaux : 6 à 12 colonnes.

---

## 4. Composants — Spécifications détaillées

### 4.1 Bouton

**Variantes** : `primary`, `secondary`, `ghost`, `danger`.

```tsx
// Anatomie
<button className="btn btn-primary">
  <Icon className="h-3.5 w-3.5" />  {/* optionnel, taille 14px */}
  <span>Label</span>
  <kbd>⌘K</kbd>  {/* optionnel, raccourci clavier */}
</button>
```

**Spécifications** :

| Propriété | Primary | Secondary | Ghost | Danger |
|---|---|---|---|---|
| Background | `--color-fg` | `--color-bg-elevated` | transparent | `--color-danger` |
| Text | `--color-bg` | `--color-fg` | `--color-fg` | white |
| Border | none | `1px solid --color-border` | none | none |
| Hover bg | `--color-fg` à 90% | `--color-bg-muted` | `--color-bg-muted` | `--color-danger` foncé |
| Padding | `space-2 space-3` | `space-2 space-3` | `space-2 space-3` | `space-2 space-3` |
| Height | `32px` (sm) / `36px` (md) / `40px` (lg) | idem | idem | idem |
| Border-radius | `radius-sm` | `radius-sm` | `radius-sm` | `radius-sm` |
| Font | `sans / sm / medium` | idem | idem | idem |
| Gap interne | `space-2` | idem | idem | idem |
| Transition | `background-color 150ms ease-out` | idem | idem | idem |

**Focus state (TOUS les boutons)** : ring 2px de `--color-accent` avec offset 2px.

```css
.btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

**Disabled state** : opacity 0.5, cursor not-allowed, aucune interaction.

### 4.2 Input et champs de formulaire

```css
.input {
  height: 36px;
  padding: 0 var(--space-3);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font: 400 var(--text-sm)/1.4 var(--font-sans);
  color: var(--color-fg);
  transition: border-color var(--duration-base) var(--ease-out);
}

.input:hover {
  border-color: var(--color-border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-bg);
}

.input::placeholder {
  color: var(--color-fg-subtle);
}
```

**Search input avec icône et raccourci** (pattern récurrent dans le style cible) :

```
┌──────────────────────────────────────────────┐
│ 🔍  Rechercher...                       ⌘K   │
└──────────────────────────────────────────────┘
```

- Icône à gauche : 14px, couleur `--color-fg-subtle`, padding-left de l'input compensé
- Kbd à droite : badge avec fond `--color-bg-muted`, border 1px, font-mono, taille `2xs`
- Hauteur 40px (légèrement plus grand que les inputs standards)

### 4.3 Pills / Filter chips (composant SIGNATURE du style)

C'est l'élément le plus reconnaissable du style cible. Utilisé pour filtres, catégories, états.

**Anatomie** :
```
┌──────────────────────┐    ┌──────────────────────┐
│ Label  count         │    │ ● Label              │   (avec dot indicateur)
└──────────────────────┘    └──────────────────────┘
```

**États** :

| État | Background | Text | Border | Count color |
|---|---|---|---|---|
| Default | `--color-bg-elevated` | `--color-fg` | `1px solid --color-border` | `--color-fg-subtle` |
| Hover | `--color-bg-muted` | `--color-fg` | `1px solid --color-border-strong` | `--color-fg-muted` |
| Active (sélectionné) | `--color-accent-bg` | `--color-accent` | `1px solid --color-accent` | `--color-accent` à 70% |

**Spécifications** :
- Hauteur : `28px`
- Padding : `0 var(--space-3)`
- Border-radius : `radius-full` (pilule complète)
- Font : `sans / xs / medium`
- Gap interne : `var(--space-2)`
- Le **count est en font-mono**, taille `2xs`, couleur plus claire que le label

**Exemple JSX** :
```tsx
<button className="pill" data-active={isActive}>
  <span>SP95</span>
  <span className="pill-count">3 094</span>
</button>
```

### 4.4 List item (sidebar pattern)

Utilisé pour les listes de stations, activités, tracks, etc. C'est le second composant signature.

**Anatomie** :
```
┌──────────────────────────────────────────────────────┐
│  [G]  Sortie longue Vannes              4'52"/km     │
│       12 km · 1h 03 · 2 jours              -8        │
└──────────────────────────────────────────────────────┘
  ↑    ↑                                    ↑
 Avatar Title + métadonnées              Valeur(s)
 32×32  (deux lignes)                    + delta
```

**Spécifications** :
- Padding : `var(--space-3) var(--space-4)`
- Gap entre avatar et contenu : `var(--space-3)`
- Border-bottom : `1px solid --color-border` (séparation entre items)
- Hover background : `--color-bg-muted`
- Active (sélectionné) : `--color-accent-bg` avec border-left de 2px en `--color-accent`

**Avatar circulaire (lettre ou logo)** :
- Taille `32px`, border-radius `radius-full`
- Si logo : image cover, fond du logo
- Si lettre : fond gris (`--color-bg-muted`) + lettre en sans / sm / semibold, ou fond coloré si la marque a une couleur d'identité forte (rouge Total, bleu Carrefour…)

**Title** : sans / sm / medium, couleur `--color-fg`, truncate sur une ligne avec ellipsis.

**Métadonnées** (deuxième ligne) : sans / xs / normal, couleur `--color-fg-subtle`, séparées par `·` (avec espaces), truncate.

**Valeur principale** (à droite, top) : **mono** / sm / medium, couleur `--color-fg`.

**Delta / valeur secondaire** (à droite, bottom) : **mono** / xs / normal, couleur sémantique :
- Positif (au-dessus de la moyenne dans le contexte "moins cher" ou "meilleur") : `--color-success`
- Négatif : `--color-danger`
- Neutre : `--color-fg-subtle`

### 4.5 Section header (eyebrow text)

Pattern omniprésent dans le style cible pour structurer les listes.

```
STATIONS                                          50 / 1240
SAINT-BRICE-SOUS-FORÊT (1)
```

**Spec** :
- Font : sans / `2xs` / medium
- Casse : UPPERCASE
- Letter-spacing : `tracking-wider` (0.08em)
- Couleur : `--color-fg-muted`
- Padding : `var(--space-3) var(--space-4) var(--space-2) var(--space-4)`
- Optionnel : count à droite en mono, même taille, couleur `--color-fg-subtle`

### 4.6 KPI Card

Pour afficher une métrique principale (ex : "Distance totale ce mois", "VFC moyenne", etc.).

**Anatomie** :
```
┌────────────────────────────────────┐
│ DISTANCE TOTALE                    │  ← eyebrow
│                                    │
│ 247.3 km                           │  ← métrique (mono, large)
│                                    │
│ +12.4% vs mois dernier             │  ← delta (mono, petit, sémantique)
└────────────────────────────────────┘
```

**Spec** :
- Padding : `var(--space-5)`
- Border : `1px solid --color-border`
- Border-radius : `radius-md`
- Background : `--color-bg-elevated`
- Pas d'ombre
- Eyebrow : voir 4.5
- Métrique : mono / `2xl` / medium / leading-tight, couleur `--color-fg`
- Unité (ex "km") : peut être en sans / `lg` / normal pour distinguer le nombre de l'unité, couleur `--color-fg-muted`
- Delta : mono / xs / normal, couleur sémantique (vert/rouge selon contexte)

### 4.7 Table (data table dense)

```
┌───────────────────────────────────────────────────────────────┐
│ DATE      │ PARCOURS         │ DISTANCE │ ALLURE   │ FC AVG  │  ← header
├───────────────────────────────────────────────────────────────┤
│ 28 avr.   │ Bois de Boulogne │ 12.4 km  │ 5'02"/km │ 152 bpm │
│ 26 avr.   │ Trail Annecy     │ 21.7 km  │ 6'48"/km │ 161 bpm │
│ 24 avr.   │ Récupération     │  6.0 km  │ 5'45"/km │ 138 bpm │
└───────────────────────────────────────────────────────────────┘
```

**Spec** :
- Header : background `--color-bg-subtle`, font sans / `2xs` / medium / UPPERCASE / tracking-wider, couleur `--color-fg-muted`, padding `space-3 space-4`
- Cellule : padding `space-3 space-4`, font sans ou mono selon le type de donnée (cf section 2.2)
- Border-bottom sur chaque ligne : `1px solid --color-border`
- Hover sur ligne : background `--color-bg-muted`
- Pas de border verticale entre colonnes (vertical lines = bruit visuel)
- Alignement : texte à gauche, **chiffres à droite** ou alignés sur la décimale
- Sticky header recommandé sur tableaux longs

### 4.8 Map container

Pour les cartes (Mapbox / MapLibre). Contraintes spécifiques :

**Style de carte** : utiliser un style très désaturé. Recommandations :
- **Mapbox** : `mapbox/light-v11` avec custom (saturation -100, lightness +5)
- **MapLibre** : style maison basé sur OSM tiles avec palette grise, ou utiliser le style "Stadia Stamen Toner Lite"
- Pas de POI affichés (restaurants, magasins, etc.)
- Routes en gris très clair, autoroutes légèrement plus foncées
- Eau en gris bleuté très clair (`oklch(0.95 0.01 240)`)
- Frontières administratives en pointillé fin
- Typographie de la carte : la même que l'app si possible (Geist / Inter)

**Markers** :
- Cluster : cercle blanc avec border 1px gris, nombre au centre en mono / xs / medium
- Cluster sélectionné : border passe à `--color-accent`, légère scale 1.1 au hover
- Marker individuel : cercle plein de la couleur de la marque (si applicable) ou `--color-fg`, taille 8px à 12px

**Contrôles de carte** (zoom, géoloc) :
- Background `--color-bg-elevated`, border 1px `--color-border`
- Taille `36px × 36px`
- Border-radius `radius-md`
- Icônes en `--color-fg`, taille 16px
- Espacement entre groupes de contrôles : `space-2`

### 4.9 Toggle (switch on/off)

Pour les booléens dans les settings, ou pour basculer entre deux modes (ex: Carte / Tableau).

**Toggle binaire (carte/tableau)** : utiliser plutôt un **segmented control** :

```
┌─────────────┬─────────────┐
│   Carte     │   Tableau   │
└─────────────┴─────────────┘
```

- Container : background `--color-bg-subtle`, border 1px `--color-border`, border-radius `radius-sm`, padding 2px
- Segment actif : background `--color-bg-elevated`, ombre légère (sm), font-weight medium, couleur `--color-accent`
- Segment inactif : transparent, couleur `--color-fg-muted`
- Hauteur totale : 36px
- Transition au switch : `background-color 150ms`

### 4.10 Badge / Tag (statut)

Différent des pills (qui sont interactives). Les badges sont **passifs** et indiquent un état.

```
[ TRAIL ]   [ COMPÉTITION ]   [ PB ]
```

**Spec** :
- Hauteur : `20px`
- Padding : `0 var(--space-2)`
- Border-radius : `radius-xs` (2px) ou `radius-full` selon préférence
- Font : sans / `2xs` / medium / UPPERCASE / tracking-wide
- Variantes :
  - Neutre : bg `--color-bg-muted`, text `--color-fg-muted`
  - Accent : bg `--color-accent-bg`, text `--color-accent`
  - Success / Warning / Danger : bg avec teinte sémantique très claire, text en couleur sémantique pleine

### 4.11 Empty state

Pour les listes vides, résultats de recherche sans match.

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│   Aucune activité dans cette zone    │
│   Déplace la carte ou change         │
│   la période sélectionnée            │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

**Spec** :
- Texte centré
- Padding vertical : `space-12`
- Title : sans / sm / medium, couleur `--color-fg`
- Description : sans / sm / normal, couleur `--color-fg-muted`, max-width 280px
- Pas d'illustration. Optionnellement une icône Lucide simple en `--color-fg-subtle`, taille 32px, au-dessus du texte.

### 4.12 Loading state

**Préférer les skeleton screens aux spinners** sauf pour les actions très courtes (<300ms).

**Skeleton** : rectangle de fond `--color-bg-muted` avec animation de shimmer subtile (gradient qui passe de gauche à droite, durée 1.5s, ease-in-out, infinite).

**Spinner** (cas exceptionnel) : 16px, border 2px `--color-border` avec border-top `--color-accent`, rotation 600ms linéaire infinie.

---

## 5. Iconographie

**Bibliothèque** : `lucide-react` exclusivement. Pas de mélange avec d'autres libs (Heroicons, Tabler, etc.).

**Tailles standards** :
- `12px` : inline dans le texte (rare)
- `14px` : par défaut dans boutons et inputs
- `16px` : par défaut dans listes, navigation
- `20px` : dans contrôles de carte, gros boutons
- `24px` : empty states, icônes "héros" (rare)

**Couleurs** :
- Par défaut : `currentColor` (hérite de la couleur du texte)
- Décorative : `--color-fg-subtle`
- Active : `--color-accent`

**Stroke width** : `1.5` (valeur par défaut de Lucide). Ne pas utiliser `2` (trop lourd) ni `1` (trop fragile).

**RÈGLE STRICTE** : pas d'icône à côté d'un label si elle est purement décorative. Exemples :
- ✅ Icône loupe dans un input de recherche (utile, indique la fonction)
- ✅ Icône calendrier sur un date picker
- ❌ Icône "graphique" à côté du mot "Statistiques" dans un titre de section

---

## 6. Couleurs sémantiques — règles d'usage strict

| Couleur | Cas d'usage UNIQUEMENT |
|---|---|
| `--color-success` (vert) | Performance améliorée, statut "up", PB battu, validation de formulaire |
| `--color-warning` (ambre) | Dégradation légère, recommandation d'attention, valeur sortante de la zone optimale |
| `--color-danger` (rouge) | Erreur, blessure flag, valeur critique, suppression irréversible |
| `--color-accent` (bleu) | État actif, focus, sélection, lien primaire — **JAMAIS pour des données** |

**Couleurs des données** (logos de marques, types d'activité) : à laisser en libre, mais avec parcimonie. Maximum 5 couleurs distinctes simultanément à l'écran. Préférer toujours différencier par la **typographie ou le pictogramme** plutôt que par la couleur.

---

## 7. Patterns de page

### 7.1 Dashboard principal

```
┌─────────────────────────────────────────────────────────────┐
│ ELA DP · Running                            [theme] [user]  │  ← top bar
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ 🔍 Search    │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│              │  │ KPI 1  │ │ KPI 2  │ │ KPI 3  │ │ KPI 4  │ │
│ [Carte][Tbl] │  └────────┘ └────────┘ └────────┘ └────────┘ │
│              │                                              │
│ Distance     │  ┌────────────────────────────────────────┐  │
│ Allure       │  │                                        │  │
│ FC moyenne   │  │   Graphique principal                  │  │
│              │  │                                        │  │
│ TRAJET    ▼  │  └────────────────────────────────────────┘  │
│              │                                              │
│ ACTIVITÉS    │  ┌──────────────┐ ┌──────────────────────┐   │
│ • Item 1     │  │ Heatmap zone │ │ Distribution allures │   │
│ • Item 2     │  └──────────────┘ └──────────────────────┘   │
│ • Item 3     │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 7.2 Vue carte avec sidebar (pattern PowlFuel)

Layout 100vh, sans scroll de la page principale. La sidebar scroll en interne.

```
┌──────────────┬─────────────────────────────────────────────┐
│ Header app   │                                             │
│ search       │                                             │
│ ┌──────────┐ │                                             │
│ │Carte│Tbl │ │                                             │
│ └──────────┘ │                MAP FULL BLEED               │
│              │                                             │
│ [filters]    │                                             │
│              │                                             │
│ TRAJET    ▼  │                                             │
│              │                                             │
│ STATIONS  50 │                                             │
│ ─────────────│                                             │
│ • Item       │                                             │
│ • Item       │                                             │
│ • Item       │                                             │
│   (scroll)   │                                             │
│              │                                             │
│ Footer       │                                             │
└──────────────┴─────────────────────────────────────────────┘
```

### 7.3 Vue détail (page dédiée)

Layout centré, max-width 1200px, padding généreux. Header avec breadcrumb.

```
[Activités] / Sortie longue 28 avril 2026

# Sortie longue Vannes
12.4 km · 1h 03 · 5'02"/km · 152 bpm avg

[ Carte du parcours full width ]

[ Graphique allure / FC / dénivelé sur même axe X ]

[ Splits par km — table ]

[ Notes & observations ]
```

---

## 8. Accessibilité

- **Contraste minimum** : WCAG AA (4.5:1 pour le texte normal, 3:1 pour le texte large 18px+ ou 14px bold). La palette est calibrée pour respecter ce critère.
- **Focus visible** sur TOUS les éléments interactifs (ring 2px accent, offset 2px). Ne jamais supprimer `:focus-visible` sans alternative.
- **Targets** : taille minimum 32px de hauteur pour les éléments cliquables (boutons, list items). Idéalement 36-40px.
- **Aria labels** : chaque bouton sans texte (icon-only) DOIT avoir un `aria-label`.
- **Sémantique HTML** : `<button>` pour les actions, `<a>` pour la navigation, `<nav>` `<main>` `<aside>` pour la structure.
- **Reduced motion** : respecter `prefers-reduced-motion: reduce` en désactivant les transitions non essentielles.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Stack technique recommandé

```
- Framework      : Next.js 15+ (App Router)
- Language       : TypeScript strict
- Styling        : Tailwind CSS v4 + CSS variables (tokens ci-dessus)
- Components     : shadcn/ui (base), customisé selon ce doc
- Icons          : lucide-react
- Charts         : Recharts (avec override de palette) OU Tremor
- Maps           : MapLibre GL JS + style désaturé custom (préféré à Mapbox pour pricing)
- Date           : date-fns (locale fr)
- Tables         : TanStack Table
- Forms          : react-hook-form + zod
- Animation      : Framer Motion UNIQUEMENT pour transitions de pages, sinon CSS pur
- Fonts          : next/font avec Geist + Geist Mono (auto self-hosted)
```

### Configuration Tailwind v4 minimale

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-bg: oklch(0.99 0 0);
  --color-fg: oklch(0.18 0 0);
  /* ... reproduire toute la palette de la section 2.1 ... */

  --font-sans: 'Geist', 'Inter', system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;

  --radius-md: 6px;
  /* etc. */
}
```

---

## 10. Exemples de code (pour amorcer l'agent)

### 10.1 Composant Pill

```tsx
// components/ui/pill.tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number | string;
}

export const Pill = forwardRef<HTMLButtonElement, PillProps>(
  ({ active, count, children, className, ...props }, ref) => (
    <button
      ref={ref}
      data-active={active}
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-full border px-3",
        "text-xs font-medium transition-colors",
        "border-[--color-border] bg-[--color-bg-elevated] text-[--color-fg]",
        "hover:border-[--color-border-strong] hover:bg-[--color-bg-muted]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--color-accent]",
        "data-[active=true]:border-[--color-accent] data-[active=true]:bg-[--color-accent-bg] data-[active=true]:text-[--color-accent]",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span className="font-mono text-[11px] tabular-nums opacity-70">{count}</span>
      )}
    </button>
  )
);
Pill.displayName = "Pill";
```

### 10.2 Composant ListItem

```tsx
// components/ui/list-item.tsx
import { cn } from "@/lib/utils";

interface ListItemProps {
  avatar: { letter?: string; logo?: string; bg?: string };
  title: string;
  meta?: string;
  primaryValue: string;
  secondaryValue?: { value: string; tone?: "neutral" | "success" | "danger" };
  active?: boolean;
  onClick?: () => void;
}

export function ListItem({ avatar, title, meta, primaryValue, secondaryValue, active, onClick }: ListItemProps) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      className={cn(
        "flex w-full items-center gap-3 border-b border-[--color-border] px-4 py-3 text-left",
        "transition-colors hover:bg-[--color-bg-muted]",
        "data-[active=true]:bg-[--color-accent-bg] data-[active=true]:border-l-2 data-[active=true]:border-l-[--color-accent]"
      )}
    >
      {/* Avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        style={{ background: avatar.bg ?? "var(--color-bg-muted)" }}
      >
        {avatar.logo ? <img src={avatar.logo} alt="" className="h-full w-full rounded-full object-cover" /> : avatar.letter}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[--color-fg]">{title}</div>
        {meta && <div className="truncate text-xs text-[--color-fg-subtle]">{meta}</div>}
      </div>

      {/* Values */}
      <div className="shrink-0 text-right">
        <div className="font-mono text-sm font-medium tabular-nums text-[--color-fg]">{primaryValue}</div>
        {secondaryValue && (
          <div
            className={cn(
              "font-mono text-xs tabular-nums",
              secondaryValue.tone === "success" && "text-[--color-success]",
              secondaryValue.tone === "danger" && "text-[--color-danger]",
              (!secondaryValue.tone || secondaryValue.tone === "neutral") && "text-[--color-fg-subtle]"
            )}
          >
            {secondaryValue.value}
          </div>
        )}
      </div>
    </button>
  );
}
```

### 10.3 Composant SectionHeader

```tsx
// components/ui/section-header.tsx
interface SectionHeaderProps {
  label: string;
  count?: string;
}

export function SectionHeader({ label, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pb-2 pt-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[--color-fg-muted]">
        {label}
      </span>
      {count && (
        <span className="font-mono text-[11px] tabular-nums text-[--color-fg-subtle]">
          {count}
        </span>
      )}
    </div>
  );
}
```

---

## 11. Checklist de revue (pour valider une PR)

Avant de merger un composant ou une page, vérifier :

- [ ] Tous les chiffres lisibles utilisent `font-mono` + `tabular-nums`
- [ ] Aucune couleur hard-codée (que des variables CSS)
- [ ] Aucune ombre sur des éléments non-flottants
- [ ] Aucun `border-radius` > 12px
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Mode sombre testé
- [ ] Contraste WCAG AA respecté
- [ ] Pas plus d'1 couleur d'accent par écran (hors couleurs de marques de données)
- [ ] Hauteur minimale 32px pour les targets cliquables
- [ ] Animation respecte `prefers-reduced-motion`
- [ ] Texte tronqué a une `title` ou un tooltip
- [ ] Tableaux n'ont pas de bordures verticales
- [ ] Eyebrows en uppercase + tracking-wider
- [ ] Pas d'icône décorative à côté d'un label

---

## 12. Références visuelles

Pour calibrer l'œil de l'agent IA, voici des références publiques cohérentes avec ce style :

- **PowlFuel** (référence directe) : https://fuel.powlisher.com/
- **Linear** : https://linear.app — pour la rigueur typographique et la palette
- **Vercel Dashboard** : https://vercel.com/dashboard — pour les KPIs et les listes
- **Cron / Notion Calendar** : pour les vues calendaires et la densité
- **Inngest** : https://inngest.com — pour les dashboards de monitoring
- **Resend** : https://resend.com — pour la pureté minimaliste
- **Railway** : https://railway.app — pour les data tables denses

**À ne PAS imiter** : Stripe (trop de couleur), Notion lui-même (trop d'icônes décoratives), n'importe quel "AI startup" avec gradients violets/roses, dashboards BI traditionnels (Power BI, Tableau).

---

## Note finale pour l'agent

Si une décision n'est pas couverte par ce document : choisir l'option **la plus sobre, la plus typographique, la plus chiffrée**. Le doute se tranche toujours en faveur de moins de couleur, moins d'animation, plus de monospace pour les nombres, plus d'air autour des titres. Quand tu hésites entre deux versions, choisis celle qui ressemble le plus à un terminal Unix bien stylisé plutôt qu'à un dashboard SaaS coloré.
