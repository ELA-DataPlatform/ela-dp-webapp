@AGENTS.md
@design-system.md

# ELA DP — Webapp

Application de quantified-self : running (Garmin), musique (Spotify), santé, préparation sportive + chatbot LLM.

## Stack

- **Framework** : Next.js 16 (App Router)
- **Language** : TypeScript strict
- **Styling** : Tailwind CSS v4 + CSS variables (tokens OKLCH dans `app/globals.css`)
- **Icons** : lucide-react (stroke-width 1.5, pas d'autres libs)
- **Fonts** : Geist + Geist Mono via next/font (variables CSS `--font-geist-sans` / `--font-geist-mono`)
- **cn()** : `lib/utils.ts` (clsx + tailwind-merge)

## Design system

La source de vérité est `design-system.md`. Toute décision visuelle non couverte se tranche vers **moins de couleur, plus de monospace, plus sobre**.

### Règles absolues

- Tous les chiffres lisibles → `font-mono` + `tabular-nums`
- Aucune couleur hard-codée → uniquement les variables CSS `--color-*`
- Aucune ombre sur les cards (pas flottantes) → bordure 1px ou fond différent
- `border-radius` max 12px (`--radius-xl`)
- Accent bleu (`--color-accent`) uniquement pour état actif / focus / sélection

## Structure

```
app/
  globals.css          ← tokens OKLCH, pas de config tailwind.config.js
  layout.tsx           ← root layout : sidebar + main
  page.tsx             ← homepage

components/
  layout/
    sidebar.tsx        ← sidebar 360px
  ui/                  ← composants design system (Pill, ListItem, SectionHeader, KPICard...)

lib/
  utils.ts             ← cn()
```

## Workflow Git

- **Branche stable** : `main` — uniquement via PR depuis `develop`
- **Branche d'intégration** : `develop` — base de tout le travail
- **Branches de travail** : `feature/<sujet>` ou `fix/<sujet>`, créées depuis `develop`

```bash
git checkout develop
git checkout -b feature/ma-feature   # ou fix/mon-fix
# ... travail ...
git push -u origin feature/ma-feature
# ouvrir une PR vers develop sur GitHub
```

Ne jamais pusher directement sur `main` ou `develop`.

## Commandes

```bash
npm run dev     # localhost:3000
npm run build
npm run lint
```

## Tokens CSS

Référencer les tokens via la syntaxe CSS variable Tailwind v4 :
`bg-(--color-bg)`, `text-(--color-fg)`, `border-(--color-border)`

⚠️ Ne PAS utiliser `[--color-xxx]` (sans `var()`) — en v4 ça ne génère pas `var()` et la couleur fallback sur `currentColor`.

Dark mode : ajouter `data-theme="dark"` sur `<html>`.
