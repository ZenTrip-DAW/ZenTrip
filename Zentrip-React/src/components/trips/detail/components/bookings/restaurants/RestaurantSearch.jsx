import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { searchRestaurants } from '../../../../../../services/restaurantService';
import { SectionLabel } from '../hotels/HotelAtoms';
import RestaurantCard from './RestaurantCard';
import RestaurantDetailModal from './RestaurantDetailModal';
import { useAuth } from '../../../../../../context/AuthContext';

export default function RestaurantSearch({ trip, tripId }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  useEffect(() => {
    if (trip?.destination) {
      setQuery(trip.destination.split(',')[0].trim());
    }
  }, [trip?.destination]);

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-4 flex items-center justify-center text-2xl">🔒</div>
        <h2 className="title-h3-desktop text-neutral-7 mb-2">Acceso restringido</h2>
        <p className="body-2 text-neutral-4">Debes iniciar sesión para buscar restaurantes.</p>
      </div>
    );
  }

  const handleSearch = async () => {
    if (!query.trim() || query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(false);
    try {
      const data = await searchRestaurants({ query: query.trim() });
      setResults(data?.data ?? []);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'No se pudo realizar la búsqueda. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <>
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-3 flex items-center justify-center text-2xl">🍽️</div>
        <h2 className="title-h3-desktop text-neutral-7 mb-1">¿Dónde coméis?</h2>
        <p className="body-2 text-neutral-4">Busca los mejores restaurantes para tu grupo</p>
      </div>

      {/* Buscador */}
      <div className="mb-7">
        <SectionLabel>Buscar restaurantes</SectionLabel>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ciudad o zona (ej. Barcelona)"
            className="flex-1 h-11 px-4 rounded-xl border border-neutral-2 body-3 text-neutral-7 placeholder:text-neutral-3 focus:outline-none focus:border-primary-3"
          />
          <button
            onClick={handleSearch}
            disabled={loading || query.trim().length < 2}
            className="h-11 px-5 rounded-xl bg-primary-3 text-white body-3 font-bold hover:bg-primary-4 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-feedback-error/10 border border-feedback-error/30 rounded-xl px-4 py-3 mb-5 body-3 text-feedback-error-strong flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {/* Resultados */}
      {searched && (
        <div>
          <SectionLabel>
            {results.length > 0 ? `${results.length} restaurantes encontrados` : 'Sin resultados'}
          </SectionLabel>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((r) => (
                <RestaurantCard key={r.placeId} restaurant={r} onView={setSelectedRestaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-4 body-3">
              No se encontraron restaurantes para esta búsqueda.
            </div>
          )}
        </div>
      )}

      {/* Sin búsqueda aún */}
      {!searched && !loading && trip?.destination && (
        <div className="mb-6">
          <SectionLabel>Destino del viaje</SectionLabel>
          <div className="flex items-center gap-3 bg-white border border-neutral-1 rounded-xl px-4 py-3">
            <span className="text-2xl">🍽️</span>
            <div>
              <p className="body-2-semibold text-neutral-7">{trip.destination}</p>
              {trip.origin && <p className="body-3 text-neutral-4">Desde {trip.origin}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {selectedRestaurant && (
        <RestaurantDetailModal
          restaurant={selectedRestaurant}
          tripId={tripId}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}
    </>
  );
}
