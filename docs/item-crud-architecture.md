# Item CRUD Architecture

## Scope

This document proposes a unified CRUD architecture for all 7 system item types:

- snippet
- prompt
- command
- note
- file
- image
- link

The goal is one mutation layer, one dynamic route family, shared data access patterns, and shared components that adapt by item type without scattering type-specific branching across the app.

## Current State

What exists today:

- Item data model in `prisma/schema.prisma`
- System item types seeded in `prisma/seed.ts`
- Shared dashboard item queries in `src/lib/db/items.ts`
- Shared authenticated user lookup in `src/lib/db/dashboard-user.ts`
- Sidebar links already point to `/items/${itemType.slug}`

What does not exist yet:

- `/items/[type]` pages
- item create, update, or delete actions
- item detail pages
- shared item form components
- type-specific editors or upload UI

Source note:

- `docs/content-types.md` does not exist in the current repo. The closest current source is `docs/item-types.md`.
- `src/lib/constants.tsx` does not exist. Current item-type icon mapping lives in `src/components/utils/item-type.ts`.

## Architecture Rules

### 1. Mutations live in one action file

All create, update, and delete item mutations should live in:

- `src/actions/items.ts`

That file owns:

- auth guard
- item type lookup
- input normalization
- schema validation dispatch
- Prisma writes
- collection and tag relation updates
- cache revalidation

It should not own:

- JSX
- per-type form layout
- route parsing
- UI-specific field visibility rules

### 2. Queries live in `src/lib/db`

Server components should fetch data directly from query helpers in:

- `src/lib/db/items.ts`

Recommended query surface:

- `getSidebarItemTypes()`
- `getItemsByType(typeSlug)`
- `getItemById(itemId)`
- `getItemFormData(typeSlug)`
- `getItemTypeBySlug(typeSlug)`

This matches the current repo pattern where server components call `lib/db` functions directly instead of going through API routes.

### 3. Type-specific logic lives in config and components

The mutation layer should work from a normalized item payload and a resolved item type. It should not contain separate create/update functions for snippet, prompt, command, note, file, image, and link.

Type-specific behavior should live in:

- item-type config
- form field components
- preview/display components
- upload helpers for file/image flows

That keeps the write path consistent while allowing the UI to adapt per type.

## Proposed File Structure

```text
src/
  actions/
    items.ts
  app/
    items/
      [type]/
        page.tsx
        new/
          page.tsx
        [itemId]/
          page.tsx
          edit/
            page.tsx
  components/
    items/
      item-page-header.tsx
      item-list.tsx
      item-list-row.tsx
      item-empty-state.tsx
      item-form.tsx
      item-form-fields.tsx
      item-delete-button.tsx
      item-detail.tsx
      item-preview.tsx
      text-item-fields.tsx
      file-item-fields.tsx
      link-item-fields.tsx
  lib/
    db/
      items.ts
    items/
      item-types.ts
      item-schemas.ts
      item-mappers.ts
      item-utils.ts
```

## Routing

### `/items/[type]`

Purpose:

- list items for one type
- provide a consistent entry point for create
- keep sidebar routes stable

Examples:

- `/items/snippets`
- `/items/prompts`
- `/items/commands`
- `/items/notes`
- `/items/files`
- `/items/images`
- `/items/links`

Route behavior:

1. Read `params.type`
2. Resolve it through a shared type config map
3. Reject unknown slugs with `notFound()`
4. Fetch the current user, type metadata, and typed item list from `lib/db/items.ts`
5. Render a shared list page shell with type-aware labels, colors, and actions

### `/items/[type]/new`

Purpose:

- render the create form for one type using shared page structure

Route behavior:

1. Resolve the type from the slug
2. Fetch supporting data such as collections and existing tags
3. Render one shared `ItemForm`
4. Pass the resolved type config so the form shows the right fields

### `/items/[type]/[itemId]`

Purpose:

- render one item detail page using shared layout and type-aware content preview

Route behavior:

1. Resolve the type from the slug
2. Fetch the item by id and current user
3. Verify the item belongs to the resolved type and current user
4. Render shared detail shell plus type-specific preview

### `/items/[type]/[itemId]/edit`

Purpose:

- render the edit form with the same shared `ItemForm` used for create

Route behavior:

1. Resolve the type from the slug
2. Fetch item data and supporting form data
3. Render `ItemForm` with initial values

## Type Config

Use one shared config file:

- `src/lib/items/item-types.ts`

Each type entry should define:

- singular name
- plural name
- slug
- content classification
- icon name
- color
- whether it is Pro-only
- which field group to render
- empty-state copy
- create button label

Example shape:

```ts
type ItemTypeDefinition = {
  name: string;
  pluralName: string;
  slug: string;
  contentType: "TEXT" | "FILE" | "URL";
  icon: string;
  color: string;
  isPro: boolean;
  fieldGroup: "text" | "file" | "link";
};
```

This config should be the source of truth for routing labels and UI branching.

## Mutations

All item mutations should be exported from `src/actions/items.ts`.

Recommended surface:

```ts
export async function createItem(input: CreateItemInput)
export async function updateItem(input: UpdateItemInput)
export async function deleteItem(input: DeleteItemInput)
```

Shared mutation flow:

1. Resolve the signed-in user
2. Resolve the item type from `typeSlug` or `itemTypeId`
3. Validate the input against the correct schema
4. Normalize the payload into the shared `Item` model
5. Write the item record
6. Sync item-to-collection relations
7. Sync tags if included
8. Revalidate affected routes

The key design point is that mutation logic should branch by content classification, not by 7 separate item implementations.

## Validation Split

Validation should be separated into:

- shared base item fields
- text payload fields
- file payload fields
- URL payload fields

Suggested file:

- `src/lib/items/item-schemas.ts`

Recommended schema groups:

- base schema
- text schema
- file schema
- link schema
- create schema
- update schema

That gives one consistent write path:

- snippet, prompt, command, note -> base + text
- file, image -> base + file
- link -> base + link

## Query Responsibilities

`src/lib/db/items.ts` should own read models for pages, not raw Prisma return types.

Recommended responsibilities:

- list items by type for index pages
- fetch one item for detail or edit
- fetch item type metadata by slug
- fetch supporting form data such as collections
- map Prisma records into UI-friendly objects

This follows the same pattern already used by the dashboard and collections query helpers.

## Component Responsibilities

### `item-form.tsx`

Owns:

- shared form layout
- submit action wiring
- create vs edit mode
- common fields like title, description, favorite, pinned, collections

Does not own:

- low-level type branching for individual fields

### `item-form-fields.tsx`

Owns:

- selecting the correct field group from the resolved type config

### `text-item-fields.tsx`

Owns:

- `content`
- optional `language`
- text-editor specific UI

Used by:

- snippet
- prompt
- command
- note

### `file-item-fields.tsx`

Owns:

- file picker or upload widget
- file metadata display
- upload replacement flow

Used by:

- file
- image

### `link-item-fields.tsx`

Owns:

- `url`
- optional URL-specific preview or validation hints

Used by:

- link

### `item-list.tsx` and `item-list-row.tsx`

Own:

- shared list rendering
- type-aware icon and color presentation
- actions like edit and delete

### `item-detail.tsx` and `item-preview.tsx`

Own:

- shared detail layout
- rendering the right payload preview:
  - formatted text/code
  - file metadata or preview
  - image preview
  - external link display

## Where Type-Specific Logic Lives

Keep type-specific logic in components and item config, not in actions.

Good examples:

- whether to show a markdown editor
- whether to show a language field
- whether to show a file uploader
- whether to render an image preview
- whether to show a URL input

Bad examples:

- `createSnippet`
- `createPrompt`
- `createCommand`
- `createNote`
- `createFile`
- `createImage`
- `createLink`

Those separate mutation paths would duplicate auth, validation flow, relation syncing, and revalidation.

## Normalized Payload Strategy

The action layer should translate form input into one normalized write shape:

```ts
type NormalizedItemPayload = {
  title: string;
  description?: string | null;
  isFavorite?: boolean;
  isPinned?: boolean;
  itemTypeId: string;
  contentType: "TEXT" | "FILE" | "URL";
  content?: string | null;
  language?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  url?: string | null;
  collectionIds: string[];
  tags: string[];
};
```

Once the payload is normalized, create and update become straightforward Prisma writes.

## Recommended Implementation Order

1. Add shared item type config and slug helpers
2. Expand `src/lib/db/items.ts` with item list/detail/form queries
3. Add `src/actions/items.ts` with unified create, update, delete
4. Build shared item list page at `/items/[type]`
5. Build shared create/edit form pages
6. Build shared detail page and preview components

## Summary

The cleanest structure for Korax is:

- one mutation file for all item writes
- one `lib/db/items.ts` module for item reads
- one dynamic `/items/[type]` route family
- one shared form and detail system
- type-specific behavior isolated to config and UI field components

That matches the current repo direction:

- server components fetch from `lib/db`
- Prisma stays behind shared helper modules
- sidebar routes already assume slug-driven item pages
- the schema already supports all 7 types through one `Item` model
