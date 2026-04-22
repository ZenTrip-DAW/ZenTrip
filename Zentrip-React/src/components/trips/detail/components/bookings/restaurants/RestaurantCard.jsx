const PRICE_LABELS = { 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' };

function cuisineLabel(types = []) {
  const skip = ['restaurant', 'food', 'point_of_interest', 'establishment', 'store'];
  const found = types.find((t) => !skip.includes(t));
  return found ? found.replace(/_/g, ' ') : null;
}

export default function RestaurantCard({ restaurant, onView }) {
  const { name, address, rating, userRatingsTotal, priceLevel, photo, openNow, types } = restaurant;
  const cuisine = cuisineLabel(types);

  return (
    <div className="flex flex-col sm:flex-row sm:h-32 bg-white border border-neutral-1 rounded-xl overflow-hidden hover:border-primary-2 hover:shadow-md transition-all cursor-pointer">

      {/* Imagen */}
      <div className="w-full h-36 sm:h-full sm:w-36 sm:shrink-0 bg-primary-1 flex items-center justify-center overflow-hidden">
        {photo
          ? <img src={photo} alt={name} className="w-full h-full object-cover" />
          : <span className="text-4xl">🍽️</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 p-3 sm:border-r border-neutral-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="body-2-semibold text-neutral-7 leading-tight">{name}</p>
          {priceLevel != null && (
            <span className="text-[11px] px-2 py-0.5 bg-secondary-1 text-secondary-4 rounded-full shrink-0 font-titles font-bold">
              {PRICE_LABELS[priceLevel]}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {rating != null && (
            <span className="bg-secondary-4 text-secondary-1 text-[11px] font-bold px-1.5 py-0.5 rounded font-titles">
              ★ {rating.toFixed(1)}
            </span>
          )}
          {userRatingsTotal != null && (
            <span className="text-[11px] px-2 py-0.5 bg-neutral-1 text-neutral-5 rounded-full">
              {userRatingsTotal.toLocaleString()} reseñas
            </span>
          )}
          {cuisine && (
            <span className="text-[11px] px-2 py-0.5 bg-neutral-1 text-neutral-5 rounded-full capitalize">
              {cuisine}
            </span>
          )}
        </div>

        {address && (
          <p className="body-3 text-neutral-4 line-clamp-2 mt-1">{address}</p>
        )}
      </div>

      {/* Estado + acción */}
      <div className="w-full sm:w-36 sm:shrink-0 p-3 border-t sm:border-t-0 border-neutral-1 flex flex-col gap-3 sm:gap-0 sm:justify-between items-start sm:items-end">
        <div className="text-left sm:text-right">
          {openNow != null && (
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full font-titles ${
              openNow ? 'bg-auxiliary-green-2 text-auxiliary-green-5' : 'bg-red-50 text-feedback-error-strong'
            }`}>
              {openNow ? 'Abierto ahora' : 'Cerrado'}
            </span>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onView(restaurant); }}
          className="body-3 font-semibold px-3 py-1.5 rounded-lg border border-primary-3 text-primary-3 bg-white hover:bg-primary-1 transition whitespace-nowrap w-full sm:w-auto"
        >
          Ver restaurante →
        </button>
      </div>
    </div>
  );
}
