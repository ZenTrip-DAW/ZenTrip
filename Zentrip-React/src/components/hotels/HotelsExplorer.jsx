import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { mapApiHotel, getNights, TIPS } from '../trips/detail/components/bookings/hotels/hotelUtils';
import { SectionLabel, TipCard } from '../trips/detail/components/bookings/hotels/HotelAtoms';
import HotelSearchForm from '../trips/detail/components/bookings/hotels/HotelSearchForm';
import HotelResults from '../trips/detail/components/bookings/hotels/HotelResults';
import HotelDetailModal from '../trips/detail/components/bookings/hotels/HotelDetailModal';

export default function HotelsExplorer() {
  const { state } = useLocation();
  const tripContext = state?.tripContext ?? {};

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [dest, setDest]         = useState(tripContext.destination || '');
  const [checkIn, setCheckIn]   = useState(tripContext.startDate || today);
  const [checkOut, setCheckOut] = useState(tripContext.endDate || tomorrow);
  const [rooms, setRooms]       = useState(1);
  const [adults, setAdults]     = useState(tripContext.memberCount || 2);
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
        currencyCode: tripContext.currency || 'EUR',
      });
      const data = await apiClient.get(`/hotels/search?${params.toString()}`);
      const rawHotels = data?.data?.hotels ?? data?.hotels ?? [];
      setHotels(rawHotels.map((h) => mapApiHotel(h, nights)));
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
    <div className="min-h-screen bg-neutral-1/50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-4 flex items-center justify-center text-3xl">
            🏨
          </div>
          <h1 className="title-h2-desktop text-neutral-7 mb-2">Busca tu hotel</h1>
          <p className="body-2 text-neutral-4">Encuentra alojamiento en cualquier destino del mundo</p>
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
          <div className="bg-feedback-error/10 border border-feedback-error/30 rounded-xl px-4 py-3 mb-5 body-3 text-feedback-error-strong flex items-center gap-2">
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

        {/* Tips */}
        {!searched && (
          <div className="mt-2">
            <SectionLabel>Consejos para tu búsqueda</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {TIPS.map((t) => <TipCard key={t.title} {...t} />)}
            </div>
          </div>
        )}

      </div>

      {/* Modal de detalles */}
      {selectedHotel && (
        <HotelDetailModal
          hotel={selectedHotel}
          searchParams={{ checkIn, checkOut, adults, rooms, currency: tripContext.currency || 'EUR' }}
          tripId={tripContext.tripId ?? null}
          trip={tripContext.tripId ? { name: tripContext.tripName, currency: tripContext.currency } : null}
          onClose={() => setSelectedHotel(null)}
        />
      )}
    </div>
  );
}
