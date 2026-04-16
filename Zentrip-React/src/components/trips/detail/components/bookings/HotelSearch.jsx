import { useState } from 'react';
import { apiClient } from '../../../../../services/apiClient';
import { mapApiHotel, getNights, TIPS } from './hotelUtils';
import { SectionLabel, TipCard } from './HotelAtoms';
import HotelSearchForm from './HotelSearchForm';
import HotelResults from './HotelResults';
import HotelDetailModal from './HotelDetailModal';

export default function HotelSearch({ trip, members = [], tripId }) {
  const [dest, setDest]         = useState(trip?.destination || '');
  const [checkIn, setCheckIn]   = useState(trip?.startDate || '');
  const [checkOut, setCheckOut] = useState(trip?.endDate || '');
  const [rooms, setRooms]       = useState(1);
  const [adults, setAdults]     = useState(members.length > 0 ? members.length : 2);
  const [children, setChildren] = useState(0);

  const [hotels, setHotels]         = useState([]);
  const [searched, setSearched]     = useState(false);
  const [searchedDest, setSearchedDest] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const [filter, setFilter]   = useState('all');
  const [sortKey, setSortKey] = useState('score');
  const [page, setPage]       = useState(1);

  const [selectedHotel, setSelectedHotel] = useState(null);

  const nights = getNights(checkIn, checkOut);
  const canSearch = Boolean(dest.trim() && checkIn && checkOut && nights > 0);

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    setHotels([]);
    setSearched(false);
    try {
      const params = new URLSearchParams({
        city: dest.trim(),
        arrivalDate: checkIn,
        departureDate: checkOut,
        adults: String(adults),
        roomQty: String(rooms),
        languageCode: 'es',
        currencyCode: trip?.currency || 'EUR',
      });
      const data = await apiClient.get(`/hotels/search?${params.toString()}`);
      const rawHotels = data?.data?.hotels ?? data?.hotels ?? [];
      setHotels(rawHotels.map(mapApiHotel));
      setSearchedDest(dest.trim());
      setFilter('all');
      setPage(1);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'No se pudo realizar la búsqueda. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key) => { setFilter(key); setPage(1); };
  const handleSortChange   = (key) => { setSortKey(key); setPage(1); };

  return (
    <>
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-3 flex items-center justify-center text-2xl">
          🏨
        </div>
        <h2 className="title-h3-desktop text-neutral-7 mb-1">¿Dónde os alojáis?</h2>
        <p className="body-2 text-neutral-4">Busca hoteles para tu grupo en cualquier destino del mundo</p>
      </div>

      {/* Formulario */}
      <div className="mb-7">
        <HotelSearchForm
          dest={dest}           onDestChange={setDest}
          checkIn={checkIn}     onCheckInChange={setCheckIn}
          checkOut={checkOut}   onCheckOutChange={setCheckOut}
          rooms={rooms}         onRoomsChange={setRooms}
          adults={adults}       onAdultsChange={setAdults}
          children={children}   onChildrenChange={setChildren}
          loading={loading}
          canSearch={canSearch}
          onSearch={handleSearch}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-feedback-error border border-feedback-error rounded-xl px-4 py-3 mb-5 body-3 text-feedback-error-strong flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      {/* Resultados */}
      {searched && (
        <HotelResults
          hotels={hotels}
          searchedDest={searchedDest}
          nights={nights}
          adults={adults}
          filter={filter}       onFilterChange={handleFilterChange}
          sortKey={sortKey}     onSortChange={handleSortChange}
          page={page}           onPageChange={setPage}
          onView={setSelectedHotel}
        />
      )}

      {/* Destino del viaje */}
      {trip?.destination && (
        <div className="mb-6">
          <SectionLabel>Destino del viaje</SectionLabel>
          <button
            onClick={() => setDest(trip.destination)}
            className="flex items-center gap-3 bg-white border border-neutral-1 rounded-xl px-4 py-3 hover:border-primary-2 hover:bg-primary-1 transition w-full text-left"
          >
            <span className="text-2xl">🏨</span>
            <div>
              <p className="body-2-semibold text-neutral-7">{trip.destination}</p>
              {trip.origin && <p className="body-3 text-neutral-4">{trip.origin}</p>}
              {nights > 0 && (
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-1 text-primary-4 font-titles">
                  {nights} noche{nights !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Tips */}
      <div>
        <SectionLabel>Consejos para tu búsqueda</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {TIPS.map((t) => <TipCard key={t.title} {...t} />)}
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedHotel && (
        <HotelDetailModal
          hotel={selectedHotel}
          searchParams={{ checkIn, checkOut, adults, rooms, currency: trip?.currency || 'EUR' }}
          tripId={tripId}
          trip={trip}
          onClose={() => setSelectedHotel(null)}
        />
      )}
    </>
  );
}
