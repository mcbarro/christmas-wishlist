/**
 * Normalizes text for accent-insensitive, case-insensitive search.
 */
export function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
