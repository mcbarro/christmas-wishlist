import { useEffect, useRef, useState } from 'react';
import {
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Search,
  ShoppingBasket,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { searchGiftImages } from '../lib/imageSearch';
import { fetchUrlMetadata } from '../lib/ogScraper';
import { isValidHttpUrl, normalizeUrl } from '../lib/url';

const EMPTY_FORM = {
  title: '',
  url: '',
  image_url: '',
  notes: '',
  price: '',
  owner_member_id: '',
};

const INPUT_CLASS =
  'w-full rounded-xl border border-line bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/60 focus:bg-panel focus:ring-2 focus:ring-accent/20';

const LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-muted';

function seedForm(initial) {
  const seed = { ...EMPTY_FORM };

  for (const key of Object.keys(EMPTY_FORM)) {
    if (typeof initial?.[key] === 'string' && initial[key].trim()) {
      seed[key] = initial[key].trim();
    }
  }

  if (!seed.notes && typeof initial?.description === 'string') {
    seed.notes = initial.description.trim();
  }

  return seed;
}

export default function AddWishModal({
  open,
  initial,
  members = [],
  currentMemberId = '',
  editing = false,
  onAmazonImport,
  onClose,
  onSubmit,
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const scrapeAbortRef = useRef(null);
  const scrapingRef = useRef(false);
  const lastScrapedRef = useRef('');
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const [imageQuery, setImageQuery] = useState('');
  const [imageResults, setImageResults] = useState([]);
  const [imageSearching, setImageSearching] = useState(false);
  const [imageSearchError, setImageSearchError] = useState('');
  const imageAbortRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    setForm(seedForm(initial));
    setErrors({});
    setSubmitting(false);
    setScraping(false);
    setScrapeStatus(null);
    setImageFailed(false);
    setImageSearchOpen(false);
    setImageQuery('');
    setImageResults([]);
    setImageSearching(false);
    setImageSearchError('');
    scrapingRef.current = false;
    lastScrapedRef.current =
      initial?.title || initial?.image_url
        ? normalizeUrl(initial?.url || '')
        : '';

    return () => {
      scrapeAbortRef.current?.abort();
      scrapeAbortRef.current = null;
      imageAbortRef.current?.abort();
      imageAbortRef.current = null;
      scrapingRef.current = false;
    };
  }, [open, initial]);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    if (field === 'image_url') setImageFailed(false);
  };

  const selectedOwnerId = form.owner_member_id || currentMemberId;
  const selectedOwner = members.find(
    (candidate) => candidate.id === selectedOwnerId
  );
  const isSuggestion =
    Boolean(form.owner_member_id) &&
    form.owner_member_id !== currentMemberId;

  const updateOwner = (event) => {
    const value = event.target.value;
    setForm((current) => ({
      ...current,
      owner_member_id: value === currentMemberId ? '' : value,
    }));
    setErrors((current) => ({ ...current, form: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = t('add.errorTitle');
    if (form.url.trim() && !isValidHttpUrl(form.url)) {
      nextErrors.url = t('add.errorUrl');
    }
    if (form.image_url.trim() && !isValidHttpUrl(form.image_url)) {
      nextErrors.image_url = t('add.errorImageUrl');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const scrapeUrl = async (rawUrl, { force = false } = {}) => {
    const normalizedUrl = normalizeUrl(rawUrl);

    if (!normalizedUrl) {
      if (force) {
        setErrors((current) => ({ ...current, url: t('add.errorUrl') }));
      }
      return;
    }

    if (
      !force &&
      (scrapingRef.current || normalizedUrl === lastScrapedRef.current)
    ) {
      return;
    }

    lastScrapedRef.current = normalizedUrl;
    scrapingRef.current = true;
    scrapeAbortRef.current?.abort();

    const controller = new AbortController();
    scrapeAbortRef.current = controller;

    setScraping(true);
    setScrapeStatus(null);
    setErrors((current) => ({ ...current, url: undefined }));

    try {
      const metadata = await fetchUrlMetadata(normalizedUrl, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!metadata.title && !metadata.image_url) {
        setScrapeStatus('error');
        return;
      }

      setForm((current) => ({
        ...current,
        url: metadata.url || normalizedUrl,
        title: current.title.trim() ? current.title : metadata.title,
        notes: current.notes.trim()
          ? current.notes
          : metadata.description || '',
        image_url: current.image_url.trim()
          ? current.image_url
          : metadata.image_url,
        price: current.price.trim() ? current.price : metadata.price,
      }));
      setImageFailed(false);
      setScrapeStatus('success');
    } finally {
      if (!controller.signal.aborted) {
        scrapingRef.current = false;
        setScraping(false);
      }
    }
  };

  const handleScrape = () => {
    void scrapeUrl(form.url, { force: true });
  };

  const handleUrlPaste = (event) => {
    const pasted = event.clipboardData?.getData('text') || '';
    const normalizedUrl = normalizeUrl(pasted);
    if (!normalizedUrl) return;

    event.preventDefault();
    setForm((current) => ({ ...current, url: normalizedUrl }));
    setErrors((current) => ({
      ...current,
      url: undefined,
      form: undefined,
    }));
    void scrapeUrl(normalizedUrl);
  };

  const handleUrlBlur = () => {
    if (!form.url.trim()) return;
    void scrapeUrl(form.url);
  };

  const runImageSearch = async (rawQuery) => {
    const query = String(rawQuery || '').trim();
    if (!query) return;

    imageAbortRef.current?.abort();
    const controller = new AbortController();
    imageAbortRef.current = controller;

    setImageSearching(true);
    setImageSearchError('');
    setImageResults([]);

    try {
      const results = await searchGiftImages(query, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setImageResults(results);
    } catch (error) {
      if (error.name === 'AbortError') return;
      setImageSearchError(error.code || 'UNKNOWN');
    } finally {
      if (!controller.signal.aborted) setImageSearching(false);
    }
  };

  const openImageSearch = () => {
    setImageSearchOpen(true);
    setImageQuery(form.title.trim());
    void runImageSearch(form.title);
  };

  const chooseImage = (imageUrl) => {
    setForm((current) => ({ ...current, image_url: imageUrl }));
    setImageFailed(false);
    setImageSearchOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        title: form.title.trim(),
        url: normalizeUrl(form.url),
        image_url: normalizeUrl(form.image_url),
        notes: form.notes.trim(),
        price: form.price.trim(),
        ownerMemberId: form.owner_member_id || null,
      });

      onClose();
    } catch (error) {
      console.error('Could not add the wish:', error);
      const specificError = [
        'MEMBER_NOT_FOUND',
        'NOT_APPROVED',
        'NOT_ALLOWED',
        'RPC_MISSING',
      ].includes(error.code);
      setErrors({
        form: specificError
          ? t(`group.errors.${error.code}`)
          : t('add.errorGeneric'),
      });
      setSubmitting(false);
    }
  };

  const imageUrl = normalizeUrl(form.image_url);
  const showImagePreview = Boolean(imageUrl) && !imageFailed;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('add.editTitle') : t('add.title')}
      description={
        editing ? t('add.editDescription') : t('add.description')
      }
      size="lg"
      closeDisabled={submitting}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('add.cancel')}
          </button>
          <button
            type="submit"
            form="add-wish-form"
            disabled={submitting || scraping}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {editing ? t('add.saving') : t('add.submitting')}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {editing ? t('add.save') : t('add.submit')}
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="add-wish-form" onSubmit={handleSubmit} className="space-y-5">
        {errors.form ? (
          <div
            className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            role="alert"
          >
            {errors.form}
          </div>
        ) : null}

        {onAmazonImport && !editing ? (
          <button
            type="button"
            onClick={onAmazonImport}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20"
          >
            <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
            {t('add.importAmazon')}
          </button>
        ) : null}

        {members.length > 1 ? (
          <div>
            <label htmlFor="add-owner" className={LABEL_CLASS}>
              {t('add.forWhom')}
            </label>
            <select
              id="add-owner"
              value={selectedOwnerId}
              onChange={updateOwner}
              className={INPUT_CLASS}
            >
              <option value={currentMemberId}>{t('add.forMe')}</option>
              {members
                .filter((member) => member.id !== currentMemberId)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
            </select>
            {isSuggestion ? (
              <p className="mt-1.5 text-xs leading-relaxed text-subtle">
                {t('add.suggestionHint', {
                  name: selectedOwner?.displayName || '',
                })}
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label htmlFor="add-url" className={LABEL_CLASS}>
            {t('add.urlLabel')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
                aria-hidden="true"
              />
              <input
                id="add-url"
                type="text"
                inputMode="url"
                value={form.url}
                onChange={updateField('url')}
                onPaste={handleUrlPaste}
                onBlur={handleUrlBlur}
                placeholder={t('add.urlPlaceholder')}
                className={`${INPUT_CLASS} pl-9`}
                data-autofocus={!form.url ? true : undefined}
                aria-invalid={errors.url ? true : undefined}
                aria-describedby={errors.url ? 'add-url-error' : undefined}
              />
            </div>
            <button
              type="button"
              onClick={handleScrape}
              disabled={scraping}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3.5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scraping ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {scraping ? t('add.fetching') : t('add.fetch')}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-subtle">{t('add.urlHint')}</p>
          {errors.url ? (
            <p
              id="add-url-error"
              className="mt-1 text-xs font-medium text-danger"
              role="alert"
            >
              {errors.url}
            </p>
          ) : null}
          {scrapeStatus ? (
            <p
              className={`mt-1.5 text-xs font-medium ${
                scrapeStatus === 'success' ? 'text-success' : 'text-warning'
              }`}
              role="status"
            >
              {scrapeStatus === 'success'
                ? t('add.fetchSuccess')
                : t('add.fetchError')}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="add-title" className={LABEL_CLASS}>
            {t('add.titleLabel')} <span className="text-accent">*</span>
          </label>
          <input
            id="add-title"
            type="text"
            value={form.title}
            onChange={updateField('title')}
            placeholder={t('add.titlePlaceholder')}
            className={INPUT_CLASS}
            data-autofocus={form.url ? true : undefined}
            aria-required="true"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'add-title-error' : undefined}
          />
          {errors.title ? (
            <p
              id="add-title-error"
              className="mt-1 text-xs font-medium text-danger"
              role="alert"
            >
              {errors.title}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="add-price" className={LABEL_CLASS}>
            {t('add.priceLabel')}
          </label>
          <input
            id="add-price"
            type="text"
            value={form.price}
            onChange={updateField('price')}
            placeholder={t('add.pricePlaceholder')}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="add-notes" className={LABEL_CLASS}>
            {t('add.notesLabel')}
          </label>
          <textarea
            id="add-notes"
            value={form.notes}
            onChange={updateField('notes')}
            placeholder={t('add.notesPlaceholder')}
            rows={3}
            className={`${INPUT_CLASS} resize-y`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="add-image" className={LABEL_CLASS}>
              {t('add.imageLabel')}
            </label>
            {!form.url.trim() ? (
              <button
                type="button"
                onClick={openImageSearch}
                disabled={!form.title.trim() || imageSearching}
                className="inline-flex items-center gap-1 rounded-lg border border-accent/20 bg-accent/10 px-2.5 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-3 w-3" aria-hidden="true" />
                {t('add.searchImage')}
              </button>
            ) : null}
          </div>
          <div className="relative mt-1.5">
            <ImagePlus
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <input
              id="add-image"
              type="text"
              inputMode="url"
              value={form.image_url}
              onChange={updateField('image_url')}
              placeholder={t('add.imagePlaceholder')}
              className={`${INPUT_CLASS} pl-9`}
              aria-invalid={errors.image_url ? true : undefined}
              aria-describedby={
                errors.image_url ? 'add-image-error' : undefined
              }
            />
          </div>
          {errors.image_url ? (
            <p
              id="add-image-error"
              className="mt-1 text-xs font-medium text-danger"
              role="alert"
            >
              {errors.image_url}
            </p>
          ) : null}

          {imageSearchOpen ? (
            <div className="mt-3 rounded-xl border border-line bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-ink">
                    {t('add.searchImageTitle')}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-subtle">
                    {t('add.searchImageHint')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageSearchOpen(false)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-subtle transition hover:bg-surface-strong hover:text-ink"
                  aria-label={t('common.close')}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={imageQuery}
                  onChange={(event) => setImageQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void runImageSearch(imageQuery);
                    }
                  }}
                  placeholder={t('add.searchImagePlaceholder')}
                  className={INPUT_CLASS}
                  aria-label={t('add.searchImagePlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => void runImageSearch(imageQuery)}
                  disabled={imageSearching || !imageQuery.trim()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {imageSearching ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Search className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {imageSearchError ? (
                <p
                  className="mt-2 text-xs font-medium text-danger"
                  role="alert"
                >
                  {t('add.imageSearchError')}
                </p>
              ) : null}

              {imageSearching ? (
                <p className="mt-2 text-xs text-muted" role="status">
                  {t('add.searchingImage')}
                </p>
              ) : null}

              {!imageSearching &&
              !imageSearchError &&
              imageResults.length === 0 ? (
                <p className="mt-2 text-xs text-muted" role="status">
                  {t('add.imageSearchEmpty')}
                </p>
              ) : null}

              {imageResults.length ? (
                <div className="mt-2 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
                  {imageResults.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => chooseImage(image.url)}
                      className="overflow-hidden rounded-lg border border-line bg-surface-strong transition hover:border-accent/50 hover:ring-2 hover:ring-accent/20"
                      aria-label={t('add.useImage', { title: image.title })}
                      title={image.title}
                    >
                      <img
                        src={image.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-20 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {form.image_url.trim() ? (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-line bg-surface-strong">
              {showImagePreview ? (
                <img
                  src={imageUrl}
                  alt={t('add.imagePreview')}
                  className="max-h-48 w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-32 items-center justify-center px-4 text-center text-xs text-muted">
                  {t('add.imageUnavailable')}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setForm((current) => ({ ...current, image_url: '' }));
                  setImageFailed(false);
                }}
                className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-panel-glass px-2.5 py-1.5 text-[11px] font-semibold text-ink backdrop-blur transition hover:bg-panel"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                {t('add.removeImage')}
              </button>
            </div>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
