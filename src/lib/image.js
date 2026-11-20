/**
 * Returns false for empty URLs and for the tracking pixels/sprites that some
 * shops expose as the OpenGraph image. Those URLs are technically valid images
 * but are not a product preview.
 */
export function isUsableImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
  } catch {
    return false;
  }

  if (/fls-eu\.amazon\.[^/]+\/1\/batch\//i.test(url)) return false;
  if (/uedata/i.test(url)) return false;
  if (/grey-pixel|spacer|transparent\.gif|pixel\.gif/i.test(url)) return false;
  if (/\/images\/G\//i.test(url)) return false;

  return true;
}
