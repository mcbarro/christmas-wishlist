import { isSupabaseConfigured, supabase } from './supabase';

export const WISHLIST_TABLE = 'wishlist_items';
export const DEMO_STORAGE_KEY = 'christmas-wishlist:demo-items:v1';
export const DEMO_CHANGE_EVENT = 'christmas-wishlist:demo-change';

export const isDemoMode = !isSupabaseConfigured;

export class WishlistError extends Error {
  constructor(code, options = {}) {
    super(options.message || code, options.cause ? { cause: options.cause } : undefined);
    this.name = 'WishlistError';
    this.code = code;
    this.reservedBy = options.reservedBy || '';
  }
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clean(value) {
  return String(value || '').trim();
}

function normalizeItem(row) {
  return {
    id: row.id,
    created_at: row.created_at || new Date().toISOString(),
    title: row.title || '',
    url: row.url || '',
    image_url: row.image_url || '',
    notes: row.notes || '',
    price: row.price || '',
    added_by: row.added_by || '',
    reserved_by: row.reserved_by || '',
  };
}

function sortByNewest(items) {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function readDemoItems() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortByNewest(parsed.map(normalizeItem));
  } catch {
    return [];
  }
}

function writeDemoItems(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(DEMO_CHANGE_EVENT));
  } catch (error) {
    throw new WishlistError('STORAGE_FAILED', {
      message: 'Could not save the wishlist in this browser.',
      cause: error,
    });
  }
}

function buildPayload(input) {
  return {
    title: clean(input.title),
    url: clean(input.url) || null,
    image_url: clean(input.image_url) || null,
    notes: clean(input.notes) || null,
    price: clean(input.price) || null,
    added_by: clean(input.added_by) || null,
  };
}

export async function fetchItems() {
  if (!isSupabaseConfigured) return readDemoItems();

  const { data, error } = await supabase
    .from(WISHLIST_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new WishlistError('FETCH_FAILED', {
      message: error.message,
      cause: error,
    });
  }

  return (data || []).map(normalizeItem);
}

export async function addItem(input) {
  const payload = buildPayload(input);
  if (!payload.title) {
    throw new WishlistError('TITLE_REQUIRED', {
      message: 'A gift name is required.',
    });
  }

  if (!isSupabaseConfigured) {
    const item = normalizeItem({
      ...payload,
      id: createId(),
      created_at: new Date().toISOString(),
      reserved_by: null,
    });
    const items = readDemoItems();
    items.unshift(item);
    writeDemoItems(items);
    return item;
  }

  const { data, error } = await supabase
    .from(WISHLIST_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new WishlistError('ADD_FAILED', {
      message: error.message,
      cause: error,
    });
  }

  return normalizeItem(data);
}

export async function reserveItem(id, name) {
  const reservedBy = clean(name);
  if (!reservedBy) {
    throw new WishlistError('NAME_REQUIRED', {
      message: 'A name is required to reserve a gift.',
    });
  }

  if (!isSupabaseConfigured) {
    const items = readDemoItems();
    const item = items.find((candidate) => candidate.id === id);
    if (!item) {
      throw new WishlistError('NOT_FOUND', { message: 'Gift not found.' });
    }
    if (item.reserved_by) {
      throw new WishlistError('ALREADY_RESERVED', {
        message: 'This gift is already reserved.',
        reservedBy: item.reserved_by,
      });
    }
    item.reserved_by = reservedBy;
    writeDemoItems(items);
    return item;
  }

  const { data, error } = await supabase
    .from(WISHLIST_TABLE)
    .update({ reserved_by: reservedBy })
    .eq('id', id)
    .is('reserved_by', null)
    .select()
    .maybeSingle();

  if (error) {
    throw new WishlistError('RESERVE_FAILED', {
      message: error.message,
      cause: error,
    });
  }

  if (!data) {
    const { data: current } = await supabase
      .from(WISHLIST_TABLE)
      .select('reserved_by')
      .eq('id', id)
      .maybeSingle();

    throw new WishlistError('ALREADY_RESERVED', {
      message: 'This gift is already reserved.',
      reservedBy: current?.reserved_by || '',
    });
  }

  return normalizeItem(data);
}

export async function releaseItem(id) {
  if (!isSupabaseConfigured) {
    const items = readDemoItems();
    const item = items.find((candidate) => candidate.id === id);
    if (!item) {
      throw new WishlistError('NOT_FOUND', { message: 'Gift not found.' });
    }
    item.reserved_by = '';
    writeDemoItems(items);
    return item;
  }

  const { data, error } = await supabase
    .from(WISHLIST_TABLE)
    .update({ reserved_by: null })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw new WishlistError('RELEASE_FAILED', {
      message: error.message,
      cause: error,
    });
  }

  if (!data) {
    throw new WishlistError('NOT_FOUND', { message: 'Gift not found.' });
  }

  return normalizeItem(data);
}

/**
 * Subscribes to wishlist changes. In demo mode this uses localStorage events;
 * with Supabase it uses Postgres changes from the replicated table.
 *
 * @returns {() => void} unsubscribe function
 */
export function subscribeToWishlist({ onChange, onStatus } = {}) {
  if (!isSupabaseConfigured) {
    onStatus?.('DEMO');
    if (typeof window === 'undefined') return () => {};

    const handleChange = () => onChange?.();
    const handleStorage = (event) => {
      if (!event.key || event.key === DEMO_STORAGE_KEY) onChange?.();
    };

    window.addEventListener(DEMO_CHANGE_EVENT, handleChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(DEMO_CHANGE_EVENT, handleChange);
      window.removeEventListener('storage', handleStorage);
    };
  }

  if (!supabase) {
    onStatus?.('OFFLINE');
    return () => {};
  }

  const channel = supabase
    .channel(`wishlist-items-${createId()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: WISHLIST_TABLE,
      },
      () => onChange?.()
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        onStatus?.('LIVE');
      } else if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        onStatus?.('OFFLINE');
      }
      if (error) {
        console.warn('Supabase realtime subscription error:', error);
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
