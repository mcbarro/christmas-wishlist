import { useId, useState } from 'react';
import { Check, ExternalLink, Gift, Undo2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { formatRelativeDate } from '../lib/date';
import { useProfileName } from '../lib/profile';

function sameName(first, second) {
  return (
    String(first || '').trim().toLowerCase() ===
    String(second || '').trim().toLowerCase()
  );
}

export default function WishCard({ item, index = 0, onReserve, onRelease }) {
  const { t, locale } = useI18n();
  const profileName = useProfileName();
  const [imageFailed, setImageFailed] = useState(false);
  const titleId = useId();

  const hasImage = Boolean(item.image_url) && !imageFailed;
  const reserved = Boolean(item.reserved_by);
  const reservedByMe = reserved && sameName(item.reserved_by, profileName);
  const addedByMe = Boolean(item.added_by) && sameName(item.added_by, profileName);

  const addedByLabel = addedByMe
    ? t('card.addedByYou')
    : item.added_by
      ? t('card.addedBy', { name: item.added_by })
      : t('card.addedAnonymously');

  const relativeDate = formatRelativeDate(item.created_at, locale);
  const dateLabel = relativeDate
    ? t('card.addedOn', { date: relativeDate })
    : '';

  return (
    <article
      aria-labelledby={titleId}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.055] animate-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="relative overflow-hidden bg-slate-900">
        {hasImage ? (
          <img
            src={item.image_url}
            alt={t('card.imageAlt', { title: item.title })}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="block max-h-[26rem] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(225,29,72,0.28),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.18),transparent_60%)]">
            <Gift
              className="h-12 w-12 text-white/30"
              aria-hidden="true"
            />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />

        {reserved ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-950/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-200 backdrop-blur">
            <Check className="h-3 w-3" aria-hidden="true" />
            {t('card.reservedBadge')}
          </span>
        ) : (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-200 backdrop-blur">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              aria-hidden="true"
            />
            {t('card.available')}
          </span>
        )}

        {item.price ? (
          <span className="absolute right-3 top-3 max-w-[55%] truncate rounded-full border border-amber-300/25 bg-slate-950/75 px-2.5 py-1 text-xs font-bold text-amber-200 backdrop-blur">
            {item.price}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3
            id={titleId}
            className="line-clamp-3 font-display text-lg font-semibold leading-snug text-white"
          >
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-rose-200"
              >
                {item.title}
              </a>
            ) : (
              item.title
            )}
          </h3>

          {item.notes ? (
            <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-slate-400">
              {item.notes}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>{addedByLabel}</span>
          {dateLabel ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{dateLabel}</span>
            </>
          ) : null}
        </div>

        {reserved ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2 text-sm text-emerald-200">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {reservedByMe
                  ? t('card.reservedByYou')
                  : t('card.reservedBy', { name: item.reserved_by })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRelease(item)}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-300/80 transition hover:text-emerald-100"
              aria-label={t('card.releaseAria', { title: item.title })}
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('card.release')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onReserve(item)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-red-400 active:scale-[0.99]"
            aria-label={t('card.reserveAria', { title: item.title })}
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
            {t('card.reserve')}
          </button>
        )}

        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-rose-200"
            aria-label={t('card.openAria', { title: item.title })}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {t('card.viewProduct')}
          </a>
        ) : null}
      </div>
    </article>
  );
}
