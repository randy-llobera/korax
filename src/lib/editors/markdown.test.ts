import { describe, expect, it } from 'vitest';

import { isMarkdownEditorItemType } from '@/lib/editors/markdown';

describe('isMarkdownEditorItemType', () => {
  it('returns true for note and prompt item types', () => {
    expect(isMarkdownEditorItemType('note')).toBe(true);
    expect(isMarkdownEditorItemType('prompt')).toBe(true);
  });

  it('returns false for non-markdown item types', () => {
    expect(isMarkdownEditorItemType('snippet')).toBe(false);
    expect(isMarkdownEditorItemType('command')).toBe(false);
    expect(isMarkdownEditorItemType('link')).toBe(false);
  });

  it('normalizes casing and blank values', () => {
    expect(isMarkdownEditorItemType(' Prompt ')).toBe(true);
    expect(isMarkdownEditorItemType('')).toBe(false);
    expect(isMarkdownEditorItemType(undefined)).toBe(false);
  });
});
