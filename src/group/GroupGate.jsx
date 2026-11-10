import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  Gift,
  Loader2,
  RefreshCw,
  UserPlus,
  Users,
} from 'lucide-react';
import CopyLinkButton from '../components/CopyLinkButton';
import { SyncFallbackBanner } from '../components/Banners';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import { useI18n } from '../i18n/I18nProvider';
import { useGroup } from './GroupProvider';

const INPUT_CLASS =
  'w-full rounded-xl border border-line bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/60 focus:bg-panel focus:ring-2 focus:ring-accent/20';

const PRIMARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 transition hover:from-rose-500 hover:to-red-400 disabled:cursor-not-allowed disabled:opacity-60';

const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50';

const LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-muted';

function GateShell({ children }) {
  const { t } = useI18n();

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="safe-top mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 shadow-lg shadow-rose-950/40">
            <Gift className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-semibold leading-tight text-ink sm:text-xl">
              {t('app.title')}
            </span>
            <span className="hidden truncate text-xs text-muted sm:block">
              {t('app.subtitle')}
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 pb-16 pt-4 sm:px-6">
        {children}
      </main>
    </div>
  );
}

function ErrorMessage({ code }) {
  const { t } = useI18n();
  if (!code) return null;

  return (
    <div
      className="w-full rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
      role="alert"
    >
      {t(`group.errors.${code}`)}
    </div>
  );
}

function FormCard({ icon: Icon, title, description, children }) {
  return (
    <section className="w-full max-w-xl rounded-3xl border border-line bg-surface p-6 shadow-xl shadow-black/5 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface-strong text-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {title}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function CreateGroupForm() {
  const { t } = useI18n();
  const { createGroup, sessions, resumeCurrentGroup } = useGroup();
  const [groupName, setGroupName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setErrorCode('');
    setSubmitting(true);

    try {
      await createGroup({ groupName, displayName });
    } catch (error) {
      setErrorCode(error.code || 'UNKNOWN');
      setSubmitting(false);
    }
  };

  return (
    <FormCard
      icon={Users}
      title={t('group.createTitle')}
      description={t('group.createDescription')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="group-name" className={LABEL_CLASS}>
            {t('group.groupNameLabel')}
          </label>
          <input
            id="group-name"
            type="text"
            value={groupName}
            onChange={(event) => {
              setGroupName(event.target.value);
              setErrorCode('');
            }}
            placeholder={t('group.groupNamePlaceholder')}
            className={INPUT_CLASS}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="group-display-name" className={LABEL_CLASS}>
            {t('group.yourNameLabel')}
          </label>
          <input
            id="group-display-name"
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setErrorCode('');
            }}
            placeholder={t('group.yourNamePlaceholder')}
            autoComplete="name"
            className={INPUT_CLASS}
          />
        </div>

        <ErrorMessage code={errorCode} />

        <button type="submit" disabled={submitting} className={`${PRIMARY_BUTTON} w-full`}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Users className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? t('group.creating') : t('group.createSubmit')}
        </button>
      </form>

      <p className="mt-4 text-xs leading-relaxed text-subtle">
        {t('group.inviteHint')}
      </p>

      {sessions.length > 0 ? (
        <button
          type="button"
          onClick={() => void resumeCurrentGroup()}
          className={`${SECONDARY_BUTTON} mt-3 w-full`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('group.backToGroup')}
        </button>
      ) : null}
    </FormCard>
  );
}

function JoinGroupForm() {
  const { t } = useI18n();
  const {
    inviteGroup,
    joinGroup,
    startAddGroup,
    sessions,
    resumeCurrentGroup,
    errorCode,
  } = useGroup();
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const initialError = errorCode === 'SESSION_REVOKED' ? errorCode : '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setLocalError('');
    setSubmitting(true);

    try {
      await joinGroup({ displayName });
    } catch (error) {
      setLocalError(error.code || 'UNKNOWN');
      setSubmitting(false);
    }
  };

  return (
    <FormCard
      icon={UserPlus}
      title={t('group.joinTitle')}
      description={t('group.joinDescription', {
        group: inviteGroup?.name || '',
      })}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {initialError ? (
          <div
            className="rounded-xl border border-warning/20 bg-warning/10 px-3.5 py-2.5 text-sm text-ink"
            role="status"
          >
            {t('group.sessionRevoked')}
          </div>
        ) : null}

        <div>
          <label htmlFor="join-display-name" className={LABEL_CLASS}>
            {t('group.yourNameLabel')}
          </label>
          <input
            id="join-display-name"
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setLocalError('');
            }}
            placeholder={t('group.yourNamePlaceholder')}
            autoComplete="name"
            className={INPUT_CLASS}
            autoFocus
          />
        </div>

        <ErrorMessage code={localError} />

        <button type="submit" disabled={submitting} className={`${PRIMARY_BUTTON} w-full`}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? t('group.joining') : t('group.joinSubmit')}
        </button>
      </form>

      <p className="mt-4 text-xs leading-relaxed text-subtle">
        {t('group.joinPendingHint')}
      </p>

      <button
        type="button"
        onClick={startAddGroup}
        className={`${SECONDARY_BUTTON} mt-3 w-full`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('group.startNewGroup')}
      </button>

      {sessions.length > 0 ? (
        <button
          type="button"
          onClick={() => void resumeCurrentGroup()}
          className={`${SECONDARY_BUTTON} mt-2 w-full`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('group.backToGroup')}
        </button>
      ) : null}
    </FormCard>
  );
}

function InviteGate() {
  const { t } = useI18n();
  const {
    inviteInfo,
    claimInvite,
    startAddGroup,
    sessions,
    resumeCurrentGroup,
  } = useGroup();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleClaim = async () => {
    if (submitting) return;
    setLocalError('');
    setSubmitting(true);

    try {
      await claimInvite();
    } catch (error) {
      setLocalError(error.code || 'UNKNOWN');
      setSubmitting(false);
    }
  };

  return (
    <FormCard
      icon={Gift}
      title={t('group.inviteTitle')}
      description={t('group.inviteDescription', {
        group: inviteInfo?.group?.name || '',
      })}
    >
      <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3 text-left text-sm">
        <p className="text-muted">
          <span className="font-semibold text-ink">{t('group.pendingGroup')}:</span>{' '}
          {inviteInfo?.group?.name}
        </p>
        <p className="mt-1 text-muted">
          <span className="font-semibold text-ink">{t('group.pendingMember')}:</span>{' '}
          {inviteInfo?.member?.displayName}
        </p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-subtle">
        {t('group.inviteSingleUseHint')}
      </p>

      <div className="mt-4">
        <ErrorMessage code={localError} />
      </div>

      <button
        type="button"
        onClick={handleClaim}
        disabled={submitting}
        className={`${PRIMARY_BUTTON} mt-4 w-full`}
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        )}
        {submitting ? t('group.inviteJoining') : t('group.inviteJoin')}
      </button>

      <button
        type="button"
        onClick={startAddGroup}
        className={`${SECONDARY_BUTTON} mt-2 w-full`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('group.startNewGroup')}
      </button>

      {sessions.length > 0 ? (
        <button
          type="button"
          onClick={() => void resumeCurrentGroup()}
          className={`${SECONDARY_BUTTON} mt-2 w-full`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('group.backToGroup')}
        </button>
      ) : null}
    </FormCard>
  );
}

function PendingApproval() {
  const { t } = useI18n();
  const {
    group,
    member,
    personalLink,
    refreshSession,
    checking,
    leaveDevice,
  } = useGroup();
  const [checkError, setCheckError] = useState('');

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshSession({ silent: true });
    }, 8000);
    return () => window.clearInterval(interval);
  }, [refreshSession]);

  const handleCheck = async () => {
    setCheckError('');
    try {
      await refreshSession();
    } catch (error) {
      setCheckError(error.code || 'UNKNOWN');
    }
  };

  return (
    <section className="w-full max-w-xl rounded-3xl border border-line bg-surface p-6 shadow-xl shadow-black/5 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span className="relative mb-5 grid h-20 w-20 place-items-center rounded-3xl border border-warning/20 bg-warning/10">
          <span className="absolute inset-0 animate-pulse rounded-3xl bg-warning/10 blur-xl" />
          <Clock3 className="relative h-9 w-9 text-warning" aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink">
          {t('group.pendingTitle')}
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          {t('group.pendingDescription')}
        </p>

        <div className="mt-5 w-full rounded-2xl border border-line bg-surface-strong px-4 py-3 text-left text-sm">
          <p className="text-muted">
            <span className="font-semibold text-ink">{t('group.pendingGroup')}:</span>{' '}
            {group?.name}
          </p>
          <p className="mt-1 text-muted">
            <span className="font-semibold text-ink">{t('group.pendingMember')}:</span>{' '}
            {member?.displayName}
          </p>
        </div>

        {personalLink ? (
          <div className="mt-5 w-full text-left">
            <p className="mb-1.5 text-xs font-semibold text-muted">
              {t('session.personalLink')}
            </p>
            <div className="rounded-xl border border-line bg-field p-3">
              <p className="break-all text-xs leading-relaxed text-muted">
                {personalLink}
              </p>
              <CopyLinkButton
                text={personalLink}
                label={t('group.copyPersonalLink')}
                className="mt-2 w-full"
              />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-subtle">
              {t('session.personalLinkHint')}
            </p>
          </div>
        ) : null}

        <ErrorMessage code={checkError} />

        <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className={`${PRIMARY_BUTTON} flex-1`}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            {checking ? t('group.checking') : t('group.checkAgain')}
          </button>
          <button type="button" onClick={leaveDevice} className={SECONDARY_BUTTON}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('group.leaveDevice')}
          </button>
        </div>
      </div>
    </section>
  );
}

function InvalidGroup({ errorCode }) {
  const { t } = useI18n();
  const { leaveDevice } = useGroup();

  return (
    <FormCard
      icon={AlertTriangle}
      title={t('group.invalidTitle')}
      description={t(`group.errors.${errorCode || 'UNKNOWN'}`)}
    >
      <button type="button" onClick={leaveDevice} className={`${PRIMARY_BUTTON} w-full`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('group.backToStart')}
      </button>
    </FormCard>
  );
}

function GateError({ errorCode }) {
  const { t } = useI18n();
  const { retry, leaveDevice } = useGroup();

  return (
    <FormCard
      icon={AlertTriangle}
      title={t('group.errorTitle')}
      description={t(`group.errors.${errorCode || 'UNKNOWN'}`)}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={retry} className={`${PRIMARY_BUTTON} flex-1`}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('group.retry')}
        </button>
        <button type="button" onClick={leaveDevice} className={SECONDARY_BUTTON}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('group.backToStart')}
        </button>
      </div>
    </FormCard>
  );
}

function GateLoading() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center text-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
      <p className="mt-4 text-sm text-muted">{t('group.loading')}</p>
    </div>
  );
}

export default function GroupGate() {
  const {
    status,
    inviteGroup,
    inviteInfo,
    errorCode,
    fallbackReason,
  } = useGroup();

  let content = null;

  if (status === 'loading') content = <GateLoading />;
  else if (status === 'no-group') content = <CreateGroupForm />;
  else if (status === 'join') {
    content = inviteGroup ? <JoinGroupForm /> : <GateLoading />;
  }
  else if (status === 'invite') {
    content = inviteInfo ? <InviteGate /> : <GateLoading />;
  }
  else if (status === 'pending') content = <PendingApproval />;
  else if (status === 'invalid') content = <InvalidGroup errorCode={errorCode} />;
  else if (status === 'error') content = <GateError errorCode={errorCode} />;

  return (
    <GateShell>
      <div className="w-full max-w-xl space-y-3">
        {fallbackReason ? (
          <SyncFallbackBanner reason={fallbackReason} />
        ) : null}
        {content}
      </div>
    </GateShell>
  );
}
