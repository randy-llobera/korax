# Item Types

## Overview

Korax currently defines 7 system item types:

| Type | Icon | Color | Content classification | Main purpose |
| --- | --- | --- | --- | --- |
| snippet | `Code` | `#3b82f6` | Text | Store reusable code or config blocks |
| prompt | `Sparkles` | `#8b5cf6` | Text | Store AI prompts and prompt templates |
| command | `Terminal` | `#f97316` | Text | Store shell or CLI commands |
| note | `StickyNote` | `#fde047` | Text | Store freeform written notes |
| file | `File` | `#6b7280` | File | Store uploaded non-image files |
| image | `Image` | `#ec4899` | File | Store uploaded images |
| link | `Link` | `#10b981` | URL | Store external URLs |

These types are seeded as immutable system types in `item_types` and are ordered in the sidebar as: snippet, prompt, command, note, file, image, link.

## Source Of Truth

- Schema: `prisma/schema.prisma`
- Seeded system types and example items: `prisma/seed.ts`
- Current icon mapping: `src/components/utils/item-type.ts`
- Current sidebar and dashboard rendering: `src/lib/db/items.ts`, `src/components/layout/sidebar.tsx`, `src/components/dashboard/dashboard-pinned-item-card.tsx`, `src/components/dashboard/dashboard-recent-item-row.tsx`

Note: the research prompt references `src/lib/constants.tsx`, but that file does not exist in the current codebase. The live icon mapping is in `src/components/utils/item-type.ts`.

## Shared Item Model

All item types use the same `Item` model and share these fields:

- `id`
- `title`
- `description`
- `isFavorite`
- `isPinned`
- `createdAt`
- `updatedAt`
- `userId`
- `itemTypeId`
- `tags`
- `collections`

The `itemType` relation provides the type metadata used by the UI:

- `name`
- `icon`
- `color`
- `isSystem`

## Content Classification

The schema uses `contentType` to decide which primary value field matters:

| Classification | Schema fields used | Types |
| --- | --- | --- |
| `TEXT` | `content`, optional `language`, optional `description` | snippet, prompt, command, note |
| `FILE` | `fileUrl`, `fileName`, `fileSize`, optional `description` | file, image |
| `URL` | `url`, optional `description` | link |

### Text vs file vs URL

- Text items keep their main payload in `content`.
- File items keep their main payload in file metadata plus a storage URL.
- URL items keep their main payload in `url`.
- `description` is cross-type supporting metadata, not the primary payload.
- `language` appears to be intended mainly for code-like text items such as snippets.

## Per-Type Details

### 1. Snippet

- Icon: `Code`
- Color: `#3b82f6`
- Classification: `TEXT`
- Purpose: reusable code, config, or technical examples
- Key fields used:
  - `title`
  - `content`
  - `language`
  - `description`
  - `itemTypeId`
- Seed examples:
  - `useDebounce Hook`
  - `useLocalStorage Hook`
  - `Compound Component Pattern`
  - `Docker Compose - Node.js + PostgreSQL`

### 2. Prompt

- Icon: `Sparkles`
- Color: `#8b5cf6`
- Classification: `TEXT`
- Purpose: reusable AI prompts and structured prompt templates
- Key fields used:
  - `title`
  - `content`
  - `description`
  - `itemTypeId`
- Seed examples:
  - `Code Review Assistant`
  - `Documentation Generator`
  - `Refactoring Assistant`

### 3. Command

- Icon: `Terminal`
- Color: `#f97316`
- Classification: `TEXT`
- Purpose: shell commands, deployment commands, and quick CLI references
- Key fields used:
  - `title`
  - `content`
  - `description`
  - `itemTypeId`
- Seed examples:
  - `Deploy to Production`
  - `Git Undo Last Commit (Keep Changes)`
  - `Docker Cleanup`
  - `Kill Process on Port`
  - `Check Outdated Packages`

### 4. Note

- Icon: `StickyNote`
- Color: `#fde047`
- Classification: `TEXT`
- Purpose: general written notes
- Key fields used:
  - `title`
  - `content`
  - `description`
  - `itemTypeId`
- Seed examples:
  - None in `prisma/seed.ts`

### 5. File

- Icon: `File`
- Color: `#6b7280`
- Classification: `FILE`
- Purpose: uploaded documents or other non-image files
- Key fields used:
  - `title`
  - `fileUrl`
  - `fileName`
  - `fileSize`
  - `description`
  - `itemTypeId`
- Seed examples:
  - None in `prisma/seed.ts`

### 6. Image

- Icon: `Image`
- Color: `#ec4899`
- Classification: `FILE`
- Purpose: uploaded image assets
- Key fields used:
  - `title`
  - `fileUrl`
  - `fileName`
  - `fileSize`
  - `description`
  - `itemTypeId`
- Seed examples:
  - None in `prisma/seed.ts`

### 7. Link

- Icon: `Link`
- Color: `#10b981`
- Classification: `URL`
- Purpose: external references and documentation links
- Key fields used:
  - `title`
  - `url`
  - `description`
  - `itemTypeId`
- Seed examples:
  - `Docker Documentation`
  - `GitHub Actions Documentation`
  - `Tailwind CSS Documentation`
  - `shadcn/ui Components`
  - `Radix UI Primitives`
  - `Lucide Icons`

## Current Display Differences

### Sidebar

The sidebar uses the item type metadata to render:

- pluralized labels such as `Snippets` and `Prompts`
- route slugs such as `/items/snippets` and `/items/prompts`
- Lucide icons from `src/components/utils/item-type.ts`
- icon color from `itemType.color`
- per-type item counts

The sidebar also marks these types as Pro-only:

- `files`
- `images`

### Dashboard item cards and rows

Pinned cards and recent rows currently do not branch on type-specific content fields. They display all item types through the same shared presentation:

- title
- description fallback
- collection badge
- item type badge
- item type icon
- item type color accent

In practice, current dashboard differentiation is visual, not structural:

- pinned cards use a colored left border
- recent rows use the type color on the icon container border
- both surfaces show the type badge using `itemType.name`

## Practical Summary

### Shared properties

Every item type shares:

- identity and ownership fields
- favorite and pinned state
- timestamps
- tags and collection membership
- visual metadata from `ItemType`

### Type-specific payload fields

- Text types use `content`
- Snippets additionally benefit from `language`
- File and image types use `fileUrl`, `fileName`, `fileSize`
- Link uses `url`

### Current gaps

- `note`, `file`, and `image` are defined as system types but have no seed examples.
- The current research prompt source list is stale because `src/lib/constants.tsx` has been replaced by `src/components/utils/item-type.ts`.
- The reviewed UI code uses shared card and row rendering for all item types; it does not yet expose type-specific previews for file, image, or link payloads.
