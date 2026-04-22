import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { deleteBooking, deleteActivity } from '../../../../../../services/tripService';

function fmtDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CancelModal({ booking, tripId, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await deleteBooking(tripId, booking.id);
      if (booking.activityId) await deleteActivity(tripId, booking.activityId);
      onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="title-h3-desktop text-neutral-7 mb-2">¿Eliminar actividad?</h3>
        <p className="body-2 text-neutral-5 mb-4">Esto la eliminará de ZenTrip. La reserva en la plataforma original no se cancela automáticamente.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-neutral-2 body-3 font-bold text-neutral-5 hover:bg-neutral-1 transition">
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-lg bg-red-600 text-white body-3 font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            {deleting ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActivityBookingCard({ booking, tripId, onCancelled }) {
  const [showCancel, setShowCancel] = useState(false);

  return (
    <>
      <div className="bg-white border border-neutral-1 rounded-xl px-4 py-3">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl shrink-0">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="body-2-semibold text-neutral-7 truncate">{booking.activityName}</p>
            {booking.address && <p className="body-3 text-neutral-4 truncate">📍 {booking.address}</p>}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {booking.rating != null && (
                <span className="text-[11px] font-bold text-auxiliary-yellow-5">★ {Number(booking.rating).toFixed(1)}</span>
              )}
              {booking.price != null && (
                <span className="text-[11px] font-semibold text-secondary-4">
                  {Number(booking.price).toLocaleString('es-ES', { style: 'currency', currency: booking.currency || 'EUR', maximumFractionDigits: 0 })}
                </span>
              )}
              {booking.duration && (
                <span className="text-[11px] text-neutral-4">⏱ {booking.duration}</span>
              )}
              {booking.date && (
                <span className="text-[11px] text-neutral-4">{fmtDate(booking.date)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {booking.mapsUrl && (
            <a
              href={booking.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-9 min-w-[120px] rounded-lg border border-secondary-3 text-secondary-3 body-3 font-bold flex items-center justify-center gap-1.5 hover:bg-secondary-1 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Google Maps
            </a>
          )}
          {booking.receiptUrls?.length > 0 && (
            <span className="h-9 px-3 rounded-lg bg-auxiliary-green-1 border border-auxiliary-green-2 body-3 font-semibold text-auxiliary-green-5 flex items-center">
              🧾 {booking.receiptUrls.length} comprobante{booking.receiptUrls.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => setShowCancel(true)}
            className="h-9 px-3 rounded-lg border border-red-300 text-red-600 body-3 font-semibold hover:bg-red-50 transition"
          >
            Eliminar
          </button>
        </div>
      </div>

      {showCancel && (
        <CancelModal
          booking={booking}
          tripId={tripId}
          onConfirm={() => { setShowCancel(false); onCancelled(booking.id); }}
          onClose={() => setShowCancel(false)}
        />
      )}
    </>
  );
}
