import { isSupabaseConfigured, supabase } from './supabase';

export const SESSION_STORAGE_KEY = 'christmas-wishlist:session:v1';
export const DEMO_GROUPS_KEY = 'christmas-wishlist:demo-groups:v1';
export const DEMO_GROUP_EVENT = 'christmas-wishlist:demo-group-change';
export const LEGACY_DEMO_ITEMS_KEY = 'christmas-wishlist:demo-items:v1';

const SCHEMA_FALLBACK_KEY = 'christmas-wishlist:schema-fallback:v1';
const SCHEMA_FALLBACK_TTL_MS = 5 * 60 * 1000;

let currentDataMode = isSupabaseConfigured ? 'supabase' : 'demo';

export function getDataMode() {
  return currentDataMode;
}

export function setDataMode(mode) {
  currentDataMode = mode === 'demo' ? 'demo' : 'supabase';
}

export function clearSchemaProbeCache() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SCHEMA_FALLBACK_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function readSchemaProbeCache() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SCHEMA_FALLBACK_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (
      (cached?.result === 'missing' || cached?.result === 'unavailable') &&
      Number(cached.expiresAt) > Date.now()
    ) {
      return cached.result;
    }
  } catch {
    // Ignore invalid caches.
  }
  return null;
}

function writeSchemaProbeCache(result) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SCHEMA_FALLBACK_KEY,
      JSON.stringify({
        result,
        expiresAt: Date.now() + SCHEMA_FALLBACK_TTL_MS,
      })
    );
  } catch {
    // Ignore storage failures.
  }
}

function isDemo() {
  return currentDataMode === 'demo';
}

/**
 * Probes the group RPC without exposing any data. A missing function means the
 * database migration has not been applied yet; the app can then fall back to
 * local demo mode instead of showing an unusable empty state.
 */
export async function probeGroupSchema() {
  if (!isSupabaseConfigured || !supabase) return 'missing';

  const cached = readSchemaProbeCache();
  if (cached) return cached;

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('SCHEMA_PROBE_TIMEOUT')), 6000);
  });

  try {
    const request = supabase.rpc('get_session', {
      p_group_secret: '__schema_probe__',
      p_user_secret: '__schema_probe__',
    });
    const { error } = await Promise.race([request, timeout]);

    if (!error) {
      clearSchemaProbeCache();
      return 'supabase';
    }

    const message = String(error.message || '');
    if (
      error.code === 'PGRST202' ||
      message.includes('Could not find the function') ||
      message.includes('schema cache')
    ) {
      writeSchemaProbeCache('missing');
      return 'missing';
    }

    writeSchemaProbeCache('unavailable');
    return 'unavailable';
  } catch {
    writeSchemaProbeCache('unavailable');
    return 'unavailable';
  } finally {
    clearTimeout(timer);
  }
}

export class GroupError extends Error {
  constructor(code, options = {}) {
    super(options.message || code, options.cause ? { cause: options.cause } : undefined);
    this.name = 'GroupError';
    this.code = code;
  }
}

const DEMO_CAPABILITIES = {
  schema_version: 9,
  features: [
    'suggestions',
    'delete_notifications',
    'member_filter',
    'budget_filter',
    'amazon_import',
    'edit_items',
    'hide_items',
    'multi_group',
    'bookmarklet',
    'preapproved_members',
    'one_time_invites',
    'item_ratings',
    'member_removal',
    'member_reinvite',
    'removed_member_cleanup',
  ],
};

const BASE_CAPABILITIES = {
  schema_version: 1,
  features: [],
};

export async function getCapabilities() {
  if (isDemo()) return DEMO_CAPABILITIES;
  if (!supabase) return BASE_CAPABILITIES;

  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('CAPABILITIES_TIMEOUT')),
      5000
    );
  });

  try {
    const { data, error } = await Promise.race([
      supabase.rpc('get_app_capabilities'),
      timeout,
    ]);
    if (error || !data) return BASE_CAPABILITIES;
    return {
      schema_version: Number(data.schema_version) || 1,
      features: Array.isArray(data.features) ? data.features : [],
    };
  } catch {
    return BASE_CAPABILITIES;
  } finally {
    clearTimeout(timer);
  }
}

export function generateSecret() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replaceAll('-', '');
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function parseSessionParams(search) {
  const params = new URLSearchParams(search || '');
  return {
    groupSecret: (params.get('group') || '').trim(),
    userSecret: (params.get('user') || '').trim(),
    inviteToken: (params.get('invite') || '').trim(),
  };
}

export function buildSessionLink({
  href,
  groupSecret,
  userSecret,
  inviteToken,
}) {
  const url = new URL(href);
  url.searchParams.delete('group');
  url.searchParams.delete('user');
  url.searchParams.delete('invite');
  if (groupSecret) url.searchParams.set('group', groupSecret);
  if (userSecret) url.searchParams.set('user', userSecret);
  if (inviteToken) url.searchParams.set('invite', inviteToken);
  return url.toString();
}

export function readStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.groupSecret === 'string' &&
      parsed.groupSecret.trim() &&
      typeof parsed?.userSecret === 'string' &&
      parsed.userSecret.trim()
    ) {
      return {
        groupSecret: parsed.groupSecret.trim(),
        userSecret: parsed.userSecret.trim(),
      };
    }
  } catch {
    // Invalid stored sessions are ignored.
  }
  return null;
}

export function writeStoredSession(session) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        groupSecret: session.groupSecret,
        userSecret: session.userSecret,
      })
    );
  } catch {
    // Persisting the session is best-effort.
  }
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export const SESSIONS_STORAGE_KEY = 'christmas-wishlist:sessions:v1';

function normalizeStoredSession(session) {
  if (
    typeof session?.groupSecret !== 'string' ||
    !session.groupSecret.trim() ||
    typeof session?.userSecret !== 'string' ||
    !session.userSecret.trim()
  ) {
    return null;
  }

  return {
    groupSecret: session.groupSecret.trim(),
    userSecret: session.userSecret.trim(),
    groupId: typeof session.groupId === 'string' ? session.groupId : '',
    groupName: typeof session.groupName === 'string' ? session.groupName : '',
    memberId: typeof session.memberId === 'string' ? session.memberId : '',
    displayName:
      typeof session.displayName === 'string' ? session.displayName : '',
    isAdmin: Boolean(session.isAdmin),
    lastUsedAt: Number(session.lastUsedAt) || 0,
  };
}

export function readStoredSessions() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeStoredSession)
          .filter(Boolean)
          .map((session, index) => ({
            ...session,
            lastUsedAt: session.lastUsedAt || index,
          }));
      }
    }
  } catch {
    // Ignore invalid storage.
  }

  const legacy = readStoredSession();
  return legacy ? [{ ...legacy, lastUsedAt: 0 }] : [];
}

export function writeStoredSessions(sessions) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SESSIONS_STORAGE_KEY,
      JSON.stringify((sessions || []).map(normalizeStoredSession).filter(Boolean))
    );
  } catch {
    // Persisting sessions is best-effort.
  }
}

export function upsertStoredSession(sessionInfo) {
  const normalized = normalizeStoredSession(sessionInfo);
  if (!normalized) return readStoredSessions();

  const sessions = readStoredSessions();
  const index = sessions.findIndex(
    (candidate) =>
      candidate.groupSecret === normalized.groupSecret &&
      candidate.userSecret === normalized.userSecret
  );

  if (index === -1) {
    sessions.push({ ...normalized, lastUsedAt: Date.now() });
  } else {
    sessions[index] = {
      ...sessions[index],
      ...normalized,
      lastUsedAt: Date.now(),
    };
  }

  writeStoredSessions(sessions);
  return sessions;
}

export function removeStoredSession({ groupSecret, userSecret }) {
  const sessions = readStoredSessions().filter(
    (session) =>
      session.groupSecret !== groupSecret ||
      session.userSecret !== userSecret
  );
  writeStoredSessions(sessions);
  return sessions;
}

export function clearStoredSessions() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function trim(value) {
  return String(value || '').trim();
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptyDemoState() {
  return {
    groups: [],
    members: [],
    items: [],
    reservations: [],
    notifications: [],
    hidden_items: [],
  };
}

function readDemoState() {
  if (typeof window === 'undefined') return emptyDemoState();
  try {
    const raw = window.localStorage.getItem(DEMO_GROUPS_KEY);
    if (!raw) return emptyDemoState();
    const parsed = JSON.parse(raw);
    return {
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item) => ({
            ...item,
            created_by_member_id:
              item.created_by_member_id || item.owner_member_id,
          }))
        : [],
      reservations: Array.isArray(parsed.reservations)
        ? parsed.reservations
        : [],
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : [],
      hidden_items: Array.isArray(parsed.hidden_items)
        ? parsed.hidden_items
        : [],
    };
  } catch {
    return emptyDemoState();
  }
}

function writeDemoState(state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEMO_GROUPS_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(DEMO_GROUP_EVENT));
  } catch (error) {
    throw new GroupError('STORAGE_FAILED', {
      message: 'Could not save the family group in this browser.',
      cause: error,
    });
  }
}

function migrateLegacyDemoItems(state, groupId, memberId) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(LEGACY_DEMO_ITEMS_KEY);
    if (!raw) return;
    const legacyItems = JSON.parse(raw);
    if (!Array.isArray(legacyItems)) return;

    for (const item of legacyItems) {
      state.items.push({
        id: createId(),
        group_id: groupId,
        owner_member_id: memberId,
        created_by_member_id: memberId,
        title: trim(item.title) || 'Wish',
        url: trim(item.url),
        image_url: trim(item.image_url),
        notes: trim(item.notes),
        price: trim(item.price),
        created_at: item.created_at || new Date().toISOString(),
      });
    }

    window.localStorage.removeItem(LEGACY_DEMO_ITEMS_KEY);
  } catch {
    // Legacy data is optional; ignore malformed values.
  }
}

function mapGroupRow(row, groupSecret) {
  if (!row) return null;
  return {
    group: {
      id: row.group_id,
      name: row.group_name,
      groupSecret,
    },
    member: {
      id: row.member_id,
      displayName: row.display_name,
      isAdmin: Boolean(row.is_admin),
      status: row.status,
    },
  };
}

function mapDemoGroup(group) {
  return { id: group.id, name: group.name, groupSecret: group.group_secret };
}

function mapDemoMember(member) {
  return {
    id: member.id,
    displayName: member.display_name,
    isAdmin: Boolean(member.is_admin),
    status: member.status,
  };
}

function normalizeRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 2.5;
  return Math.min(5, Math.max(1, Math.round(numeric * 2) / 2));
}

function mapItem(row) {
  return {
    id: row.id,
    group_id: row.group_id,
    owner_member_id: row.owner_member_id,
    owner_name: row.owner_name || '',
    created_by_member_id:
      row.created_by_member_id || row.owner_member_id || '',
    created_by_name: row.created_by_name || row.owner_name || '',
    added_by: row.created_by_name || row.owner_name || '',
    created_at: row.created_at,
    title: row.title || '',
    url: row.url || '',
    image_url: row.image_url || '',
    notes: row.notes || '',
    price: row.price || '',
    rating: normalizeRating(row.rating),
    hidden_by_me: Boolean(row.hidden_by_me),
    can_admin_delete: Boolean(row.can_admin_delete),
  };
}

function mergeItems(items, reservations, memberId) {
  const reservationsByItem = new Map(
    (reservations || []).map((reservation) => [
      reservation.item_id,
      {
        ...reservation,
        reserved_by_name: reservation.reserved_by_name || '',
        is_mine: Boolean(reservation.is_mine),
      },
    ])
  );

  return (items || []).map((item) => {
    const createdById = item.created_by_member_id || item.owner_member_id;
    const isOwnItem = item.owner_member_id === memberId;
    const isSuggestion = createdById !== item.owner_member_id;

    return {
      ...item,
      created_by_member_id: createdById,
      created_by_name: item.created_by_name || item.owner_name || '',
      is_own_item: isOwnItem,
      is_suggestion: isSuggestion,
      is_own_suggestion: createdById === memberId,
      can_delete:
        createdById === memberId || Boolean(item.can_admin_delete),
      can_edit: createdById === memberId,
      can_rate: !isSuggestion && createdById === memberId,
      rating: isSuggestion ? null : normalizeRating(item.rating),
      hidden_by_me: Boolean(item.hidden_by_me),
      reservation: isOwnItem ? null : reservationsByItem.get(item.id) || null,
    };
  });
}

function mapSupabaseError(error) {
  const message = String(error?.message || '');
  const codes = [
    'GROUP_NOT_FOUND',
    'GROUP_EXISTS',
    'INVALID_SECRET',
    'INVALID_NAME',
    'NOT_APPROVED',
    'NOT_ADMIN',
    'ITEM_NOT_FOUND',
    'OWN_ITEM',
    'ALREADY_RESERVED',
    'NOT_RESERVED',
    'MEMBER_NOT_PENDING',
    'MEMBER_NOT_FOUND',
    'NOT_ALLOWED',
    'CANNOT_REMOVE_SELF',
    'CANNOT_REINVITE_SELF',
    'INVITE_NOT_FOUND',
    'INVALID_RATING',
    'INVALID_IMPORT',
    'IMPORT_LIMIT',
    'TITLE_REQUIRED',
    'SESSION_REVOKED',
    'STORAGE_FAILED',
    'NETWORK',
  ];

  let code = codes.find((candidate) => message.includes(candidate));
  if (!code && message.toLowerCase().includes('duplicate key')) {
    code = 'GROUP_EXISTS';
  }
  if (
    !code &&
    (error?.code === 'PGRST202' ||
      message.includes('Could not find the function') ||
      message.includes('schema cache'))
  ) {
    code = 'RPC_MISSING';
  }

  return new GroupError(code || 'UNKNOWN', {
    message: message || 'Unexpected group error',
    cause: error,
  });
}

async function rpc(name, args) {
  if (!supabase) throw new GroupError('NETWORK');
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw mapSupabaseError(error);
  return data;
}

function firstRow(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

function demoSession({ groupSecret, userSecret }) {
  const state = readDemoState();
  const group = state.groups.find(
    (candidate) => candidate.group_secret === groupSecret
  );
  if (!group) return null;
  const member = state.members.find(
    (candidate) =>
      candidate.group_id === group.id &&
      candidate.user_secret === userSecret
  );
  if (!member || !['pending', 'approved'].includes(member.status)) {
    return null;
  }
  return { group: mapDemoGroup(group), member: mapDemoMember(member) };
}

export async function getSession({ groupSecret, userSecret }) {
  if (!groupSecret || !userSecret) return null;
  if (isDemo()) return demoSession({ groupSecret, userSecret });

  const data = await rpc('get_session', {
    p_group_secret: groupSecret,
    p_user_secret: userSecret,
  });
  const row = firstRow(data);
  return row ? mapGroupRow(row, groupSecret) : null;
}

export async function getGroupBySecret(groupSecret) {
  if (!groupSecret) return null;
  if (isDemo()) {
    const state = readDemoState();
    const group = state.groups.find(
      (candidate) => candidate.group_secret === groupSecret
    );
    return group ? mapDemoGroup(group) : null;
  }

  const data = await rpc('get_group_by_secret', {
    p_group_secret: groupSecret,
  });
  const row = firstRow(data);
  return row
    ? { id: row.group_id, name: row.group_name, groupSecret }
    : null;
}

export async function createGroup({
  groupSecret,
  name,
  userSecret,
  displayName,
}) {
  const cleanName = trim(name);
  const cleanDisplayName = trim(displayName);
  if (!cleanName || !cleanDisplayName) {
    throw new GroupError('INVALID_NAME');
  }

  if (isDemo()) {
    const state = readDemoState();
    if (
      state.groups.some((candidate) => candidate.group_secret === groupSecret)
    ) {
      throw new GroupError('GROUP_EXISTS');
    }

    const group = {
      id: createId(),
      group_secret: groupSecret,
      name: cleanName,
      created_at: new Date().toISOString(),
    };
    const member = {
      id: createId(),
      group_id: group.id,
      user_secret: userSecret,
      display_name: cleanDisplayName,
      is_admin: true,
      status: 'approved',
      created_at: new Date().toISOString(),
    };

    state.groups.push(group);
    state.members.push(member);
    migrateLegacyDemoItems(state, group.id, member.id);
    writeDemoState(state);

    return {
      group: mapDemoGroup(group),
      member: mapDemoMember(member),
    };
  }

  const data = await rpc('create_group', {
    p_group_secret: groupSecret,
    p_name: cleanName,
    p_user_secret: userSecret,
    p_display_name: cleanDisplayName,
  });
  const row = firstRow(data);
  if (!row) throw new GroupError('UNKNOWN');
  return mapGroupRow(row, groupSecret);
}

export async function joinGroup({
  groupSecret,
  userSecret,
  displayName,
}) {
  const cleanDisplayName = trim(displayName);

  if (isDemo()) {
    const state = readDemoState();
    const group = state.groups.find(
      (candidate) => candidate.group_secret === groupSecret
    );
    if (!group) throw new GroupError('GROUP_NOT_FOUND');

    let member = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === userSecret
    );

    if (member) {
      if (cleanDisplayName && member.display_name !== cleanDisplayName) {
        member.display_name = cleanDisplayName;
        writeDemoState(state);
      }
      return {
        group: mapDemoGroup(group),
        member: mapDemoMember(member),
      };
    }

    if (!cleanDisplayName) throw new GroupError('INVALID_NAME');

    member = {
      id: createId(),
      group_id: group.id,
      user_secret: userSecret,
      display_name: cleanDisplayName,
      is_admin: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    state.members.push(member);
    writeDemoState(state);

    return {
      group: mapDemoGroup(group),
      member: mapDemoMember(member),
    };
  }

  const data = await rpc('join_group', {
    p_group_secret: groupSecret,
    p_user_secret: userSecret,
    p_display_name: cleanDisplayName,
  });
  const row = firstRow(data);
  if (!row) throw new GroupError('UNKNOWN');
  return mapGroupRow(row, groupSecret);
}

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload || {},
    createdAt: row.created_at || row.createdAt,
    readAt: row.read_at || row.readAt || null,
    isRead: Boolean(row.read_at || row.readAt),
  };
}

export async function loadGroupData({ group, member, session }) {
  if (!group || !member || !session) {
    throw new GroupError('NOT_APPROVED');
  }

  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.id === member.id &&
        candidate.group_id === group.id &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const groupMembers = state.members.filter(
      (candidate) => candidate.group_id === group.id
    );
    const approvedMembers = groupMembers.filter(
      (candidate) => candidate.status === 'approved'
    );
    const membersById = new Map(
      groupMembers.map((candidate) => [candidate.id, candidate])
    );

    const items = state.items
      .filter(
        (item) =>
          item.group_id === group.id &&
          !(
            item.owner_member_id === member.id &&
            (item.created_by_member_id || item.owner_member_id) !== member.id
          )
      )
      .map((item) => {
        const owner = membersById.get(item.owner_member_id);
        const creator = membersById.get(
          item.created_by_member_id || item.owner_member_id
        );
        return mapItem({
          ...item,
          owner_name: owner?.display_name || '',
          created_by_name: creator?.display_name || owner?.display_name || '',
          can_admin_delete:
            Boolean(currentMember.is_admin) &&
            creator?.status === 'removed',
          hidden_by_me: state.hidden_items.some(
            (hidden) =>
              hidden.group_id === group.id &&
              hidden.member_id === member.id &&
              hidden.item_id === item.id
          ),
        });
      })
      .sort(
        (first, second) =>
          new Date(second.created_at).getTime() -
          new Date(first.created_at).getTime()
      );

    const itemsById = new Map(items.map((item) => [item.id, item]));
    const reservations = state.reservations
      .filter((reservation) => {
        const item = itemsById.get(reservation.item_id);
        return item && item.owner_member_id !== member.id;
      })
      .map((reservation) => ({
        item_id: reservation.item_id,
        reserved_by_name:
          membersById.get(reservation.reserved_by_member_id)?.display_name ||
          '',
        is_mine: reservation.reserved_by_member_id === member.id,
      }));

    const pendingMembers = member.isAdmin
      ? state.members
          .filter(
            (candidate) =>
              candidate.group_id === group.id &&
              candidate.status === 'pending'
          )
          .map((candidate) => ({
            id: candidate.id,
            displayName: candidate.display_name,
            createdAt: candidate.created_at,
          }))
          .sort(
            (first, second) =>
              new Date(first.createdAt).getTime() -
              new Date(second.createdAt).getTime()
          )
      : [];

    const members = approvedMembers
      .map((candidate) => ({
        id: candidate.id,
        displayName: candidate.display_name,
        isAdmin: Boolean(candidate.is_admin),
        createdAt: candidate.created_at,
      }))
      .sort((first, second) =>
        first.displayName.localeCompare(second.displayName)
      );

    const notifications = state.notifications
      .filter(
        (notification) =>
          notification.group_id === group.id &&
          notification.member_id === member.id
      )
      .sort(
        (first, second) =>
          new Date(second.created_at).getTime() -
          new Date(first.created_at).getTime()
      )
      .slice(0, 50)
      .map(mapNotification);

    return {
      items: mergeItems(items, reservations, member.id),
      pendingMembers,
      members,
      notifications,
    };
  }

  const [itemsResult, reservationsResult, pendingResult, membersResult, notificationsResult] =
    await Promise.allSettled([
      rpc('get_group_items', {
        p_group_secret: group.groupSecret,
        p_user_secret: session.userSecret,
      }),
      rpc('get_safe_reservations', {
        p_group_id: group.id,
        p_user_secret: session.userSecret,
      }),
      member.isAdmin
        ? rpc('get_pending_members', {
            p_group_id: group.id,
            p_user_secret: session.userSecret,
          })
        : Promise.resolve([]),
      rpc('get_group_members', {
        p_group_secret: group.groupSecret,
        p_user_secret: session.userSecret,
      }),
      rpc('get_notifications', {
        p_group_id: group.id,
        p_user_secret: session.userSecret,
      }),
    ]);

  if (itemsResult.status === 'rejected') throw itemsResult.reason;
  if (reservationsResult.status === 'rejected') {
    throw reservationsResult.reason;
  }

  const itemRows = itemsResult.value || [];
  const reservationRows = reservationsResult.value || [];
  const pendingRows =
    pendingResult.status === 'fulfilled' ? pendingResult.value || [] : [];
  const memberRows =
    membersResult.status === 'fulfilled' ? membersResult.value || [] : [];
  const notificationRows =
    notificationsResult.status === 'fulfilled'
      ? notificationsResult.value || []
      : [];

  return {
    items: mergeItems(
      itemRows.map(mapItem),
      reservationRows,
      member.id
    ),
    pendingMembers: pendingRows.map((row) => ({
      id: row.member_id,
      displayName: row.display_name,
      createdAt: row.created_at,
    })),
    members: memberRows.map((row) => ({
      id: row.member_id,
      displayName: row.display_name,
      isAdmin: Boolean(row.is_admin),
      createdAt: row.created_at,
    })),
    notifications: notificationRows.map(mapNotification),
  };
}

export async function addItem({
  group,
  session,
  title,
  url,
  image_url,
  notes,
  price,
  rating = null,
  ownerMemberId = null,
}) {
  const cleanTitle = trim(title);
  if (!cleanTitle) throw new GroupError('TITLE_REQUIRED');

  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    let owner = currentMember;
    if (ownerMemberId) {
      const target = state.members.find(
        (candidate) =>
          candidate.id === ownerMemberId &&
          candidate.group_id === group.id &&
          candidate.status === 'approved'
      );
      if (!target) throw new GroupError('MEMBER_NOT_FOUND');
      owner = target;
    }

    const item = {
      id: createId(),
      group_id: group.id,
      owner_member_id: owner.id,
      created_by_member_id: currentMember.id,
      title: cleanTitle,
      url: trim(url),
      image_url: trim(image_url),
      notes: trim(notes),
      price: trim(price),
      rating: normalizeRating(rating ?? 2.5),
      created_at: new Date().toISOString(),
    };
    state.items.push(item);
    writeDemoState(state);

    return mapItem({
      ...item,
      owner_name: owner.display_name,
      created_by_name: currentMember.display_name,
    });
  }

  const params = {
    p_group_secret: group.groupSecret,
    p_user_secret: session.userSecret,
    p_title: cleanTitle,
    p_url: trim(url),
    p_image_url: trim(image_url),
    p_notes: trim(notes),
    p_price: trim(price),
  };

  // Omit the parameter when not needed so an older database that still has
  // the seven-argument function keeps working during a rolling deployment.
  if (ownerMemberId) params.p_owner_member_id = ownerMemberId;

  const data = await rpc('add_item', params);
  const row = firstRow(data);
  if (!row) throw new GroupError('UNKNOWN');

  const item = mapItem(row);
  if (rating != null) {
    const value = normalizeRating(rating);
    if (value !== 2.5) {
      await setItemRating({
        group,
        session,
        itemId: item.id,
        rating: value,
      });
      item.rating = value;
    }
  }
  return item;
}

export async function addItems({ group, session, items }) {
  const cleanItems = (items || [])
    .map((item) => ({
      title: trim(item.title),
      url: trim(item.url),
      image_url: trim(item.image_url),
      notes: trim(item.notes),
      price: trim(item.price),
    }))
    .filter((item) => item.title);

  if (!cleanItems.length) {
    throw new GroupError('INVALID_IMPORT');
  }

  if (cleanItems.length > 100) {
    throw new GroupError('IMPORT_LIMIT');
  }

  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    for (const item of cleanItems) {
      state.items.push({
        id: createId(),
        group_id: group.id,
        owner_member_id: currentMember.id,
        created_by_member_id: currentMember.id,
        title: item.title,
        url: item.url,
        image_url: item.image_url,
        notes: item.notes,
        price: item.price,
        rating: 2.5,
        created_at: new Date().toISOString(),
      });
    }
    writeDemoState(state);
    return cleanItems.length;
  }

  try {
    const inserted = await rpc('add_items', {
      p_group_secret: group.groupSecret,
      p_user_secret: session.userSecret,
      p_items: cleanItems,
    });
    return Number(inserted) || 0;
  } catch (error) {
    if (error.code === 'RPC_MISSING') {
      for (const item of cleanItems) {
        await addItem({ group, session, ...item });
      }
      return cleanItems.length;
    }
    throw error;
  }
}

export async function updateItem({
  group,
  session,
  itemId,
  title,
  url,
  image_url,
  notes,
  price,
  rating = null,
  ownerMemberId = null,
}) {
  const cleanTitle = trim(title);
  if (!cleanTitle) throw new GroupError('TITLE_REQUIRED');

  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const item = state.items.find(
      (candidate) =>
        candidate.id === itemId && candidate.group_id === group.id
    );
    if (!item) throw new GroupError('ITEM_NOT_FOUND');

    const creatorId = item.created_by_member_id || item.owner_member_id;
    if (creatorId !== currentMember.id) {
      throw new GroupError('NOT_ALLOWED');
    }

    let owner = currentMember;
    if (ownerMemberId) {
      const target = state.members.find(
        (candidate) =>
          candidate.id === ownerMemberId &&
          candidate.group_id === group.id &&
          candidate.status === 'approved'
      );
      if (!target) throw new GroupError('MEMBER_NOT_FOUND');
      owner = target;
    } else {
      owner =
        state.members.find(
          (candidate) => candidate.id === item.owner_member_id
        ) || currentMember;
    }

    item.owner_member_id = owner.id;
    item.title = cleanTitle;
    item.url = trim(url);
    item.image_url = trim(image_url);
    item.notes = trim(notes);
    item.price = trim(price);
    if (rating != null) item.rating = normalizeRating(rating);
    writeDemoState(state);

    return mapItem({
      ...item,
      owner_name: owner.display_name,
      created_by_name: currentMember.display_name,
    });
  }

  const params = {
    p_group_secret: group.groupSecret,
    p_user_secret: session.userSecret,
    p_item_id: itemId,
    p_title: cleanTitle,
    p_url: trim(url),
    p_image_url: trim(image_url),
    p_notes: trim(notes),
    p_price: trim(price),
  };
  if (ownerMemberId) params.p_owner_member_id = ownerMemberId;

  const data = await rpc('update_item', params);
  const row = firstRow(data);
  if (!row) throw new GroupError('UNKNOWN');

  const item = mapItem(row);
  if (rating != null) {
    const value = normalizeRating(rating);
    await setItemRating({
      group,
      session,
      itemId: item.id,
      rating: value,
    });
    item.rating = value;
  }
  return item;
}

export async function setItemRating({ group, session, itemId, rating }) {
  const value = Number(rating);

  if (!Number.isFinite(value) || value < 1 || value > 5 || !Number.isInteger(value * 2)) {
    throw new GroupError('INVALID_RATING');
  }

  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const item = state.items.find(
      (candidate) =>
        candidate.id === itemId && candidate.group_id === group.id
    );
    if (!item) throw new GroupError('ITEM_NOT_FOUND');

    const creatorId = item.created_by_member_id || item.owner_member_id;
    if (creatorId !== currentMember.id || item.owner_member_id !== creatorId) {
      throw new GroupError('NOT_ALLOWED');
    }

    item.rating = value;
    writeDemoState(state);
    return value;
  }

  const data = await rpc('set_item_rating', {
    p_group_secret: group.groupSecret,
    p_user_secret: session.userSecret,
    p_item_id: itemId,
    p_rating: value,
  });
  if (data === false) throw new GroupError('NOT_ALLOWED');
  return value;
}

export async function hideItem({ group, session, itemId }) {
  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const item = state.items.find(
      (candidate) =>
        candidate.id === itemId && candidate.group_id === group.id
    );
    if (!item || item.owner_member_id === currentMember.id) {
      throw new GroupError('ITEM_NOT_FOUND');
    }

    if (
      !state.hidden_items.some(
        (hidden) =>
          hidden.group_id === group.id &&
          hidden.member_id === currentMember.id &&
          hidden.item_id === itemId
      )
    ) {
      state.hidden_items.push({
        id: createId(),
        group_id: group.id,
        member_id: currentMember.id,
        item_id: itemId,
        created_at: new Date().toISOString(),
      });
      writeDemoState(state);
    }

    return true;
  }

  const data = await rpc('hide_item', {
    p_group_secret: group.groupSecret,
    p_user_secret: session.userSecret,
    p_item_id: itemId,
  });
  return data !== false;
}

export async function unhideItem({ group, session, itemId }) {
  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const before = state.hidden_items.length;
    state.hidden_items = state.hidden_items.filter(
      (hidden) =>
        !(
          hidden.group_id === group.id &&
          hidden.member_id === currentMember.id &&
          hidden.item_id === itemId
        )
    );
    if (state.hidden_items.length !== before) writeDemoState(state);
    return before !== state.hidden_items.length;
  }

  const data = await rpc('unhide_item', {
    p_group_secret: group.groupSecret,
    p_user_secret: session.userSecret,
    p_item_id: itemId,
  });
  return data !== false;
}

export async function getMembersForSession({ groupSecret, userSecret }) {
  if (!groupSecret || !userSecret) return [];

  if (isDemo()) {
    const state = readDemoState();
    const group = state.groups.find(
      (candidate) => candidate.group_secret === groupSecret
    );
    if (!group) return [];

    const current = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === userSecret &&
        candidate.status === 'approved'
    );
    if (!current) throw new GroupError('NOT_APPROVED');

    return state.members
      .filter(
        (candidate) =>
          candidate.group_id === group.id && candidate.status === 'approved'
      )
      .map((candidate) => ({
        id: candidate.id,
        displayName: candidate.display_name,
        isAdmin: Boolean(candidate.is_admin),
      }));
  }

  const data = await rpc('get_group_members', {
    p_group_secret: groupSecret,
    p_user_secret: userSecret,
  });

  return (data || []).map((row) => ({
    id: row.member_id,
    displayName: row.display_name,
    isAdmin: Boolean(row.is_admin),
  }));
}

export async function reserveItem({ group, session, itemId }) {
  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const item = state.items.find(
      (candidate) =>
        candidate.id === itemId && candidate.group_id === group.id
    );
    if (!item) throw new GroupError('ITEM_NOT_FOUND');
    if (item.owner_member_id === currentMember.id) {
      throw new GroupError('OWN_ITEM');
    }
    if (state.reservations.some((reservation) => reservation.item_id === itemId)) {
      throw new GroupError('ALREADY_RESERVED');
    }

    state.reservations.push({
      id: createId(),
      item_id: itemId,
      reserved_by_member_id: currentMember.id,
      created_at: new Date().toISOString(),
    });
    writeDemoState(state);
    return true;
  }

  const data = await rpc('reserve_item', {
    p_group_secret: group.groupSecret,
    p_user_secret: session.userSecret,
    p_item_id: itemId,
  });
  if (data === false) throw new GroupError('ALREADY_RESERVED');
  return true;
}

export async function releaseItem({ group, session, itemId }) {
  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const index = state.reservations.findIndex(
      (reservation) =>
        reservation.item_id === itemId &&
        reservation.reserved_by_member_id === currentMember.id
    );
    if (index === -1) throw new GroupError('NOT_RESERVED');

    state.reservations.splice(index, 1);
    writeDemoState(state);
    return true;
  }

  const data = await rpc('release_item', {
    p_group_secret: group.groupSecret,
    p_user_secret: session.userSecret,
    p_item_id: itemId,
  });
  if (data === false) throw new GroupError('NOT_RESERVED');
  return true;
}

export async function deleteItem({ group, session, itemId }) {
  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const item = state.items.find(
      (candidate) =>
        candidate.id === itemId && candidate.group_id === group.id
    );
    if (!item) throw new GroupError('ITEM_NOT_FOUND');

    const creatorId =
      item.created_by_member_id || item.owner_member_id;
    if (creatorId !== currentMember.id) {
      const creator = state.members.find(
        (candidate) =>
          candidate.id === creatorId && candidate.group_id === group.id
      );
      if (!currentMember.is_admin || creator?.status !== 'removed') {
        throw new GroupError('NOT_ALLOWED');
      }
    }

    const reservations = state.reservations.filter(
      (reservation) =>
        reservation.item_id === itemId &&
        reservation.reserved_by_member_id !== currentMember.id
    );

    for (const reservation of reservations) {
      state.notifications.push({
        id: createId(),
        group_id: group.id,
        member_id: reservation.reserved_by_member_id,
        type: 'wish_deleted',
        payload: {
          item_title: item.title,
          deleted_by_name: currentMember.display_name,
        },
        created_at: new Date().toISOString(),
        read_at: null,
      });
    }

    state.items = state.items.filter((candidate) => candidate.id !== itemId);
    state.reservations = state.reservations.filter(
      (reservation) => reservation.item_id !== itemId
    );
    writeDemoState(state);
    return true;
  }

  const data = await rpc('delete_item', {
    p_group_secret: group.groupSecret,
    p_user_secret: session.userSecret,
    p_item_id: itemId,
  });
  if (data === false) throw new GroupError('ITEM_NOT_FOUND');
  return true;
}

export async function markNotificationsRead({ group, session }) {
  if (isDemo()) {
    const state = readDemoState();
    const currentMember = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved'
    );
    if (!currentMember) throw new GroupError('NOT_APPROVED');

    const readAt = new Date().toISOString();
    let count = 0;
    for (const notification of state.notifications) {
      if (
        notification.group_id === group.id &&
        notification.member_id === currentMember.id &&
        !notification.read_at
      ) {
        notification.read_at = readAt;
        count += 1;
      }
    }
    writeDemoState(state);
    return count;
  }

  const data = await rpc('mark_notifications_read', {
    p_group_id: group.id,
    p_user_secret: session.userSecret,
  });
  return Number(data) || 0;
}

export async function approveMember({
  group,
  session,
  memberId,
  approve,
}) {
  if (isDemo()) {
    const state = readDemoState();
    const admin = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved' &&
        candidate.is_admin
    );
    if (!admin) throw new GroupError('NOT_ADMIN');

    if (approve) {
      const target = state.members.find(
        (candidate) =>
          candidate.id === memberId &&
          candidate.group_id === group.id &&
          candidate.status === 'pending'
      );
      if (!target) throw new GroupError('MEMBER_NOT_PENDING');
      target.status = 'approved';
    } else {
      state.members = state.members.filter(
        (candidate) =>
          !(
            candidate.id === memberId &&
            candidate.group_id === group.id &&
            candidate.status === 'pending'
          )
      );
    }

    writeDemoState(state);
    return true;
  }

  const data = await rpc('approve_member', {
    p_group_id: group.id,
    p_admin_user_secret: session.userSecret,
    p_member_id: memberId,
    p_approve: approve,
  });
  if (data === false) throw new GroupError('MEMBER_NOT_PENDING');
  return true;
}

export async function removeMember({ group, session, memberId }) {
  if (isDemo()) {
    const state = readDemoState();
    const admin = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved' &&
        candidate.is_admin
    );
    if (!admin) throw new GroupError('NOT_ADMIN');
    if (memberId === admin.id) throw new GroupError('CANNOT_REMOVE_SELF');

    const target = state.members.find(
      (candidate) =>
        candidate.id === memberId &&
        candidate.group_id === group.id &&
        candidate.status !== 'removed'
    );
    if (!target) throw new GroupError('MEMBER_NOT_FOUND');

    state.reservations = state.reservations.filter(
      (reservation) => reservation.reserved_by_member_id !== memberId
    );
    state.hidden_items = state.hidden_items.filter(
      (hidden) => hidden.member_id !== memberId
    );
    state.notifications = state.notifications.filter(
      (notification) => notification.member_id !== memberId
    );

    target.status = 'removed';
    target.user_secret = generateSecret();
    target.invite_token = null;
    writeDemoState(state);
    return true;
  }

  const data = await rpc('remove_member', {
    p_group_secret: group.groupSecret,
    p_admin_user_secret: session.userSecret,
    p_member_id: memberId,
  });
  if (data === false) throw new GroupError('MEMBER_NOT_FOUND');
  return true;
}

export async function reissueInvite({ group, session, memberId }) {
  if (isDemo()) {
    const state = readDemoState();
    const admin = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved' &&
        candidate.is_admin
    );
    if (!admin) throw new GroupError('NOT_ADMIN');
    if (memberId === admin.id) throw new GroupError('CANNOT_REINVITE_SELF');

    const target = state.members.find(
      (candidate) =>
        candidate.id === memberId && candidate.group_id === group.id
    );
    if (!target) throw new GroupError('MEMBER_NOT_FOUND');

    const inviteToken = generateSecret();
    target.status = 'invited';
    target.user_secret = generateSecret();
    target.invite_token = inviteToken;
    target.invite_created_at = new Date().toISOString();
    target.invite_used_at = null;
    writeDemoState(state);

    return {
      memberId: target.id,
      displayName: target.display_name,
      inviteToken,
    };
  }

  const data = await rpc('reissue_invite', {
    p_group_secret: group.groupSecret,
    p_admin_user_secret: session.userSecret,
    p_member_id: memberId,
  });
  const row = firstRow(data);
  if (!row) throw new GroupError('MEMBER_NOT_FOUND');

  return {
    memberId: row.member_id,
    displayName: row.display_name,
    inviteToken: row.invite_token,
  };
}

export async function createPreapprovedMember({
  group,
  session,
  displayName,
}) {
  const cleanName = trim(displayName);
  if (!cleanName) throw new GroupError('INVALID_NAME');

  if (isDemo()) {
    const state = readDemoState();
    const admin = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.user_secret === session.userSecret &&
        candidate.status === 'approved' &&
        candidate.is_admin
    );
    if (!admin) throw new GroupError('NOT_ADMIN');

    const inviteToken = generateSecret();
    const member = {
      id: createId(),
      group_id: group.id,
      user_secret: generateSecret(),
      display_name: cleanName,
      is_admin: false,
      status: 'invited',
      invite_token: inviteToken,
      invite_created_at: new Date().toISOString(),
      invite_used_at: null,
      created_at: new Date().toISOString(),
    };
    state.members.push(member);
    writeDemoState(state);

    return {
      memberId: member.id,
      displayName: cleanName,
      inviteToken,
    };
  }

  const data = await rpc('create_preapproved_member', {
    p_group_secret: group.groupSecret,
    p_admin_user_secret: session.userSecret,
    p_display_name: cleanName,
  });
  const row = firstRow(data);
  if (!row) throw new GroupError('UNKNOWN');

  return {
    memberId: row.member_id,
    displayName: row.display_name,
    inviteToken: row.invite_token,
  };
}

export async function getInviteInfo({ groupSecret, inviteToken }) {
  if (!groupSecret || !inviteToken) return null;

  if (isDemo()) {
    const state = readDemoState();
    const group = state.groups.find(
      (candidate) => candidate.group_secret === groupSecret
    );
    if (!group) return null;

    const member = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.invite_token === inviteToken &&
        candidate.status === 'invited'
    );
    if (!member) return null;

    return {
      group: mapDemoGroup(group),
      member: {
        id: member.id,
        displayName: member.display_name,
      },
      inviteToken,
    };
  }

  const data = await rpc('get_invite', {
    p_group_secret: groupSecret,
    p_invite_token: inviteToken,
  });
  const row = firstRow(data);
  if (!row) return null;

  return {
    group: {
      id: row.group_id,
      name: row.group_name,
      groupSecret,
    },
    member: {
      id: row.member_id,
      displayName: row.display_name,
    },
    inviteToken,
  };
}

export async function claimInvite({
  groupSecret,
  inviteToken,
  userSecret,
}) {
  if (!groupSecret || !inviteToken || !userSecret) {
    throw new GroupError('INVITE_NOT_FOUND');
  }

  if (isDemo()) {
    const state = readDemoState();
    const group = state.groups.find(
      (candidate) => candidate.group_secret === groupSecret
    );
    if (!group) throw new GroupError('INVITE_NOT_FOUND');

    const member = state.members.find(
      (candidate) =>
        candidate.group_id === group.id &&
        candidate.invite_token === inviteToken &&
        candidate.status === 'invited'
    );
    if (!member) throw new GroupError('INVITE_NOT_FOUND');

    member.user_secret = userSecret;
    member.status = 'approved';
    member.invite_token = null;
    member.invite_used_at = new Date().toISOString();
    writeDemoState(state);

    return {
      group: mapDemoGroup(group),
      member: mapDemoMember(member),
    };
  }

  const data = await rpc('claim_invite', {
    p_group_secret: groupSecret,
    p_invite_token: inviteToken,
    p_user_secret: userSecret,
  });
  const row = firstRow(data);
  if (!row) throw new GroupError('INVITE_NOT_FOUND');
  return mapGroupRow(row, groupSecret);
}
