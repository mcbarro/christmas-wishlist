const COMMONS_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
const IMAGE_EXTENSION = /\.(?:jpe?g|png|webp|gif)(?:[?#]|$)/i;

export class ImageSearchError extends Error {
  constructor(code, options = {}) {
    super(options.message || code, options.cause ? { cause: options.cause } : undefined);
    this.name = 'ImageSearchError';
    this.code = code;
  }
}

export async function searchGiftImages(
  query,
  { signal, limit = 12 } = {}
) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return [];

  const url = new URL(COMMONS_ENDPOINT);
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', `${cleanQuery} filetype:bitmap`);
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrlimit', String(limit));
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url');
  url.searchParams.set('iiurlwidth', '600');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  let response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ImageSearchError('NETWORK', { cause: error });
  }

  if (!response.ok) {
    throw new ImageSearchError('UNAVAILABLE');
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ImageSearchError('INVALID_RESPONSE', { cause: error });
  }

  const pages = payload?.query?.pages;
  if (!pages || typeof pages !== 'object') return [];

  return Object.values(pages)
    .map((page) => {
      const info = page?.imageinfo?.[0];
      const imageUrl = info?.thumburl || info?.url;
      if (!imageUrl || !IMAGE_EXTENSION.test(imageUrl)) return null;

      return {
        id: String(page.pageid || imageUrl),
        title: String(page.title || '').replace(/^File:/i, ''),
        url: imageUrl,
        thumbnail: info?.thumburl || imageUrl,
        pageUrl: info?.descriptionurl || '',
      };
    })
    .filter(Boolean);
}
