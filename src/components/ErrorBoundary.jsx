import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled application error:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }) {
  const { t } = useI18n();

  const fallback = (
    <div
      className="flex min-h-dvh items-center justify-center px-4 py-12"
      role="alert"
    >
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-2xl shadow-black/10">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-danger/20 bg-danger/10">
          <AlertTriangle className="h-7 w-7 text-danger" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          {t('error.boundaryTitle')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {t('error.boundaryDescription')}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-red-400"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t('error.reload')}
        </button>
      </div>
    </div>
  );

  return <ErrorBoundaryInner fallback={fallback}>{children}</ErrorBoundaryInner>;
}
