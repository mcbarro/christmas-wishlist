import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Keep the storage key in sync with the inline theme script in index.html.
export const THEME_STORAGE_KEY = 'christmas-wishlist:theme';
export const THEMES = ['light', 'dark', 'christmas'];

const ThemeContext = createContext(null);

function isTheme(value) {
  return THEMES.includes(value);
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Theme persistence is best-effort.
  }

  return 'light';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute(
      'content',
      theme === 'dark'
        ? '#070b14'
        : theme === 'christmas'
          ? '#0b3d2e'
          : '#f7f3ec'
    );
  }

  const statusBar = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]'
  );
  if (statusBar) {
    statusBar.setAttribute(
      'content',
      theme === 'dark' ? 'black-translucent' : 'default'
    );
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const setTheme = useCallback((nextTheme) => {
    if (!isTheme(nextTheme)) return;
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Persisting the preference is best-effort.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const nextTheme =
        current === 'light'
          ? 'dark'
          : current === 'dark'
            ? 'christmas'
            : 'light';
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Persisting the preference is best-effort.
      }
      return nextTheme;
    });
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) {
        setThemeState(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      isChristmas: theme === 'christmas',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return context;
}
