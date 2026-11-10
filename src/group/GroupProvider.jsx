import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  buildSessionLink,
  claimInvite as claimInviteInStore,
  clearSchemaProbeCache,
  clearStoredSession,
  clearStoredSessions,
  createGroup as createGroupInStore,
  DEMO_GROUP_EVENT,
  generateSecret,
  getCapabilities,
  getGroupBySecret,
  getInviteInfo,
  getSession,
  GroupError,
  joinGroup as joinGroupInStore,
  parseSessionParams,
  probeGroupSchema,
  readStoredSessions,
  removeStoredSession,
  setDataMode as setStoreDataMode,
  upsertStoredSession,
  writeStoredSession,
} from '../lib/groupStore';
import { isSupabaseConfigured } from '../lib/supabase';

const GroupContext = createContext(null);

function writeSessionToUrl({ groupSecret, userSecret }) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (groupSecret) url.searchParams.set('group', groupSecret);
  else url.searchParams.delete('group');
  if (userSecret) url.searchParams.set('user', userSecret);
  else url.searchParams.delete('user');
  url.searchParams.delete('invite');
  window.history.replaceState(null, '', url);
}

function clearSessionFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('group');
  url.searchParams.delete('user');
  url.searchParams.delete('invite');
  window.history.replaceState(null, '', url);
}

function getBaseHref() {
  if (typeof window === 'undefined') return '';
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

function getRecentSession(sessions) {
  return (
    [...(sessions || [])].sort(
      (first, second) =>
        (second.lastUsedAt || 0) - (first.lastUsedAt || 0)
    )[0] || null
  );
}

function sameSession(first, second) {
  return (
    first?.groupSecret === second?.groupSecret &&
    first?.userSecret === second?.userSecret
  );
}

export function GroupProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [group, setGroup] = useState(null);
  const [member, setMember] = useState(null);
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState(() => readStoredSessions());
  const [inviteGroup, setInviteGroup] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [errorCode, setErrorCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [dataMode, setDataModeState] = useState(
    isSupabaseConfigured ? 'checking' : 'demo'
  );
  const [fallbackReason, setFallbackReason] = useState(null);
  const [capabilities, setCapabilities] = useState({
    schema_version: 1,
    features: [],
  });

  const clearCurrent = useCallback((nextStatus = 'no-group') => {
    setGroup(null);
    setMember(null);
    setSession(null);
    setInviteGroup(null);
    setInviteInfo(null);
    setErrorCode('');
    setStatus(nextStatus);
  }, []);

  const applyResolved = useCallback(
    (result, nextSession, { updateUrl = true } = {}) => {
      if (!result) {
        clearCurrent('no-group');
        clearStoredSession();
        return;
      }

      setGroup(result.group);
      setMember(result.member);
      setSession(nextSession);
      setInviteGroup(null);
      setInviteInfo(null);
      setStatus(result.member.status === 'approved' ? 'approved' : 'pending');
      setErrorCode('');

      const nextSessions = upsertStoredSession({
        ...nextSession,
        groupId: result.group.id,
        groupName: result.group.name,
        memberId: result.member.id,
        displayName: result.member.displayName,
        isAdmin: Boolean(result.member.isAdmin),
      });
      setSessions(nextSessions);
      writeStoredSession(nextSession);
      if (updateUrl) writeSessionToUrl(nextSession);
    },
    [clearCurrent]
  );

  const activateSession = useCallback(
    async (nextSession, { updateUrl = true } = {}) => {
      const resolved = await getSession(nextSession);
      if (!resolved) {
        const remaining = removeStoredSession(nextSession);
        setSessions(remaining);
        return null;
      }
      applyResolved(resolved, nextSession, { updateUrl });
      return resolved;
    },
    [applyResolved]
  );

  const switchGroup = useCallback(
    async (nextSession) => {
      if (!nextSession) return null;
      setStatus('loading');
      setErrorCode('');

      try {
        const resolved = await activateSession(nextSession);
        if (resolved) return resolved;

        const fallback = getRecentSession(readStoredSessions());
        if (fallback && !sameSession(fallback, nextSession)) {
          const fallbackResolved = await activateSession(fallback);
          if (fallbackResolved) return fallbackResolved;
        }

        clearCurrent('no-group');
        clearSessionFromUrl();
        return null;
      } catch (error) {
        setStatus('error');
        setErrorCode(error.code || 'UNKNOWN');
        return null;
      }
    },
    [activateSession, clearCurrent]
  );

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setStatus('loading');
      setErrorCode('');
      setFallbackReason(null);

      let mode = 'demo';
      let fallback = null;

      if (isSupabaseConfigured) {
        const probe = await probeGroupSchema();
        if (cancelled) return;

        if (probe === 'supabase') {
          mode = 'supabase';
        } else {
          fallback = probe === 'missing' ? 'schema' : 'network';
        }
      }

      setStoreDataMode(mode);
      setDataModeState(mode);
      setFallbackReason(fallback);

      const nextCapabilities = await getCapabilities();
      if (cancelled) return;
      setCapabilities(nextCapabilities);

      const urlSession = parseSessionParams(window.location.search);
      const storedSessions = readStoredSessions();
      setSessions(storedSessions);

      // A one-time invite always wins, even over saved sessions: the token has
      // to be resolved explicitly and confirmed before it can be claimed.
      if (urlSession.groupSecret && urlSession.inviteToken) {
        try {
          const info = await getInviteInfo({
            groupSecret: urlSession.groupSecret,
            inviteToken: urlSession.inviteToken,
          });
          if (cancelled) return;

          if (info) {
            setInviteInfo(info);
            setInviteGroup(info.group);
            setStatus('invite');
            setErrorCode('');
            return;
          }

          setInviteInfo(null);
          setInviteGroup(null);
          setStatus('invalid');
          setErrorCode('INVITE_NOT_FOUND');
          return;
        } catch (error) {
          if (cancelled) return;
          setStatus('error');
          setErrorCode(error.code || 'UNKNOWN');
          return;
        }
      }

      // A complete personal link always wins and is resolved explicitly.
      if (urlSession.groupSecret && urlSession.userSecret) {
        try {
          const resolved = await getSession(urlSession);
          if (cancelled) return;

          if (resolved) {
            applyResolved(resolved, urlSession);
            return;
          }

          const remaining = removeStoredSession(urlSession);
          setSessions(remaining);
          clearStoredSession();

          const maybeGroup = await getGroupBySecret(
            urlSession.groupSecret
          ).catch(() => null);
          if (cancelled) return;

          if (maybeGroup) {
            setInviteGroup(maybeGroup);
            setStatus('join');
            setErrorCode('SESSION_REVOKED');
            writeSessionToUrl({
              groupSecret: maybeGroup.groupSecret,
              userSecret: '',
            });
          } else {
            setStatus('invalid');
            setErrorCode('GROUP_NOT_FOUND');
          }
          return;
        } catch (error) {
          if (cancelled) return;
          setStatus('error');
          setErrorCode(error.code || 'UNKNOWN');
          return;
        }
      }

      // A group-only link is an invitation to request access, even when the
      // user already has other groups saved.
      if (urlSession.groupSecret) {
        try {
          const maybeGroup = await getGroupBySecret(urlSession.groupSecret);
          if (cancelled) return;

          if (maybeGroup) {
            setInviteGroup(maybeGroup);
            setStatus('join');
            setErrorCode('');
            writeSessionToUrl({
              groupSecret: urlSession.groupSecret,
              userSecret: '',
            });
          } else {
            setStatus('invalid');
            setErrorCode('GROUP_NOT_FOUND');
          }
        } catch (error) {
          if (cancelled) return;
          setStatus('error');
          setErrorCode(error.code || 'UNKNOWN');
        }
        return;
      }

      // Otherwise use the most recent saved session that still resolves.
      if (storedSessions.length) {
        const ordered = [...storedSessions].sort(
          (first, second) =>
            (second.lastUsedAt || 0) - (first.lastUsedAt || 0)
        );

        for (const candidate of ordered) {
          try {
            const resolved = await getSession(candidate);
            if (cancelled) return;

            if (resolved) {
              applyResolved(resolved, candidate);
              return;
            }

            removeStoredSession(candidate);
          } catch (error) {
            if (cancelled) return;
            if (error.code === 'NETWORK' || error.code === 'UNKNOWN') {
              setStatus('error');
              setErrorCode(error.code);
              return;
            }
            removeStoredSession(candidate);
          }
        }

        const remaining = readStoredSessions();
        setSessions(remaining);
      }

      clearCurrent('no-group');
      clearSessionFromUrl();
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, applyResolved, clearCurrent]);

  const createGroup = useCallback(
    async ({ groupName, displayName }) => {
      const groupSecret = generateSecret();
      const userSecret = generateSecret();
      const result = await createGroupInStore({
        groupSecret,
        name: groupName,
        userSecret,
        displayName,
      });
      applyResolved(result, { groupSecret, userSecret });
      return result;
    },
    [applyResolved]
  );

  const joinGroup = useCallback(
    async ({ displayName }) => {
      if (!inviteGroup) throw new GroupError('GROUP_NOT_FOUND');
      const userSecret = generateSecret();
      const result = await joinGroupInStore({
        groupSecret: inviteGroup.groupSecret,
        userSecret,
        displayName,
      });
      applyResolved(result, {
        groupSecret: inviteGroup.groupSecret,
        userSecret,
      });
      return result;
    },
    [applyResolved, inviteGroup]
  );

  const claimInvite = useCallback(async () => {
    if (!inviteInfo) throw new GroupError('INVITE_NOT_FOUND');

    const groupSecret = inviteInfo.group.groupSecret;
    const userSecret = generateSecret();
    const result = await claimInviteInStore({
      groupSecret,
      inviteToken: inviteInfo.inviteToken,
      userSecret,
    });
    applyResolved(result, { groupSecret, userSecret });
    return result;
  }, [applyResolved, inviteInfo]);

  const refreshSession = useCallback(
    async ({ silent = false } = {}) => {
      if (!session) return null;
      if (!silent) setChecking(true);

      try {
        const resolved = await getSession(session);
        if (resolved) {
          applyResolved(resolved, session, { updateUrl: false });
          return resolved;
        }

        const remaining = removeStoredSession(session);
        setSessions(remaining);
        clearStoredSession();

        const fallback = getRecentSession(remaining);
        if (fallback) {
          try {
            const fallbackResolved = await getSession(fallback);
            if (fallbackResolved) {
              applyResolved(fallbackResolved, fallback);
              return fallbackResolved;
            }
            removeStoredSession(fallback);
            setSessions(readStoredSessions());
          } catch {
            // Keep the revoked state below if the fallback is unreachable.
          }
        }

        const maybeGroup = await getGroupBySecret(session.groupSecret).catch(
          () => null
        );
        clearCurrent('no-group');
        if (maybeGroup) {
          setInviteGroup(maybeGroup);
          setStatus('join');
          setErrorCode('SESSION_REVOKED');
          writeSessionToUrl({
            groupSecret: maybeGroup.groupSecret,
            userSecret: '',
          });
        } else {
          clearSessionFromUrl();
        }
        return null;
      } catch (error) {
        if (!silent) throw error;
        return null;
      } finally {
        if (!silent) setChecking(false);
      }
    },
    [session, applyResolved, clearCurrent]
  );

  useEffect(() => {
    if (status !== 'pending' || dataMode !== 'demo') return undefined;

    const handleChange = () => {
      void refreshSession({ silent: true });
    };

    window.addEventListener(DEMO_GROUP_EVENT, handleChange);
    window.addEventListener('storage', handleChange);

    return () => {
      window.removeEventListener(DEMO_GROUP_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, [status, dataMode, refreshSession]);

  const startAddGroup = useCallback(() => {
    clearCurrent('no-group');
    clearSessionFromUrl();
  }, [clearCurrent]);

  const resumeCurrentGroup = useCallback(async () => {
    const next = getRecentSession(readStoredSessions());
    if (next) await switchGroup(next);
  }, [switchGroup]);

  const leaveGroup = useCallback(async () => {
    if (!session) {
      startAddGroup();
      return;
    }

    const remaining = removeStoredSession(session);
    setSessions(remaining);
    clearStoredSession();
    clearSessionFromUrl();

    const next = getRecentSession(remaining);
    if (next) {
      await switchGroup(next);
      return;
    }

    clearCurrent('no-group');
  }, [session, startAddGroup, switchGroup, clearCurrent]);

  const leaveAllGroups = useCallback(() => {
    clearStoredSessions();
    setSessions([]);
    clearSessionFromUrl();
    clearCurrent('no-group');
  }, [clearCurrent]);

  const retry = useCallback(() => {
    clearSchemaProbeCache();
    setReloadToken((current) => current + 1);
  }, []);

  const baseHref = useMemo(getBaseHref, []);

  const personalLink = useMemo(() => {
    if (!session?.groupSecret || !session?.userSecret) return '';
    return buildSessionLink({
      href: baseHref,
      groupSecret: session.groupSecret,
      userSecret: session.userSecret,
    });
  }, [baseHref, session]);

  const groupInviteLink = useMemo(() => {
    if (!session?.groupSecret) return '';
    return buildSessionLink({
      href: baseHref,
      groupSecret: session.groupSecret,
      userSecret: '',
    });
  }, [baseHref, session]);

  const value = useMemo(
    () => ({
      status,
      group,
      member,
      session,
      sessions,
      inviteGroup,
      inviteInfo,
      errorCode,
      checking,
      dataMode,
      fallbackReason,
      capabilities,
      baseHref,
      personalLink,
      groupInviteLink,
      createGroup,
      joinGroup,
      claimInvite,
      refreshSession,
      switchGroup,
      startAddGroup,
      resumeCurrentGroup,
      leaveGroup,
      leaveAllGroups,
      leaveDevice: leaveGroup,
      retry,
    }),
    [
      status,
      group,
      member,
      session,
      sessions,
      inviteGroup,
      inviteInfo,
      errorCode,
      checking,
      dataMode,
      fallbackReason,
      capabilities,
      baseHref,
      personalLink,
      groupInviteLink,
      createGroup,
      joinGroup,
      claimInvite,
      refreshSession,
      switchGroup,
      startAddGroup,
      resumeCurrentGroup,
      leaveGroup,
      leaveAllGroups,
      retry,
    ]
  );

  return (
    <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used inside a GroupProvider');
  }
  return context;
}
