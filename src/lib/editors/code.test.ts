import { describe, expect, it } from 'vitest';

import {
  getCodeEditorLanguage,
  getCodeEditorLanguageOptions,
  getCodeEditorWordWrap,
  isCodeEditorItemType,
} from '@/lib/editors/code';

describe('isCodeEditorItemType', () => {
  it('returns true for snippet and command item types', () => {
    expect(isCodeEditorItemType('snippet')).toBe(true);
    expect(isCodeEditorItemType('command')).toBe(true);
  });

  it('returns false for non-code item types', () => {
    expect(isCodeEditorItemType('note')).toBe(false);
    expect(isCodeEditorItemType('prompt')).toBe(false);
    expect(isCodeEditorItemType('link')).toBe(false);
  });
});

describe('getCodeEditorLanguage', () => {
  it('maps known language aliases to Monaco languages and labels', () => {
    expect(getCodeEditorLanguage('ts', 'snippet')).toEqual({
      editorLanguage: 'typescript',
      label: 'TypeScript',
    });

    expect(getCodeEditorLanguage('bash', 'command')).toEqual({
      editorLanguage: 'shell',
      label: 'Bash',
    });
  });

  it('falls back to shell for commands without an explicit language', () => {
    expect(getCodeEditorLanguage('', 'command')).toEqual({
      editorLanguage: 'shell',
      label: 'Shell',
    });
  });

  it('preserves unknown custom language labels while using plaintext mode', () => {
    expect(getCodeEditorLanguage('Custom DSL', 'snippet')).toEqual({
      editorLanguage: 'plaintext',
      label: 'Custom DSL',
    });
  });
});

describe('getCodeEditorLanguageOptions', () => {
  it('returns shared dropdown options for known languages', () => {
    expect(getCodeEditorLanguageOptions()).toContainEqual({
      value: 'typescript',
      label: 'TypeScript',
    });
    expect(getCodeEditorLanguageOptions()).toContainEqual({
      value: 'shell',
      label: 'Shell',
    });
  });

  it('preserves unknown saved languages in the dropdown', () => {
    expect(getCodeEditorLanguageOptions('Custom DSL')).toContainEqual({
      value: 'Custom DSL',
      label: 'Custom DSL',
    });
  });
});

describe('getCodeEditorWordWrap', () => {
  it('maps editor preference booleans to Monaco word wrap values', () => {
    expect(getCodeEditorWordWrap(true)).toBe('on');
    expect(getCodeEditorWordWrap(false)).toBe('off');
  });
});
