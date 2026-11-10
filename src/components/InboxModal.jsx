import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  Inbox,
  Loader2,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import CopyLinkButton from './CopyLinkButton';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { formatRelativeDate } from '../lib/date';
import { getMemberColor, getMemberInitial } from '../lib/memberColor';

const INPUT_CLASS =
  'w-full min-w-0 rounded-xl border border-line bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/60 focus:bg-panel focus:ring-2 focus:ring-accent/20';

export default function InboxModal({
  open,
  onClose,
  pendingMembers,
  members = [],
  currentMemberId,
  notifications,
  isAdmin,
  onApprove,
  onReject,
  onMarkRead,
  onCreateInvite,
  onRemoveMember,
}) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState('notifications');
  const [busyId, setBusyId] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [removeConfirmId, setRemoveConfirmId] = useState('');
  const [removeBusyId, setRemoveBusyId] = useState('');
  const [removeError, setRemoveError] = useState('');
  const markedRef = useRef(false);
  const wasOpenRef = useRef(false);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;

    wasOpenRef.current = true;
    setActiveTab(
      isAdmin && pendingMembers.length > 0 ? 'requests' : 'notifications'
    );
    setBusyId('');
    setErrorCode('');
    setInviteName('');
    setInviteBusy(false);
    setInviteError('');
    setInviteResult(null);
    setRemoveConfirmId('');
    setRemoveBusyId('');
    setRemoveError('');
    markedRef.current = false;
  }, [open, isAdmin, pendingMembers.length]);

  useEffect(() => {
    if (
      !open ||
      activeTab !== 'notifications' ||
      unreadCount === 0 ||
      markedRef.current
    ) {
      return;
    }

    markedRef.current = true;
    Promise.resolve(onMarkRead()).catch(() => {
      markedRef.current = false;
    });
  }, [open, activeTab, unreadCount, onMarkRead]);

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

  const handleCreateInvite = async (event) => {
    event.preventDefault();
    if (!onCreateInvite || inviteBusy) return;

    const name = inviteName.trim();
    if (!name) {
      setInviteError('INVALID_NAME');
      return;
    }

    setInviteBusy(true);
    setInviteError('');

    try {
      const result = await onCreateInvite(name);
      setInviteResult(result);
      setInviteName('');
    } catch (error) {
      setInviteError(error.code || 'UNKNOWN');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!onRemoveMember || removeBusyId) return;
    setRemoveBusyId(member.id);
    setRemoveError('');

    try {
      await onRemoveMember(member);
      setRemoveConfirmId('');
    } catch (error) {
      setRemoveError(error.code || 'UNKNOWN');
    } finally {
      setRemoveBusyId('');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('inbox.title')}
      description={t('inbox.description')}
      size="md"
      closeDisabled={Boolean(busyId)}
    >
      <div className="space-y-4">
        <div
          className="flex gap-1 rounded-xl border border-line bg-surface p-1"
          role="tablist"
          aria-label={t('inbox.tabsLabel')}
        >
          {isAdmin ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'requests'}
              aria-controls="inbox-requests-panel"
              id="inbox-requests-tab"
              onClick={() => setActiveTab('requests')}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                activeTab === 'requests'
                  ? 'bg-surface-strong text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              {t('inbox.requests')}
              {pendingMembers.length > 0 ? (
                <span className="rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                  {pendingMembers.length}
                </span>
              ) : null}
            </button>
          ) : null}

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notifications'}
            aria-controls="inbox-notifications-panel"
            id="inbox-notifications-tab"
            onClick={() => setActiveTab('notifications')}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              activeTab === 'notifications'
                ? 'bg-surface-strong text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            {t('inbox.notifications')}
            {unreadCount > 0 ? (
              <span className="rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                {unreadCount}
              </span>
            ) : null}
          </button>
        </div>

        {errorCode ? (
          <div
            className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            role="alert"
          >
            {t(`group.errors.${errorCode}`)}
          </div>
        ) : null}

        {activeTab === 'requests' && isAdmin ? (
          <div
            id="inbox-requests-panel"
            role="tabpanel"
            aria-labelledby="inbox-requests-tab"
            className="space-y-3"
          >
            {onCreateInvite ? (
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
                <h3 className="text-sm font-semibold text-ink">
                  {t('members.inviteTitle')}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {t('members.inviteDescription')}
                </p>

                <form
                  onSubmit={handleCreateInvite}
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                >
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(event) => {
                      setInviteName(event.target.value);
                      setInviteError('');
                    }}
                    placeholder={t('members.inviteNamePlaceholder')}
                    aria-label={t('members.inviteNameLabel')}
                    className={INPUT_CLASS}
                    disabled={inviteBusy}
                  />
                  <button
                    type="submit"
                    disabled={inviteBusy || !inviteName.trim()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3.5 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {inviteBusy ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                    )}
                    {inviteBusy
                      ? t('members.inviteCreating')
                      : t('members.inviteCreate')}
                  </button>
                </form>

                {inviteError ? (
                  <p
                    className="mt-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger"
                    role="alert"
                  >
                    {t(`group.errors.${inviteError}`)}
                  </p>
                ) : null}

                {inviteResult ? (
                  <div className="mt-3 rounded-xl border border-success/20 bg-success/10 p-3">
                    <p className="text-sm font-semibold text-success">
                      {t('members.inviteLinkTitle', {
                        name: inviteResult.name,
                      })}
                    </p>
                    <p className="mt-1 break-all text-xs leading-relaxed text-muted">
                      {inviteResult.link}
                    </p>
                    <CopyLinkButton
                      text={inviteResult.link}
                      label={t('members.inviteCopy')}
                      className="mt-2 w-full"
                    />
                    <p className="mt-1.5 text-xs leading-relaxed text-subtle">
                      {t('members.inviteLinkHint')}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {pendingMembers.length === 0 ? (
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
              pendingMembers.map((pendingMember) => {
                const isBusy = busyId === pendingMember.id;
                const relativeDate = formatRelativeDate(
                  pendingMember.createdAt,
                  locale
                );

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

            {onRemoveMember && members.length > 0 ? (
              <div className="rounded-2xl border border-line bg-surface p-4">
                <h3 className="text-sm font-semibold text-ink">
                  {t('members.manageTitle')}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {t('members.manageDescription')}
                </p>

                <div className="mt-3 space-y-1.5">
                  {members.map((member) => {
                    const color = getMemberColor(member.id);
                    const isCurrent = member.id === currentMemberId;
                    const confirming = removeConfirmId === member.id;
                    const isBusy = removeBusyId === member.id;

                    return (
                      <div
                        key={member.id}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-field px-2.5 py-2"
                      >
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: color.background,
                            color: color.foreground,
                          }}
                          aria-hidden="true"
                        >
                          {getMemberInitial(member.displayName)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                          {member.displayName}
                          {isCurrent ? ` (${t('members.you')})` : ''}
                        </span>
                        {member.isAdmin ? (
                          <span className="rounded-full border border-accent/20 bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
                            {t('members.adminBadge')}
                          </span>
                        ) : null}

                        {confirming ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-danger">
                              {t('members.removeConfirmShort')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member)}
                              disabled={isBusy}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-danger/20 bg-danger/10 px-2 text-[11px] font-semibold text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2
                                  className="h-3.5 w-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <UserMinus
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                              {t('members.remove')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRemoveConfirmId('')}
                              disabled={isBusy}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-line bg-surface px-2 text-[11px] font-semibold text-muted transition hover:bg-surface-strong hover:text-ink disabled:opacity-60"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              {t('members.removeCancel')}
                            </button>
                          </div>
                        ) : isCurrent ? null : (
                          <button
                            type="button"
                            onClick={() => {
                              setRemoveConfirmId(member.id);
                              setRemoveError('');
                            }}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-danger/20 bg-danger/10 px-2 text-[11px] font-semibold text-danger transition hover:bg-danger/20"
                            aria-label={t('members.removeAria', {
                              name: member.displayName,
                            })}
                          >
                            <UserMinus
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {t('members.remove')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-subtle">
                  {t('members.removeHint')}
                </p>

                {removeError ? (
                  <p
                    className="mt-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger"
                    role="alert"
                  >
                    {t(`group.errors.${removeError}`)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'notifications' ? (
          <div
            id="inbox-notifications-panel"
            role="tabpanel"
            aria-labelledby="inbox-notifications-tab"
            className="space-y-3"
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
                <Inbox className="h-8 w-8 text-subtle" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-ink">
                  {t('inbox.empty')}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {t('inbox.emptyDescription')}
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const payload = notification.payload || {};
                const relativeDate = formatRelativeDate(
                  notification.createdAt,
                  locale
                );

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${
                      notification.isRead
                        ? 'border-line bg-surface text-muted'
                        : 'border-warning/20 bg-warning/10 text-ink'
                    }`}
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed">
                        {t('inbox.wishDeleted', {
                          title: payload.item_title || '',
                          name: payload.deleted_by_name || '',
                        })}
                      </p>
                      <p className="mt-1 text-xs text-subtle">
                        {relativeDate}
                      </p>
                    </div>
                    {!notification.isRead ? (
                      <>
                        <span
                          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-warning"
                          aria-hidden="true"
                        />
                        <span className="sr-only">{t('inbox.unread')}</span>
                      </>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
