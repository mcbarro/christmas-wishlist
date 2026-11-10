/**
 * Parses a human-entered price into a number for the budget filter. It is
 * deliberately permissive because the price field is free text.
 *
 * Returns null when the text has no usable amount. For ranges such as
 * "10 - 20 €" the first amount is used as the lower bound.
 */
export function parsePriceAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value || '').trim();
  if (!text) return null;

  const match = text.match(/\d[\d.,\s]*/);
  if (!match) return null;

  let normalized = match[0].replace(/\s+/g, '').replace(/[.,]+$/, '');
  if (!normalized) return null;

  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    const decimals = normalized.length - lastComma - 1;
    normalized =
      decimals > 0 && decimals <= 2
        ? normalized.replace(',', '.')
        : normalized.replace(/,/g, '');
  } else if (lastDot !== -1) {
    const decimals = normalized.length - lastDot - 1;
    if (decimals === 0 || decimals > 2) {
      normalized = normalized.replace(/\./g, '');
    }
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function formatBudgetValue(value, locale = 'it-IT') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
