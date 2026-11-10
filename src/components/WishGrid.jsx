import WishCard from './WishCard';

export default function WishGrid({
  items,
  viewMode = 'grid',
  onReserve,
  onRelease,
  onDelete,
  onEdit,
  onHide,
  onUnhide,
  onRate,
  showRating,
  canHide,
}) {
  const list = viewMode === 'list';

  return (
    <div
      className={
        list
          ? 'flex flex-col gap-3'
          : 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
      }
    >
      {items.map((item, index) => (
        <div key={item.id}>
          <WishCard
            item={item}
            index={index}
            variant={list ? 'list' : 'grid'}
            onReserve={onReserve}
            onRelease={onRelease}
            onDelete={onDelete}
            onEdit={onEdit}
            onHide={onHide}
            onUnhide={onUnhide}
            onRate={onRate}
            showRating={showRating}
            canHide={canHide}
          />
        </div>
      ))}
    </div>
  );
}
