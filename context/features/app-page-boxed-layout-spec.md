# App Page Boxed Layout

## Overview

Standardize the main content area for all app pages rendered inside `DashboardShell`.

The goal is to give every page the same boxed, centered content treatment now used on
the dashboard, while keeping the app chrome unchanged.

This feature is only for the page main section.

Do not change:

- Sidebar
- Top bar
- Item drawer
- Drawer providers
- Mobile sidebar behavior
- Search/dialog behavior

## Goals

- Define one reusable page-main layout pattern for all app pages
- Apply the boxed content width consistently across all `DashboardShell` routes
- Remove repeated page title/description layout markup where it is duplicated
- Review the current page-main and page-layout components and keep only the ones that
  clearly own real behavior
- Avoid adding generic wrappers that do not reduce meaningful duplication

## Routes In Scope

Apply the shared boxed main-section pattern to these app routes:

- `/dashboard`
- `/collections`
- `/collections/[id]`
- `/items/[type]`
- `/favorites`
- `/profile`
- `/settings`
- `/upgrade`

## Out Of Scope

- Homepage
- Auth pages
- Sidebar refactor
- Top bar refactor
- Item drawer refactor
- Card redesigns unrelated to page main layout
- Data fetching changes
- Navigation changes

## Current Problems

- Page width is inconsistent across app routes
- Each page manually defines its own title block and spacing
- The dashboard already uses a boxed feel, but the rest of the app does not follow it
- `DashboardShell` currently mixes app chrome concerns with page content width escape
  hatches
- There are repeated empty-state containers and repeated page header patterns
- Some page content components are real feature components, while some layout concerns
  are still embedded directly in route files

## Design Direction

### 1. Keep `DashboardShell` As App Chrome

`DashboardShell` should remain responsible for:

- Sidebar
- Top bar
- Global search dialog
- Create item / create collection dialogs
- Item drawer provider
- Main scroll container

It should not become the place where each route defines its own main-section layout.

### 2. Introduce A Shared Page-Main Layout

Create a reusable layout component under `src/components/layout/` for app pages.

Recommended name:

- `AppPageShell`

This component should own:

- Centered content width for the boxed layout
- Shared horizontal spacing
- Shared vertical spacing between header and page content
- A predictable content stack for sections

Expected behavior:

- Match the dashboard’s boxed content feel
- Use one centered canvas for all pages
- Keep mobile responsive behavior intact
- Not enforce page-specific grids or cards

### 3. Introduce A Shared Page Header

Create a reusable header component under `src/components/layout/`.

Recommended name:

- `AppPageHeader`

This component should support the common route-level pattern:

- Page title
- Description, subtitle, or count text
- Optional right-side action slot

Use it for simple pages that currently repeat the same structure:

- dashboard
- collections
- items by type
- favorites
- profile
- settings

Do not force every page into the exact same header shape.

`/collections/[id]` should still be allowed to render a richer custom header inside the
shared page shell because it has:

- Collection name
- Item count
- Favorite icon
- Type breakdown
- Updated-at metadata
- Action controls

### 4. Only Extract Layout, Not Feature Logic

Keep page-level content components that already make sense:

- `FavoritesList`
- `ProfileStats`
- `UpgradePage`
- `DashboardItemsList`

These components own feature-specific UI and should not be collapsed into generic layout
abstractions.

Do not create generic wrappers like:

- `PageSection`
- `PageGrid`
- `PageContentGroup`

unless they remove real duplication across multiple routes.

## Layout Component Evaluation

### Keep

- `DashboardShell`
  - It is the correct app chrome wrapper
  - It already centralizes shared shell behavior

- Page-specific content components
  - They own domain-specific UI and should remain feature-level

### Add

- `AppPageShell`
  - Shared boxed main-section wrapper

- `AppPageHeader`
  - Shared simple page header

### Optional Add

- `AppPageEmptyState`
  - Only extract if it cleanly replaces the repeated dashed empty-state boxes
  - Keep the API minimal: title, description, optional CTA

### Do Not Add

- A large family of page layout primitives
- Generic wrappers for every section block
- Page-level shells that duplicate `DashboardShell`

## Route-By-Route Requirements

### Dashboard

- Keep the current section order and dashboard-specific content
- Move outer boxed main-section layout into the shared page shell
- Stop treating the dashboard as a one-off width implementation

### Collections List

- Replace the hand-built page title block with the shared page header
- Place the collections grid inside the shared page shell
- Use the shared empty-state component only if it is extracted cleanly

### Collection Detail

- Use the shared page shell for boxed width and outer spacing
- Keep a custom richer header instead of forcing it into the simple shared header
- Preserve section ordering for mixed items, files, images, and pagination

### Items By Type

- Replace the route-level title/count block with the shared page header
- Keep the existing `DashboardItemsList` and pagination flow

### Favorites

- Replace the route-level title/count block with the shared page header
- Keep `FavoritesList` responsible for sorting and grouped content

### Profile

- Replace the route-level title/description block with the shared page header
- Keep `ProfileInfo` and `ProfileStats` unchanged except for their parent layout context

### Settings

- Replace the route-level title/description block with the shared page header
- Keep settings sections in their current order

### Upgrade

- Apply the shared page shell
- Avoid rendering two competing page headers
- Either:
  - Move the upgrade title/description out of `UpgradePage` into the route, or
  - Add a small prop to `UpgradePage` so its internal heading can be hidden when the
    route provides the shared page header

Prefer the option that keeps `UpgradePage` reusable without duplicating headers.

## Empty-State Handling

Repeated empty-state patterns currently exist in multiple places.

Candidates:

- Collections page empty state
- Collection detail empty state
- `DashboardItemsList` empty state

If extracted, the shared empty-state component must remain simple and presentational.

If extraction creates awkward conditional APIs or forces non-identical layouts into one
component, do not extract it in this pass.

## Implementation Requirements

- Add shared page-main layout components under `src/components/layout/`
- Update each in-scope route to use the shared page-main layout
- Keep page-specific content components focused on content, not outer width and header
  duplication
- Preserve existing data queries and route behavior
- Preserve empty-state messaging unless a shared empty-state extraction makes the copy
  structure clearer
- Do not change shell-level behavior for sidebar, top bar, search, dialogs, or drawer

## Acceptance Criteria

- All `DashboardShell` routes use the same boxed main-section width treatment
- Dashboard and non-dashboard app pages feel visually aligned in width and spacing
- Common page headers are shared where the layout is actually duplicated
- Richer pages like collection detail can still render custom header content
- No sidebar, top bar, or item drawer behavior changes
- No unnecessary layout component sprawl is introduced
- Only layout duplication is abstracted; feature UI remains feature-local

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Success looks like:

- All commands pass
- All in-scope app pages have the same boxed content width
- Titles and descriptions align consistently across routes
- Mobile and desktop spacing both remain stable
- No regressions in route content, pagination, or action entry points

## References

- `src/components/dashboard/dashboard-shell.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/collections/page.tsx`
- `src/app/collections/[id]/page.tsx`
- `src/app/items/[type]/page.tsx`
- `src/app/favorites/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/upgrade/page.tsx`
