import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';

export default function DeleteWishModal({ open, item, onClose, onConfirm }) {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState('');

  useEffect(() => {
    if (!open) return;
    setSubmitting(false);
    setErrorCode('');
  }, [open]);

  const handleConfirm = async () => {
    if (!item || submitting) return;
    setSubmitting(true);
    setErrorCode('');

    try {
      await onConfirm(item);
      onClose();
    } catch (error) {
      setErrorCode(error.code || 'UNKNOWN');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('delete.title')}
      description={t('delete.description')}
      size="sm"
      closeDisabled={submitting}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('delete.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !item}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 transition hover:from-rose-600 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            {submitting ? t('delete.deleting') : t('delete.confirm')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-danger"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {item?.title || ''}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {item?.is_suggestion
                ? t('delete.suggestionWarning', {
                    name: item?.owner_name || '',
                  })
                : t('delete.ownerWarning')}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted">
          {t('delete.irreversible')}
        </p>

        {errorCode ? (
          <p
            className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            role="alert"
          >
            {errorCode === 'NOT_ALLOWED'
              ? t('group.errors.NOT_ALLOWED')
              : t('delete.error')}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
