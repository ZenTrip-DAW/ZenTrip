import { useState, useEffect } from 'react';
import { Plane, Users, X } from 'lucide-react';
import { getBookings, deleteBooking, deleteActivity } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';

const fmt = (amount, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

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
        <h3 className="title-h3-desktop text-neutral-7 mb-2">¿Cancelar reserva?</h3>
        <p className="body-2 text-neutral-5 mb-4">
          Esto eliminará el vuelo de ZenTrip. <span className="font-bold text-neutral-7">Cancela también en la aerolínea</span> si aplica.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-neutral-2 body-3 font-bold text-neutral-5 hover:bg-neutral-1 transition">
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-lg bg-feedback-error text-white body-3 font-bold hover:opacity-90 disabled:opacity-50 transition"
          >
            {deleting ? 'Eliminando…' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FlightBookingCard({ booking, tripId, onCancelled }) {
  const [showCancel, setShowCancel] = useState(false);

  return (
    <>
      <div className="bg-secondary-1 border border-secondary-2 rounded-xl px-4 py-3">
        <div className="flex items-start gap-3 mb-3">
          <Plane className="w-5 h-5 text-secondary-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="body-2-semibold text-neutral-7">{booking.flightLabel || `${booking.origin} → ${booking.destination}`}</p>
            <p className="body-3 text-neutral-4">{booking.carrier}</p>
          </div>
          {booking.totalPrice != null && (
            <p className="body-2-semibold text-secondary-4 shrink-0">{fmt(booking.totalPrice, booking.currency)}</p>
          )}
        </div>

        {booking.passengers && (
          <div className="flex items-center gap-1.5 mb-3 body-3 text-neutral-5">
            <Users className="w-3.5 h-3.5 text-neutral-3" />
            <span>
              {booking.passengers === 'all'
                ? 'Todos los miembros'
                : Array.isArray(booking.passengers)
                  ? `${booking.passengers.length} pasajero${booking.passengers.length !== 1 ? 's' : ''}`
                  : booking.passengers}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          {booking.receiptUrls?.length > 0 && (
            <span className="flex items-center gap-1 body-3 text-auxiliary-green-5 px-2 py-1 bg-auxiliary-green-1 rounded-lg">
              ✓ Comprobante ({booking.receiptUrls.length})
            </span>
          )}
          <button
            onClick={() => setShowCancel(true)}
            className="ml-auto h-8 px-3 rounded-lg border border-feedback-error/40 text-feedback-error body-3 font-semibold hover:bg-red-50 transition flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Cancelar
          </button>
        </div>
      </div>

      {showCancel && (
        <CancelModal
          booking={booking}
          tripId={tripId}
          onConfirm={() => { setShowCancel(false); onCancelled(); }}
          onClose={() => setShowCancel(false)}
        />
      )}
    </>
  );
}

export default function FlightSearch({ tripId, onGoBook }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!tripId || !user) return;
    getBookings(tripId)
      .then((data) => setBookings(data.filter((b) => b.type === 'vuelo')))
      .catch(() => {});
  }, [tripId, user]);

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="body-2 text-neutral-4">Debes iniciar sesión para buscar vuelos.</p>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-secondary-1 rounded-[50%_50%_50%_0] mx-auto mb-3 flex items-center justify-center text-2xl">
          ✈️
        </div>
        <h2 className="title-h3-desktop text-neutral-7 mb-1">Vuelos del viaje</h2>
        <p className="body-2 text-neutral-4">Busca y guarda los vuelos de tu grupo en un solo lugar</p>
      </div>

      {/* Reservas existentes */}
      {bookings.length > 0 && (
        <div className="mb-7">
          <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Vuelos reservados</p>
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <FlightBookingCard
                key={b.id}
                booking={b}
                tripId={tripId}
                onCancelled={() => setBookings((prev) => prev.filter((x) => x.id !== b.id))}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA buscar */}
      <button
        onClick={() => onGoBook?.('vuelos')}
        className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed border-secondary-2 hover:border-secondary-3 hover:bg-secondary-1 transition group"
      >
        <div className="w-10 h-10 rounded-full bg-secondary-1 group-hover:bg-secondary-2 flex items-center justify-center transition shrink-0">
          <Plane className="w-5 h-5 text-secondary-4" />
        </div>
        <div className="text-left">
          <p className="body-semibold text-secondary-4">Buscar vuelos</p>
          <p className="body-3 text-neutral-4">Ir al buscador de vuelos del viaje</p>
        </div>
      </button>

      {/* Info */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { icon: '🔍', title: 'Busca y compara', desc: 'Filtra por precio, escalas y horario' },
          { icon: '✅', title: 'Guarda en el viaje', desc: 'El vuelo queda en el itinerario del grupo' },
          { icon: '👥', title: 'Para cada miembro', desc: 'Indica quién vuela en cada reserva' },
          { icon: '📄', title: 'Comprobante incluido', desc: 'Sube la captura de la reserva' },
        ].map((t) => (
          <div key={t.title} className="bg-neutral-1/60 rounded-xl p-3">
            <p className="text-lg mb-1">{t.icon}</p>
            <p className="body-3 font-semibold text-neutral-6">{t.title}</p>
            <p className="body-3 text-neutral-4">{t.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
