import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy copy path.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export default function CopyLinkButton({ text, label, className = '' }) {
  const { t } = useI18n();
  const [status, setStatus] = useState('idle');

  const handleCopy = async () => {
    if (!text) return;
    const copied = await copyText(text);
    setStatus(copied ? 'copied' : 'failed');
    window.setTimeout(() => setStatus('idle'), 2200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong ${className}`}
    >
      {status === 'copied' ? (
        <Check className="h-4 w-4 text-success" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {status === 'copied'
        ? t('common.copied')
        : status === 'failed'
          ? t('common.copyFailed')
          : label}
    </button>
  );
}
