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
          : 'columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4'
      }
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={list ? '' : 'mb-4 break-inside-avoid'}
        >
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
