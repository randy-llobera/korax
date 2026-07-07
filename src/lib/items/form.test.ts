import { describe, expect, it } from 'vitest';

import {
  buildCreateItemPayload,
  buildUpdateItemPayload,
  getDefaultCodeLanguageLabel,
  getItemContentPlaceholder,
  getItemFormCapabilities,
  isContentItemType,
  isFileItemType,
  isLanguageItemType,
  isUrlItemType,
  parseItemTagsInput,
  resetItemFormValuesForType,
} from '@/lib/items/form';

describe('item-form helpers', () => {
  it('parses comma-separated tags and removes duplicates', () => {
    expect(parseItemTagsInput(' react, prisma, react , , auth ')).toEqual([
      'react',
      'prisma',
      'auth',
    ]);
  });

  it('matches item form modes case-insensitively', () => {
    expect(isContentItemType('Snippet')).toBe(true);
    expect(isLanguageItemType('COMMAND')).toBe(true);
    expect(isFileItemType('image')).toBe(true);
    expect(isUrlItemType('link')).toBe(true);
    expect(isUrlItemType('note')).toBe(false);
  });

  it('returns field capabilities for an item type', () => {
    expect(getItemFormCapabilities('prompt')).toEqual({
      hasContent: true,
      hasFile: false,
      hasLanguage: false,
      hasMarkdown: true,
      hasUrl: false,
    });
    expect(getItemFormCapabilities('link')).toMatchObject({
      hasContent: false,
      hasUrl: true,
    });
  });

  it('returns editor labels and placeholders from item type', () => {
    expect(getDefaultCodeLanguageLabel('command')).toBe('Default (Shell)');
    expect(getDefaultCodeLanguageLabel('snippet')).toBe('Plain text');
    expect(getItemContentPlaceholder('prompt')).toBe('Write the prompt text');
    expect(getItemContentPlaceholder('note')).toBe('Write your note');
    expect(getItemContentPlaceholder('snippet')).toBe('Paste the content here');
  });

  it('clears stale type-specific values when changing item type', () => {
    expect(
      resetItemFormValuesForType(
        {
          content: 'content',
          language: 'typescript',
          title: 'Title',
          url: 'https://example.com',
        },
        'link',
      ),
    ).toEqual({
      content: '',
      language: '',
      title: 'Title',
      url: 'https://example.com',
    });
  });

  it('builds create payloads with only fields supported by the item type', () => {
    expect(
      buildCreateItemPayload({
        collectionIds: ['collection-1'],
        content: 'const value = true;',
        description: 'Example',
        itemType: 'snippet',
        language: 'typescript',
        tags: ['react'],
        title: 'Snippet',
        url: 'https://example.com',
      }),
    ).toEqual({
      collectionIds: ['collection-1'],
      content: 'const value = true;',
      description: 'Example',
      itemType: 'snippet',
      language: 'typescript',
      tags: ['react'],
      title: 'Snippet',
    });
  });

  it('builds create file payloads with uploaded file metadata', () => {
    expect(
      buildCreateItemPayload({
        collectionIds: [],
        content: 'stale',
        description: '',
        fileName: 'diagram.png',
        fileSize: 1234,
        fileUrl: 'https://storage.example.com/diagram.png',
        itemType: 'image',
        language: 'typescript',
        tags: [],
        title: 'Diagram',
        url: 'https://example.com',
      }),
    ).toEqual({
      collectionIds: [],
      description: '',
      fileName: 'diagram.png',
      fileSize: 1234,
      fileUrl: 'https://storage.example.com/diagram.png',
      itemType: 'image',
      tags: [],
      title: 'Diagram',
    });
  });

  it('builds update payloads with item-type-specific fields only', () => {
    expect(
      buildUpdateItemPayload({
        collectionIds: ['collection-1'],
        content: 'stale',
        description: 'A useful link',
        itemType: 'link',
        language: 'typescript',
        tags: ['docs'],
        title: 'Docs',
        url: 'https://example.com/docs',
      }),
    ).toEqual({
      collectionIds: ['collection-1'],
      description: 'A useful link',
      tags: ['docs'],
      title: 'Docs',
      url: 'https://example.com/docs',
    });
  });
});
