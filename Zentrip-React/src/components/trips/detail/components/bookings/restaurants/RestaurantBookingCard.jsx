import { useState } from 'react';
import { deleteBooking, deleteActivity } from '../../../../../../services/tripService';

const PRICE_LABELS = { 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' };

function fmtDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CancelBookingModal({ booking, tripId, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await deleteBooking(tripId, booking.id);
      if (booking.activityId) await deleteActivity(tripId, booking.activityId);
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
        <h3 className="title-h3-desktop text-neutral-7 mb-2">¿Eliminar restaurante?</h3>
        <p className="body-2 text-neutral-5 mb-4">
          Esto eliminará el restaurante de tu viaje en ZenTrip.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-neutral-2 body-3 font-bold text-neutral-5 hover:bg-neutral-1 transition">
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-lg bg-feedback-error-strong text-white body-3 font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {deleting ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantBookingCard({ booking, tripId, onCancelled }) {
  const [showCancel, setShowCancel] = useState(false);

  return (
    <>
      <div className="bg-auxiliary-green-1 border border-auxiliary-green-3 rounded-xl px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">🍽️</span>
            <div>
              <p className="body-2-semibold text-neutral-7">{booking.restaurantName}</p>
              {booking.address && <p className="body-3 text-neutral-4 line-clamp-1">{booking.address}</p>}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {booking.rating != null && (
                  <span className="text-[11px] font-bold text-auxiliary-yellow-5">★ {booking.rating}</span>
                )}
                {booking.priceLevel != null && (
                  <span className="text-[11px] text-neutral-4">{PRICE_LABELS[booking.priceLevel]}</span>
                )}
                {booking.date && (
                  <span className="text-[11px] text-neutral-4">{fmtDate(booking.date)}</span>
                )}
                {booking.people != null && (
                  <span className="text-[11px] text-neutral-4">{booking.people} pers.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {booking.mapsUrl && (
            <a
              href={booking.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 h-9 rounded-lg border border-auxiliary-green-4 text-auxiliary-green-5 body-3 font-bold flex items-center justify-center gap-1.5 hover:bg-auxiliary-green-2 transition"
            >
              Ver en Google Maps
            </a>
          )}
          <button
            onClick={() => setShowCancel(true)}
            className="h-9 px-3 rounded-lg border border-feedback-error-strong text-feedback-error-strong body-3 font-bold flex items-center justify-center hover:bg-red-50 transition w-full sm:w-auto"
          >
            Eliminar
          </button>
        </div>
      </div>

      {showCancel && (
        <CancelBookingModal
          booking={booking}
          tripId={tripId}
          onConfirm={() => { setShowCancel(false); onCancelled?.(booking.id); }}
          onClose={() => setShowCancel(false)}
        />
      )}
    </>
  );
}
