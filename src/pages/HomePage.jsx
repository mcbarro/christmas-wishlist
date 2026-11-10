import {
  AlertTriangle,
  CheckCircle2,
  Gift,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import WishGrid from '../components/WishGrid';
import { useI18n } from '../i18n/I18nProvider';

function SkeletonGrid() {
  const { t } = useI18n();

  return (
    <div
      className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      role="status"
      aria-busy="true"
      aria-label={t('loading.wishes')}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-line bg-surface p-4"
        >
          <div className="animate-pulse space-y-3">
            <div className="aspect-[4/3] rounded-2xl bg-surface-strong" />
            <div className="h-5 w-3/4 rounded bg-surface-strong" />
            <div className="h-4 w-full rounded bg-surface-strong" />
            <div className="h-9 w-full rounded-xl bg-surface-strong" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatPill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
      <Icon className="h-3.5 w-3.5 text-subtle" aria-hidden="true" />
      {children}
    </span>
  );
}

export default function HomePage({
  items,
  allCounts,
  loading,
  error,
  hasFilters,
  viewMode,
  onRetry,
  onAdd,
  onClearFilters,
  onReserve,
  onRelease,
  onDelete,
  onEdit,
  onHide,
  onUnhide,
  onRate,
  showRating,
  canHide,
}) {
  const { t, tn } = useI18n();
  const pageTitle = <h1 className="sr-only">{t('app.title')}</h1>;

  if (loading && items.length === 0) {
    return (
      <>
        {pageTitle}
        <SkeletonGrid />
      </>
    );
  }

  if (error && items.length === 0) {
    return (
      <>
        {pageTitle}
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-danger/20 bg-danger/5 px-6 py-14 text-center">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-danger/20 bg-danger/10">
            <AlertTriangle className="h-7 w-7 text-danger" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            {t('error.boundaryTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('error.load')}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('error.retry')}
          </button>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        {pageTitle}
        <EmptyState
          variant={hasFilters ? 'no-results' : 'empty'}
          onAdd={onAdd}
          onClear={onClearFilters}
        />
      </>
    );
  }

  return (
    <div className="space-y-5">
      {pageTitle}
      <div className="flex flex-wrap items-center gap-2">
        <StatPill icon={Gift}>{tn('stats.total', allCounts.all)}</StatPill>
        <StatPill icon={CheckCircle2}>
          {tn('stats.available', allCounts.available)}
        </StatPill>
        <StatPill icon={Sparkles}>
          {tn('stats.reserved', allCounts.reserved)}
        </StatPill>
        {hasFilters ? (
          <span className="text-xs text-subtle">
            {t('stats.filtered', {
              shown: items.length,
              total: allCounts.all,
            })}
          </span>
        ) : null}
      </div>

      <h2 className="sr-only">{t('home.wishesTitle')}</h2>
      <WishGrid
        items={items}
        viewMode={viewMode}
        onReserve={onReserve}
        onRelease={onRelease}
        onDelete={onDelete}
        onEdit={onEdit}
        onHide={onHide}
        onUnhide={onUnhide}
        onRate={onRate}
        showRating={showRating}
        canHide={canHide}
      />
    </div>
  );
}
