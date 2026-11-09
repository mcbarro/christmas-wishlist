import { AlertTriangle, FlaskConical, RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export function DemoBanner() {
  const { t } = useI18n();

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90"
      role="status"
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
        aria-hidden="true"
      />
      <p className="leading-relaxed">{t('demo.banner')}</p>
    </div>
  );
}

export function ErrorBanner({ onRetry }) {
  const { t } = useI18n();

  return (
    <div
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100/90 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-rose-300"
          aria-hidden="true"
        />
        <p className="leading-relaxed">{t('error.load')}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        {t('error.retry')}
      </button>
    </div>
  );
}
