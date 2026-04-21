import { useState, useEffect } from 'react';
import { Plane } from 'lucide-react';
import { getBookings } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';
import FlightBookingCard from './FlightBookingCard';
import { SectionLabel, TipCard } from './FlightAtoms';
import { todayStr, getFirstDep, TIPS } from './flightBookingUtils';

export default function FlightSearch({ members = [], tripId, onGoBook }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!tripId || !user) return;
    getBookings(tripId)
      .then((data) => setBookings(data.filter((b) => b.type === 'vuelo')))
      .catch(() => {});
  }, [tripId, user]);

  const removeBooking = (id) => setBookings((prev) => prev.filter((x) => x.id !== id));

  const upcoming = bookings
    .filter((b) => !getFirstDep(b) || getFirstDep(b) >= todayStr)
    .sort((a, b) => getFirstDep(a).localeCompare(getFirstDep(b)));

  const past = bookings
    .filter((b) => getFirstDep(b) && getFirstDep(b) < todayStr)
    .sort((a, b) => getFirstDep(b).localeCompare(getFirstDep(a)));

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

      {/* Vuelos próximos */}
      {upcoming.length > 0 && (
        <div className="mb-7">
          <SectionLabel>Vuelos reservados</SectionLabel>
          <div className="flex flex-col gap-3">
            {upcoming.map((b) => (
              <FlightBookingCard
                key={b.id}
                booking={b}
                tripId={tripId}
                members={members}
                defaultExpanded={true}
                onCancelled={() => removeBooking(b.id)}
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

      {/* Vuelos pasados */}
      {past.length > 0 && (
        <div className="mt-7">
          <SectionLabel muted>Vuelos pasados</SectionLabel>
          <div className="flex flex-col gap-3 opacity-70">
            {past.map((b) => (
              <FlightBookingCard
                key={b.id}
                booking={b}
                tripId={tripId}
                members={members}
                defaultExpanded={false}
                onCancelled={() => removeBooking(b.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tips (solo si no hay reservas) */}
      {bookings.length === 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-2 gap-3">
            {TIPS.map((t) => <TipCard key={t.title} {...t} />)}
          </div>
        </div>
      )}
    </>
  );
}
