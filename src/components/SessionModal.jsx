import { Download, LogOut, Shield, UserRound } from 'lucide-react';
import Modal from './Modal';
import CopyLinkButton from './CopyLinkButton';
import { useI18n } from '../i18n/I18nProvider';

export default function SessionModal({
  open,
  onClose,
  group,
  member,
  personalLink,
  groupInviteLink,
  onLeaveDevice,
  canInstall,
  onInstall,
}) {
  const { t } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('session.title')}
      description={t('session.description')}
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              {t('session.group')}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {group?.name || ''}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              {t('session.member')}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
              <UserRound className="h-4 w-4 text-accent" aria-hidden="true" />
              {member?.displayName || ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs text-muted">
          <Shield className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          {member?.isAdmin
            ? t('session.roleAdmin')
            : t('session.roleMember')}
        </div>

        <section>
          <h3 className="text-sm font-semibold text-ink">
            {t('session.personalLink')}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-subtle">
            {t('session.personalLinkHint')}
          </p>
          <div className="mt-2 rounded-xl border border-line bg-field p-3">
            <p className="break-all text-xs leading-relaxed text-muted">
              {personalLink}
            </p>
            <CopyLinkButton
              text={personalLink}
              label={t('session.copyPersonalLink')}
              className="mt-2 w-full"
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-ink">
            {t('session.groupInviteLink')}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-subtle">
            {t('session.groupInviteHint')}
          </p>
          <div className="mt-2 rounded-xl border border-line bg-field p-3">
            <p className="break-all text-xs leading-relaxed text-muted">
              {groupInviteLink}
            </p>
            <CopyLinkButton
              text={groupInviteLink}
              label={t('session.copyGroupInvite')}
              className="mt-2 w-full"
            />
          </div>
        </section>

        {canInstall ? (
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('nav.install')}
          </button>
        ) : null}

        <section className="border-t border-line pt-4">
          <p className="text-xs leading-relaxed text-subtle">
            {t('session.leaveHint')}
          </p>
          <button
            type="button"
            onClick={onLeaveDevice}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/20"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('session.leaveDevice')}
          </button>
        </section>
      </div>
    </Modal>
  );
}
