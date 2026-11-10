import { describe, expect, it } from 'vitest';
import { filterWishes, getPriceBounds } from './filters';

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
});

describe('getPriceBounds', () => {
  it('rounds the maximum up to the next five', () => {
    expect(getPriceBounds(items)).toEqual({
      min: 0,
      max: 60,
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
