import { useEffect, useState } from 'react';
import { X, MapPin, ChevronLeft, ChevronRight, Wifi, Car, Coffee, Dumbbell, Waves, Utensils, ExternalLink } from 'lucide-react';
import { apiClient } from '../../../../../../services/apiClient';
import { addActivity, addBooking, getBookings, sendBookingNotifications, updateBooking } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';
import { ScoreBadge, StarRow } from './HotelAtoms';
import BookingReceiptUpload from '../BookingReceiptUpload';

// ─── HotelDetailModal ─────────────────────────────────────────────────────────

export default function HotelDetailModal({ hotel, searchParams, tripId, trip, onClose }) {
  const { checkIn, checkOut, adults, rooms, currency } = searchParams;
  const { user, profile } = useAuth();

  const [details, setDetails]   = useState(null);
  const [photos, setPhotos]     = useState(hotel.photo ? [hotel.photo] : []);
  const [policies, setPolicies] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [booking, setBooking]   = useState(false);
  const [booked, setBooked]     = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [duplicate, setDuplicate] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const POLICY_LABELS = {
    POLICY_CHILDREN: 'Niños',
    POLICY_HOTEL_GROUPS: 'Grupos',
    POLICY_HOTEL_INTERNET: 'Internet',
    POLICY_HOTEL_PARKING: 'Aparcamiento',
    POLICY_HOTEL_PETS: 'Mascotas',
  };

  useEffect(() => {
    if (!hotel.id) return;
    let cancelled = false;

    const fetchAll = async () => {
      setLoadingDetails(true);
      try {
        const [detailsRes, photosRes, policiesRes, roomsRes] = await Promise.allSettled([
          apiClient.get(`/hotels/details?hotelId=${hotel.id}&arrivalDate=${checkIn}&departureDate=${checkOut}&adults=${adults}&roomQty=${rooms}&currencyCode=${currency}`),
          apiClient.get(`/hotels/photos?hotelId=${hotel.id}`),
          apiClient.get(`/hotels/policies?hotelId=${hotel.id}&languageCode=es`),
          apiClient.get(`/hotels/rooms?hotelId=${hotel.id}&arrivalDate=${checkIn}&departureDate=${checkOut}&adults=${adults}&roomQty=${rooms}&currencyCode=${currency}&languageCode=es`),
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
          if (policiesRes.status === 'fulfilled') {
            const raw = policiesRes.value?.data?.policy ?? [];
            const parsed = raw
              .map((p) => ({ type: p.type, text: p.content?.[0]?.text }))
              .filter((p) => p.text);
            setPolicies(parsed);
          }
          if (roomsRes.status === 'fulfilled') {
            const blocks = roomsRes.value?.data?.block ?? [];
            const seen = new Set();
            const parsed = blocks
              .map((b) => ({
                name: b.room_name,
                pricePerNight: b.product_price_breakdown?.gross_amount_per_night?.amount_rounded,
                currency: b.product_price_breakdown?.gross_amount_per_night?.currency ?? currency,
                size: b.room_surface_in_m2,
                maxOccupancy: b.max_occupancy,
                breakfastIncluded: b.breakfast_included === 1,
                halfBoard: b.half_board === 1,
                refundable: b.refundable === 1,
              }))
              .filter((r) => {
                const key = `${r.name}|${r.pricePerNight}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            setRoomList(parsed);
          }
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
        createdBy: {
          uid: user.uid,
          name: profile?.displayName || profile?.firstName || user.email,
          photoURL: profile?.photoURL || null,
        },
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
      const newBookingId = await addBooking(tripId, { ...bookingData, activityId });
      await sendBookingNotifications(tripId, {
        bookerUid: user.uid,
        bookerName: profile?.displayName || profile?.firstName || 'Un miembro',
        hotelName: hotel.name,
        tripName: trip?.name || '',
      });
      setBookingId(newBookingId);
      setBooked(true);
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Habitaciones */}
            {roomList.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Habitaciones disponibles</p>
                <div className="flex flex-col gap-2">
                  {roomList.map((r, i) => (
                    <div key={i} className="border border-neutral-1 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="body-3 font-semibold text-neutral-7 truncate">{r.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {r.size > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-1 text-neutral-5">{r.size} m²</span>
                          )}
                          {r.maxOccupancy > 0 && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-1 text-neutral-5">Máx. {r.maxOccupancy} pers.</span>
                          )}
                          {r.breakfastIncluded && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-auxiliary-green-1 text-auxiliary-green-5">Desayuno incl.</span>
                          )}
                          {r.halfBoard && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-auxiliary-green-1 text-auxiliary-green-5">Media pensión</span>
                          )}
                          {r.refundable && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary-1 text-secondary-4">Cancelación gratis</span>
                          )}
                        </div>
                      </div>
                      {r.pricePerNight && (
                        <div className="text-right shrink-0">
                          <p className="body-2-semibold text-neutral-7">{r.pricePerNight}</p>
                          <p className="body-3 text-neutral-4">/noche</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Políticas */}
            {policies.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Políticas</p>
                <div className="bg-auxiliary-green-1 border border-auxiliary-green-3 rounded-xl p-4 flex flex-col gap-2">
                  {policies.map((p, i) => (
                    <div key={i}>
                      {POLICY_LABELS[p.type] && (
                        <p className="body-3 font-bold text-neutral-5 mb-0.5">{POLICY_LABELS[p.type]}</p>
                      )}
                      <p className="body-3 text-neutral-6">{p.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer fijo con acciones */}
        <div className="px-5 py-4 border-t border-neutral-1 flex flex-col gap-3 shrink-0 bg-white">
          {duplicate ? (
            <div className="h-11 rounded-lg bg-feedback-warning border border-feedback-warning-strong text-feedback-warning-strong flex items-center justify-center gap-2 body-2-semibold">
              ⚠️ Ya tienes este hotel reservado
            </div>
          ) : booked ? (
            <>
              <div className="h-11 rounded-lg bg-auxiliary-green-2 text-auxiliary-green-5 flex items-center justify-center gap-2 body-2-semibold">
                ✓ Reserva guardada
              </div>
              <BookingReceiptUpload
                onUpdate={async (urls) => {
                  if (bookingId) {
                    await updateBooking(tripId, bookingId, { receiptUrls: urls });
                  }
                }}
              />
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="h-10 rounded-lg border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition"
              >
                Continuar
              </button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
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
              <a
                href={`https://www.booking.com/searchresults.es.html?dest_id=${hotel.id}&dest_type=hotel&checkin=${checkIn}&checkout=${checkOut}&group_adults=${adults}&no_rooms=${rooms}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-4 rounded-lg border border-secondary-3 text-secondary-3 flex items-center justify-center gap-2 body-2-semibold hover:bg-secondary-1 transition"
              >
                <ExternalLink className="w-4 h-4" /> Booking.com
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
