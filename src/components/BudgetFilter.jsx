import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { formatBudgetValue } from '../lib/price';

export default function BudgetFilter({ bounds, value, onChange, onReset }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [minValue, setMinValue] = useState(bounds.min);
  const [maxValue, setMaxValue] = useState(bounds.max);
  const [includeMissing, setIncludeMissing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMinValue(value?.active ? value.min : bounds.min);
    setMaxValue(value?.active ? value.max : bounds.max);
    setIncludeMissing(Boolean(value?.includeMissing));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = Boolean(value?.active);
  const disabled = !bounds.hasPrices;
  const label = active
    ? `${formatBudgetValue(value.min, locale)} – ${formatBudgetValue(value.max, locale)}`
    : t('budget.button');

  const apply = () => {
    const nextMin = Math.min(minValue, maxValue);
    const nextMax = Math.max(minValue, maxValue);
    onChange({
      active: nextMin > bounds.min || nextMax < bounds.max,
      min: nextMin,
      max: nextMax,
      includeMissing,
    });
    setOpen(false);
  };

  const reset = () => {
    setMinValue(bounds.min);
    setMaxValue(bounds.max);
    setIncludeMissing(false);
    onReset();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          active
            ? 'border-accent/30 bg-accent/10 text-accent'
            : 'border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink'
        } disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label={
          active ? t('budget.open', { range: label }) : t('budget.title')
        }
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('budget.title')}
        description={t('budget.description')}
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong"
            >
              {t('budget.reset')}
            </button>
            <button
              type="button"
              onClick={apply}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 transition hover:from-rose-500 hover:to-red-400"
            >
              {t('budget.apply')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              {t('budget.range')}
            </p>
            <p
              className="mt-1 font-display text-xl font-semibold text-ink"
              aria-live="polite"
            >
              {formatBudgetValue(Math.min(minValue, maxValue), locale)} –{' '}
              {formatBudgetValue(Math.max(minValue, maxValue), locale)}
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
                {t('budget.min')}
                <span className="text-ink">
                  {formatBudgetValue(minValue, locale)}
                </span>
              </span>
              <input
                type="range"
                min={bounds.min}
                max={bounds.max}
                step={1}
                value={minValue}
                onChange={(event) =>
                  setMinValue(
                    Math.min(Number(event.target.value), maxValue)
                  )
                }
                className="w-full accent-[var(--color-accent)]"
                aria-label={t('budget.minAria')}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
                {t('budget.max')}
                <span className="text-ink">
                  {formatBudgetValue(maxValue, locale)}
                </span>
              </span>
              <input
                type="range"
                min={bounds.min}
                max={bounds.max}
                step={1}
                value={maxValue}
                onChange={(event) =>
                  setMaxValue(
                    Math.max(Number(event.target.value), minValue)
                  )
                }
                className="w-full accent-[var(--color-accent)]"
                aria-label={t('budget.maxAria')}
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3">
            <input
              type="checkbox"
              checked={includeMissing}
              onChange={(event) => setIncludeMissing(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-accent focus:ring-accent/30"
            />
            <span>
              <span className="block text-sm font-semibold text-ink">
                {t('budget.includeMissing')}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                {t('budget.includeMissingHint')}
              </span>
            </span>
          </label>
        </div>
      </Modal>
    </>
  );
}
