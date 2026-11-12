/**
 * Parses a human-entered price for display and for the budget filter.
 *
 * Prices are deliberately permissive because the field is free text. Any dot
 * or comma is treated as a decimal separator; when both appear, the last one
 * wins. Earlier separators and spaces are ignored, so "1.299,00" and
 * "1,299.00" both become 1299.00. A single separator is always decimal, as
 * requested: "1.299" means 1.299, not 1299.
 */
function parsePriceParts(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return {
      amount: value,
      hasDecimals: !Number.isInteger(value),
    };
  }

  const text = String(value || '').trim();
  if (!text) return null;

  const match = text.match(/\d[\d.,\s]*/);
  if (!match) return null;

  const token = match[0].replace(/\s+/g, '').replace(/[.,]+$/, '');
  if (!token) return null;

  const lastDot = token.lastIndexOf('.');
  const lastComma = token.lastIndexOf(',');
  const lastSeparator = Math.max(lastDot, lastComma);

  let amount;
  let hasDecimals = false;

  if (lastSeparator === -1) {
    amount = Number(token);
  } else {
    const whole = token.slice(0, lastSeparator).replace(/[.,]/g, '');
    const decimals = token.slice(lastSeparator + 1).replace(/[.,]/g, '');
    amount = Number(`${whole || '0'}.${decimals || '0'}`);
    hasDecimals = true;
  }

  if (!Number.isFinite(amount)) return null;
  return { amount, hasDecimals };
}

/**
 * Returns the numeric amount used by filters, or null when the text has no
 * usable amount. For ranges such as "10 - 20 €" the first amount is used.
 */
export function parsePriceAmount(value) {
  const parts = parsePriceParts(value);
  return parts ? parts.amount : null;
}

/**
 * Normalizes a price label for rendering:
 * - a dot or comma separates decimals;
 * - thousands separators are not shown;
 * - the euro symbol is always present when a number was found;
 * - integer prices stay without cents, decimal prices show two decimals.
 */
export function formatPrice(value, locale = 'it-IT') {
  const parts = parsePriceParts(value);
  if (!parts) return String(value || '').trim();

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    useGrouping: false,
    minimumFractionDigits: parts.hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(parts.amount);
}

export function formatBudgetValue(value, locale = 'it-IT') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    useGrouping: false,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
