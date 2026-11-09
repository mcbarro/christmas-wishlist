import { normalizeUrl } from './url';

const MICROLINK_ENDPOINT = 'https://api.microlink.io/';
const REQUEST_TIMEOUT_MS = 12000;

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

  return '';
}

/**
 * Fetches OpenGraph metadata through Microlink, which avoids browser CORS
 * restrictions on arbitrary e-commerce pages.
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
      title: firstNonEmpty(data.title),
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
