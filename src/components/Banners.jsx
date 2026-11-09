import { AlertTriangle, FlaskConical, RefreshCw } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export function DemoBanner() {
  const { t } = useI18n();

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-ink"
      role="status"
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 shrink-0 text-warning"
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
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-danger"
          aria-hidden="true"
        />
        <p className="leading-relaxed">{t('error.load')}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger/20"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        {t('error.retry')}
      </button>
    </div>
  );
}
