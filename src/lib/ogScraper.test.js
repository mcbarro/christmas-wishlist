import { describe, expect, it } from 'vitest';
import { extractPrice } from './ogScraper';

describe('extractPrice', () => {
  it('extracts common price shapes', () => {
    expect(extractPrice({ price: 29.99 })).toBe('29.99');
    expect(extractPrice({ offers: { price: '€ 10,00' } })).toBe('€ 10,00');
    expect(extractPrice({ product: { offers: [{ price: '15.00' }] } })).toBe(
      '15.00'
    );
  });

  it('returns an empty string when no price exists', () => {
    expect(extractPrice({})).toBe('');
    expect(extractPrice(null)).toBe('');
  });
});
