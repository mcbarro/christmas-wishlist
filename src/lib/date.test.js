import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeDate } from './date';

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-09T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats relative dates in English', () => {
    expect(formatRelativeDate('2026-11-07T12:00:00.000Z', 'en')).toBe(
      '2 days ago'
    );
    expect(formatRelativeDate('2026-11-08T12:00:00.000Z', 'en')).toBe(
      'yesterday'
    );
  });

  it('formats relative dates in Italian', () => {
    expect(formatRelativeDate('2026-11-06T12:00:00.000Z', 'it')).toBe(
      '3 giorni fa'
    );
  });

  it('returns an empty string for invalid values', () => {
    expect(formatRelativeDate('', 'en')).toBe('');
    expect(formatRelativeDate('not-a-date', 'en')).toBe('');
  });
});
