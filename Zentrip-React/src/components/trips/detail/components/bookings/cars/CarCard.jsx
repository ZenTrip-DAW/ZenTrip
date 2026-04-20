export default function CarCard({ car, onView }) {
  return (
    <div className="flex flex-col sm:flex-row bg-white border border-neutral-1 rounded-xl overflow-hidden hover:border-primary-2 hover:shadow-md transition-all cursor-pointer">

      {/* Imagen */}
      <div className="w-full h-40 sm:h-auto sm:w-36 sm:shrink-0 bg-secondary-1 flex items-center justify-center overflow-hidden">
        {car.imageUrl
          ? <img src={car.imageUrl} alt={car.name} className="w-full h-full object-contain p-2" />
          : <span className="text-4xl">🚗</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 p-3 sm:border-r border-neutral-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="body-2-semibold text-neutral-7 leading-tight">{car.name}</p>
          {car.carClass && (
            <span className="text-[11px] px-2 py-0.5 bg-secondary-1 text-secondary-4 rounded-full shrink-0 font-titles font-bold">
              {car.carClass}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {car.transmission && (
            <span className="text-[11px] px-2 py-0.5 bg-neutral-1 text-neutral-5 rounded-full">{car.transmission}</span>
          )}
          {car.seats && (
            <span className="text-[11px] px-2 py-0.5 bg-neutral-1 text-neutral-5 rounded-full">{car.seats} plazas</span>
          )}
          {car.doors && (
            <span className="text-[11px] px-2 py-0.5 bg-neutral-1 text-neutral-5 rounded-full">{car.doors} puertas</span>
          )}
          {car.airConditioning && (
            <span className="text-[11px] px-2 py-0.5 bg-neutral-1 text-neutral-5 rounded-full">Aire acond.</span>
          )}
          {car.mileage && (
            <span className="text-[11px] px-2 py-0.5 bg-neutral-1 text-neutral-5 rounded-full">{car.mileage}</span>
          )}
        </div>

        {car.supplier?.name && (
          <div className="flex items-center gap-2 mt-1">
            {car.supplier.imageUrl && (
              <img src={car.supplier.imageUrl} alt={car.supplier.name} className="h-4 object-contain" />
            )}
            {car.supplier.rating && (
              <span className="bg-secondary-4 text-secondary-1 text-[11px] font-bold px-1.5 py-0.5 rounded font-titles">
                {car.supplier.rating}
              </span>
            )}
            <span className="body-3 text-neutral-4">{car.supplier.name}</span>
          </div>
        )}
      </div>

      {/* Precio + acción */}
      <div className="w-full sm:w-36 sm:shrink-0 p-3 border-t sm:border-t-0 border-neutral-1 flex flex-col gap-3 sm:gap-0 sm:justify-between items-start sm:items-end">
        <div className="text-left sm:text-right">
          {car.pricePerDay != null ? (
            <div>
              <p className="body-3 text-neutral-4">desde</p>
              <p className="title-h3-desktop text-neutral-7 leading-tight">{car.pricePerDay} {car.currency}</p>
              <p className="body-3 text-neutral-4">/ día</p>
            </div>
          ) : (
            <p className="body-3 text-neutral-4 mt-2">Precio no disponible</p>
          )}
        </div>

        <div className="flex flex-col items-start sm:items-end gap-1.5 w-full sm:w-auto">
          {car.freeCancellation && (
            <span className="text-[11px] font-bold px-2 py-1 bg-auxiliary-green-2 text-auxiliary-green-5 rounded-full font-titles">
              Cancelación gratis
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onView(car); }}
            className="body-3 font-semibold px-3 py-1.5 rounded-lg border border-primary-3 text-primary-3 bg-white hover:bg-primary-1 transition whitespace-nowrap w-full sm:w-auto"
          >
            Ver coche →
          </button>
        </div>
      </div>
    </div>
  );
}
