import { useEffect, useState } from 'react';
import { Globe2, Loader2, ShoppingBasket } from 'lucide-react';
import Modal from './Modal';
import { useI18n } from '../i18n/I18nProvider';
import { getMembersForSession, getSession } from '../lib/groupStore';
import { fetchUrlMetadata } from '../lib/ogScraper';
import { normalizeUrl } from '../lib/url';

const INPUT_CLASS =
  'w-full rounded-xl border border-line bg-field px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/60 focus:bg-panel focus:ring-2 focus:ring-accent/20';

const LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-muted';

function sessionKey(session) {
  return `${session?.groupSecret || ''}:${session?.userSecret || ''}`;
}

export default function BookmarkletModal({
  open,
  pageUrl,
  pageTitle,
  sessions,
  currentSession,
  onClose,
  onSave,
}) {
  const { t } = useI18n();
  const [status, setStatus] = useState('loading');
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState('');
  const [form, setForm] = useState({
    title: '',
    url: '',
    image_url: '',
    notes: '',
    price: '',
  });
  const [selectedKey, setSelectedKey] = useState('');
  const [groupState, setGroupState] = useState(null);
  const [recipientId, setRecipientId] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    const controller = new AbortController();
    const defaultSession = currentSession || sessions?.[0] || null;

    setStatus('loading');
    setLoadingGroup(false);
    setSaving(false);
    setErrorCode('');
    setGroupState(null);
    setRecipientId('');
    setSelectedKey(defaultSession ? sessionKey(defaultSession) : '');
    setForm({
      title: pageTitle || '',
      url: pageUrl || '',
      image_url: '',
      notes: '',
      price: '',
    });

    async function load() {
      const metadataPromise = pageUrl
        ? fetchUrlMetadata(pageUrl, { signal: controller.signal }).catch(
            () => null
          )
        : Promise.resolve(null);

      const sessionPromise = defaultSession
        ? getSession(defaultSession).then(async (resolved) => {
            if (!resolved) throw Object.assign(new Error('SESSION_REVOKED'), {
              code: 'SESSION_REVOKED',
            });
            const members = await getMembersForSession(defaultSession);
            return { resolved, members, session: defaultSession };
          })
        : Promise.resolve(null);

      const [metadata, sessionResult] = await Promise.all([
        metadataPromise,
        sessionPromise,
      ]);
      if (cancelled) return;

      if (metadata) {
        setForm((current) => ({
          ...current,
          title: metadata.title || current.title || pageTitle || '',
          image_url: metadata.image_url || '',
          notes: metadata.description || '',
          price: metadata.price || '',
        }));
      }

      if (!sessionResult) {
        setErrorCode('NO_GROUP');
        setStatus('error');
        return;
      }

      setGroupState({
        session: sessionResult.session,
        group: sessionResult.resolved.group,
        members: sessionResult.members,
      });
      setRecipientId(sessionResult.resolved.member.id);
      setStatus('ready');
    }

    void load().catch((error) => {
      if (cancelled) return;
      setErrorCode(error.code || 'UNKNOWN');
      setStatus('error');
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGroupChange = async (event) => {
    const key = event.target.value;
    const candidate = (sessions || []).find(
      (session) => sessionKey(session) === key
    );
    if (!candidate) return;

    setSelectedKey(key);
    setLoadingGroup(true);
    setErrorCode('');

    try {
      const resolved = await getSession(candidate);
      if (!resolved) throw new Error('SESSION_REVOKED');
      const members = await getMembersForSession(candidate);
      setGroupState({ session: candidate, group: resolved.group, members });
      setRecipientId(resolved.member.id);
    } catch (error) {
      setErrorCode(error.code || 'UNKNOWN');
    } finally {
      setLoadingGroup(false);
    }
  };

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrorCode('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!groupState || saving) return;

    if (!form.title.trim()) {
      setErrorCode('TITLE_REQUIRED');
      return;
    }

    setSaving(true);
    setErrorCode('');

    try {
      await onSave({
        group: groupState.group,
        session: {
          groupSecret: groupState.session.groupSecret,
          userSecret: groupState.session.userSecret,
        },
        item: {
          title: form.title.trim(),
          url: normalizeUrl(form.url) || pageUrl || '',
          image_url: normalizeUrl(form.image_url),
          notes: form.notes.trim(),
          price: form.price.trim(),
          ownerMemberId: recipientId || null,
        },
      });
      onClose();
    } catch (error) {
      setErrorCode(error.code || 'UNKNOWN');
      setSaving(false);
    }
  };

  const busy = status === 'loading' || loadingGroup || saving;
  const selectedGroup = groupState?.group;
  const members = groupState?.members || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('bookmarklet.title')}
      description={t('bookmarklet.description')}
      size="lg"
      closeDisabled={saving}
      footer={
        status === 'ready' ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('bookmarklet.cancel')}
            </button>
            <button
              type="submit"
              form="bookmarklet-form"
              disabled={busy || !selectedGroup}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 transition hover:from-rose-500 hover:to-red-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
              )}
              {saving
                ? t('bookmarklet.saving')
                : t('bookmarklet.save')}
            </button>
          </div>
        ) : null
      }
    >
      {status === 'loading' ? (
        <div
          className="flex flex-col items-center rounded-2xl border border-line bg-surface px-5 py-10 text-center"
          role="status"
        >
          <Loader2
            className="h-7 w-7 animate-spin text-accent"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-semibold text-ink">
            {t('bookmarklet.loading')}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t('bookmarklet.loadingDescription')}
          </p>
        </div>
      ) : null}

      {status === 'error' ? (
        <div
          className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
          role="alert"
        >
          {t(`bookmarklet.errors.${errorCode || 'UNKNOWN'}`)}
        </div>
      ) : null}

      {status === 'ready' ? (
        <form id="bookmarklet-form" onSubmit={handleSubmit} className="space-y-5">
          {errorCode ? (
            <div
              className="rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
              role="alert"
            >
              {t(`bookmarklet.errors.${errorCode}`)}
            </div>
          ) : null}

          <div className="rounded-2xl border border-line bg-surface-strong px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('bookmarklet.page')}
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-ink">
              {form.url || pageUrl}
            </p>
          </div>

          {sessions.length > 1 ? (
            <div>
              <label htmlFor="bookmarklet-group" className={LABEL_CLASS}>
                {t('bookmarklet.group')}
              </label>
              <select
                id="bookmarklet-group"
                value={selectedKey}
                onChange={handleGroupChange}
                disabled={loadingGroup || saving}
                className={INPUT_CLASS}
              >
                {sessions.map((session) => (
                  <option
                    key={sessionKey(session)}
                    value={sessionKey(session)}
                  >
                    {session.groupName || t('groups.fallback')}
                    {session.displayName ? ` · ${session.displayName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label htmlFor="bookmarklet-recipient" className={LABEL_CLASS}>
              {t('bookmarklet.forWhom')}
            </label>
            <select
              id="bookmarklet-recipient"
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              disabled={loadingGroup || saving || !members.length}
              className={INPUT_CLASS}
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                  {groupState?.session?.memberId === member.id
                    ? ` (${t('members.you')})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bookmarklet-title" className={LABEL_CLASS}>
              {t('bookmarklet.titleLabel')} <span className="text-accent">*</span>
            </label>
            <input
              id="bookmarklet-title"
              type="text"
              value={form.title}
              onChange={updateField('title')}
              className={INPUT_CLASS}
              data-autofocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bookmarklet-price" className={LABEL_CLASS}>
                {t('add.priceLabel')}
              </label>
              <input
                id="bookmarklet-price"
                type="text"
                value={form.price}
                onChange={updateField('price')}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="bookmarklet-image" className={LABEL_CLASS}>
                {t('add.imageLabel')}
              </label>
              <input
                id="bookmarklet-image"
                type="text"
                value={form.image_url}
                onChange={updateField('image_url')}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label htmlFor="bookmarklet-notes" className={LABEL_CLASS}>
              {t('add.notesLabel')}
            </label>
            <textarea
              id="bookmarklet-notes"
              value={form.notes}
              onChange={updateField('notes')}
              rows={3}
              className={`${INPUT_CLASS} resize-y`}
            />
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
