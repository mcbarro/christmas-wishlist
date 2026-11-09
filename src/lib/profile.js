import { useSyncExternalStore } from 'react';

const PROFILE_STORAGE_KEY = 'christmas-wishlist:profile-name';
const listeners = new Set();

function emitChange() {
  for (const listener of listeners) listener();
}

export function getProfileName() {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(PROFILE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setProfileName(name) {
  if (typeof window === 'undefined') return;
  const value = String(name || '').trim();
  try {
    if (value) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  } catch {
    // The profile name is a convenience, not a requirement.
  }
  emitChange();
}

function subscribe(listener) {
  listeners.add(listener);

  const onStorage = (event) => {
    if (event.key === PROFILE_STORAGE_KEY) emitChange();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

/**
 * Reads the locally stored name without requiring an account.
 */
export function useProfileName() {
  return useSyncExternalStore(subscribe, getProfileName, () => '');
}
