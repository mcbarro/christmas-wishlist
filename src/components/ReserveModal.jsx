import { useEffect, useState } from 'react';
import { Check, Gift, Loader2, Undo2 } from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { getProfileName, setProfileName } from '../lib/profile';

const INPUT_CLASS =
  'w-full rounded-xl border border-line bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/60 focus:bg-panel focus:ring-2 focus:ring-accent/20';

export default function ReserveModal({
  open,
  item,
  mode = 'reserve',
  onClose,
  onConfirm,
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isRelease = mode === 'release';

  useEffect(() => {
    if (!open) return;
    setName(getProfileName());
    setError('');
    setSubmitting(false);
  }, [open, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    if (!isRelease && !trimmedName) {
      setError(t('reserve.nameRequired'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onConfirm({
        item,
        mode: isRelease ? 'release' : 'reserve',
        name: trimmedName,
      });

      if (!isRelease) setProfileName(trimmedName);
      onClose();
    } catch (nextError) {
      console.error('Could not update the reservation:', nextError);

      if (nextError.code === 'ALREADY_RESERVED') {
        setError(
          t('reserve.already', {
            name: nextError.reservedBy || t('common.someone'),
          })
        );
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
                name: item?.reserved_by || t('common.someone'),
              })}
            </span>
          </div>
        ) : (
          <div>
            <label
              htmlFor="reserve-name"
              className="mb-1.5 block text-xs font-semibold text-muted"
            >
              {t('reserve.nameLabel')} <span className="text-accent">*</span>
            </label>
            <input
              id="reserve-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError('');
              }}
              placeholder={t('reserve.namePlaceholder')}
              autoComplete="name"
              className={INPUT_CLASS}
              data-autofocus
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'reserve-error' : undefined}
            />
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
