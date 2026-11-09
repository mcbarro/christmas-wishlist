import { describe, expect, it } from 'vitest';
import {
  extractFirstUrl,
  getHostname,
  isValidHttpUrl,
  normalizeUrl,
  stripUrls,
} from './url';

describe('normalizeUrl', () => {
  it('adds https to bare domains', () => {
    expect(normalizeUrl('example.com/product')).toBe(
      'https://example.com/product'
    );
  });

  it('keeps valid http and https URLs', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
    expect(normalizeUrl('https://example.com/a?b=1')).toBe(
      'https://example.com/a?b=1'
    );
  });

  it('rejects non-http protocols', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBe('');
    expect(normalizeUrl('mailto:test@example.com')).toBe('');
  });

  it('returns an empty string for blank or malformed values', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('   ')).toBe('');
    expect(normalizeUrl(null)).toBe('');
    expect(normalizeUrl('not a url')).toBe('');
  });
});

describe('isValidHttpUrl', () => {
  it('validates web URLs', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('example.com')).toBe(true);
    expect(isValidHttpUrl('not a url')).toBe(false);
  });
});

describe('extractFirstUrl', () => {
  it('extracts the first URL from shared text', () => {
    expect(
      extractFirstUrl('Look at this: https://example.com/gift?x=1, thanks!')
    ).toBe('https://example.com/gift?x=1');
  });

  it('returns an empty string when no URL exists', () => {
    expect(extractFirstUrl('Just a note')).toBe('');
    expect(extractFirstUrl(null)).toBe('');
  });
});

describe('stripUrls', () => {
  it('removes URLs and normalizes whitespace', () => {
    expect(
      stripUrls('  A nice gift https://example.com/gift   for grandma  ')
    ).toBe('A nice gift for grandma');
  });
});

describe('getHostname', () => {
  it('returns a hostname without the www prefix', () => {
    expect(getHostname('https://www.example.com/gift')).toBe('example.com');
    expect(getHostname('')).toBe('');
  });
});
