import { describe, expect, it } from 'vitest';
import { normalizeSearch } from './text';

describe('normalizeSearch', () => {
  it('lowercases, trims and removes accents', () => {
    expect(normalizeSearch('  Città  ')).toBe('citta');
    expect(normalizeSearch('Père Noël')).toBe('pere noel');
  });

  it('handles empty values', () => {
    expect(normalizeSearch('')).toBe('');
    expect(normalizeSearch(null)).toBe('');
  });
});
