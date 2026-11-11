import { describe, expect, it } from 'vitest';
import { filterWishes, getPriceBounds, sortWishes } from './filters';

const items = [
  {
    id: 'a',
    owner_member_id: 'b',
    owner_name: 'Bea',
    created_by_name: 'Bea',
    title: 'Cuffie',
    notes: '',
    price: '€ 19,99',
    reservation: null,
  },
  {
    id: 'b',
    owner_member_id: 'b',
    owner_name: 'Bea',
    created_by_name: 'Bea',
    title: 'Libro',
    notes: '',
    price: '59 €',
    reservation: { reserved_by_name: 'Carla', is_mine: false },
  },
  {
    id: 'c',
    owner_member_id: 'c',
    owner_name: 'Carla',
    created_by_name: 'Carla',
    title: 'Senza prezzo',
    notes: '',
    price: '',
    reservation: null,
  },
];

const fullBudget = {
  active: false,
  min: 0,
  max: 60,
  includeMissing: false,
};

describe('filterWishes', () => {
  it('combines member and budget with AND', () => {
    const result = filterWishes(items, {
      memberId: 'b',
      budget: { active: true, min: 0, max: 30, includeMissing: false },
      status: 'all',
      query: '',
    });

    expect(result.map((item) => item.id)).toEqual(['a']);
  });

  it('hides unparsable prices when the budget is active', () => {
    const hidden = filterWishes(items, {
      memberId: 'all',
      budget: { active: true, min: 0, max: 100, includeMissing: false },
      status: 'all',
      query: '',
    });
    expect(hidden.map((item) => item.id)).toEqual(['a', 'b']);

    const included = filterWishes(items, {
      memberId: 'all',
      budget: { active: true, min: 0, max: 100, includeMissing: true },
      status: 'all',
      query: '',
    });
    expect(included.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('includes unparsable prices when the budget is inactive', () => {
    const result = filterWishes(items, {
      memberId: 'all',
      budget: fullBudget,
      status: 'all',
      query: '',
    });
    expect(result).toHaveLength(3);
  });

  it('combines status and search', () => {
    const reserved = filterWishes(items, {
      memberId: 'all',
      budget: fullBudget,
      status: 'reserved',
      query: 'libro',
    });
    expect(reserved.map((item) => item.id)).toEqual(['b']);
  });

  it('hides hidden wishes unless showHidden is enabled', () => {
    const hiddenItems = [
      ...items,
      {
        ...items[0],
        id: 'hidden',
        title: 'Hidden gift',
        hidden_by_me: true,
      },
    ];

    expect(
      filterWishes(hiddenItems, {
        memberId: 'all',
        budget: fullBudget,
        status: 'all',
        query: '',
      }).map((item) => item.id)
    ).toEqual(['a', 'b', 'c']);

    expect(
      filterWishes(hiddenItems, {
        memberId: 'all',
        budget: fullBudget,
        status: 'all',
        query: '',
        showHidden: true,
      }).map((item) => item.id)
    ).toEqual(['a', 'b', 'c', 'hidden']);
  });
});

describe('sortWishes', () => {
  it('puts suggestions first and then sorts by rating descending', () => {
    const sorted = sortWishes([
      {
        id: 'low',
        rating: 2.5,
        is_suggestion: false,
        created_at: '2026-11-10T10:00:00.000Z',
      },
      {
        id: 'suggestion',
        rating: null,
        is_suggestion: true,
        created_at: '2026-11-10T09:00:00.000Z',
      },
      {
        id: 'high',
        rating: 5,
        is_suggestion: false,
        created_at: '2026-11-10T08:00:00.000Z',
      },
      {
        id: 'half',
        rating: 4.5,
        is_suggestion: false,
        created_at: '2026-11-10T11:00:00.000Z',
      },
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      'suggestion',
      'high',
      'half',
      'low',
    ]);
  });

  it('keeps the newest first when ratings are equal', () => {
    const sorted = sortWishes([
      {
        id: 'older',
        rating: 3,
        is_suggestion: false,
        created_at: '2026-11-10T08:00:00.000Z',
      },
      {
        id: 'newer',
        rating: 3,
        is_suggestion: false,
        created_at: '2026-11-10T09:00:00.000Z',
      },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['newer', 'older']);
  });
});

describe('getPriceBounds', () => {
  it('uses the most expensive wish as the maximum', () => {
    expect(getPriceBounds(items)).toEqual({
      min: 0,
      max: 59,
      hasPrices: true,
    });
  });

  it('rounds a fractional maximum up to the next euro', () => {
    expect(getPriceBounds([{ price: '26,40 €' }])).toEqual({
      min: 0,
      max: 27,
      hasPrices: true,
    });
  });

  it('reports when no price can be parsed', () => {
    expect(getPriceBounds([{ price: '' }, { price: 'Gratis' }])).toEqual({
      min: 0,
      max: 0,
      hasPrices: false,
    });
  });
});
