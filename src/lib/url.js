const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[),.;!?]+$/;

/**
 * Returns a normalized http(s) URL or an empty string when the value is not a
 * valid web URL. Bare domains are upgraded to https.
 */
export function normalizeUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed || /\s/.test(trimmed)) return '';

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      const rest = trimmed.slice(schemeMatch[0].length);
      const looksLikeHostPort =
        /^\d+(\/|$)/.test(rest) &&
        (scheme.includes('.') || scheme === 'localhost');

      if (!looksLikeHostPort) return '';
    }
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function isValidHttpUrl(value) {
  return Boolean(normalizeUrl(value));
}

/**
 * Extracts the first web URL from a shared text payload.
 */
export function extractFirstUrl(text) {
  const matches = String(text || '').match(URL_PATTERN);
  if (!matches || !matches.length) return '';
  return matches[0].replace(TRAILING_PUNCTUATION, '');
}

/**
 * Removes URLs from a shared text payload, leaving a usable notes string.
 */
export function stripUrls(text) {
  return String(text || '')
    .replace(URL_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getHostname(value) {
  const normalized = normalizeUrl(value);
  if (!normalized) return '';
  try {
    return new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
