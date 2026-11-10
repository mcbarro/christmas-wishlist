import WishCard from './WishCard';

export default function WishGrid({ items, onReserve, onRelease, onDelete }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4">
      {items.map((item, index) => (
        <div key={item.id} className="mb-4 break-inside-avoid">
          <WishCard
            item={item}
            index={index}
            onReserve={onReserve}
            onRelease={onRelease}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
