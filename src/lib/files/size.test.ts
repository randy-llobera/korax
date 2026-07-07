import { describe, expect, it } from 'vitest';

import { formatFileSize } from '@/lib/files/size';

describe('formatFileSize', () => {
  it('returns null for missing or invalid sizes', () => {
    expect(formatFileSize(null)).toBeNull();
    expect(formatFileSize(undefined)).toBeNull();
    expect(formatFileSize(0)).toBeNull();
  });

  it('formats bytes and larger units', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
  });
});
