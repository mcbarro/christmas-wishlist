import { normalizeUrl } from './url';

const MICROLINK_ENDPOINT = 'https://api.microlink.io/';
const JINA_ENDPOINT = 'https://r.jina.ai/';
const REQUEST_TIMEOUT_MS = 12000;
const AMAZON_REQUEST_TIMEOUT_MS = 20000;

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizePriceCandidate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    return normalizePriceCandidate(value.price ?? value.value ?? value.amount);
  }
  return '';
}

const CURRENCY_AMOUNT =
  '(?:\\d{1,3}(?:[.\\s]\\d{3})+|\\d+)(?:[.,]\\d{1,2})?';

const PRICE_IN_TEXT_PATTERNS = [
  new RegExp(`(?:€|eur\\b)\\s*${CURRENCY_AMOUNT}`, 'i'),
  new RegExp(`${CURRENCY_AMOUNT}\\s*(?:€|eur\\b)`, 'i'),
];

/**
 * Finds a price inside free text. Some shops (for example Lidl) expose the
 * price in the OpenGraph description instead of a structured price field.
 */
export function extractPriceFromText(value) {
  if (typeof value !== 'string' || !value.trim()) return '';

  for (const pattern of PRICE_IN_TEXT_PATTERNS) {
    const match = value.match(pattern);
    if (match) return match[0].replace(/\s+/g, ' ').trim();
  }

  return '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes the shop name that many pages append to the title, and the brand
 * prefix used by some product pages, without touching the product name.
 */
export function cleanTitle(title, publisher, author) {
  const original = String(title || '').trim();
  let value = original;
  if (!value) return '';

  for (const candidate of [publisher, author]) {
    const name = String(candidate || '').trim();
    if (!name) continue;

    const escaped = escapeRegExp(name);
    value = value
      .replace(new RegExp(`\\s+[-–—|]\\s+${escaped}\\s*$`, 'i'), '')
      .replace(new RegExp(`^${escaped}\\s*[-–—|]\\s*`, 'i'), '')
      .trim();
  }

  return value || original;
}

export function extractPrice(data) {
  if (!data || typeof data !== 'object') return '';

  const candidates = [
    data.price,
    data.offer?.price,
    data.offers?.price,
    data.offers?.[0]?.price,
    data.product?.offers?.price,
    data.product?.offers?.[0]?.price,
    data.jsonld?.offers?.price,
    data.jsonld?.offers?.[0]?.price,
    data.product?.price,
  ];

  for (const candidate of candidates) {
    const price = normalizePriceCandidate(candidate);
    if (price) return price;
  }

  for (const text of [data.description, data.title]) {
    const price = extractPriceFromText(text);
    if (price) return price;
  }

  return '';
}

export function isAmazonProductUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:') return false;

    const hostname = url.hostname.replace(/^www\./i, '').toLowerCase();
    if (!hostname.startsWith('amazon.')) return false;

    return /\/(?:dp|gp\/product|gp\/aw\/d)\/[A-Z0-9]{10}(?:[/?]|$)/i.test(url.pathname);
  } catch {
    return false;
  }
}

function canonicalAmazonProductUrl(value) {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
    if (!match) return value;
    return `https://${url.hostname}/dp/${match[1].toUpperCase()}`;
  } catch {
    return value;
  }
}

function amazonProductParts(value) {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
    if (!match) return null;
    return {
      hostname: url.hostname,
      asin: match[1].toUpperCase(),
    };
  } catch {
    return null;
  }
}

function cleanAmazonTitle(value) {
  return String(value || '')
    .replace(/\s*[:\-|]\s*Amazon\.[a-z.]+.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickAmazonImage(text) {
  const urls = Array.from(
    String(text || '').matchAll(/https:\/\/m\.media-amazon\.com\/images\/I\/[^\s)"']+/g),
    (match) => match[0]
  );

  const preferred = urls.find(
    (url) => /_AC_(?:SX|SY)/i.test(url) && !/_SR\d/i.test(url)
  );
  if (preferred) return preferred;

  return (
    urls.find((url) => !/_SR\d|Sash/i.test(url)) ||
    urls[0] ||
    ''
  );
}

/**
 * Extracts product metadata from the Markdown returned by Jina Reader for an
 * Amazon product page. Amazon often blocks plain OpenGraph scrapers, but the
 * rendered reader still exposes the title, image and (when present) price.
 */
export function parseAmazonProductText(text, sourceUrl = '') {
  const source = String(text || '');
  const titleLine = source.match(/^Title:\s*(.+)$/m)?.[1] || '';
  let title = cleanAmazonTitle(titleLine);

  if (!title || /^amazon\.[a-z.]+$/i.test(title)) {
    const candidates = Array.from(
      source.matchAll(/^#\s+(.+)$/gm),
      (match) => cleanAmazonTitle(match[1])
    ).filter(
      (candidate) =>
        candidate.length > 12 &&
        !/^(product summary|keyboard shortcuts|adding to basket|added to basket|item is in your basket|not added|sorry|where did you see)/i.test(
          candidate
        )
    );
    title = candidates[0] || '';
  }

  const priceSection = source.search(/^##\s+(?:Price|Prezzo)\b/im);
  let price = '';

  if (priceSection >= 0) {
    price = extractPriceFromText(
      source.slice(priceSection, priceSection + 1500)
    );
  }
  if (!price) {
    price = extractPriceFromText(source.slice(0, 12000));
  }

  return {
    title,
    description: '',
    image_url: pickAmazonImage(source),
    price,
    url: normalizeUrl(sourceUrl) || sourceUrl,
  };
}

async function fetchJinaText(targetUrl, { signal, timeoutMs } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromParent = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abortFromParent, { once: true });
  }

  try {
    const response = await fetch(`${JINA_ENDPOINT}${targetUrl}`, {
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Jina Reader returned HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', abortFromParent);
  }
}

async function fetchAmazonProductMetadata(url, { signal } = {}) {
  const text = await fetchJinaText(canonicalAmazonProductUrl(url), {
    signal,
    timeoutMs: AMAZON_REQUEST_TIMEOUT_MS,
  });
  return parseAmazonProductText(text, url);
}

async function fetchAmazonOfferPrice(url, { signal } = {}) {
  const parts = amazonProductParts(url);
  if (!parts) return '';

  const offersUrl =
    `https://${parts.hostname}/gp/offer-listing/${parts.asin}`;
  const text = await fetchJinaText(offersUrl, {
    signal,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  // The first price on the offer page belongs to the first available seller.
  return extractPriceFromText(text.slice(0, 8000));
}

/**
 * Fetches OpenGraph metadata through Microlink, which avoids browser CORS
 * restrictions on arbitrary e-commerce pages. Amazon product pages use Jina
 * Reader first because Amazon frequently returns no metadata to Microlink.
 *
 * Always resolves: callers get an empty metadata object when scraping fails.
 */
export async function fetchUrlMetadata(targetUrl, { signal } = {}) {
  const url = normalizeUrl(targetUrl);
  const emptyResult = {
    title: '',
    description: '',
    image_url: '',
    price: '',
    url,
  };

  if (!url) return emptyResult;

  // Amazon product pages need the rendered-reader fallback.
  if (isAmazonProductUrl(url)) {
    try {
      const amazon = await fetchAmazonProductMetadata(url, { signal });
      if (amazon.title || amazon.image_url || amazon.price) {
        if (!amazon.price) {
          try {
            amazon.price = await fetchAmazonOfferPrice(url, { signal });
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.warn('Could not fetch Amazon offer price:', error);
            }
          }
        }
        return { ...emptyResult, ...amazon, url };
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('Could not fetch Amazon product metadata:', error);
      }
      if (signal?.aborted) return emptyResult;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortFromParent = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abortFromParent, { once: true });
  }

  try {
    const endpoint = new URL(MICROLINK_ENDPOINT);
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('meta', 'true');

    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Microlink returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload.status !== 'success' || !payload.data) {
      throw new Error(payload.message || 'Microlink returned no metadata');
    }

    const data = payload.data;
    return {
      title: cleanTitle(
        firstNonEmpty(data.title),
        firstNonEmpty(data.publisher),
        firstNonEmpty(data.author)
      ),
      description: firstNonEmpty(data.description),
      image_url: firstNonEmpty(
        data.image?.url,
        data.logo?.url,
        data.screenshot?.url
      ),
      price: extractPrice(data),
      url,
    };
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.warn('Could not fetch URL metadata:', error);
    }
    return emptyResult;
  } finally {
    clearTimeout(timeout);
    if (signal) signal.removeEventListener('abort', abortFromParent);
  }
}
