const PRICE_LABELS = { 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' };

function TypeBadge({ types = [] }) {
  const cuisine = types.find((t) => !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t));
  if (!cuisine) return null;
  const label = cuisine.replace(/_/g, ' ');
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-1 text-neutral-5 capitalize">
      {label}
    </span>
  );
}

export default function RestaurantCard({ restaurant, onView }) {
  const { name, address, rating, userRatingsTotal, priceLevel, photo, openNow, types } = restaurant;

  return (
    <div className="bg-white border border-neutral-1 rounded-xl overflow-hidden hover:border-primary-3 hover:shadow-sm transition group">
      {photo ? (
        <div className="h-36 overflow-hidden bg-neutral-1">
          <img src={photo} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        </div>
      ) : (
        <div className="h-36 bg-neutral-1 flex items-center justify-center text-4xl">🍽️</div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="body-2-semibold text-neutral-7 leading-tight line-clamp-1">{name}</p>
          {priceLevel != null && (
            <span className="body-3 text-neutral-4 shrink-0">{PRICE_LABELS[priceLevel] ?? ''}</span>
          )}
        </div>

        {rating != null && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[11px] font-bold text-auxiliary-yellow-5">★ {rating.toFixed(1)}</span>
            {userRatingsTotal != null && (
              <span className="text-[11px] text-neutral-4">({userRatingsTotal.toLocaleString()})</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <TypeBadge types={types} />
          {openNow != null && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${openNow ? 'bg-auxiliary-green-1 text-auxiliary-green-5' : 'bg-red-50 text-feedback-error-strong'}`}>
              {openNow ? 'Abierto' : 'Cerrado'}
            </span>
          )}
        </div>

        {address && (
          <p className="text-[11px] text-neutral-4 line-clamp-1 mb-3">{address}</p>
        )}

        <button
          onClick={() => onView?.(restaurant)}
          className="w-full h-8 rounded-lg bg-primary-1 text-primary-4 body-3 font-bold hover:bg-primary-2 transition"
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
}
