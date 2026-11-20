import { describe, expect, it } from 'vitest';
import { isUsableImageUrl } from './image';

describe('isUsableImageUrl', () => {
  it('accepts normal product images', () => {
    expect(
      isUsableImageUrl(
        'https://m.media-amazon.com/images/I/61kiWKfZurL._AC_SX569_.jpg'
      )
    ).toBe(true);
    expect(
      isUsableImageUrl('https://www.lidl.it/assets/example.png')
    ).toBe(true);
  });

  it('rejects empty values and non-http URLs', () => {
    expect(isUsableImageUrl('')).toBe(false);
    expect(isUsableImageUrl(null)).toBe(false);
    expect(isUsableImageUrl('data:image/png;base64,abc')).toBe(false);
  });

  it('rejects Amazon tracking pixels and sprites', () => {
    expect(
      isUsableImageUrl(
        'https://fls-eu.amazon.it/1/batch/1/OP/APJ6JRA9NG5V4:123$uedata=s:abc'
      )
    ).toBe(false);
    expect(
      isUsableImageUrl(
        'https://m.media-amazon.com/images/G/29/gno/sprites/nav-sprite.png'
      )
    ).toBe(false);
  });
});
