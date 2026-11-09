import { useEffect, useState } from 'react';
import { Check, Loader2, UserPlus, X } from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { formatRelativeDate } from '../lib/date';

export default function MembersModal({
  open,
  onClose,
  members,
  onApprove,
  onReject,
}) {
  const { t, locale } = useI18n();
  const [busyId, setBusyId] = useState('');
  const [errorCode, setErrorCode] = useState('');

  useEffect(() => {
    if (!open) return;
    setBusyId('');
    setErrorCode('');
  }, [open]);

  const handleAction = async (memberId, approve) => {
    if (busyId) return;
    setBusyId(memberId);
    setErrorCode('');

    try {
      await (approve ? onApprove(memberId) : onReject(memberId));
    } catch (error) {
      setErrorCode(error.code || 'UNKNOWN');
    } finally {
      setBusyId('');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('members.title')}
      description={t('members.description')}
      size="sm"
      closeDisabled={Boolean(busyId)}
    >
      <div className="space-y-3">
        {errorCode ? (
          <div
            className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            role="alert"
          >
            {t(`group.errors.${errorCode}`)}
          </div>
        ) : null}

        {members.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
            <UserPlus className="h-8 w-8 text-subtle" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-ink">
              {t('members.empty')}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t('members.emptyDescription')}
            </p>
          </div>
        ) : (
          members.map((pendingMember) => {
            const relativeDate = formatRelativeDate(
              pendingMember.createdAt,
              locale
            );
            const isBusy = busyId === pendingMember.id;

            return (
              <div
                key={pendingMember.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3.5 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {pendingMember.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {pendingMember.displayName}
                    </p>
                    <p className="text-xs text-subtle">
                      {t('members.requested', { date: relativeDate })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(pendingMember.id, true)}
                    disabled={isBusy}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-xs font-semibold text-success transition hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBusy ? (
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {t('members.approve')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(pendingMember.id, false)}
                    disabled={isBusy}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('members.reject')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}
