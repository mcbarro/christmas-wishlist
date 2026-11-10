import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchGiftImages } from './imageSearch';

describe('searchGiftImages', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns image results from Wikimedia Commons', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          pages: {
            '1': {
              pageid: 1,
              title: 'File:Headphones.jpg',
              imageinfo: [
                {
                  url: 'https://example.com/headphones.jpg',
                  thumburl: 'https://example.com/thumb.jpg',
                  descriptionurl: 'https://commons.wikimedia.org/wiki/File:Headphones.jpg',
                },
              ],
            },
            '2': {
              pageid: 2,
              title: 'File:Document.pdf',
              imageinfo: [
                {
                  url: 'https://example.com/document.pdf',
                  thumburl: 'https://example.com/document.pdf',
                },
              ],
            },
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchGiftImages('wireless headphones');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: 'Headphones.jpg',
      url: 'https://example.com/thumb.jpg',
      pageUrl: 'https://commons.wikimedia.org/wiki/File:Headphones.jpg',
    });

    const requested = new URL(fetchMock.mock.calls[0][0]);
    expect(requested.searchParams.get('gsrsearch')).toContain(
      'wireless headphones'
    );
    expect(requested.searchParams.get('origin')).toBe('*');
  });

  it('returns no results for an empty query without fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchGiftImages('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
