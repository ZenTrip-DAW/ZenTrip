export default function ActivityCard({ activity, onView }) {
  const { name, photo, rating, reviewCount, price, currency, shortDescription, duration, freeCancellation } = activity;

  return (
    <div className="flex flex-col sm:flex-row bg-white border border-neutral-1 rounded-xl overflow-hidden hover:border-primary-2 hover:shadow-sm transition-all">
      {/* Foto */}
      <div className="w-full h-36 sm:h-auto sm:w-36 sm:shrink-0 bg-primary-1 flex items-center justify-center overflow-hidden">
        {photo
          ? <img src={photo} alt={name} className="w-full h-full object-cover object-top" />
          : <span className="text-4xl">🎯</span>}
      </div>

      {/* Info */}
      <div className="flex-1 p-3 sm:border-r border-neutral-1 min-w-0">
        <p className="body-2-semibold text-neutral-7 line-clamp-2 mb-1">{name}</p>

        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {rating != null && (
            <span className="bg-secondary-4 text-secondary-1 text-[11px] font-bold px-1.5 py-0.5 rounded">
              ★ {Number(rating).toFixed(1)}
            </span>
          )}
          {reviewCount != null && (
            <span className="text-[11px] text-neutral-4">{reviewCount.toLocaleString()} reseñas</span>
          )}
          {freeCancellation && (
            <span className="text-[11px] px-2 py-0.5 bg-auxiliary-green-1 text-auxiliary-green-5 rounded-full font-semibold">
              Cancelación gratis
            </span>
          )}
          {duration && (
            <span className="text-[11px] px-2 py-0.5 bg-neutral-1 text-neutral-5 rounded-full">⏱ {duration}</span>
          )}
        </div>

        {shortDescription && (
          <p className="body-3 text-neutral-4 line-clamp-2">{shortDescription}</p>
        )}
      </div>

      {/* CTA */}
      <div className="p-3 sm:w-36 sm:shrink-0 border-t sm:border-t-0 border-neutral-1 flex flex-col sm:justify-center items-start sm:items-end gap-2">
        {price != null && (
          <p className="body-2-semibold text-secondary-4">
            desde {Number(price).toLocaleString('es-ES', { style: 'currency', currency: currency || 'EUR', maximumFractionDigits: 0 })}
          </p>
        )}
        <button
          onClick={() => onView(activity)}
          className="body-3 font-semibold px-3 py-1.5 rounded-lg border border-primary-3 text-primary-3 bg-white hover:bg-primary-1 transition whitespace-nowrap"
        >
          Ver actividad →
        </button>
      </div>
    </div>
  );
}
