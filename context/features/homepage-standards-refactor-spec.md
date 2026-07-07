# Homepage Standards Refactor

## Overview

Refactor the implemented homepage in `src/components/homepage` so it follows the same architecture and styling standards as the rest of the app.

The original vanilla prototype in `prototypes/homepage` is historical reference material only. The current app implementation in `src/components/homepage` is the source of truth for content, behavior, and section structure.

## Current State

- The homepage is fully implemented at `/` through `src/app/page.tsx` and `src/components/homepage`.
- The page is split into homepage-specific components, but the implementation still carries prototype-style structure.
- Most styling lives in `src/components/homepage/homepage.module.css`.
- Components use custom class names, custom button/card styling, embedded SVGs, and inline CSS variables instead of the app's usual shadcn/Tailwind patterns.
- Client-side behavior currently exists for mobile navigation, the pricing toggle, and the hero chaos animation.

## Requirements

- Preserve the existing homepage sections:
  - nav
  - hero
  - chaos-to-dashboard visual
  - features
  - AI section
  - pricing
  - CTA
  - footer
- Preserve current copy, routes, anchors, and auth-aware CTA behavior unless a change is required by the refactor.
- Use Tailwind CSS utilities for styling.
- Use existing shadcn/ui primitives where applicable:
  - `Button`
  - `Card`
  - `CardHeader`
  - `CardContent`
  - `CardTitle`
  - `CardDescription`
  - `Badge`
  - `Sheet` for mobile navigation if appropriate
- Add shadcn primitives only through the shadcn CLI if a needed primitive is not already present.
- Use `lucide-react` icons where available.
- Keep custom SVGs only for brand icons that do not exist in lucide.
- Remove `homepage.module.css` after all imports and `styles.*` usages are gone.
- Do not introduce new folders or broad abstractions.

## Component Boundaries

- `src/app/page.tsx` must remain a server component.
- Static homepage sections should remain server-rendered:
  - page shell
  - hero copy
  - features
  - AI section
  - CTA
  - footer
- Client components should be limited to behavior that requires browser APIs or state:
  - mobile nav toggle
  - pricing billing toggle
  - chaos animation
- Keep the chaos animation DOM/`requestAnimationFrame` logic isolated in its client component.

## Implementation Notes

- Replace CSS module layout and styling with Tailwind classes using existing design tokens:
  - `bg-background`
  - `bg-card`
  - `bg-muted`
  - `border-border`
  - `text-foreground`
  - `text-muted-foreground`
  - `primary`
- Prefer local data arrays plus small local rendering helpers over generic homepage abstractions.
- Extract reusable homepage pieces only where duplication is real, such as a section wrapper or pricing card.
- Avoid inline styles except where dynamic runtime values are necessary for animation or item-type colors.
- Keep responsive behavior equivalent to the current homepage:
  - desktop horizontal hero visual
  - mobile stacked hero visual
  - mobile arrow rotation
  - single-column mobile grids
  - usable mobile nav

## Risks

- Visual spacing may shift when replacing CSS module rules with Tailwind utilities.
- The hero animation can regress if transform styles or container sizing change.
- Removing inline CSS variables may affect accent colors if not mapped carefully.
- Replacing custom mobile nav with `Sheet` may alter focus behavior or layout if not checked.

## Test Plan

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build`.
- Verify no CSS module usage remains:
  - `rg "homepage.module.css|styles\\." src/components/homepage`
- Manually verify `/` at mobile and desktop widths:
  - nav links and auth-aware buttons work
  - mobile nav opens and closes
  - hero animation renders and moves
  - pricing toggle updates monthly/yearly pricing
  - sections stack correctly on mobile
  - no text or UI overlaps

## Done Checklist

- `src/components/homepage` uses Tailwind classes and app design tokens instead of `homepage.module.css`.
- Existing shadcn primitives replace custom homepage buttons, cards, badges, and mobile navigation where appropriate.
- Server/client boundaries follow Next.js App Router standards.
- Homepage content, routes, anchors, and core behavior are preserved.
- `homepage.module.css` is deleted after all usages are removed.
- Typecheck, lint, and build pass.
