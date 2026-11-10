import { useState } from 'react';
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

function ratingFromPointer(clientX, element) {
  const rect = element.getBoundingClientRect();
  if (!rect.width) return null;

  const ratio = (clientX - rect.left) / rect.width;
  return clampRating(Math.round(ratio * MAX_RATING * 2) / 2);
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
  const [hoverRating, setHoverRating] = useState(null);
  const rating = clampRating(Number(value) || 2.5);
  const interactive = !readOnly && typeof onChange === 'function';
  const displayRating =
    interactive && hoverRating != null ? hoverRating : rating;
  const iconClassName = compact
    ? 'h-[1.15rem] w-[1.15rem]'
    : 'h-[1.4375rem] w-[1.4375rem]';
  const Icon = isChristmas ? Gift : Star;
  const toneClassName = isChristmas ? 'text-danger' : 'text-warning';

  const handleValue = (next) => {
    if (!interactive) return;
    const clamped = clampRating(Math.round(next * 2) / 2);
    if (clamped !== rating) onChange(clamped);
  };

  const handleClick = (event) => {
    if (!interactive) return;
    const next = ratingFromPointer(event.clientX, event.currentTarget);
    if (next != null) handleValue(next);
    setHoverRating(null);
  };

  const handleMouseMove = (event) => {
    if (!interactive) return;
    setHoverRating(ratingFromPointer(event.clientX, event.currentTarget));
  };

  const handleKeyDown = (event) => {
    if (!interactive) return;
    setHoverRating(null);

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
  const displayLabel = t('rating.value', {
    value: displayRating.toFixed(1),
  });
  const icons = (
    <>
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const fill = Math.min(1, Math.max(0, displayRating - index));

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
    </>
  );
  const numericLabel = (
    <span
      className={`text-[11px] font-semibold tabular-nums ${
        displayRating !== rating ? 'text-accent' : 'text-subtle'
      }`}
    >
      {displayRating.toFixed(1)}
    </span>
  );

  if (!interactive) {
    return (
      <span
        role="img"
        className={`inline-flex items-center gap-1 ${className}`}
        aria-label={valueLabel}
        title={valueLabel}
      >
        {icons}
        {numericLabel}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <div
        role="slider"
        tabIndex={0}
        aria-label={t('rating.label')}
        aria-valuemin={MIN_RATING}
        aria-valuemax={MAX_RATING}
        aria-valuenow={rating}
        aria-valuetext={valueLabel}
        title={`${t('rating.hint')} ${displayLabel}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverRating(null)}
        className="inline-flex cursor-pointer touch-manipulation items-center gap-1 rounded-lg py-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {icons}
      </div>
      {numericLabel}
    </span>
  );
}
