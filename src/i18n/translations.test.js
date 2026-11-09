import { describe, expect, test } from 'vitest';
import en from './en';
import it from './it';

function placeholders(value) {
  return [...String(value).matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort();
}

describe('translations', () => {
  test('has exactly the same keys in English and Italian', () => {
    expect(Object.keys(it).sort()).toEqual(Object.keys(en).sort());
  });

  test('has non-empty strings for every key', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en.${key}`).toBeTypeOf('string');
      expect(value.trim(), `en.${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(it)) {
      expect(value, `it.${key}`).toBeTypeOf('string');
      expect(value.trim(), `it.${key}`).not.toBe('');
    }
  });

  test('uses the same interpolation placeholders in both languages', () => {
    for (const key of Object.keys(en)) {
      expect(placeholders(it[key]), `it.${key}`).toEqual(
        placeholders(en[key])
      );
    }
  });
});
