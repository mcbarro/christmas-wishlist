import { Gift, Plus, RotateCcw, SearchX } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export default function EmptyState({
  variant = 'empty',
  onAdd,
  onClear,
}) {
  const { t } = useI18n();
  const noResults = variant === 'no-results';
  const Icon = noResults ? SearchX : Gift;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <div className="relative mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-accent/20 to-success/10 ring-1 ring-line">
        <div className="absolute inset-0 rounded-3xl bg-accent/10 blur-2xl" />
        <Icon className="relative h-9 w-9 text-accent" aria-hidden="true" />
      </div>

      <h2 className="font-display text-2xl font-semibold text-ink">
        {noResults ? t('empty.noResultsTitle') : t('empty.title')}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {noResults
          ? t('empty.noResultsDescription')
          : t('empty.description')}
      </p>

      {noResults ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t('empty.clear')}
        </button>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-red-400"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('empty.cta')}
        </button>
      )}
    </div>
  );
}
