import { Languages } from 'lucide-react';
import { SUPPORTED_LOCALES } from '../i18n/config';
import { useI18n } from '../i18n/I18nProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1"
      role="group"
      aria-label={t('language.label')}
    >
      <Languages
        className="ml-1 hidden h-3.5 w-3.5 text-slate-500 sm:block"
        aria-hidden="true"
      />
      {SUPPORTED_LOCALES.map((code) => {
        const selected = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={selected}
            aria-label={t('language.switchTo', {
              language: t(`language.${code}`),
            })}
            title={t(`language.${code}`)}
            className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
              selected
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
