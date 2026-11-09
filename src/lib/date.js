const INTL_LOCALES = { en: 'en-US', it: 'it-IT' };

const RELATIVE_RANGES = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
  ['second', 1],
];

export function toIntlLocale(locale) {
  return INTL_LOCALES[locale] || INTL_LOCALES.en;
}

/**
 * Formats a date as a localized relative time (for example "2 days ago").
 */
export function formatRelativeDate(value, locale) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(toIntlLocale(locale), {
    numeric: 'auto',
  });

  for (const [unit, seconds] of RELATIVE_RANGES) {
    if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return '';
}
