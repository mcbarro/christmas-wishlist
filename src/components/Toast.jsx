import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

const TONES = {
  success: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-400/30 bg-emerald-950/90 text-emerald-50',
    iconColor: 'text-emerald-300',
  },
  error: {
    icon: AlertCircle,
    wrapper: 'border-rose-400/30 bg-rose-950/90 text-rose-50',
    iconColor: 'text-rose-300',
  },
  info: {
    icon: Info,
    wrapper: 'border-sky-400/30 bg-sky-950/90 text-sky-50',
    iconColor: 'text-sky-300',
  },
};

export default function Toast({ toast, onDismiss }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast || typeof document === 'undefined') return null;

  const tone = TONES[toast.type] || TONES.success;
  const Icon = tone.icon;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:px-6"
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-md animate-slide-up ${tone.wrapper}`}
      >
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${tone.iconColor}`}
          aria-hidden="true"
        />
        <p className="flex-1 text-sm font-medium leading-relaxed">
          {toast.message}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-current/70 transition hover:bg-white/10 hover:text-current"
          aria-label={t('toast.dismiss')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body
  );
}
