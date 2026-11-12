import { describe, expect, it } from 'vitest';
import { formatBudgetValue, formatPrice, parsePriceAmount } from './price';

function plain(value) {
  return value.replace(/\u00a0/g, ' ');
}

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

describe('formatPrice', () => {
  it('normalizes both decimal separators and adds the euro symbol', () => {
    expect(plain(formatPrice('19.99', 'it-IT'))).toBe('19,99 €');
    expect(plain(formatPrice('19,99', 'it-IT'))).toBe('19,99 €');
    expect(plain(formatPrice('€ 59', 'it-IT'))).toBe('59 €');
    expect(plain(formatPrice('59', 'it-IT'))).toBe('59 €');
  });

  it('drops thousands separators and keeps the last separator as decimal', () => {
    expect(plain(formatPrice('1.299,00 €', 'it-IT'))).toBe('1299,00 €');
    expect(plain(formatPrice('€1,299.00', 'it-IT'))).toBe('1299,00 €');
    expect(plain(formatPrice('1 299,00', 'it-IT'))).toBe('1299,00 €');
  });

  it('treats a single dot or comma as decimal even with three digits', () => {
    expect(plain(formatPrice('1.299', 'it-IT'))).toBe('1,30 €');
  });

  it('keeps text that does not contain a number', () => {
    expect(formatPrice('Gratis', 'it-IT')).toBe('Gratis');
    expect(formatPrice('', 'it-IT')).toBe('');
  });
});

describe('formatBudgetValue', () => {
  it('does not add thousands separators', () => {
    expect(plain(formatBudgetValue(1299, 'it-IT'))).toBe('1299 €');
  });
});
