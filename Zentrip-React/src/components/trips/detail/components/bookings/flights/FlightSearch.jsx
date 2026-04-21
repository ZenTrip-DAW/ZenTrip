import { useState, useEffect } from 'react';
import { Plane } from 'lucide-react';
import { getBookings } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';
import FlightBookingCard from './FlightBookingCard';
import BookingBanner from '../BookingBanner';
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
        <p className="body-2 text-neutral-4">Debes iniciar sesión para ver las reservas.</p>
      </div>
    );
  }

  return (
    <>
      <BookingBanner
        src="/img/background/bookings/plane.jpg"
        alt="Vuelos"
        title="Vuelos"
        subtitle="Gestiona los vuelos reservados para el viaje"
      />
      <div className="p-4 sm:p-6">
      {/* Vuelos próximos */}
      {upcoming.length > 0 ? (
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
      ) : (
        <div className="text-center py-10 mb-7">
          <span className="text-4xl block mb-3">✈️</span>
          <p className="body-2-semibold text-neutral-6 mb-1">Sin vuelos reservados</p>
          <p className="body-3 text-neutral-4">Usa el itinerario para buscar y guardar vuelos</p>
        </div>
      )}

      {/* CTA buscar */}
      <button
        onClick={() => onGoBook?.('vuelos')}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-primary-2 hover:border-primary-3 hover:bg-primary-1 transition group"
      >
        <div className="w-9 h-9 rounded-full bg-primary-1 group-hover:bg-primary-2 flex items-center justify-center transition shrink-0">
          <Plane className="w-4 h-4 text-primary-4" />
        </div>
        <div className="text-left">
          <p className="body-3 font-bold text-primary-4">Buscar vuelos</p>
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
      </div>
    </>
  );
}
