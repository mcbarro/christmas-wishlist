import { describe, expect, it } from 'vitest';
import { parsePriceAmount } from './price';

describe('parsePriceAmount', () => {
  it('parses Italian and English price formats', () => {
    expect(parsePriceAmount('19.99 €')).toBe(19.99);
    expect(parsePriceAmount('€ 19,99')).toBe(19.99);
    expect(parsePriceAmount('19,99 EUR')).toBe(19.99);
    expect(parsePriceAmount('1.299,00 €')).toBe(1299);
    expect(parsePriceAmount('€1,299.00')).toBe(1299);
    expect(parsePriceAmount('1 299,00')).toBe(1299);
    expect(parsePriceAmount(29.99)).toBe(29.99);
  });

  it('uses the first amount of a range', () => {
    expect(parsePriceAmount('10 - 20 €')).toBe(10);
  });

  it('returns null when there is no price', () => {
    expect(parsePriceAmount('')).toBeNull();
    expect(parsePriceAmount('Gratis')).toBeNull();
    expect(parsePriceAmount(null)).toBeNull();
  });
});
