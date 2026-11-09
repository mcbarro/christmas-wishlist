import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Gift, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { fetchUrlMetadata } from '../lib/ogScraper';
import { extractFirstUrl, normalizeUrl, stripUrls } from '../lib/url';

export default function ShareReceiver({ onShared }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const onSharedRef = useRef(onShared);
  const navigateRef = useRef(navigate);

  useEffect(() => {
    onSharedRef.current = onShared;
    navigateRef.current = navigate;
  }, [onShared, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sharedTitle = (params.get('title') || '').trim();
    const sharedText = (params.get('text') || '').trim();
    const explicitUrl = normalizeUrl(params.get('url') || '');
    const sharedUrl = explicitUrl || normalizeUrl(extractFirstUrl(sharedText));
    const sharedNotes = stripUrls(sharedText);
    const fallbackTitle =
      sharedTitle && !/^https?:\/\//i.test(sharedTitle) ? sharedTitle : '';

    const controller = new AbortController();
    let cancelled = false;

    async function receive() {
      // Defer so a StrictMode cleanup can cancel the first pass before it
      // opens the add dialog.
      await Promise.resolve();
      if (cancelled) return;

      let metadata = {
        title: '',
        description: '',
        image_url: '',
        price: '',
        url: sharedUrl,
      };

      if (sharedUrl) {
        metadata = await fetchUrlMetadata(sharedUrl, {
          signal: controller.signal,
        });
      }

      if (cancelled || controller.signal.aborted) return;

      onSharedRef.current?.(
        {
          title: metadata.title || fallbackTitle,
          url: metadata.url || sharedUrl,
          image_url: metadata.image_url,
          notes: sharedNotes || metadata.description,
          price: metadata.price,
          added_by: '',
        },
        {
          hadUrl: Boolean(sharedUrl),
          fetched: Boolean(metadata.title || metadata.image_url),
        }
      );

      navigateRef.current('/', { replace: true });
    }

    void receive();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [location.search]);

  return (
    <section className="mx-auto flex min-h-[55dvh] max-w-xl flex-col items-center justify-center text-center">
      <div className="relative mb-6 grid h-20 w-20 place-items-center rounded-3xl border border-line bg-surface">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-accent/10 blur-xl" />
        <Gift className="animate-float relative h-9 w-9 text-accent" aria-hidden="true" />
      </div>
      <Loader2
        className="mb-3 h-5 w-5 animate-spin text-accent"
        aria-hidden="true"
      />
      <h1 className="font-display text-2xl font-semibold text-ink">
        {t('share.loadingTitle')}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {t('share.loadingDescription')}
      </p>
    </section>
  );
}
