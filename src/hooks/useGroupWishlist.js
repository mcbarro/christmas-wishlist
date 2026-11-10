import { useCallback, useEffect, useRef, useState } from 'react';
import { useGroup } from '../group/GroupProvider';
import {
  addItem as addItemInStore,
  addItems as addItemsInStore,
  approveMember as approveMemberInStore,
  deleteItem as deleteItemInStore,
  DEMO_GROUP_EVENT,
  DEMO_GROUPS_KEY,
  loadGroupData,
  markNotificationsRead as markNotificationsReadInStore,
  releaseItem as releaseItemInStore,
  reserveItem as reserveItemInStore,
} from '../lib/groupStore';

export function useGroupWishlist() {
  const { group, member, session, dataMode } = useGroup();
  const isDemo = dataMode === 'demo';
  const [items, setItems] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
        setMembers(data.members || []);
        setNotifications(data.notifications || []);
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
    // Never show the previous member's data while the new session loads.
    setItems([]);
    setMembers([]);
    setNotifications([]);
    setPendingMembers([]);
    setError(null);
    setLoading(true);
    setConnection(isDemo ? 'demo' : 'connecting');
  }, [group?.id, member?.id, isDemo]);

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

  const addItems = useCallback(
    async (items) => {
      const inserted = await addItemsInStore({ group, session, items });
      await load({ quiet: true });
      return inserted;
    },
    [group, session, load]
  );

  const deleteItem = useCallback(
    async (itemId) => {
      await deleteItemInStore({ group, session, itemId });
      await load({ quiet: true });
      return true;
    },
    [group, session, load]
  );

  const markNotificationsRead = useCallback(async () => {
    const count = await markNotificationsReadInStore({ group, session });
    setNotifications((current) =>
      current.map((notification) =>
        notification.isRead
          ? notification
          : {
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            }
      )
    );
    return count;
  }, [group, session]);

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
    members,
    notifications,
    loading,
    error,
    connection,
    reload,
    addItem,
    addItems,
    deleteItem,
    markNotificationsRead,
    reserveItem,
    releaseItem,
    approveMember,
    rejectMember,
  };
}
