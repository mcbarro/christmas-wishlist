import { parsePriceAmount } from './price';
import { normalizeSearch } from './text';

export function itemMatchesBudget(item, budget) {
  if (!budget?.active) return true;

  const amount = parsePriceAmount(item.price);
  if (amount === null) return Boolean(budget.includeMissing);

  return amount >= budget.min && amount <= budget.max;
}

export function filterWishes(
  items,
  { memberId, budget, status, query, showHidden = false } = {}
) {
  const normalizedQuery = normalizeSearch(query);

  return (items || []).filter((item) => {
    if (item.hidden_by_me && !showHidden) return false;

    if (memberId && memberId !== 'all' && item.owner_member_id !== memberId) {
      return false;
    }

    if (!itemMatchesBudget(item, budget)) return false;

    if (status === 'available' && item.reservation) return false;
    if (status === 'reserved' && !item.reservation) return false;

    if (!normalizedQuery) return true;

    return [
      item.title,
      item.notes,
      item.added_by,
      item.created_by_name,
      item.owner_name,
      item.price,
      item.reservation?.reserved_by_name,
    ].some((value) => normalizeSearch(value).includes(normalizedQuery));
  });
}

export function getPriceBounds(items) {
  const prices = (items || [])
    .map((item) => parsePriceAmount(item.price))
    .filter((amount) => amount !== null && amount >= 0);

  if (!prices.length) {
    return { min: 0, max: 0, hasPrices: false };
  }

  const maximum = Math.max(...prices);
  return {
    min: 0,
    max: Math.max(10, Math.ceil(maximum / 5) * 5),
    hasPrices: true,
  };
}
