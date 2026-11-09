import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addItem as addItemInStore,
  fetchItems,
  isDemoMode,
  releaseItem as releaseItemInStore,
  reserveItem as reserveItemInStore,
  subscribeToWishlist,
} from '../lib/wishlistStore';

export function useWishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connection, setConnection] = useState(
    isDemoMode ? 'demo' : 'connecting'
  );
  const mountedRef = useRef(true);
  const reloadTimerRef = useRef(null);

  const reload = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);

    try {
      const nextItems = await fetchItems();
      if (!mountedRef.current) return;
      setItems(nextItems);
      setError(null);
    } catch (nextError) {
      if (!mountedRef.current) return;
      console.error('Could not load the wishlist:', nextError);
      setError(nextError);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void reload();

    const unsubscribe = subscribeToWishlist({
      onChange: () => {
        if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = setTimeout(() => {
          void reload({ quiet: true });
        }, 160);
      },
      onStatus: (status) => {
        if (!mountedRef.current) return;
        if (status === 'LIVE') setConnection('live');
        else if (status === 'DEMO') setConnection('demo');
        else setConnection('offline');
      },
    });

    return () => {
      mountedRef.current = false;
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      unsubscribe();
    };
  }, [reload]);

  const addItem = useCallback(async (payload) => {
    const created = await addItemInStore(payload);
    if (mountedRef.current) {
      setItems((current) => [
        created,
        ...current.filter((item) => item.id !== created.id),
      ]);
    }
    return created;
  }, []);

  const reserveItem = useCallback(
    async (id, name) => {
      try {
        const updated = await reserveItemInStore(id, name);
        if (mountedRef.current) {
          setItems((current) =>
            current.map((item) => (item.id === id ? updated : item))
          );
        }
        return updated;
      } catch (nextError) {
        if (nextError.code === 'ALREADY_RESERVED') {
          void reload({ quiet: true });
        }
        throw nextError;
      }
    },
    [reload]
  );

  const releaseItem = useCallback(
    async (id) => {
      const updated = await releaseItemInStore(id);
      if (mountedRef.current) {
        setItems((current) =>
          current.map((item) => (item.id === id ? updated : item))
        );
      }
      return updated;
    },
    []
  );

  return {
    items,
    loading,
    error,
    connection,
    mode: isDemoMode ? 'demo' : 'supabase',
    reload,
    addItem,
    reserveItem,
    releaseItem,
  };
}
