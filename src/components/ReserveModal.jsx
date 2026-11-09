import { useEffect, useState } from 'react';
import { Check, Gift, Loader2, Undo2 } from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { getProfileName, setProfileName } from '../lib/profile';

const INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-rose-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-rose-500/20';

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
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRelease ? t('release.cancel') : t('reserve.cancel')}
          </button>
          <button
            type="submit"
            form="reserve-form"
            disabled={submitting}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isRelease
                ? 'bg-gradient-to-r from-amber-600 to-orange-500 shadow-amber-950/30 hover:from-amber-500 hover:to-orange-400'
                : 'bg-gradient-to-r from-rose-600 to-red-500 shadow-rose-950/30 hover:from-rose-500 hover:to-red-400'
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
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-200">
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
              className="mb-1.5 block text-xs font-semibold text-slate-300"
            >
              {t('reserve.nameLabel')} <span className="text-rose-300">*</span>
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
            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-100"
            role="alert"
          >
            {error}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
