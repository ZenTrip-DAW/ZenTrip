import FlightCard from './FlightCard';
import FilterSheet from './FilterSheet';
import { toPrice, fmt, PAGE_SIZE } from './flightUtils';
import { IcPlaneFly, IcFilter } from './flightIcons';
import Pagination from '../../ui/Pagination';

export default function FlightResults({
  response,
  filteredOffers,
  allOffers,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  tripType,
  showFilters,
  onToggleFilters,
  currentPage,
  onPageChange,
  onShowDetail,
  onPurchase,
}) {
  const activeFilters = [
    filters.stopsOutbound !== null,
    tripType === 'ROUND_TRIP' && filters.stopsReturn !== null,
    filters.airline !== null,
    filters.maxPrice !== null,
    (filters.timeSlots?.length ?? 0) > 0,
  ].filter(Boolean).length;

  return (
    <>
      {/* Chips con las mejores opciones de precio */}
      {response.data?.flightDeals?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {response.data.flightDeals.map((d) => {
            const labels = { CHEAPEST: 'Más barato', FASTEST: 'Más rápido', BEST: 'Mejor opción' };
            return (
              <div key={d.key} className="shrink-0 border border-neutral-1 rounded-xl px-3 py-2 bg-white text-center min-w-27.5">
                <p className="body-3 text-neutral-4 mb-0.5">{labels[d.key] ?? d.key}</p>
                <p className={`body-2-semibold ${d.key === 'CHEAPEST' ? 'text-auxiliary-green-5' : 'text-neutral-7'}`}>
                  {fmt(toPrice(d.price), d.price.currencyCode)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra de meta, ordenamiento y filtros */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="body-2 text-neutral-5">
          <span className="body-bold text-neutral-7">{filteredOffers.length} vuelos</span> disponibles
        </p>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="cursor-pointer body-3 border border-neutral-2 rounded-xl px-3 py-2 bg-white text-neutral-6 focus:outline-none focus:border-secondary-3"
          >
            <option value="BEST">Mejor opción</option>
            <option value="CHEAPEST">Precio más bajo</option>
            <option value="FASTEST">Más rápido</option>
          </select>
          <button
            onClick={onToggleFilters}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border body-3 font-semibold transition-all ${activeFilters > 0 ? 'bg-secondary-1 border-secondary-3 text-secondary-4' : 'bg-white border-neutral-2 text-neutral-5 hover:border-neutral-3'}`}
          >
            <IcFilter size={13} />
            Filtrar
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-secondary-3 text-white flex items-center justify-center" style={{ fontSize: 10, fontWeight: 700 }}>
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Lista de vuelos o estado vacío */}
      {filteredOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border-2 border-dashed border-neutral-2 rounded-2xl">
          <IcPlaneFly size={36} color="#C3BEBD" />
          <p className="body-semibold text-neutral-5">No hay vuelos con estos filtros</p>
          <button
            onClick={() => onFiltersChange({ stopsOutbound: null, stopsReturn: null, airline: null, maxPrice: null, timeSlots: [] })}
            className="cursor-pointer body-3 text-primary-3 font-semibold hover:text-primary-4"
          >
            Quitar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {filteredOffers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((offer, i) => (
              <FlightCard
                key={offer.token ?? i}
                offer={offer}
                isBest={(currentPage - 1) * PAGE_SIZE + i === 0 && sort === 'BEST'}
                onShowDetail={onShowDetail}
                onPurchase={onPurchase}
              />
            ))}
          </div>
          <Pagination
            page={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredOffers.length / PAGE_SIZE))}
            onPage={onPageChange}
          />
        </>
      )}

      {/* Modal de filtros avanzados */}
      {showFilters && (
        <FilterSheet
          aggregation={response?.data?.aggregation}
          offers={allOffers}
          filters={filters}
          tripType={tripType}
          onChange={onFiltersChange}
          onClose={onToggleFilters}
        />
      )}
    </>
  );
}
