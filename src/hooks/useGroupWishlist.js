import { useCallback, useEffect, useRef, useState } from 'react';
import { useGroup } from '../group/GroupProvider';
import {
  addItem as addItemInStore,
  approveMember as approveMemberInStore,
  DEMO_GROUP_EVENT,
  DEMO_GROUPS_KEY,
  loadGroupData,
  releaseItem as releaseItemInStore,
  reserveItem as reserveItemInStore,
} from '../lib/groupStore';

export function useGroupWishlist() {
  const { group, member, session, dataMode } = useGroup();
  const isDemo = dataMode === 'demo';
  const [items, setItems] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(isDemo ? 'demo' : 'connecting');
  const mountedRef = useRef(true);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!group || !member || !session) return;
      if (!quiet) setLoading(true);

      try {
        const data = await loadGroupData({ group, member, session });
        if (!mountedRef.current) return;
        setItems(data.items);
        setPendingMembers(data.pendingMembers);
        setError(null);
        setConnection(isDemo ? 'demo' : 'live');
      } catch (nextError) {
        if (!mountedRef.current) return;
        console.error('Could not load the family wishlist:', nextError);
        setError(nextError);
        setConnection(isDemo ? 'demo' : 'offline');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [group, member, session, isDemo]
  );

  useEffect(() => {
    mountedRef.current = true;
    void load();

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load({ quiet: true });
      }
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void load({ quiet: true });
      }
    };

    const handleDemoChange = (event) => {
      if (!isDemo) return;
      if (
        event.type === 'storage' &&
        event.key &&
        event.key !== DEMO_GROUPS_KEY
      ) {
        return;
      }
      void load({ quiet: true });
    };

    document.addEventListener('visibilitychange', handleVisibility);

    if (isDemo) {
      window.addEventListener(DEMO_GROUP_EVENT, handleDemoChange);
      window.addEventListener('storage', handleDemoChange);
    }

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (isDemo) {
        window.removeEventListener(DEMO_GROUP_EVENT, handleDemoChange);
        window.removeEventListener('storage', handleDemoChange);
      }
    };
  }, [load, isDemo]);

  const addItem = useCallback(
    async (payload) => {
      const item = await addItemInStore({ group, session, ...payload });
      await load({ quiet: true });
      return item;
    },
    [group, session, load]
  );

  const reserveItem = useCallback(
    async (itemId) => {
      try {
        await reserveItemInStore({ group, session, itemId });
        await load({ quiet: true });
        return true;
      } catch (nextError) {
        if (nextError.code === 'ALREADY_RESERVED') {
          void load({ quiet: true });
        }
        throw nextError;
      }
    },
    [group, session, load]
  );

  const releaseItem = useCallback(
    async (itemId) => {
      await releaseItemInStore({ group, session, itemId });
      await load({ quiet: true });
      return true;
    },
    [group, session, load]
  );

  const approveMember = useCallback(
    async (memberId) => {
      await approveMemberInStore({
        group,
        session,
        memberId,
        approve: true,
      });
      await load({ quiet: true });
    },
    [group, session, load]
  );

  const rejectMember = useCallback(
    async (memberId) => {
      await approveMemberInStore({
        group,
        session,
        memberId,
        approve: false,
      });
      await load({ quiet: true });
    },
    [group, session, load]
  );

  const reload = useCallback(() => load(), [load]);

  return {
    items,
    pendingMembers,
    loading,
    error,
    connection,
    reload,
    addItem,
    reserveItem,
    releaseItem,
    approveMember,
    rejectMember,
  };
}
