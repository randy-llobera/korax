# Homepage Spec

## Overview

Implement the real marketing homepage at `/` using the mockup in `prototypes/homepage/` as the visual reference.

## Requirements

- Replace the placeholder in `src/app/page.tsx` with the actual homepage.
- Match the mockup structure: sticky nav, hero, features, AI section, pricing, CTA, footer.
- Use Tailwind and existing shadcn/ui primitives where they fit the current codebase.
- Keep the implementation clean and DRY. Extract repeated UI into small homepage-specific components only where reuse is real.
- Split the page into server and client components:
  - Server components for the page shell and static marketing sections.
  - Client components only where needed for interactivity or animation.
- Preserve the current app visual language instead of dropping in raw prototype HTML/CSS/JS.

## Component Boundaries

- `src/app/page.tsx` should stay a server component.
- Keep mostly static sections server-rendered:
  - nav shell
  - hero copy and CTA copy
  - features grid
  - AI section
  - pricing section
  - final CTA
  - footer
- Use client components only for:
  - mobile nav toggle
  - chaos animation in the hero
  - pricing billing toggle if implemented as interactive UI
  - scroll/visibility effects only if they require client state

## Navigation and Destinations

- Logo links to `/`.
- Nav links scroll to section anchors on the homepage:
  - `#features`
  - `#pricing`
- Guest actions:
  - `Sign In` -> `/sign-in`
  - `Get Started` / `Get Started Free` -> `/register`
- If the user is already signed in, primary CTA buttons should go to `/dashboard`.
- Footer links should only use real routes or homepage anchors that exist in the app after implementation. Do not leave `#` placeholders.

## Content and UI Notes

- Use the mockup content and layout as the baseline.
- Keep the hero "chaos to order" concept, including the animated chaos area, transform arrow, and dashboard preview.
- Reuse the project item type colors where appropriate so the marketing page matches the product.
- Pricing should reflect the mockup:
  - Free tier
  - Pro tier
  - monthly and yearly presentation
- The homepage should be responsive and preserve the mockup’s mobile stacking behavior.

## References

- `prototypes/homepage/index.html`
- `prototypes/homepage/styles.css`
- `prototypes/homepage/script.js`
- `src/app/page.tsx`
- `src/app/(auth)/sign-in/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/dashboard/page.tsx`
