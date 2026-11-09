import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DICTIONARIES,
  INTL_LOCALES,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
} from './config';

const I18nContext = createContext(null);

function isSupportedLocale(value) {
  return SUPPORTED_LOCALES.includes(String(value || '').toLowerCase());
}

function detectLocale() {
  if (typeof window === 'undefined') return 'en';

  const queryLocale = new URLSearchParams(window.location.search).get('lang');
  if (isSupportedLocale(queryLocale)) return queryLocale.toLowerCase();

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isSupportedLocale(stored)) return stored.toLowerCase();
  } catch {
    // localStorage can be unavailable in private browsing modes.
  }

  const languages =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

  for (const language of languages) {
    const code = String(language || '')
      .toLowerCase()
      .split('-')[0];
    if (isSupportedLocale(code)) return code;
  }

  return 'en';
}

function interpolate(template, variables) {
  if (!variables) return template;
  return Object.entries(variables).reduce((value, [key, replacement]) => {
    return value.replaceAll(`{${key}}`, String(replacement ?? ''));
  }, template);
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);

  const setLocale = useCallback((nextLocale) => {
    if (!isSupportedLocale(nextLocale)) return;
    const normalized = nextLocale.toLowerCase();
    setLocaleState(normalized);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
    } catch {
      // Persisting the preference is best-effort.
    }
  }, []);

  const t = useCallback(
    (key, variables) => {
      const dictionary = DICTIONARIES[locale] || DICTIONARIES.en;
      const fallback = DICTIONARIES.en;
      const template = dictionary[key] ?? fallback[key] ?? key;
      return interpolate(template, variables);
    },
    [locale]
  );

  const tn = useCallback(
    (key, count) => {
      const normalizedCount = Number(count) || 0;
      const suffix = normalizedCount === 1 ? 'One' : '';
      return t(`${key}${suffix}`, { count: normalizedCount });
    },
    [t]
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.title = t('app.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('app.description'));
  }, [locale, t]);

  const value = useMemo(
    () => ({
      locale,
      intlLocale: INTL_LOCALES[locale] || INTL_LOCALES.en,
      setLocale,
      t,
      tn,
    }),
    [locale, setLocale, t, tn]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside an I18nProvider');
  }
  return context;
}
