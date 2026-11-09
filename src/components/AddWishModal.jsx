import { useEffect, useRef, useState } from 'react';
import {
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { fetchUrlMetadata } from '../lib/ogScraper';
import { getProfileName, setProfileName } from '../lib/profile';
import { isValidHttpUrl, normalizeUrl } from '../lib/url';

const EMPTY_FORM = {
  title: '',
  url: '',
  image_url: '',
  notes: '',
  price: '',
  added_by: '',
};

const INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-rose-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-rose-500/20';

const LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-slate-300';

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

  seed.added_by = initial?.added_by?.trim() || getProfileName();
  return seed;
}

export default function AddWishModal({ open, initial, onClose, onSubmit }) {
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const scrapeAbortRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    setForm(seedForm(initial));
    setErrors({});
    setSubmitting(false);
    setScraping(false);
    setScrapeStatus(null);
    setImageFailed(false);

    return () => {
      scrapeAbortRef.current?.abort();
      scrapeAbortRef.current = null;
    };
  }, [open, initial]);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
    if (field === 'image_url') setImageFailed(false);
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

  const handleScrape = async () => {
    const normalizedUrl = normalizeUrl(form.url);
    if (!normalizedUrl) {
      setErrors((current) => ({ ...current, url: t('add.errorUrl') }));
      return;
    }

    scrapeAbortRef.current?.abort();
    const controller = new AbortController();
    scrapeAbortRef.current = controller;

    setScraping(true);
    setScrapeStatus(null);
    setErrors((current) => ({ ...current, url: undefined }));

    const metadata = await fetchUrlMetadata(normalizedUrl, {
      signal: controller.signal,
    });

    if (controller.signal.aborted) return;

    setScraping(false);

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
        added_by: form.added_by.trim(),
      });

      if (form.added_by.trim()) setProfileName(form.added_by.trim());
      onClose();
    } catch (error) {
      console.error('Could not add the wish:', error);
      setErrors({ form: t('add.errorGeneric') });
      setSubmitting(false);
    }
  };

  const imageUrl = normalizeUrl(form.image_url);
  const showImagePreview = Boolean(imageUrl) && !imageFailed;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('add.title')}
      description={t('add.description')}
      size="lg"
      closeDisabled={submitting}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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
                {t('add.submitting')}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('add.submit')}
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="add-wish-form" onSubmit={handleSubmit} className="space-y-5">
        {errors.form ? (
          <div
            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-100"
            role="alert"
          >
            {errors.form}
          </div>
        ) : null}

        <div>
          <label htmlFor="add-url" className={LABEL_CLASS}>
            {t('add.urlLabel')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="add-url"
                type="text"
                inputMode="url"
                value={form.url}
                onChange={updateField('url')}
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300/20 bg-rose-500/10 px-3.5 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scraping ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {scraping ? t('add.fetching') : t('add.fetch')}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{t('add.urlHint')}</p>
          {errors.url ? (
            <p
              id="add-url-error"
              className="mt-1 text-xs font-medium text-rose-300"
              role="alert"
            >
              {errors.url}
            </p>
          ) : null}
          {scrapeStatus ? (
            <p
              className={`mt-1.5 text-xs font-medium ${
                scrapeStatus === 'success' ? 'text-emerald-300' : 'text-amber-300'
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
            {t('add.titleLabel')} <span className="text-rose-300">*</span>
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
              className="mt-1 text-xs font-medium text-rose-300"
              role="alert"
            >
              {errors.title}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
            <label htmlFor="add-name" className={LABEL_CLASS}>
              {t('add.nameLabel')}
            </label>
            <input
              id="add-name"
              type="text"
              value={form.added_by}
              onChange={updateField('added_by')}
              placeholder={t('add.namePlaceholder')}
              autoComplete="name"
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-slate-500">{t('add.nameHelp')}</p>

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
          <label htmlFor="add-image" className={LABEL_CLASS}>
            {t('add.imageLabel')}
          </label>
          <div className="relative">
            <ImagePlus
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
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
              className="mt-1 text-xs font-medium text-rose-300"
              role="alert"
            >
              {errors.image_url}
            </p>
          ) : null}

          {form.image_url.trim() ? (
            <div className="relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-900">
              {showImagePreview ? (
                <img
                  src={imageUrl}
                  alt={t('add.imagePreview')}
                  className="max-h-48 w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-32 items-center justify-center px-4 text-center text-xs text-slate-500">
                  {t('add.imageUnavailable')}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setForm((current) => ({ ...current, image_url: '' }));
                  setImageFailed(false);
                }}
                className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-slate-950"
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
