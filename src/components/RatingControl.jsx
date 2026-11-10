import { Gift, Star } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';

const MIN_RATING = 1;
const MAX_RATING = 5;
const STEP = 0.5;

function clampRating(value) {
  return Math.min(MAX_RATING, Math.max(MIN_RATING, value));
}

function stepRating(value, direction) {
  return clampRating(Math.round((value + direction * STEP) * 2) / 2);
}

export default function RatingControl({
  value = 2.5,
  onChange,
  readOnly = false,
  compact = false,
  className = '',
}) {
  const { t } = useI18n();
  const { isChristmas } = useTheme();
  const rating = clampRating(Number(value) || 2.5);
  const interactive = !readOnly && typeof onChange === 'function';
  const iconClassName = compact ? 'h-4 w-4' : 'h-5 w-5';
  const Icon = isChristmas ? Gift : Star;
  const toneClassName = isChristmas ? 'text-danger' : 'text-warning';

  const handleValue = (next) => {
    if (!interactive) return;
    const clamped = clampRating(Math.round(next * 2) / 2);
    if (clamped !== rating) onChange(clamped);
  };

  const handleClick = (event) => {
    if (!interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    handleValue(Math.round(ratio * MAX_RATING * 2) / 2);
  };

  const handleKeyDown = (event) => {
    if (!interactive) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      handleValue(stepRating(rating, 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      handleValue(stepRating(rating, -1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      handleValue(MIN_RATING);
    } else if (event.key === 'End') {
      event.preventDefault();
      handleValue(MAX_RATING);
    }
  };

  const valueLabel = t('rating.value', { value: rating.toFixed(1) });
  const content = (
    <>
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const fill = Math.min(1, Math.max(0, rating - index));

        return (
          <span
            key={index}
            className={`relative block shrink-0 ${iconClassName}`}
          >
            <Icon
              className={`${iconClassName} text-line`}
              strokeWidth={1.7}
              aria-hidden="true"
            />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
              aria-hidden="true"
            >
              <Icon
                className={`${iconClassName} ${toneClassName} fill-current`}
                strokeWidth={1.7}
              />
            </span>
          </span>
        );
      })}
      <span className="ml-1 text-[10px] font-semibold tabular-nums text-subtle">
        {rating.toFixed(1)}
      </span>
    </>
  );

  if (!interactive) {
    return (
      <span
        role="img"
        className={`inline-flex items-center gap-0.5 ${className}`}
        aria-label={valueLabel}
        title={valueLabel}
      >
        {content}
      </span>
    );
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={t('rating.label')}
      aria-valuemin={MIN_RATING}
      aria-valuemax={MAX_RATING}
      aria-valuenow={rating}
      aria-valuetext={valueLabel}
      title={t('rating.hint')}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`inline-flex cursor-pointer touch-manipulation items-center gap-0.5 rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-accent/40 ${className}`}
    >
      {content}
    </div>
  );
}
