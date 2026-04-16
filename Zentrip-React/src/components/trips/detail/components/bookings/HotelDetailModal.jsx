import { useEffect, useState } from 'react';
import { X, MapPin, ChevronLeft, ChevronRight, Wifi, Car, Coffee, Dumbbell, Waves, Utensils, ExternalLink } from 'lucide-react';
import { apiClient } from '../../../../../services/apiClient';
import { addActivity, addBooking, getBookings, sendBookingNotifications } from '../../../../../services/tripService';
import { useAuth } from '../../../../../context/AuthContext';
import { ScoreBadge, StarRow } from './HotelAtoms';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-2 border-b border-neutral-1 last:border-0">
      <span className="body-3 font-bold text-neutral-5 uppercase tracking-wider">{label}</span>
      <span className="body-3 text-neutral-7">{value}</span>
    </div>
  );
}

// ─── HotelDetailModal ─────────────────────────────────────────────────────────

export default function HotelDetailModal({ hotel, searchParams, tripId, trip, onClose }) {
  const { checkIn, checkOut, adults, rooms, currency } = searchParams;
  const { user, profile } = useAuth();

  const [details, setDetails]   = useState(null);
  const [photos, setPhotos]     = useState(hotel.photo ? [hotel.photo] : []);
  const [policies, setPolicies] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [booking, setBooking]   = useState(false);
  const [booked, setBooked]     = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!hotel.id) return;
    let cancelled = false;

    const fetchAll = async () => {
      setLoadingDetails(true);
      try {
        const [detailsRes, photosRes, policiesRes] = await Promise.allSettled([
          apiClient.get(`/hotels/details?hotelId=${hotel.id}&arrivalDate=${checkIn}&departureDate=${checkOut}&adults=${adults}&roomQty=${rooms}&currencyCode=${currency}`),
          apiClient.get(`/hotels/photos?hotelId=${hotel.id}`),
          apiClient.get(`/hotels/policies?hotelId=${hotel.id}`),
        ]);

        if (!cancelled) {
          if (detailsRes.status === 'fulfilled') setDetails(detailsRes.value);
          if (photosRes.status === 'fulfilled') {
            const photosData = photosRes.value?.data ?? photosRes.value ?? [];
            const urls = Array.isArray(photosData)
              ? photosData.slice(0, 12).map((p) => p.url_max || p.url || p).filter((u) => typeof u === 'string')
              : [];
            if (urls.length > 0) setPhotos(urls);
          }
          if (policiesRes.status === 'fulfilled') setPolicies(policiesRes.value);
        }
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [hotel.id, checkIn, checkOut, adults, rooms, currency]);

  const handleBooked = async () => {
    if (!tripId) return;
    setBooking(true);
    try {
      const existing = await getBookings(tripId);
      const isDuplicate = existing.some(
        (b) => b.hotelId === hotel.id && b.checkIn === checkIn && b.checkOut === checkOut
      );
      if (isDuplicate) {
        setDuplicate(true);
        return;
      }
      const bookingUrl = `https://www.booking.com/searchresults.es.html?dest_id=${hotel.id}&dest_type=hotel&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=${rooms}`;
      const bookingData = {
        type: 'hotel',
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelStars: hotel.stars,
        hotelScore: hotel.score,
        checkIn,
        checkOut,
        adults,
        rooms,
        nights,
        pricePerNight: hotel.price,
        totalPrice: hotel.price != null ? hotel.price * nights : null,
        currency: hotel.currency,
        status: 'reservado',
        bookingUrl,
      };
      const activityId = await addActivity(tripId, {
        date: checkIn,
        startTime: details?.data?.property?.checkin?.fromTime || '15:00',
        endTime: details?.data?.property?.checkout?.untilTime || '11:00',
        name: hotel.name,
        type: 'hotel',
        notes: hotel.price != null ? `Reservado · ${hotel.price} ${hotel.currency}/noche · ${nights} noche${nights !== 1 ? 's' : ''}` : 'Reservado',
        status: 'reservado',
      });
      await addBooking(tripId, { ...bookingData, activityId });
      await sendBookingNotifications(tripId, {
        bookerUid: user.uid,
        bookerName: profile?.displayName || profile?.firstName || 'Un miembro',
        hotelName: hotel.name,
        tripName: trip?.name || '',
      });
      setBooked(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error('[HotelDetailModal] Error al guardar reserva:', err);
    } finally {
      setBooking(false);
    }
  };


  const prop = details?.data?.property ?? details?.property ?? {};
  const description = prop.description?.intro || prop.shortDescription || null;
  const facilities = prop.facilities || prop.facilityHighlights || [];
  const address = prop.location?.address || prop.address || hotel.loc;
  const checkinTime = prop.checkin?.fromTime || hotel.checkin;
  const checkoutTime = prop.checkout?.untilTime || hotel.checkout;
  const reviewScore = prop.reviewScore ?? hotel.score;
  const reviewCount = prop.reviewCount ?? hotel.reviewCount;
  const reviewWord = prop.reviewScoreWord ?? hotel.reviewScoreWord;

  const nights = Math.max(0, Math.round((new Date(checkOut + 'T00:00:00') - new Date(checkIn + 'T00:00:00')) / 86400000));

  const FACILITY_ICONS = {
    'wifi': <Wifi className="w-4 h-4" />, 'internet': <Wifi className="w-4 h-4" />,
    'parking': <Car className="w-4 h-4" />, 'garage': <Car className="w-4 h-4" />,
    'desayuno': <Coffee className="w-4 h-4" />, 'breakfast': <Coffee className="w-4 h-4" />,
    'gym': <Dumbbell className="w-4 h-4" />, 'gimnasio': <Dumbbell className="w-4 h-4" />,
    'pool': <Waves className="w-4 h-4" />, 'piscina': <Waves className="w-4 h-4" />,
    'restaurante': <Utensils className="w-4 h-4" />, 'restaurant': <Utensils className="w-4 h-4" />,
  };

  const getFacilityIcon = (name = '') => {
    const key = Object.keys(FACILITY_ICONS).find((k) => name.toLowerCase().includes(k));
    return key ? FACILITY_ICONS[key] : <span className="w-4 h-4 text-center text-xs">✓</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* Header fijo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-1 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <ScoreBadge score={reviewScore} />
            <div className="min-w-0">
              <p className="body-2-semibold text-neutral-7 truncate">{hotel.name}</p>
              <StarRow stars={hotel.stars} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center text-neutral-5 hover:bg-neutral-1 transition shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1">

          {/* Galería de fotos */}
          {photos.length > 0 && (
            <div className="relative h-52 bg-neutral-1">
              <img src={photos[photoIndex]} alt={hotel.name} className="w-full h-full object-cover" />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-neutral-6" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition"
                  >
                    <ChevronRight className="w-4 h-4 text-neutral-6" />
                  </button>
                  <span className="absolute bottom-2 right-3 text-[11px] bg-neutral-7/60 text-white px-2 py-0.5 rounded-full">
                    {photoIndex + 1} / {photos.length}
                  </span>
                </>
              )}
            </div>
          )}

          <div className="p-5">

            {/* Valoración y ubicación */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                {address && (
                  <p className="flex items-center gap-1 body-3 text-neutral-4 mb-2">
                    <MapPin className="w-3 h-3 shrink-0" /> {address}
                  </p>
                )}
                {reviewWord && (
                  <div className="flex items-center gap-2">
                    <span className="body-2-semibold text-neutral-7">{reviewWord}</span>
                    {reviewCount > 0 && <span className="body-3 text-neutral-4">({reviewCount.toLocaleString()} valoraciones)</span>}
                  </div>
                )}
              </div>
              {hotel.price != null && (
                <div className="text-right shrink-0">
                  <p className="body-3 text-neutral-4">desde</p>
                  <p className="title-h3-desktop text-neutral-7 leading-tight">{hotel.price} {hotel.currency}<span className="body-3 text-neutral-4 font-normal"> /noche</span></p>
                  {nights > 0 && (
                    <p className="body-3 font-bold text-primary-3 mt-0.5">
                      {hotel.price * nights} {hotel.currency} total ({nights} noche{nights !== 1 ? 's' : ''})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Descripción */}
            {loadingDetails && !description && (
              <div className="flex items-center gap-2 body-3 text-neutral-4 mb-4">
                <span className="w-4 h-4 border-2 border-neutral-2 border-t-secondary-3 rounded-full animate-spin" />
                Cargando detalles…
              </div>
            )}
            {description && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-2">Descripción</p>
                <p className="body-3 text-neutral-5 leading-relaxed">{description}</p>
              </div>
            )}

            {/* Check-in / Check-out */}
            {(checkinTime || checkoutTime) && (
              <div className="bg-secondary-1/40 rounded-xl p-4 mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Horarios</p>
                <div className="grid grid-cols-2 gap-4">
                  {checkinTime && (
                    <div>
                      <p className="body-3 text-neutral-4 mb-0.5">Check-in</p>
                      <p className="body-2-semibold text-neutral-7">Desde {checkinTime}</p>
                    </div>
                  )}
                  {checkoutTime && (
                    <div>
                      <p className="body-3 text-neutral-4 mb-0.5">Check-out</p>
                      <p className="body-2-semibold text-neutral-7">Hasta {checkoutTime}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instalaciones */}
            {facilities.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Instalaciones</p>
                <div className="flex flex-wrap gap-2">
                  {facilities.slice(0, 12).map((f, i) => {
                    const name = typeof f === 'string' ? f : (f.name || f.label || '');
                    return (
                      <span key={i} className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 bg-neutral-1 text-neutral-6 rounded-full">
                        <span className="text-secondary-3">{getFacilityIcon(name)}</span>
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Políticas */}
            {policies && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Políticas</p>
                <div className="bg-auxiliary-green-1 border border-auxiliary-green-3 rounded-xl p-4">
                  {(() => {
                    const policyData = policies?.data ?? policies;
                    const items = Array.isArray(policyData)
                      ? policyData
                      : (policyData?.cancellation ?? policyData?.policies ?? []);
                    if (items.length === 0) return <p className="body-3 text-neutral-5">Consulta las políticas en el sitio web del hotel.</p>;
                    return items.slice(0, 3).map((p, i) => (
                      <p key={i} className="body-3 text-neutral-6 mb-1 last:mb-0">
                        ✓ {typeof p === 'string' ? p : (p.description || p.title || JSON.stringify(p))}
                      </p>
                    ));
                  })()}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer fijo con acciones */}
        <div className="px-5 py-4 border-t border-neutral-1 flex gap-3 shrink-0 bg-white">
          {duplicate ? (
            <div className="flex-1 h-11 rounded-lg bg-feedback-warning border border-feedback-warning-strong text-feedback-warning-strong flex items-center justify-center gap-2 body-2-semibold">
              ⚠️ Ya tienes este hotel reservado
            </div>
          ) : booked ? (
            <div className="flex-1 h-11 rounded-lg bg-auxiliary-green-2 text-auxiliary-green-5 flex items-center justify-center gap-2 body-2-semibold">
              ✓ Reserva guardada
            </div>
          ) : (
            <button
              onClick={handleBooked}
              disabled={booking || !tripId}
              className={`flex-1 h-11 rounded-lg body-2-semibold text-white flex items-center justify-center gap-2 transition ${
                booking || !tripId ? 'bg-neutral-2 cursor-not-allowed' : 'bg-auxiliary-green-4 hover:bg-auxiliary-green-5'
              }`}
            >
              {booking ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Comprobando…</>
              ) : '✓ He reservado'}
            </button>
          )}
          <a
            href={`https://www.booking.com/searchresults.es.html?dest_id=${hotel.id}&dest_type=hotel&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=${rooms}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-lg border border-secondary-3 text-secondary-3 flex items-center gap-2 body-2-semibold hover:bg-secondary-1 transition"
          >
            <ExternalLink className="w-4 h-4" /> Booking.com
          </a>
        </div>

      </div>
    </div>
  );
}
