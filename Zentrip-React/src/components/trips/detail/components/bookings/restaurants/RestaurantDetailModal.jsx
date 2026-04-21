import { useEffect, useState } from 'react';
import { X, ExternalLink, Phone, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRestaurantDetails } from '../../../../../../services/restaurantService';
import { addActivity, addBooking, getBookings, updateBooking } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';
import BookingReceiptUpload from '../BookingReceiptUpload';
import PassengerSelector from '../../../../shared/PassengerSelector';

const PRICE_LABELS = { 1: '€ Económico', 2: '€€ Moderado', 3: '€€€ Caro', 4: '€€€€ Muy caro' };

function fmtDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RestaurantDetailModal({ restaurant, tripId, bookingParams = {}, members = [], onClose }) {
  const { user, profile } = useAuth();
  const { date, people } = bookingParams;

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  // 'detail' | 'confirm' | 'booked' | 'duplicate'
  const [step, setStep] = useState('detail');
  const [saving, setSaving] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const [selectedMembers, setSelectedMembers] = useState('all');
  const [receiptUrls, setReceiptUrls] = useState([]);

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

  const acceptedMembers = members.filter((m) => m.invitationStatus === 'accepted');

  const handleSave = async () => {
    if (!tripId || !user) return;
    setSaving(true);
    try {
      const existing = await getBookings(tripId);
      const isDuplicate = existing.some((b) => b.type === 'restaurant' && b.placeId === restaurant.placeId);
      if (isDuplicate) { setStep('duplicate'); return; }

      const activityId = await addActivity(tripId, {
        date: date || '',
        startTime: '',
        endTime: '',
        name: info.name,
        type: 'restaurant',
        notes: [
          info.rating != null ? `${info.rating}★` : null,
          people ? `${people} persona${people !== 1 ? 's' : ''}` : null,
          date ? fmtDate(date) : null,
        ].filter(Boolean).join(' · ') || 'Anotado',
        status: 'reservado',
      });

      const newBookingId = await addBooking(tripId, {
        type: 'restaurant',
        placeId: restaurant.placeId,
        restaurantName: info.name,
        address: info.address ?? null,
        phone: info.phone ?? null,
        website: info.website ?? null,
        rating: info.rating ?? null,
        priceLevel: info.priceLevel ?? null,
        date: date ?? null,
        people: people ?? null,
        mapsUrl,
        status: 'reservado',
        activityId,
        members: selectedMembers,
        receiptUrls: receiptUrls.length ? receiptUrls : [],
        createdBy: {
          uid: user.uid,
          name: profile?.displayName || profile?.firstName || user.email,
          photoURL: profile?.photoURL || null,
        },
      });

      setBookingId(newBookingId);
      setStep('booked');
    } catch (err) {
      console.error('[RestaurantDetailModal] Error al guardar:', err);
    } finally {
      setSaving(false);
    }
  };

  const canSave = receiptUrls.length > 0 &&
    (selectedMembers === 'all' || (Array.isArray(selectedMembers) && selectedMembers.length > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={step !== 'booked' ? onClose : undefined} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-1 shrink-0">
          {step === 'confirm' ? (
            <button
              type="button"
              onClick={() => setStep('detail')}
              className="flex items-center gap-1.5 body-3 text-neutral-4 hover:text-neutral-6 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver
            </button>
          ) : (
            <div className="min-w-0">
              <p className="body-2-semibold text-neutral-7 truncate">{info.name}</p>
              {info.rating != null && (
                <p className="body-3 text-neutral-4">★ {info.rating.toFixed(1)}{info.userRatingsTotal ? ` · ${info.userRatingsTotal.toLocaleString()} valoraciones` : ''}</p>
              )}
            </div>
          )}
          {step !== 'booked' && (
            <button onClick={onClose} className="w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center text-neutral-5 hover:bg-neutral-1 transition shrink-0 ml-3">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1">

          {step === 'confirm' ? (
            <div className="p-5 flex flex-col gap-5">
              {/* Resumen restaurante */}
              <div className="bg-secondary-1/40 rounded-xl p-4 flex items-center gap-3">
                {photos[0] && (
                  <img src={photos[0]} alt={info.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="body-2-semibold text-neutral-7 truncate">{info.name}</p>
                  {info.address && <p className="body-3 text-neutral-4 truncate">📍 {info.address}</p>}
                  {(date || people) && (
                    <p className="body-3 text-neutral-4">
                      {[date && fmtDate(date), people && `${people} pers.`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Selector de miembros */}
              {acceptedMembers.length > 0 && (
                <PassengerSelector
                  members={acceptedMembers}
                  value={selectedMembers}
                  onChange={setSelectedMembers}
                  label="¿Para quién es la reserva?"
                />
              )}

              {/* Captura del pago */}
              <div>
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Captura del pago</p>
                <BookingReceiptUpload
                  optional={false}
                  onUpdate={(urls) => setReceiptUrls(urls)}
                />
              </div>
            </div>
          ) : step === 'booked' ? (
            <div className="p-5 flex flex-col items-center py-10 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-auxiliary-green-1 flex items-center justify-center text-3xl">✓</div>
              <div>
                <p className="body-semibold text-neutral-7">Restaurante guardado en el viaje</p>
                <p className="body-3 text-neutral-4 mt-1">{info.name}</p>
              </div>
              {bookingId && receiptUrls.length === 0 && (
                <div className="w-full mt-2">
                  <BookingReceiptUpload
                    onUpdate={async (urls) => {
                      await updateBooking(tripId, bookingId, { receiptUrls: urls });
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
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

                {/* Datos de reserva */}
                {(date || people) && (
                  <div className="bg-secondary-1/40 rounded-xl p-4 mb-5">
                    <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Tu reserva</p>
                    <div className="grid grid-cols-2 gap-4">
                      {date && (
                        <div>
                          <p className="body-3 text-neutral-4 mb-0.5">Fecha</p>
                          <p className="body-2-semibold text-neutral-7">{fmtDate(date)}</p>
                        </div>
                      )}
                      {people && (
                        <div>
                          <p className="body-3 text-neutral-4 mb-0.5">Personas</p>
                          <p className="body-2-semibold text-neutral-7">{people} persona{people !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-1 shrink-0 bg-white flex flex-col gap-3">
          {step === 'duplicate' ? (
            <div className="h-11 rounded-lg bg-feedback-warning border border-feedback-warning-strong text-feedback-warning-strong flex items-center justify-center gap-2 body-2-semibold">
              ⚠️ Ya tienes este restaurante anotado
            </div>
          ) : step === 'booked' ? (
            <button type="button" onClick={onClose} className="h-11 rounded-lg bg-primary-3 text-white body-2-semibold hover:bg-primary-4 transition">
              Listo
            </button>
          ) : step === 'confirm' ? (
            <button
              onClick={handleSave}
              disabled={saving || !canSave}
              className={`h-11 rounded-lg body-2-semibold text-white flex items-center justify-center gap-2 transition ${saving || !canSave ? 'bg-neutral-2 cursor-not-allowed' : 'bg-auxiliary-green-4 hover:bg-auxiliary-green-5'}`}
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
                : '✓ Guardar en el itinerario'}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              {tripId && (
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 h-11 rounded-lg body-2-semibold text-white bg-auxiliary-green-4 hover:bg-auxiliary-green-5 flex items-center justify-center gap-2 transition"
                >
                  ✓ Añadir al viaje
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
