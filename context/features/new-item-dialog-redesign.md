# New Item Dialog Redesign

## Summary

Redesign the New Item dialog to align with design image `[Image #1]` while keeping current item creation behavior intact. The update should focus on visual structure, control styling, spacing consistency, and Monaco editor presentation without changing item creation payloads or validation rules.

## Design Reference

- Use design image `[Image #1]` as the visual reference for:
  - the item type dropdown treatment
  - label spacing and vertical rhythm
  - the language and collections control styling
  - the simplified editor appearance
  - the overall dark modal presentation

## Current Implementation Notes

- The create flow is implemented in `src/components/dashboard/create-item-dialog.tsx`.
- Collections are handled by `src/components/dashboard/collection-picker.tsx`.
- The shared Monaco wrapper is implemented in `src/components/ui/code-editor.tsx`.
- Editor theme preferences currently allow multiple themes and are shared across code-editor surfaces.

## Implementation Plan

### 1. Replace item type tiles with a dropdown

- Remove the current item-type radio-card grid from the create dialog.
- Replace it with a dropdown trigger and menu styled to match `[Image #1]`.
- Keep the existing type metadata, icons, and Pro-gated behavior for file and image items.
- Keep the current type-switch logic so conditional fields still update the same way they do now.

### 2. Normalize field spacing

- Make the label spacing for `Type`, `Title`, and `Language` match the spacing already used by `Description` and `Tags`.
- Keep the form visually tighter and more uniform across the full dialog.
- Preserve existing validation and helper text placement unless it conflicts with the new layout.

### 3. Align Language and Collections with the same dropdown style

- Restyle the `Language` control to use the same dropdown treatment as the new item type control.
- Restyle the `Collections` trigger and popover so it visually aligns with the same control style.
- Keep Collections as searchable multi-select.
- Preserve current selected-value summary, search behavior, and validation handling.

### 4. Remove the Content heading

- Remove the `Content` label from the create dialog.
- Let the editor or content area sit directly under the previous field with consistent spacing.
- Keep all current conditional content rendering for snippet, command, prompt, note, file, image, and link flows.

### 5. Update Monaco to default dark everywhere

- Remove the custom Monaco theme variants from the shared code editor experience.
- Standardize the shared editor on Monaco default dark (`vs-dark`) across:
  - the New Item dialog
  - edit flows that use the shared code editor
  - read-only code views that use the shared code editor
- Simplify the surrounding editor chrome so it feels closer to `[Image #1]` and less custom-themed.
- Keep current editor behaviors such as copy, explain, auto-height, read-only support, font size, tab size, word wrap, and minimap.

### 6. Clean up editor preference support

- Narrow theme support to Monaco default dark only.
- Normalize legacy stored theme values to `vs-dark` instead of treating them as invalid.
- Remove the theme picker from the editor preferences UI.
- Update related tests to reflect the single-theme model.

## Files Expected To Change During Implementation

- `src/components/dashboard/create-item-dialog.tsx`
- `src/components/dashboard/collection-picker.tsx`
- `src/components/ui/code-editor.tsx`
- `src/lib/editors/preferences.ts`
- `src/components/settings/editor-preferences-settings.tsx`
- `src/lib/editors/preferences.test.ts`
- `src/actions/editor-preferences.test.ts`

## Constraints

- Do not change item creation payloads or server action signatures.
- Do not change item-type availability rules.
- Do not change Collections behavior beyond styling.
- Do not replace Monaco with another editor.

## Risks

- Shared editor styling changes affect create, edit, and read-only code views.
- Legacy theme preference values must be normalized safely to avoid breaking saved preferences.
- Collections styling changes must not regress multi-select accessibility or search behavior.

## Done Checklist

- Item type uses a dropdown styled from `[Image #1]`.
- `Type`, `Title`, and `Language` spacing matches the cleaner spacing seen on `Description` and `Tags`.
- `Language` and `Collections` use the same dropdown visual language as item type.
- The `Content` heading is removed.
- Monaco uses default dark everywhere the shared code editor appears.
- Theme preference support is reduced to `vs-dark` and related tests are updated.

## Verification

Run:

```bash
npm run lint
npm run build
```

Manual checks:

- Open the New Item dialog and confirm the item type control matches design image `[Image #1]`.
- Confirm `Language` and `Collections` align visually with the same dropdown style.
- Confirm the `Content` heading is gone.
- Confirm snippet and command editors use Monaco default dark in create, edit, and read-only views.
- Confirm Collections still supports search and multi-select.
