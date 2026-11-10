import { describe, expect, it } from 'vitest';
import {
  buildSessionLink,
  generateSecret,
  GroupError,
  parseSessionParams,
} from './groupStore';

describe('parseSessionParams', () => {
  it('reads group and user secrets from the query string', () => {
    expect(parseSessionParams('?group=family&user=marco&lang=it')).toEqual({
      groupSecret: 'family',
      userSecret: 'marco',
      inviteToken: '',
    });
  });

  it('reads a one-time invite token from the query string', () => {
    expect(parseSessionParams('?group=family&invite=token-1')).toEqual({
      groupSecret: 'family',
      userSecret: '',
      inviteToken: 'token-1',
    });
  });

  it('returns empty values when the parameters are absent', () => {
    expect(parseSessionParams('?foo=bar')).toEqual({
      groupSecret: '',
      userSecret: '',
      inviteToken: '',
    });
  });
});

describe('buildSessionLink', () => {
  it('builds a personal link on the deployment base path', () => {
    const link = buildSessionLink({
      href: 'https://example.com/christmas-wishlist/',
      groupSecret: 'group-1',
      userSecret: 'user-1',
    });

    const url = new URL(link);
    expect(url.pathname).toBe('/christmas-wishlist/');
    expect(url.searchParams.get('group')).toBe('group-1');
    expect(url.searchParams.get('user')).toBe('user-1');
  });

  it('builds a group invite link without the user secret', () => {
    const link = buildSessionLink({
      href: 'https://example.com/christmas-wishlist/?lang=it&group=old&user=old',
      groupSecret: 'group-2',
    });

    const url = new URL(link);
    expect(url.searchParams.get('group')).toBe('group-2');
    expect(url.searchParams.get('user')).toBeNull();
    expect(url.searchParams.get('lang')).toBe('it');
  });

  it('builds a one-time invite link without a user secret', () => {
    const link = buildSessionLink({
      href: 'https://example.com/christmas-wishlist/?group=old&user=old&invite=old',
      groupSecret: 'group-3',
      inviteToken: 'invite-3',
    });

    const url = new URL(link);
    expect(url.searchParams.get('group')).toBe('group-3');
    expect(url.searchParams.get('invite')).toBe('invite-3');
    expect(url.searchParams.get('user')).toBeNull();
  });
});

describe('generateSecret', () => {
  it('returns a high-entropy alphanumeric token', () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[a-z0-9]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(24);
  });
});

describe('GroupError', () => {
  it('carries a stable error code', () => {
    const error = new GroupError('NOT_APPROVED');
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('NOT_APPROVED');
  });
});
