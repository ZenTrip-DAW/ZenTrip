import { useState, useEffect } from 'react';
import { apiClient } from '../../../../../../services/apiClient';
import { mapApiHotel, getNights, fmtDate, TIPS } from './hotelUtils';
import { SectionLabel, TipCard } from './HotelAtoms';
import HotelSearchForm from './HotelSearchForm';
import HotelResults from './HotelResults';
import HotelDetailModal from './HotelDetailModal';
import BookingDetailModal from './BookingDetailModal';
import { useAuth } from '../../../../../../context/AuthContext';
import { getBookings, deleteBooking, deleteActivity } from '../../../../../../services/tripService';

function CancelBookingModal({ booking, tripId, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await deleteBooking(tripId, booking.id);
      if (booking.activityId) {
        await deleteActivity(tripId, booking.activityId);
      }
      onConfirm();
      window.location.reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="title-h3-desktop text-neutral-7 mb-2">¿Cancelar reserva?</h3>
        <p className="body-2 text-neutral-5 mb-4">
          Esto eliminará la reserva de ZenTrip, pero <span className="font-bold text-neutral-7">debes cancelarla también en el sitio web</span> donde la hiciste para evitar cargos.
        </p>
        {booking.bookingUrl && (
          <a
            href={booking.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-secondary-3 text-secondary-3 body-3 font-bold hover:bg-secondary-1 transition mb-4"
          >
            Ir a Booking.com para cancelar
          </a>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-neutral-2 body-3 font-bold text-neutral-5 hover:bg-neutral-1 transition"
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-lg bg-feedback-error text-white body-3 font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {deleting ? 'Eliminando…' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelBookingButton({ booking, tripId, onCancelled }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="h-9 px-3 rounded-lg border border-feedback-error text-feedback-error-strong body-3 font-bold flex items-center justify-center hover:bg-red-50 transition w-full sm:w-auto"
      >
        Cancelar reserva
      </button>
      {showModal && (
        <CancelBookingModal
          booking={booking}
          tripId={tripId}
          onConfirm={() => { setShowModal(false); onCancelled(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default function HotelSearch({ trip, members = [], tripId }) {
  const { user } = useAuth();

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
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [existingBookings, setExistingBookings] = useState([]);

  useEffect(() => {
    if (!tripId || !user) return;
    getBookings(tripId)
      .then((data) => setExistingBookings(data.filter((b) => b.type === 'hotel')))
      .catch(() => {});
  }, [tripId, user]);

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-4 flex items-center justify-center text-2xl">
          🔒
        </div>
        <h2 className="title-h3-desktop text-neutral-7 mb-2">Acceso restringido</h2>
        <p className="body-2 text-neutral-4">Debes iniciar sesión para buscar hoteles.</p>
      </div>
    );
  }

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
    <>
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-primary-1 rounded-[50%_50%_50%_0] mx-auto mb-3 flex items-center justify-center text-2xl">
          🏨
        </div>
        <h2 className="title-h3-desktop text-neutral-7 mb-1">¿Dónde os alojáis?</h2>
        <p className="body-2 text-neutral-4">Busca hoteles para tu grupo en cualquier destino del mundo</p>
      </div>

      {/* Reservas existentes */}
      {existingBookings.length > 0 && (
        <div className="mb-7">
          <SectionLabel>Alojamiento reservado</SectionLabel>
          <div className="flex flex-col gap-3">
            {existingBookings.map((b) => (
              <div key={b.id} className="bg-auxiliary-green-1 border border-auxiliary-green-3 rounded-xl px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(b)}
                  className="w-full text-left mb-3 hover:opacity-80 transition"
                >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🏨</span>
                    <div>
                      <p className="body-2-semibold text-neutral-7">{b.hotelName}</p>
                      <p className="body-3 text-neutral-4">{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.nights} noche{b.nights !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {b.pricePerNight != null && (
                    <div className="text-right shrink-0">
                      <p className="body-2-semibold text-auxiliary-green-5">{b.pricePerNight} {b.currency}<span className="body-3 font-normal"> /noche</span></p>
                      <p className="body-3 text-neutral-4">{b.totalPrice} {b.currency} total</p>
                    </div>
                  )}
                </div>
                </button>
                <div className="flex flex-col sm:flex-row gap-2">
                  {b.bookingUrl && (
                    <a
                      href={b.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 h-9 rounded-lg border border-auxiliary-green-4 text-auxiliary-green-5 body-3 font-bold flex items-center justify-center gap-1.5 hover:bg-auxiliary-green-2 transition"
                    >
                      Ver en Booking.com
                    </a>
                  )}
                  <CancelBookingButton
                    booking={b}
                    tripId={tripId}
                    onCancelled={() => setExistingBookings((prev) => prev.filter((x) => x.id !== b.id))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Modal de reserva existente */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          tripId={tripId}
          onClose={() => setSelectedBooking(null)}
          onUpdated={(updated) => {
            setExistingBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
            setSelectedBooking(updated);
          }}
        />
      )}

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
