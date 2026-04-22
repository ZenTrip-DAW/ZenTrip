import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { searchRestaurants } from '../../../../../../services/restaurantService';
import { SectionLabel } from '../hotels/HotelAtoms';
import BookingBanner from '../BookingBanner';
import RestaurantCard from './RestaurantCard';
import RestaurantDetailModal from './RestaurantDetailModal';
import Pagination from '../../../../../ui/Pagination';
import { useAuth } from '../../../../../../context/AuthContext';

const PER_PAGE = 5;

const FILTERS = [
  { key: 'all',        label: 'Todos' },
  { key: 'open_now',   label: 'Abierto ahora' },
  { key: 'cheap',      label: '€ / €€' },
  { key: 'top_rated',  label: 'Mejor valorados' },
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

export default function RestaurantSearch({ trip, tripId, members = [] }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState(trip?.startDate || '');
  const [people, setPeople] = useState(2);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (trip?.destination) setQuery(trip.destination.split(',')[0].trim());
    if (trip?.startDate) setDate(trip.startDate);
  }, [trip?.destination, trip?.startDate]);

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-1 text-center py-16">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-4 flex items-center justify-center text-2xl">🔒</div>
        <h2 className="title-h3-desktop text-neutral-7 mb-2">Acceso restringido</h2>
        <p className="body-2 text-neutral-4">Debes iniciar sesión para buscar restaurantes.</p>
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
      const data = await searchRestaurants({ query: query.trim() });
      setResults(data?.data ?? []);
      setSearched(true);
      setFilter('all');
      setPage(1);
    } catch (err) {
      setError(err.message || 'No se pudo realizar la búsqueda. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = results.filter((r) => {
    if (filter === 'open_now') return r.openNow === true;
    if (filter === 'cheap') return r.priceLevel != null && r.priceLevel <= 2;
    if (filter === 'top_rated') return r.rating != null && r.rating >= 4.5;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageSlice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const renderResults = () => (
    <div className="mb-6">
      <div className="border-t border-neutral-1 mb-5" />
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
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <p className="body-3 text-neutral-4">
          <span className="font-bold text-neutral-7">{filtered.length} restaurantes</span>
          {query && ` · ${query}`}
          {people > 0 && ` · ${people} persona${people !== 1 ? 's' : ''}`}
        </p>
      </div>
      {filtered.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {pageSlice.map((r) => (
              <RestaurantCard key={r.placeId} restaurant={r} onView={setSelectedRestaurant} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      ) : (
        <p className="text-center py-10 body-2 text-neutral-4">No se encontraron restaurantes con estos filtros.</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 overflow-hidden">
      <BookingBanner
        src="/img/background/bookings/restaurant.jpg"
        objectPosition="center 70%"
        alt="Restaurantes"
        title="¿Dónde coméis?"
        subtitle="Busca los mejores restaurantes para tu grupo"
      />

      <div className="p-4 sm:p-6">

        {/* Formulario */}
        <div className="bg-white border border-neutral-1 rounded-2xl p-4 sm:p-6 shadow-sm mb-7">
          <SectionLabel>Buscar restaurantes</SectionLabel>

          {/* Destino */}
          <div className="mb-4">
            <FormField label="Ciudad o zona" icon={MapPin}>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-3 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Barcelona, Madrid, Roma…"
                  className="w-full h-12 pl-9 pr-3 border-2 border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-primary-3 focus:ring-2 focus:ring-primary-3/10 transition placeholder:text-neutral-3"
                />
              </div>
            </FormField>
          </div>

          {/* Fecha y personas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <FormField label="Fecha" icon={Calendar}>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
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
              <><Search className="w-4 h-4" /> Buscar restaurantes</>
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
        {searched && renderResults()}

        {/* Destino del viaje */}
        {trip?.destination && !searched && (
          <div className="mb-6">
            <SectionLabel>Destino del viaje</SectionLabel>
            <button
              onClick={() => setQuery(trip.destination.split(',')[0].trim())}
              className="flex items-center gap-3 bg-white border border-neutral-1 rounded-xl px-4 py-3 hover:border-primary-2 hover:bg-primary-1 transition w-full text-left"
            >
              <span className="text-2xl">🍽️</span>
              <div>
                <p className="body-2-semibold text-neutral-7">{trip.destination}</p>
                {trip.origin && <p className="body-3 text-neutral-4">Desde {trip.origin}</p>}
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {selectedRestaurant && (
        <RestaurantDetailModal
          restaurant={selectedRestaurant}
          tripId={tripId}
          trip={trip}
          bookingParams={{ date, people }}
          members={members}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}
    </div>
  );
}
