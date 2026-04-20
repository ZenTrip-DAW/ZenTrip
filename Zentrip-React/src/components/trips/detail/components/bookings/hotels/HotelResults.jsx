import HotelCard from './HotelCard';
import { FILTERS, FILTER_FN, PER_PAGE } from './hotelUtils';
import Pagination from '../../../../../ui/Pagination';

export default function HotelResults({
  hotels,
  searchedDest,
  nights,
  adults,
  filter, onFilterChange,
  sortKey, onSortChange,
  page, onPageChange,
  onView,
}) {
  const filtered = hotels.filter((h) => filter === 'all' || FILTER_FN[filter]?.(h));
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'score')      return (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0);
    if (sortKey === 'price-asc')  return (a.price ?? Infinity) - (b.price ?? Infinity);
    if (sortKey === 'price-desc') return (b.price ?? -Infinity) - (a.price ?? -Infinity);
    if (sortKey === 'stars')      return b.stars - a.stars;
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const slice = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="mb-8">
      <div className="border-t border-neutral-1 mb-5" />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`h-8 px-3 rounded-full body-3 border transition ${
              filter === f.key
                ? 'border-primary-3 bg-primary-1 text-primary-4 font-bold'
                : 'border-neutral-2 bg-white text-neutral-5 hover:border-primary-3 hover:text-primary-3'
            }`}
          >{f.label}</button>
        ))}
      </div>

      {/* Meta + ordenar */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <p className="body-3 text-neutral-4">
          <span className="font-bold text-neutral-7">{filtered.length} hoteles</span>
          {' '}· {searchedDest}
          {nights > 0 && ` · ${nights} noche${nights !== 1 ? 's' : ''}`}
          {` · ${adults} huésped${adults !== 1 ? 'es' : ''}`}
        </p>
        <select
          onChange={(e) => onSortChange(e.target.value)}
          className="h-8 px-3 rounded-lg border border-neutral-2 body-3 text-neutral-5 bg-white outline-none"
        >
          <option value="score">Mejor valorados</option>
          <option value="price-asc">Precio: menor primero</option>
          <option value="price-desc">Precio: mayor primero</option>
          <option value="stars">Estrellas</option>
        </select>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {slice.length > 0
          ? slice.map((h) => <HotelCard key={h.id} hotel={h} onView={onView} />)
          : <p className="text-center py-10 body-2 text-neutral-4">No se encontraron hoteles con estos filtros.</p>
        }
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPageChange} />
    </div>
  );
}
