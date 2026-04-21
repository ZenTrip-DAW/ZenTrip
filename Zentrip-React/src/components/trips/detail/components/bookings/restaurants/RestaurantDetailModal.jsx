import { useEffect, useState } from 'react';
import { X, ExternalLink, Phone, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRestaurantDetails } from '../../../../../../services/restaurantService';
import { addActivity, addBooking, getBookings } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';

const PRICE_LABELS = { 1: '€ Económico', 2: '€€ Moderado', 3: '€€€ Caro', 4: '€€€€ Muy caro' };

export default function RestaurantDetailModal({ restaurant, tripId, onClose }) {
  const { user, profile } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  useEffect(() => {
    if (!restaurant.placeId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getRestaurantDetails({ placeId: restaurant.placeId })
      .then((data) => { if (!cancelled) setDetails(data?.data ?? null); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [restaurant.placeId]);

  const info = details ?? restaurant;
  const photos = details?.photos?.length ? details.photos : (restaurant.photo ? [restaurant.photo] : []);

  const mapsUrl = info.location
    ? `https://www.google.com/maps/search/?api=1&query=${info.location.lat},${info.location.lng}&query_place_id=${restaurant.placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.name)}`;

  const handleBooked = async () => {
    if (!tripId || !user) return;
    setBooking(true);
    try {
      const existing = await getBookings(tripId);
      const isDuplicate = existing.some((b) => b.type === 'restaurant' && b.placeId === restaurant.placeId);
      if (isDuplicate) { setDuplicate(true); return; }

      const activityId = await addActivity(tripId, {
        date: '',
        startTime: '',
        endTime: '',
        name: info.name,
        type: 'restaurant',
        notes: info.rating != null ? `Anotado · ${info.rating}★` : 'Anotado',
        status: 'reservado',
      });

      await addBooking(tripId, {
        type: 'restaurant',
        placeId: restaurant.placeId,
        restaurantName: info.name,
        address: info.address ?? null,
        phone: info.phone ?? null,
        website: info.website ?? null,
        rating: info.rating ?? null,
        priceLevel: info.priceLevel ?? null,
        mapsUrl,
        status: 'reservado',
        activityId,
        createdBy: {
          uid: user.uid,
          name: profile?.displayName || profile?.firstName || user.email,
          photoURL: profile?.photoURL || null,
        },
      });

      setBooked(true);
    } catch (err) {
      console.error('[RestaurantDetailModal] Error al guardar:', err);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-1 shrink-0">
          <div className="min-w-0">
            <p className="body-2-semibold text-neutral-7 truncate">{info.name}</p>
            {info.rating != null && (
              <p className="body-3 text-neutral-4">★ {info.rating.toFixed(1)}{info.userRatingsTotal ? ` · ${info.userRatingsTotal.toLocaleString()} valoraciones` : ''}</p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center text-neutral-5 hover:bg-neutral-1 transition shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1">

          {/* Galería */}
          {photos.length > 0 && (
            <div className="relative h-52 bg-neutral-1">
              <img src={photos[photoIndex]} alt={info.name} className="w-full h-full object-cover" />
              {photos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition">
                    <ChevronLeft className="w-4 h-4 text-neutral-6" />
                  </button>
                  <button onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition">
                    <ChevronRight className="w-4 h-4 text-neutral-6" />
                  </button>
                  <span className="absolute bottom-2 right-3 text-[11px] bg-neutral-7/60 text-white px-2 py-0.5 rounded-full">{photoIndex + 1} / {photos.length}</span>
                </>
              )}
            </div>
          )}

          <div className="p-5">

            {loading && (
              <div className="flex items-center gap-2 body-3 text-neutral-4 mb-4">
                <span className="w-4 h-4 border-2 border-neutral-2 border-t-secondary-3 rounded-full animate-spin" />
                Cargando detalles…
              </div>
            )}

            {/* Info básica */}
            <div className="flex flex-col gap-2 mb-5">
              {info.address && <p className="body-3 text-neutral-5">📍 {info.address}</p>}
              {info.priceLevel != null && <p className="body-3 text-neutral-5">💰 {PRICE_LABELS[info.priceLevel] ?? ''}</p>}
              {info.phone && (
                <a href={`tel:${info.phone}`} className="flex items-center gap-1.5 body-3 text-secondary-3 hover:underline">
                  <Phone className="w-3.5 h-3.5" /> {info.phone}
                </a>
              )}
              {info.website && (
                <a href={info.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 body-3 text-secondary-3 hover:underline">
                  <Globe className="w-3.5 h-3.5" /> Sitio web
                </a>
              )}
            </div>

            {/* Horarios */}
            {details?.openingHours?.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Horarios</p>
                <div className="bg-secondary-1/40 rounded-xl p-4 flex flex-col gap-1">
                  {details.openingHours.map((line, i) => (
                    <p key={i} className="body-3 text-neutral-6">{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Reseñas */}
            {details?.reviews?.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Reseñas</p>
                <div className="flex flex-col gap-3">
                  {details.reviews.map((rev, i) => (
                    <div key={i} className="border border-neutral-1 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="body-3 font-semibold text-neutral-7">{rev.author}</p>
                        <span className="text-[11px] font-bold text-auxiliary-yellow-5">★ {rev.rating}</span>
                      </div>
                      <p className="text-[11px] text-neutral-4 mb-1">{rev.time}</p>
                      <p className="body-3 text-neutral-5 line-clamp-3">{rev.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-1 shrink-0 bg-white">
          {duplicate ? (
            <div className="h-11 rounded-lg bg-feedback-warning border border-feedback-warning-strong text-feedback-warning-strong flex items-center justify-center gap-2 body-2-semibold">
              ⚠️ Ya tienes este restaurante anotado
            </div>
          ) : booked ? (
            <>
              <div className="h-11 rounded-lg bg-auxiliary-green-2 text-auxiliary-green-5 flex items-center justify-center gap-2 body-2-semibold mb-3">
                ✓ Restaurante guardado en el viaje
              </div>
              <button type="button" onClick={() => window.location.reload()} className="w-full h-10 rounded-lg border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition">
                Continuar
              </button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              {tripId && (
                <button
                  onClick={handleBooked}
                  disabled={booking}
                  className={`flex-1 h-11 rounded-lg body-2-semibold text-white flex items-center justify-center gap-2 transition ${booking ? 'bg-neutral-2 cursor-not-allowed' : 'bg-auxiliary-green-4 hover:bg-auxiliary-green-5'}`}
                >
                  {booking ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando…</>
                  ) : '✓ Añadir al viaje'}
                </button>
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-4 rounded-lg border border-secondary-3 text-secondary-3 flex items-center justify-center gap-2 body-2-semibold hover:bg-secondary-1 transition"
              >
                <ExternalLink className="w-4 h-4" /> Google Maps
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
