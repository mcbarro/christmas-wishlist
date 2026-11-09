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
  clearStoredSession,
  createGroup as createGroupInStore,
  DEMO_GROUP_EVENT,
  generateSecret,
  getGroupBySecret,
  getSession,
  GroupError,
  joinGroup as joinGroupInStore,
  parseSessionParams,
  probeGroupSchema,
  readStoredSession,
  setDataMode as setStoreDataMode,
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
  window.history.replaceState(null, '', url);
}

function clearSessionFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('group');
  url.searchParams.delete('user');
  window.history.replaceState(null, '', url);
}

function getBaseHref() {
  if (typeof window === 'undefined') return '';
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

export function GroupProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [group, setGroup] = useState(null);
  const [member, setMember] = useState(null);
  const [session, setSession] = useState(null);
  const [inviteGroup, setInviteGroup] = useState(null);
  const [errorCode, setErrorCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [dataMode, setDataModeState] = useState(
    isSupabaseConfigured ? 'checking' : 'demo'
  );
  const [fallbackReason, setFallbackReason] = useState(null);

  const applyResolved = useCallback((result, nextSession) => {
    if (!result) {
      setGroup(null);
      setMember(null);
      setSession(null);
      setStatus('no-group');
      setErrorCode('');
      return;
    }

    setGroup(result.group);
    setMember(result.member);
    setSession(nextSession);
    setInviteGroup(null);
    setStatus(result.member.status === 'approved' ? 'approved' : 'pending');
    setErrorCode('');
    writeStoredSession(nextSession);
    writeSessionToUrl(nextSession);
  }, []);

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

      const urlSession = parseSessionParams(window.location.search);
      const storedSession = readStoredSession();
      let candidate = null;

      if (urlSession.groupSecret && urlSession.userSecret) {
        candidate = urlSession;
      } else if (storedSession) {
        candidate = storedSession;
      } else if (urlSession.groupSecret) {
        try {
          const result = await getGroupBySecret(urlSession.groupSecret);
          if (cancelled) return;
          if (!result) {
            setStatus('invalid');
            setErrorCode('GROUP_NOT_FOUND');
            return;
          }
          setInviteGroup(result);
          setStatus('join');
          setErrorCode('');
          writeSessionToUrl({
            groupSecret: urlSession.groupSecret,
            userSecret: '',
          });
        } catch (error) {
          if (cancelled) return;
          setStatus('error');
          setErrorCode(error.code || 'UNKNOWN');
        }
        return;
      } else {
        setStatus('no-group');
        return;
      }

      try {
        const resolved = await getSession(candidate);
        if (cancelled) return;

        if (resolved) {
          applyResolved(resolved, candidate);
          return;
        }

        clearStoredSession();
        const maybeGroup = await getGroupBySecret(candidate.groupSecret).catch(
          () => null
        );
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
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setErrorCode(error.code || 'UNKNOWN');
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, applyResolved]);

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

  const refreshSession = useCallback(
    async ({ silent = false } = {}) => {
      if (!session) return null;
      if (!silent) setChecking(true);

      try {
        const resolved = await getSession(session);
        if (!resolved) {
          clearStoredSession();
          const maybeGroup = await getGroupBySecret(session.groupSecret).catch(
            () => null
          );
          setGroup(null);
          setMember(null);
          setSession(null);
          if (maybeGroup) {
            setInviteGroup(maybeGroup);
            setStatus('join');
            setErrorCode('SESSION_REVOKED');
            writeSessionToUrl({
              groupSecret: maybeGroup.groupSecret,
              userSecret: '',
            });
          } else {
            setStatus('no-group');
            setErrorCode('');
          }
          return null;
        }

        setGroup(resolved.group);
        setMember(resolved.member);
        setStatus(
          resolved.member.status === 'approved' ? 'approved' : 'pending'
        );
        setErrorCode('');
        return resolved;
      } catch (error) {
        if (!silent) throw error;
        return null;
      } finally {
        if (!silent) setChecking(false);
      }
    },
    [session]
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

  const leaveDevice = useCallback(() => {
    clearStoredSession();
    clearSessionFromUrl();
    setGroup(null);
    setMember(null);
    setSession(null);
    setInviteGroup(null);
    setErrorCode('');
    setStatus('no-group');
  }, []);

  const retry = useCallback(() => {
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
      inviteGroup,
      errorCode,
      checking,
      dataMode,
      fallbackReason,
      personalLink,
      groupInviteLink,
      createGroup,
      joinGroup,
      refreshSession,
      leaveDevice,
      retry,
    }),
    [
      status,
      group,
      member,
      session,
      inviteGroup,
      errorCode,
      checking,
      dataMode,
      fallbackReason,
      personalLink,
      groupInviteLink,
      createGroup,
      joinGroup,
      refreshSession,
      leaveDevice,
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
