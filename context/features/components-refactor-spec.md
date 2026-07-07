# Components Refactor

## Overview

Refactor duplicated component patterns in `src/components` while keeping UI flow explicit and easy to follow. Extract small shared pieces where they improve clarity, reuse, and maintenance. Avoid broad generic abstractions that make create/edit flows brittle or obscure.

## Requirements

### Component Strategy

- Keep the app shadcn-first.
- Before creating any custom component, check whether an existing shadcn component already fits the need.
- Use existing shadcn primitives such as `Button`, `Input`, `Textarea`, `Dialog`, `Sheet`, `DropdownMenu`, `Command`, `Badge`, `Card`, and `AlertDialog` when possible.
- Add any shadcn component that hasn't been previously added if you find it usefull for our app. Use context7 MCP if you need to.
- Any existing component that can be replaced or can use an existing shadcn primitive or non-existing shadcn candidate should be removed and a shadcn component must be used in its place.
- Create custom components only when they wrap existing app behavior, reduce real duplication, or compose shadcn primitives for a repeated app-specific pattern.

### Dashboard Form Cleanup

- Extract duplicated field error rendering into a shared dashboard form component.
- Extract duplicated item language dropdown behavior from create/edit item flows.
- Extract focused item form sections shared by create and edit flows:
  - title
  - description with AI summary button
  - dynamic content/language/url fields
  - tags with AI suggestions
- Keep file upload, create-only item type picker, drawer metadata, drawer actions, and dialog/sheet layout in their parent components.
- Avoid one generic item form component that hides create/edit-specific behavior.

### Item Form Helpers

Move data-only item form logic into `src/lib/items/form.ts` where appropriate:

- default language labels
- content placeholders
- create payload construction
- update payload construction
- payload inclusion rules based on item type

Helpers must stay pure:

- no React
- no browser APIs
- no server actions
- no UI state

### Shared UI and Behavior

- Extract shared optimistic toggle behavior used by favorite and pin buttons, while keeping separate button components for clear copy, icons, and styling.
- Extract small item identity UI only where it reduces duplication without forcing one row/card layout.
- Clean up `global-search-dialog.tsx` indentation and readability.
- Extract narrow editor shell pieces shared by code and markdown editors:
  - window dots
  - copy button
  - tab button styling
  - shared markdown render components where visual output should match
- Keep Monaco sizing in `code-editor.tsx` and textarea/preview sizing in `markdown-editor.tsx`.

### Auth and Billing Cleanup

- Extract auth form primitives:
  - error alert
  - divider
  - GitHub button
  - icon input row
- Keep each auth flow's validation and submit logic inline.
- Extract billing redirect logic to a client-safe helper in `src/lib/billing`.
- Share billing status copy where both settings and upgrade pages use the same message.

## Risks

- Over-extracting item forms could make simple create/edit flows harder to reason about.
- Editor shell extraction could accidentally change visual behavior.
- Toggle helper must preserve optimistic rollback, search invalidation, `router.refresh()`, and `onToggled`.
- Billing redirect helper must remain client-safe because it uses `window.location.href`.

## Test Plan

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run test`.
- Add or update focused unit tests for pure helpers in `src/lib/items/form.ts`.
- Manually verify:
  - create snippet, prompt, command, note, link, file, and image items
  - edit those item types in the drawer
  - favorite and pin from cards, rows, and drawer
  - markdown/code editor copy, tabs, AI explain, and prompt optimization controls
  - billing checkout and portal buttons
  - register, sign in, and reset password forms

## Done Checklist

- Duplicate item form field code is reduced without hiding create/edit flow differences.
- Shared helpers live in `src/lib` only when they are pure logic.
- shadcn primitives are reused before introducing custom UI.
- Favorite/pin, editor, auth, billing, and search/card duplication is reduced where it stays simple.
- Typecheck, lint, and tests pass.
