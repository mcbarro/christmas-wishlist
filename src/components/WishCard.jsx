import { useId, useState } from 'react';
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  Pencil,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { formatRelativeDate } from '../lib/date';
import { getMemberColor } from '../lib/memberColor';

export default function WishCard({
  item,
  index = 0,
  onReserve,
  onRelease,
  onDelete,
  onEdit,
  onHide,
  onUnhide,
  canHide = false,
}) {
  const { t, locale } = useI18n();
  const [imageFailed, setImageFailed] = useState(false);
  const titleId = useId();

  const hasImage = Boolean(item.image_url) && !imageFailed;
  const isOwnItem = Boolean(item.is_own_item);
  const isSuggestion = Boolean(item.is_suggestion);
  const isOwnSuggestion = Boolean(item.is_own_suggestion);
  const canDelete = Boolean(item.can_delete) && typeof onDelete === 'function';
  const canEdit = Boolean(item.can_edit) && typeof onEdit === 'function';
  const isHidden = Boolean(item.hidden_by_me);
  const canHideItem =
    Boolean(canHide) && typeof onHide === 'function' && !isHidden;
  const canUnhide = isHidden && typeof onUnhide === 'function';
  const reservation = item.reservation;
  const reserved = Boolean(reservation?.reserved_by_name);
  const reservedByMe = Boolean(reservation?.is_mine);
  const ownerColor = item.owner_member_id
    ? getMemberColor(item.owner_member_id)
    : null;

  const addedByLabel = isSuggestion
    ? isOwnSuggestion
      ? t('card.suggestedByYou')
      : item.created_by_name
        ? t('card.suggestedBy', { name: item.created_by_name })
        : t('card.suggestedBySomeone')
    : isOwnItem
      ? t('card.addedByYou')
      : item.owner_name
        ? t('card.addedBy', { name: item.owner_name })
        : t('card.addedAnonymously');

  const relativeDate = formatRelativeDate(item.created_at, locale);
  const dateLabel = relativeDate
    ? t('card.addedOn', { date: relativeDate })
    : '';

  return (
    <article
      aria-labelledby={titleId}
      className="group relative overflow-hidden rounded-3xl border-2 border-line bg-surface shadow-xl shadow-black/5 transition duration-300 hover:-translate-y-0.5 hover:bg-surface-strong animate-fade-up"
      style={{
        animationDelay: `${Math.min(index, 8) * 45}ms`,
        borderColor: ownerColor?.background,
      }}
    >
      <div className="relative overflow-hidden bg-surface-strong">
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
            <Gift className="h-12 w-12 text-subtle" aria-hidden="true" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-image-shade via-transparent to-transparent" />

        {isOwnItem ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-panel-glass px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent backdrop-blur">
            <Gift className="h-3 w-3" aria-hidden="true" />
            {t('card.yourWishBadge')}
          </span>
        ) : isSuggestion ? (
          <span className="absolute left-3 top-3 inline-flex max-w-[70%] items-center gap-1.5 truncate rounded-full border border-accent/30 bg-panel-glass px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent backdrop-blur">
            <Gift className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {t('card.ideaFor', { name: item.owner_name })}
            </span>
          </span>
        ) : reserved ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-panel-glass px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-success backdrop-blur">
            <Check className="h-3 w-3" aria-hidden="true" />
            {t('card.reservedBadge')}
          </span>
        ) : (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-glass px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink backdrop-blur">
            <span
              className="h-1.5 w-1.5 rounded-full bg-success"
              aria-hidden="true"
            />
            {t('card.available')}
          </span>
        )}

        {item.price ? (
          <span className="absolute right-3 top-3 max-w-[55%] truncate rounded-full border border-price/25 bg-price-bg px-2.5 py-1 text-xs font-bold text-price backdrop-blur">
            {item.price}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3
            id={titleId}
            className="line-clamp-3 font-display text-lg font-semibold leading-snug text-ink"
          >
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-accent"
              >
                {item.title}
              </a>
            ) : (
              item.title
            )}
          </h3>

          {item.notes ? (
            <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-muted">
              {item.notes}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
          <span>{addedByLabel}</span>
          {dateLabel ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{dateLabel}</span>
            </>
          ) : null}
          {isHidden ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
              <EyeOff className="h-3 w-3" aria-hidden="true" />
              {t('card.hiddenBadge')}
            </span>
          ) : null}
        </div>

        {isSuggestion && isOwnSuggestion ? (
          <p className="text-xs leading-relaxed text-subtle">
            {t('card.suggestionPrivate', { name: item.owner_name })}
          </p>
        ) : null}

        {isOwnItem ? null : reserved ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-success/20 bg-success/10 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2 text-sm text-success">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {reservedByMe
                  ? t('card.reservedByYou')
                  : t('card.reservedBy', {
                      name: reservation.reserved_by_name,
                    })}
              </span>
            </div>
            {reservedByMe ? (
              <button
                type="button"
                onClick={() => onRelease(item)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-success/80 transition hover:text-success"
                aria-label={t('card.releaseAria', { title: item.title })}
              >
                <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t('card.release')}
              </button>
            ) : null}
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

        <div className="flex items-center justify-between gap-3">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-subtle transition hover:text-accent"
              aria-label={t('card.openAria', { title: item.title })}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              {t('card.viewProduct')}
            </a>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5">
            {canUnhide ? (
              <button
                type="button"
                onClick={() => onUnhide(item)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:bg-surface-strong hover:text-ink"
                aria-label={t('card.unhideAria', { title: item.title })}
                title={t('card.unhide')}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}

            {canHideItem ? (
              <button
                type="button"
                onClick={() => onHide(item)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:bg-surface-strong hover:text-ink"
                aria-label={t('card.hideAria', { title: item.title })}
                title={t('card.hide')}
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}

            {canEdit ? (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:bg-surface-strong hover:text-ink"
                aria-label={t('card.editAria', { title: item.title })}
                title={t('card.edit')}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}

            {canDelete ? (
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-danger/20 bg-danger/10 text-danger transition hover:bg-danger/20"
                aria-label={t('card.deleteAria', { title: item.title })}
                title={t('card.delete')}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
