import { extractPriceFromText } from './ogScraper';
import { normalizeUrl } from './url';

const JINA_ENDPOINT = 'https://r.jina.ai/';
const REQUEST_TIMEOUT_MS = 25000;
const MAX_PAGES = 5;
const MAX_ITEMS = 100;
const PAGE_DELAY_MS = 350;

export class AmazonImportError extends Error {
  constructor(code, options = {}) {
    super(options.message || code, options.cause ? { cause: options.cause } : undefined);
    this.name = 'AmazonImportError';
    this.code = code;
  }
}

const AMAZON_TLDS = new Set([
  'it',
  'com',
  'de',
  'fr',
  'es',
  'co.uk',
  'nl',
  'se',
  'pl',
  'be',
  'ca',
  'com.au',
  'co.jp',
  'in',
  'com.br',
  'com.mx',
  'ae',
  'sa',
  'sg',
  'tr',
  'com.tr',
  'eg',
  'co.za',
]);

export function isAmazonWishlistUrl(value) {
  const normalized = normalizeUrl(value);
  if (!normalized) return false;

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:') return false;

    const hostname = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (!hostname.startsWith('amazon.')) return false;

    const tld = hostname.slice('amazon.'.length);
    if (!AMAZON_TLDS.has(tld)) return false;

    return /^\/(?:hz\/wishlist\/ls|gp\/registry\/wishlist)\/[a-z0-9]+/i.test(
      url.pathname
    );
  } catch {
    return false;
  }
}

export function normalizeAmazonProductUrl(href, fallbackHostname = 'www.amazon.it') {
  try {
    const url = new URL(href);
    const match = url.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    if (!match) return '';
    const hostname = fallbackHostname || url.hostname;
    return `https://${hostname}/dp/${match[1].toUpperCase()}`;
  } catch {
    return '';
  }
}

function decodeEntities(value) {
  return String(value || '').replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (match, entity) => {
      const key = entity.toLowerCase();

      try {
        if (key === 'amp') return '&';
        if (key === 'quot') return '"';
        if (key === 'lt') return '<';
        if (key === 'gt') return '>';
        if (key === 'nbsp') return ' ';
        if (key === 'apos') return "'";
        if (key.startsWith('#x')) {
          return String.fromCodePoint(parseInt(key.slice(2), 16));
        }
        if (key.startsWith('#')) {
          return String.fromCodePoint(parseInt(key.slice(1), 10));
        }
      } catch {
        return match;
      }

      return match;
    }
  );
}

function cleanTitle(value) {
  return decodeEntities(value)
    .replace(/^#{1,6}\s*/, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksPrivate(text) {
  if (text.length > 12000) return false;
  if (/\/dp\/[A-Z0-9]{10}/i.test(text)) return false;
  return /accedi|sign in|enter the characters|captcha|api-services-support/i.test(
    text
  );
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function parseAmazonWishlistText(text, sourceUrl) {
  const source = new URL(
    normalizeUrl(sourceUrl) || 'https://www.amazon.it/'
  );
  const links = [];
  const linkPattern =
    /\[([^\]]+)\]\((https?:\/\/[^)\s]*?\/dp\/([A-Z0-9]{10})[^)\s]*)(?:\s+"([^"]*)")?\)/gi;

  let linkMatch = linkPattern.exec(text);
  while (linkMatch) {
    const [, linkText, href, asin, titleAttribute] = linkMatch;
    const title = cleanTitle(titleAttribute || linkText);
    const url = normalizeAmazonProductUrl(href, source.hostname);

    if (title && url) {
      const key = asin.toUpperCase();
      if (!links.some((entry) => entry.asin === key)) {
        links.push({
          asin: key,
          title,
          url,
          index: linkMatch.index,
          image_url: '',
          price: '',
          notes: '',
        });
      }
    }

    linkMatch = linkPattern.exec(text);
  }

  const images = [];
  const imagePattern =
    /!\[[^\]]*\]\((https?:\/\/m\.media-amazon\.com\/images\/I\/[^)]+)\)/gi;
  let imageMatch = imagePattern.exec(text);

  while (imageMatch) {
    images.push({ index: imageMatch.index, url: imageMatch[1] });
    imageMatch = imagePattern.exec(text);
  }

  let imageCursor = 0;
  links.forEach((entry, entryIndex) => {
    const imageSegment = images.filter(
      (image) => image.index >= imageCursor && image.index < entry.index
    );
    if (imageSegment.length) {
      entry.image_url = imageSegment[imageSegment.length - 1].url;
    }
    imageCursor = entry.index;

    const end =
      links[entryIndex + 1]?.index ?? Math.min(text.length, entry.index + 2500);
    const priceSegment = text.slice(
      entry.index,
      Math.min(end, entry.index + 2500)
    );
    entry.price = extractPriceFromText(priceSegment);
  });

  return links.map(({ index, ...entry }) => entry);
}

async function fetchJina(url, signal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortFromParent = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abortFromParent, { once: true });
  }

  try {
    const response = await fetch(`${JINA_ENDPOINT}${url}`, {
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AmazonImportError('UNAVAILABLE');
    }

    return await response.text();
  } catch (error) {
    if (error instanceof AmazonImportError) throw error;
    if (error.name === 'AbortError') throw error;
    throw new AmazonImportError('NETWORK', { cause: error });
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', abortFromParent);
  }
}

export async function fetchAmazonWishlist(targetUrl, { signal } = {}) {
  const normalized = normalizeUrl(targetUrl);
  if (!isAmazonWishlistUrl(normalized)) {
    throw new AmazonImportError('INVALID_URL');
  }

  const collected = new Map();
  const source = new URL(normalized);

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const pageUrl = new URL(source.toString());
    if (page > 1) pageUrl.searchParams.set('page', String(page));

    let text;
    try {
      text = await fetchJina(pageUrl.toString(), signal);
    } catch (error) {
      if (page === 1) throw error;
      break;
    }

    if (page === 1 && looksPrivate(text)) {
      throw new AmazonImportError('PRIVATE_LIST');
    }

    const items = parseAmazonWishlistText(text, pageUrl.toString());
    let added = 0;

    for (const item of items) {
      if (collected.size >= MAX_ITEMS) break;
      if (!collected.has(item.asin)) {
        collected.set(item.asin, item);
        added += 1;
      }
    }

    if (page === 1 && collected.size === 0) {
      throw new AmazonImportError(looksPrivate(text) ? 'PRIVATE_LIST' : 'NO_ITEMS');
    }

    if (added === 0 || collected.size >= MAX_ITEMS) break;
    await wait(PAGE_DELAY_MS);
  }

  return {
    items: [...collected.values()],
    truncated: collected.size >= MAX_ITEMS,
  };
}
