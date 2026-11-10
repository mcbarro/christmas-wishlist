import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAmazonWishlist,
  isAmazonWishlistUrl,
  normalizeAmazonProductUrl,
  parseAmazonWishlistText,
} from './amazonImport';

const wishlistText = `Title: Check out my list on Amazon

![Image](https://m.media-amazon.com/images/I/first.jpg)
## [First link text](https://www.amazon.it/-/en/dp/AAAAAAAAAA/?coliid=X&colid=Y&psc=1&ref=z "Full first title")
by Brand [rating] €29.69€29.69 **FREE Delivery**

![Image](https://m.media-amazon.com/images/I/second.jpg)
## [Second link text](https://www.amazon.it/-/en/dp/BBBBBBBBBB/?coliid=X&colid=Y&psc=1&ref=z "Full second title (Pack of 2)")
by Brand [rating] € 10,00
`;

describe('isAmazonWishlistUrl', () => {
  it('accepts public Amazon wishlist links', () => {
    expect(
      isAmazonWishlistUrl(
        'https://www.amazon.it/hz/wishlist/ls/3V73DZSL3A84V?ref_=wl_share'
      )
    ).toBe(true);
    expect(
      isAmazonWishlistUrl(
        'https://www.amazon.co.uk/gp/registry/wishlist/ABC123'
      )
    ).toBe(true);
  });

  it('rejects non-wishlist or non-Amazon links', () => {
    expect(
      isAmazonWishlistUrl('https://www.amazon.it/dp/B0CYSS48K4')
    ).toBe(false);
    expect(
      isAmazonWishlistUrl('https://example.com/hz/wishlist/ls/ABC123')
    ).toBe(false);
    expect(
      isAmazonWishlistUrl('https://amazon.evil.com/hz/wishlist/ls/ABC123')
    ).toBe(false);
    expect(
      isAmazonWishlistUrl('http://www.amazon.it/hz/wishlist/ls/ABC123')
    ).toBe(false);
  });
});

describe('normalizeAmazonProductUrl', () => {
  it('normalizes the product URL to the ASIN form', () => {
    expect(
      normalizeAmazonProductUrl(
        'https://www.amazon.it/-/en/dp/B0CYSS48K4/?coliid=X&ref=z',
        'www.amazon.it'
      )
    ).toBe('https://www.amazon.it/dp/B0CYSS48K4');
  });
});

describe('parseAmazonWishlistText', () => {
  it('extracts items, full titles, prices and images', () => {
    const items = parseAmazonWishlistText(
      wishlistText,
      'https://www.amazon.it/hz/wishlist/ls/3V73DZSL3A84V'
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      asin: 'AAAAAAAAAA',
      title: 'Full first title',
      url: 'https://www.amazon.it/dp/AAAAAAAAAA',
      price: '€29.69',
      image_url: 'https://m.media-amazon.com/images/I/first.jpg',
    });
    expect(items[1]).toMatchObject({
      asin: 'BBBBBBBBBB',
      title: 'Full second title (Pack of 2)',
      url: 'https://www.amazon.it/dp/BBBBBBBBBB',
      price: '€ 10,00',
      image_url: 'https://m.media-amazon.com/images/I/second.jpg',
    });
  });

  it('deduplicates repeated ASINs', () => {
    const repeated = `${wishlistText}
## [Duplicate](https://www.amazon.it/dp/AAAAAAAAAA/?ref=again "Duplicate title")
`;
    const items = parseAmazonWishlistText(
      repeated,
      'https://www.amazon.it/hz/wishlist/ls/3V73DZSL3A84V'
    );
    expect(items).toHaveLength(2);
  });
});

describe('fetchAmazonWishlist', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and merges the parsed items', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => wishlistText,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAmazonWishlist(
      'https://www.amazon.it/hz/wishlist/ls/3V73DZSL3A84V'
    );

    expect(result.items).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('reports a private list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'Accedi per vedere la tua lista',
      })
    );

    await expect(
      fetchAmazonWishlist(
        'https://www.amazon.it/hz/wishlist/ls/3V73DZSL3A84V'
      )
    ).rejects.toMatchObject({ code: 'PRIVATE_LIST' });
  });

  it('reports an empty list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'Title: Wishlist\nNo products here',
      })
    );

    await expect(
      fetchAmazonWishlist(
        'https://www.amazon.it/hz/wishlist/ls/3V73DZSL3A84V'
      )
    ).rejects.toMatchObject({ code: 'NO_ITEMS' });
  });

  it('rejects an invalid URL before fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchAmazonWishlist('https://example.com/list')
    ).rejects.toMatchObject({ code: 'INVALID_URL' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
