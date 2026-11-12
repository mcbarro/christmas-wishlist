import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ExternalLink,
  Gift,
  Loader2,
  ShoppingBasket,
} from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { fetchAmazonWishlist } from '../lib/amazonImport';
import { formatPrice } from '../lib/price';
import { normalizeUrl } from '../lib/url';

const INPUT_CLASS =
  'w-full rounded-xl border border-line bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/60 focus:bg-panel focus:ring-2 focus:ring-accent/20';

function productKey(value) {
  const match = String(value || '').match(/\/dp\/([A-Z0-9]{10})/i);
  if (match) return `asin:${match[1].toUpperCase()}`;
  return `url:${normalizeUrl(value)}`;
}

function buildExistingKeys(items) {
  return new Set((items || []).map((item) => productKey(item.url)));
}

export default function AmazonImportModal({
  open,
  onClose,
  existingItems,
  onImport,
}) {
  const { t, locale } = useI18n();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [errorCode, setErrorCode] = useState('');
  const [truncated, setTruncated] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    setUrl('');
    setStatus('idle');
    setItems([]);
    setSelected(new Set());
    setErrorCode('');
    setTruncated(false);

    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [open]);

  const close = () => {
    if (status === 'loading' || status === 'importing') return;
    onClose();
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (status === 'loading') return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorCode('');
    setItems([]);
    setSelected(new Set());
    setTruncated(false);

    try {
      const result = await fetchAmazonWishlist(url, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const existingKeys = buildExistingKeys(existingItems);
      const nextItems = result.items.map((item) => ({
        ...item,
        alreadyPresent: existingKeys.has(productKey(item.url)),
      }));

      setItems(nextItems);
      setSelected(
        new Set(
          nextItems.filter((item) => !item.alreadyPresent).map((item) => item.asin)
        )
      );
      setTruncated(Boolean(result.truncated));
      setStatus('preview');
    } catch (error) {
      if (error.name === 'AbortError') return;
      setErrorCode(error.code || 'UNKNOWN');
      setStatus('idle');
    }
  };

  const toggleItem = (asin) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(asin)) next.delete(asin);
      else next.add(asin);
      return next;
    });
  };

  const selectable = items.filter((item) => !item.alreadyPresent);
  const allSelected =
    selectable.length > 0 && selectable.every((item) => selected.has(item.asin));

  const toggleAll = () => {
    setSelected(
      allSelected ? new Set() : new Set(selectable.map((item) => item.asin))
    );
  };

  const handleImport = async () => {
    if (status === 'importing') return;

    const chosen = items.filter(
      (item) => !item.alreadyPresent && selected.has(item.asin)
    );
    if (!chosen.length) return;

    setStatus('importing');
    setErrorCode('');

    try {
      await onImport(chosen);
      onClose();
    } catch (error) {
      setErrorCode(error.code || 'UNKNOWN');
      setStatus('preview');
    }
  };

  const selectedCount = items.filter(
    (item) => !item.alreadyPresent && selected.has(item.asin)
  ).length;

  const footer =
    status === 'preview' || status === 'importing' ? (
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={toggleAll}
          disabled={status === 'importing' || selectable.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {allSelected ? t('amazon.selectNone') : t('amazon.selectAll')}
        </button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={close}
            disabled={status === 'importing'}
            className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('amazon.cancel')}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={selectedCount === 0 || status === 'importing'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 transition hover:from-rose-500 hover:to-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'importing' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
            )}
            {status === 'importing'
              ? t('amazon.importing')
              : t('amazon.importCount', { count: selectedCount })}
          </button>
        </div>
      </div>
    ) : null;

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('amazon.title')}
      description={t('amazon.description')}
      size="lg"
      closeDisabled={status === 'loading' || status === 'importing'}
      footer={footer}
    >
      <div className="space-y-5">
        <form onSubmit={handleAnalyze} className="space-y-3">
          <label
            htmlFor="amazon-wishlist-url"
            className="block text-xs font-semibold text-muted"
          >
            {t('amazon.urlLabel')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="amazon-wishlist-url"
              type="text"
              inputMode="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setErrorCode('');
              }}
              placeholder={t('amazon.urlPlaceholder')}
              className={INPUT_CLASS}
              disabled={status === 'loading'}
              data-autofocus
            />
            <button
              type="submit"
              disabled={status === 'loading' || !url.trim()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
              )}
              {status === 'loading'
                ? t('amazon.analyzing')
                : t('amazon.analyze')}
            </button>
          </div>
          <p className="text-xs leading-relaxed text-subtle">
            {t('amazon.urlHint')}
          </p>
        </form>

        {errorCode ? (
          <div
            className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            role="alert"
          >
            {t(`amazon.errors.${errorCode}`)}
          </div>
        ) : null}

        {status === 'loading' ? (
          <div
            className="flex flex-col items-center rounded-2xl border border-line bg-surface px-5 py-10 text-center"
            role="status"
          >
            <Loader2
              className="h-7 w-7 animate-spin text-accent"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold text-ink">
              {t('amazon.analyzingTitle')}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t('amazon.analyzingDescription')}
            </p>
          </div>
        ) : null}

        {status === 'preview' || status === 'importing' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-strong px-3.5 py-2.5">
              <p className="text-sm font-semibold text-ink">
                {t('amazon.found', { count: items.length })}
              </p>
              <p className="text-xs text-muted">
                {t('amazon.selected', { count: selectedCount })}
              </p>
            </div>

            {truncated ? (
              <p
                className="rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-2.5 text-xs leading-relaxed text-ink"
                role="status"
              >
                {t('amazon.truncated')}
              </p>
            ) : null}

            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {items.map((item) => {
                const alreadyPresent = item.alreadyPresent;
                const checked = selected.has(item.asin);

                return (
                  <div
                    key={item.asin}
                    className={`flex items-start gap-3 rounded-2xl border px-3 py-3 ${
                      alreadyPresent
                        ? 'border-line bg-surface opacity-70'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <input
                      id={`amazon-item-${item.asin}`}
                      type="checkbox"
                      checked={checked}
                      disabled={alreadyPresent || status === 'importing'}
                      onChange={() => toggleItem(item.asin)}
                      className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent/30"
                    />
                    <label
                      htmlFor={`amazon-item-${item.asin}`}
                      className="flex min-w-0 flex-1 cursor-pointer items-start gap-3"
                    >
                      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface-strong">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Gift
                            className="h-6 w-6 text-subtle"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-sm font-semibold text-ink">
                          {item.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                          {item.price ? (
                            <span className="font-semibold text-price">
                              {formatPrice(item.price, locale)}
                            </span>
                          ) : (
                            <span>{t('amazon.noPrice')}</span>
                          )}
                          {alreadyPresent ? (
                            <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                              {t('amazon.alreadyPresent')}
                            </span>
                          ) : null}
                        </span>
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-subtle transition hover:text-accent"
                          >
                            <ExternalLink
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            {t('amazon.viewProduct')}
                          </a>
                        ) : null}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
