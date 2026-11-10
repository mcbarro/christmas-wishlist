import { describe, expect, it } from 'vitest';
import {
  getMemberColor,
  getMemberInitial,
  hashMemberId,
} from './memberColor';

describe('memberColor', () => {
  it('is stable for the same member id', () => {
    const first = getMemberColor('member-123');
    const second = getMemberColor('member-123');
    expect(second).toEqual(first);
    expect(hashMemberId('member-123')).toBe(hashMemberId('member-123'));
  });

  it('keeps text readable for many generated ids', () => {
    for (let index = 0; index < 500; index += 1) {
      const color = getMemberColor(`member-${index}`);
      expect(color.contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('builds an uppercase initial from the display name', () => {
    expect(getMemberInitial('Marco')).toBe('M');
    expect(getMemberInitial('èlia')).toBe('È');
    expect(getMemberInitial('')).toBe('?');
  });
});
