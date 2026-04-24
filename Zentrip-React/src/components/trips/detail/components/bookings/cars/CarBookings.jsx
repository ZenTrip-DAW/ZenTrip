import { useState, useEffect } from 'react';
import { Car } from 'lucide-react';
import { SectionLabel } from '../hotels/HotelAtoms';
import CarBookingCard from './CarBookingCard';
import BookingBanner from '../BookingBanner';
import ImageLoadGate from '../../../../../shared/ImageLoadGate';
import { useAuth } from '../../../../../../context/AuthContext';
import { getBookings } from '../../../../../../services/tripService';

export default function CarBookings({ tripId, onGoBook }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!tripId || !user) return;
    getBookings(tripId)
      .then((data) => setBookings(data.filter((b) => b.type === 'car')))
      .catch(() => {});
  }, [tripId, user]);

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="body-2 text-neutral-4">Debes iniciar sesión para ver las reservas.</p>
      </div>
    );
  }

  return (
    <ImageLoadGate src="/img/background/bookings/car.jpg" alt="Coches">
      <>
        <BookingBanner
          src="/img/background/bookings/car.jpg"
          objectPosition="center 30%"
          alt="Coches"
          title="Coches"
          subtitle="Gestiona los coches alquilados para el viaje"
        />
        <div className="p-4 sm:p-6">
        {bookings.length > 0 ? (
          <div className="mb-7">
            <SectionLabel>Coches reservados</SectionLabel>
            <div className="flex flex-col gap-3">
              {bookings.map((b) => (
                <CarBookingCard
                  key={b.id}
                  booking={b}
                  tripId={tripId}
                  onCancelled={(id) => setBookings((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 mb-7">
            <span className="text-4xl block mb-3">🚗</span>
            <p className="body-2-semibold text-neutral-6 mb-1">Sin coches reservados</p>
            <p className="body-3 text-neutral-4">Usa el itinerario para buscar y reservar coches</p>
          </div>
        )}

        <button
          onClick={() => onGoBook?.('coches')}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-primary-2 hover:border-primary-3 hover:bg-primary-1 transition group"
        >
          <div className="w-9 h-9 rounded-full bg-primary-1 group-hover:bg-primary-2 flex items-center justify-center transition shrink-0">
            <Car className="w-4 h-4 text-primary-4" />
          </div>
          <div className="text-left">
            <p className="body-3 font-bold text-primary-4">Buscar coches</p>
            <p className="body-3 text-neutral-4">Ir al buscador de coches del viaje</p>
          </div>
        </button>
        </div>
      </>
    </ImageLoadGate>
  );
}
