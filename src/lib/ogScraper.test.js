import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanTitle,
  extractPrice,
  extractPriceFromText,
  fetchUrlMetadata,
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
});
