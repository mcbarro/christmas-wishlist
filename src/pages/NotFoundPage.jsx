import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <section className="mx-auto flex min-h-[55dvh] max-w-md flex-col items-center justify-center text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-white/5">
        <Compass className="h-9 w-9 text-rose-200" aria-hidden="true" />
      </div>
      <h1 className="font-display text-3xl font-semibold text-white">
        {t('notFound.title')}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        {t('notFound.description')}
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-red-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('notFound.cta')}
      </Link>
    </section>
  );
}
