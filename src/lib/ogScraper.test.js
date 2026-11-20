import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanTitle,
  extractPrice,
  extractPriceFromText,
  fetchUrlMetadata,
  isAmazonProductUrl,
  isAmazonShortUrl,
  parseAmazonProductText,
} from './ogScraper';

describe('extractPrice', () => {
  it('extracts common price shapes', () => {
    expect(extractPrice({ price: 29.99 })).toBe('29.99');
    expect(extractPrice({ offers: { price: '€ 10,00' } })).toBe('€ 10,00');
    expect(extractPrice({ product: { offers: [{ price: '15.00' }] } })).toBe(
      '15.00'
    );
  });

  it('falls back to the description when there is no structured price', () => {
    expect(
      extractPrice({
        title: 'Parkside | Levigatrice a penna multifunzione ricaricabile - Lidl',
        description:
          'Levigatrice a penna multifunzione ricaricabile - 19.99 €\n(10.11.2026)',
      })
    ).toBe('19.99 €');
  });

  it('returns an empty string when no price exists', () => {
    expect(extractPrice({})).toBe('');
    expect(extractPrice(null)).toBe('');
  });
});

describe('extractPriceFromText', () => {
  it('finds Italian and English price formats', () => {
    expect(
      extractPriceFromText(
        'Levigatrice a penna multifunzione ricaricabile - 19.99 €\n(10.11.2026)'
      )
    ).toBe('19.99 €');
    expect(extractPriceFromText('Prezzo € 1.299,00')).toBe('€ 1.299,00');
    expect(extractPriceFromText('Only 19,99 EUR today')).toBe('19,99 EUR');
  });

  it('does not treat a date as a price', () => {
    expect(extractPriceFromText('Disponibile dal 10.11.2026')).toBe('');
  });
});

describe('cleanTitle', () => {
  it('removes the shop suffix and brand prefix', () => {
    expect(
      cleanTitle(
        'Parkside | Levigatrice a penna multifunzione ricaricabile - Lidl',
        'LIDL',
        'Parkside'
      )
    ).toBe('Levigatrice a penna multifunzione ricaricabile');
  });

  it('keeps a title that has nothing to trim', () => {
    expect(cleanTitle('A nice gift', '', '')).toBe('A nice gift');
  });

  it('keeps the original title if trimming would empty it', () => {
    expect(cleanTitle('Lidl', 'LIDL')).toBe('Lidl');
  });
});

describe('Amazon product metadata', () => {
  const amazonText = `Title: Lindt Lindor Milk Chocolate Praline 16 Chocolates, 200 g Pack : Amazon.it: Grocery

![Image](https://m.media-amazon.com/images/I/6123._AC_SR38,50_.jpg)
![Image](https://m.media-amazon.com/images/I/61kiWKfZurL._AC_SX569_.jpg)

# Lindt Lindor Milk Chocolate Praline 16 Chocolates, 200 g Pack

## Price

€ 12,99
`;

  it('recognizes Amazon product URLs only', () => {
    expect(
      isAmazonProductUrl(
        'https://www.amazon.it/Lindt-Praline-Cioccolato/dp/B00XUMTTYI?th=1'
      )
    ).toBe(true);
    expect(
      isAmazonProductUrl('https://www.amazon.it/gp/product/B00XUMTTYI')
    ).toBe(true);
    expect(
      isAmazonProductUrl('https://www.amazon.it/gp/aw/d/B00XUMTTYI')
    ).toBe(true);
    expect(
      isAmazonProductUrl('https://www.amazon.it/hz/wishlist/ls/ABC123')
    ).toBe(false);
    expect(isAmazonProductUrl('https://example.com/dp/B00XUMTTYI')).toBe(false);
    expect(isAmazonShortUrl('https://amzn.eu/d/01CmLUdt')).toBe(true);
    expect(isAmazonShortUrl('https://amzn.to/abc')).toBe(true);
    expect(isAmazonShortUrl('https://example.com/d/01CmLUdt')).toBe(false);
  });

  it('extracts the title, main image and price from reader markdown', () => {
    const metadata = parseAmazonProductText(
      amazonText,
      'https://www.amazon.it/dp/B00XUMTTYI'
    );

    expect(metadata.title).toBe(
      'Lindt Lindor Milk Chocolate Praline 16 Chocolates, 200 g Pack'
    );
    expect(metadata.image_url).toBe(
      'https://m.media-amazon.com/images/I/61kiWKfZurL._AC_SX569_.jpg'
    );
    expect(metadata.price).toBe('€ 12,99');
  });

  it('still returns title and image when Amazon has no offer', () => {
    const metadata = parseAmazonProductText(
      amazonText.replace('€ 12,99', 'No featured offers available'),
      'https://www.amazon.it/dp/B00XUMTTYI'
    );

    expect(metadata.title).toContain('Lindt Lindor');
    expect(metadata.image_url).toContain('m.media-amazon.com');
    expect(metadata.price).toBe('');
  });

  it('reads the buy-box price amount from Amazon JSON', () => {
    const metadata = parseAmazonProductText(
      `${amazonText.replace('€ 12,99', 'No featured offers available')}

{"desktop_buybox_group_1":[{"displayPrice":"42,16€","priceAmount":42.16}]}
`,
      'https://www.amazon.it/dp/B00XUMTTYI'
    );

    expect(metadata.price).toBe('42,16€');
  });

  it('uses the first variant option price when there is no buy box', () => {
    const metadata = parseAmazonProductText(
      amazonText.replace('€ 12,99', '1 opzione da 24,07€'),
      'https://www.amazon.it/dp/B00XUMTTYI'
    );

    expect(metadata.price).toBe('24,07€');
  });

  it('recognizes English option prices and rejects generic error titles', () => {
    const metadata = parseAmazonProductText(
      `Title: Ci dispiace

![Image](https://m.media-amazon.com/images/I/61kiWKfZurL._AC_SX569_.jpg)

1 option from €24.07
`,
      'https://www.amazon.it/dp/B00XUMTTYI'
    );

    expect(metadata.title).toBe('');
    expect(metadata.price).toBe('24.07');
  });
});

describe('fetchUrlMetadata', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cleans the title and reads the price from the description', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          title:
            'Parkside | Levigatrice a penna multifunzione ricaricabile - Lidl',
          publisher: 'LIDL',
          author: 'Parkside',
          description:
            'Levigatrice a penna multifunzione ricaricabile - 19.99 €\n(10.11.2026)',
          image: { url: 'https://example.com/image.png' },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const metadata = await fetchUrlMetadata(
      'https://www.lidl.it/p/parkside-levigatrice-a-penna-multifunzione-ricaricabile/p11131409'
    );

    expect(metadata.title).toBe(
      'Levigatrice a penna multifunzione ricaricabile'
    );
    expect(metadata.price).toBe('19.99 €');
    expect(metadata.image_url).toBe('https://example.com/image.png');

    const requestedUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestedUrl.searchParams.get('url')).toBe(
      'https://www.lidl.it/p/parkside-levigatrice-a-penna-multifunzione-ricaricabile/p11131409'
    );
    expect(requestedUrl.searchParams.get('meta')).toBe('true');
  });

  it('uses the reader fallback for Amazon product pages', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        `Title: Lindt Lindor Milk Chocolate Praline 16 Chocolates, 200 g Pack : Amazon.it: Grocery

![Image](https://m.media-amazon.com/images/I/61kiWKfZurL._AC_SX569_.jpg)

## Price

€ 12,99
`,
    });
    vi.stubGlobal('fetch', fetchMock);

    const metadata = await fetchUrlMetadata(
      'https://www.amazon.it/Lindt-Praline-Cioccolato-Cioccolatini-confezione/dp/B00XUMTTYI?th=1'
    );

    expect(metadata.title).toBe(
      'Lindt Lindor Milk Chocolate Praline 16 Chocolates, 200 g Pack'
    );
    expect(metadata.image_url).toBe(
      'https://m.media-amazon.com/images/I/61kiWKfZurL._AC_SX569_.jpg'
    );
    expect(metadata.price).toBe('€ 12,99');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('r.jina.ai');
    expect(fetchMock.mock.calls[0][0]).toContain(
      'https://www.amazon.it/gp/aw/d/B00XUMTTYI'
    );
  });

  it('resolves amzn.eu short links before reading Amazon metadata', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          `Title: Amazon.it

URL Source: https://amzn.eu/d/01CmLudt

Final URL: https://www.amazon.it/dp/B0DRCRNFN6?language=it-IT
`,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          `Title: Tolesum Lima Unghie Cani : Amazon.it: Prodotti per animali domestici

![Image](https://m.media-amazon.com/images/I/61Yw-VJPQyL._AC_SX522_.jpg)

## Price

€ 12,00
`,
      });
    vi.stubGlobal('fetch', fetchMock);

    const metadata = await fetchUrlMetadata('https://amzn.eu/d/01CmLUdt');

    expect(metadata.title).toBe('Tolesum Lima Unghie Cani');
    expect(metadata.image_url).toContain('m.media-amazon.com');
    expect(metadata.price).toBe('€ 12,00');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain(
      'https://www.amazon.it/gp/aw/d/B0DRCRNFN6'
    );
    expect(fetchMock.mock.calls[1][0]).toContain('language=it_IT');
  });

  it('falls back to the offer-listing page when Amazon has no buy box price', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          `Title: Lindt Lindor Milk Chocolate Praline 16 Chocolates, 200 g Pack : Amazon.it: Grocery

![Image](https://m.media-amazon.com/images/I/61kiWKfZurL._AC_SX569_.jpg)

## Price

No featured offers available
`,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          `Title: Lindt Lindor Milk Chocolate Praline 16 Chocolates, 200 g Pack

##### 1 option

One-time purchase

 €12.00 €12.00
`,
      });
    vi.stubGlobal('fetch', fetchMock);

    const metadata = await fetchUrlMetadata(
      'https://www.amazon.it/Lindt-Praline-Cioccolato-Cioccolatini-confezione/dp/B00XUMTTYI?th=1'
    );

    expect(metadata.title).toContain('Lindt Lindor');
    expect(metadata.price).toBe('€12.00');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain(
      'https://www.amazon.it/gp/offer-listing/B00XUMTTYI'
    );
  });
});
