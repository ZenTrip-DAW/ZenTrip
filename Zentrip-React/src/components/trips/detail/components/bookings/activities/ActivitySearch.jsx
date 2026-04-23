import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { searchAttractions } from '../../../../../../services/attractionService';
import { SectionLabel } from '../hotels/HotelAtoms';
import BookingBanner from '../BookingBanner';
import ActivityCard from './ActivityCard';
import ActivityDetailModal from './ActivityDetailModal';
import Pagination from '../../../../../ui/Pagination';
import { useAuth } from '../../../../../../context/AuthContext';

const PER_PAGE = 5;

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'free_cancel', label: 'Cancelación gratis' },
  { key: 'popular', label: 'Más reservadas' },
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Mejor valoradas' },
  { value: 'price-asc', label: 'Precio: menor primero' },
  { value: 'price-desc', label: 'Precio: mayor primero' },
];

function FormField({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 body-3 font-bold text-neutral-5 uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ActivitySearch({ trip, tripId, members = [] }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState(trip?.startDate || '');
  const [people, setPeople] = useState(2);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('rating');
  const [page, setPage] = useState(1);

  const today = new Date().toISOString().split('T')[0];
  const maxDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 2); return d.toISOString().split('T')[0]; })();

  useEffect(() => {
    if (trip?.destination) setQuery(trip.destination.split(',')[0].trim());
    if (trip?.startDate) setDate(trip.startDate);
  }, [trip?.destination, trip?.startDate]);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-1 text-center py-16">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-4 flex items-center justify-center text-2xl">🔒</div>
        <h2 className="title-h3-desktop text-neutral-7 mb-2">Acceso restringido</h2>
        <p className="body-2 text-neutral-4">Debes iniciar sesión para buscar actividades.</p>
      </div>
    );
  }

  const canSearch = query.trim().length >= 2 && !!date;

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(false);
    try {
      const data = await searchAttractions({ query: query.trim() });
      setResults(data?.data ?? []);
      setSearched(true);
      setFilter('all');
      setSortKey('rating');
      setPage(1);
    } catch (err) {
      setError(err.message || 'No se pudo realizar la búsqueda. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const displayResults = useMemo(() => {
    let list = [...results];
    if (filter === 'free_cancel') list = list.filter((a) => a.freeCancellation);
    if (filter === 'popular') {
      list.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    } else {
      if (sortKey === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      if (sortKey === 'price-asc') list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      if (sortKey === 'price-desc') list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    }
    return list;
  }, [results, filter, sortKey]);

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 overflow-hidden">
      <BookingBanner
        src="/img/background/bookings/attraction.jpg"
        objectPosition="center 95%"
        alt="Actividades"
        title="¿Qué queréis hacer?"
        subtitle="Busca actividades y atracciones en vuestro destino"
      />

      <div className="p-4 sm:p-6">
        {/* Formulario */}
        <div className="bg-white border border-neutral-1 rounded-2xl p-4 sm:p-6 shadow-sm mb-7">
          <SectionLabel>Buscar actividades</SectionLabel>

          <div className="mb-4">
            <FormField label="Ciudad o destino" icon={MapPin}>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-3 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Barcelona, Roma, París…"
                  className="w-full h-12 pl-9 pr-3 border-2 border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-primary-3 focus:ring-2 focus:ring-primary-3/10 transition placeholder:text-neutral-3"
                />
              </div>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <FormField label="Fecha" icon={Calendar}>
              <input
                type="date"
                value={date}
                min={today}
                max={maxDate}
                onChange={(e) => { if (e.target.value <= maxDate) setDate(e.target.value); }}
                className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-secondary-3 focus:ring-2 focus:ring-secondary-3/20 transition"
              />
            </FormField>
            <FormField label="Personas" icon={Users}>
              <input
                type="number"
                min={1}
                max={20}
                value={people}
                onChange={(e) => setPeople(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-secondary-3 focus:ring-2 focus:ring-secondary-3/20 transition"
              />
            </FormField>
          </div>

          <div className="border-t border-neutral-1 mb-6" />

          <button
            onClick={handleSearch}
            disabled={!canSearch || loading}
            className={`w-full h-12 rounded-lg font-titles font-bold text-white flex items-center justify-center gap-2 transition ${
              canSearch && !loading ? 'bg-primary-3 hover:bg-primary-4' : 'bg-neutral-2 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Buscando…
              </>
            ) : (
              <><Search className="w-4 h-4" /> Buscar actividades</>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-feedback-error/10 border border-feedback-error/30 rounded-xl px-4 py-3 mb-5 body-3 text-feedback-error-strong flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Resultados */}
        {searched && (
          <div className="mb-6">
            <div className="border-t border-neutral-1 mb-5" />

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap mb-4">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setFilter(f.key); setPage(1); }}
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
                <span className="font-bold text-neutral-7">{displayResults.length} actividades</span>
                {query && ` · ${query}`}
              </p>
              <select
                value={sortKey}
                onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
                className="h-8 px-3 rounded-lg border border-neutral-2 body-3 text-neutral-5 bg-white outline-none"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {displayResults.length > 0 ? (
              <>
                <div className="flex flex-col gap-3">
                  {displayResults.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((a) => (
                    <ActivityCard key={a.id ?? a.slug} activity={a} onView={setSelectedActivity} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={Math.max(1, Math.ceil(displayResults.length / PER_PAGE))}
                  onPage={setPage}
                />
              </>
            ) : (
              <p className="text-center py-10 body-2 text-neutral-4">No se encontraron actividades con estos filtros.</p>
            )}
          </div>
        )}

        {/* Destino del viaje */}
        {trip?.destination && !searched && (
          <div className="mb-6">
            <SectionLabel>Destino del viaje</SectionLabel>
            <button
              onClick={() => setQuery(trip.destination.split(',')[0].trim())}
              className="flex items-center gap-3 bg-white border border-neutral-1 rounded-xl px-4 py-3 hover:border-primary-2 hover:bg-primary-1 transition w-full text-left"
            >
              <span className="text-2xl">🎯</span>
              <div>
                <p className="body-2-semibold text-neutral-7">{trip.destination}</p>
                {trip.origin && <p className="body-3 text-neutral-4">Desde {trip.origin}</p>}
              </div>
            </button>
          </div>
        )}
      </div>

      {selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          tripId={tripId}
          trip={trip}
          bookingParams={{ date, people }}
          members={members}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}
