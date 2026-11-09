import { useEffect, useState } from 'react';
import { Check, Gift, Loader2, UserRound, Undo2 } from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';

export default function ReserveModal({
  open,
  item,
  mode = 'reserve',
  memberName = '',
  onClose,
  onConfirm,
}) {
  const { t } = useI18n();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isRelease = mode === 'release';

  useEffect(() => {
    if (!open) return;
    setError('');
    setSubmitting(false);
  }, [open, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await onConfirm({
        item,
        mode: isRelease ? 'release' : 'reserve',
      });
      onClose();
    } catch (nextError) {
      console.error('Could not update the reservation:', nextError);

      if (nextError.code === 'ALREADY_RESERVED') {
        setError(
          t('reserve.already', {
            name: nextError.reservedBy || t('common.someone'),
          })
        );
      } else if (nextError.code === 'OWN_ITEM') {
        setError(t('reserve.ownItem'));
      } else if (nextError.code === 'NOT_RESERVED') {
        setError(t('release.error'));
      } else {
        setError(isRelease ? t('release.error') : t('reserve.error'));
      }

      setSubmitting(false);
    }
  };

  const title = isRelease ? t('release.title') : t('reserve.title');
  const description = isRelease
    ? t('release.description', { title: item?.title || '' })
    : t('reserve.description', { title: item?.title || '' });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
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
            {isRelease ? t('release.cancel') : t('reserve.cancel')}
          </button>
          <button
            type="submit"
            form="reserve-form"
            disabled={submitting}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isRelease
                ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-amber-950 shadow-black/10 hover:from-amber-400 hover:to-orange-300'
                : 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-rose-950/20 hover:from-rose-500 hover:to-red-400'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {isRelease ? t('release.releasing') : t('reserve.saving')}
              </>
            ) : isRelease ? (
              <>
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                {t('release.confirm')}
              </>
            ) : (
              <>
                <Gift className="h-4 w-4" aria-hidden="true" />
                {t('reserve.confirm')}
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="reserve-form" onSubmit={handleSubmit} className="space-y-4">
        {isRelease ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-3.5 py-2.5 text-sm text-success">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {t('card.reservedBy', {
                name:
                  item?.reservation?.reserved_by_name ||
                  memberName ||
                  t('common.someone'),
              })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-strong px-3.5 py-2.5 text-sm text-muted">
            <UserRound className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <span>{t('reserve.asName', { name: memberName })}</span>
          </div>
        )}

        {error ? (
          <div
            id="reserve-error"
            className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            role="alert"
          >
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
