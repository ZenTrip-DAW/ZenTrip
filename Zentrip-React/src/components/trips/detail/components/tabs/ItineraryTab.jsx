import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import BookingBar from '../itinerary/BookingBar';
import TripSummaryCard from '../itinerary/TripSummaryCard';
import ParticipantsCard from '../itinerary/ParticipantsCard';
import DayCalendar from '../itinerary/DayCalendar';
import DayActivities from '../itinerary/DayActivities';
import HotelSearch from '../bookings/hotels/HotelSearch';
import CarSearch from '../bookings/cars/CarSearch';
import RestaurantSearch from '../bookings/restaurants/RestaurantSearch';
import FlightsExplorer from '../../../../flights/FlightsExplorer';
import BookingBanner from '../bookings/BookingBanner';
import PlaceholderTab from './PlaceholderTab';

const BOOKING_LABELS = {
  trenes: 'Trenes', actividades: 'Actividades',
  rutas: 'Rutas', restaurantes: 'Restaurantes',
};

export default function ItinerarioTab({
  trip,
  members,
  activities,
  activitiesByDate,
  tripDays,
  tripId,
  onAddActivity,
  onInvite,
  initialActiveBooking = null,
  onBookingOpened,
}) {
  const [selectedDay, setSelectedDay] = useState(tripDays[0] ?? null);
  const [activeBooking, setActiveBooking] = useState(initialActiveBooking);

  const handleBookingSelect = (key) => {
    const opening = activeBooking !== key;
    setActiveBooking((prev) => (prev === key ? null : key));
    if (opening) onBookingOpened?.();
  };

  const renderBookingContent = () => {
    if (activeBooking === 'hoteles') return <HotelSearch trip={trip} members={members} tripId={tripId} />;
    if (activeBooking === 'coches') return <CarSearch trip={trip} members={members} tripId={tripId} />;
    if (activeBooking === 'restaurantes') return <RestaurantSearch trip={trip} tripId={tripId} members={members} />;
    if (activeBooking === 'vuelos') {
      const acceptedCount = members.filter((m) => m.invitationStatus === 'accepted').length;
      return (
        <div className="bg-white rounded-2xl border border-neutral-1 overflow-hidden">
          <BookingBanner
            src="/img/background/bookings/plane.jpg"
            alt="Vuelos"
            title="¿Cómo llegáis?"
            subtitle="Busca vuelos para tu grupo en cualquier destino del mundo"
          />
          <div className="p-4 sm:p-6">
            <FlightsExplorer
              embedded
              tripContext={{
                tripId,
                tripName: trip?.name,
                origin: trip?.origin,
                destination: trip?.destination,
                memberCount: acceptedCount || 1,
                startDate: trip?.startDate,
                endDate: trip?.endDate,
              }}
            />
          </div>
        </div>
      );
    }
    return <PlaceholderTab label={BOOKING_LABELS[activeBooking] ?? 'Próximamente'} emoji="🚧" />;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de reservas */}
      <div className="bg-white rounded-2xl border border-neutral-1 px-4 py-3">
        <BookingBar activeKey={activeBooking} onBook={handleBookingSelect} />
      </div>

      {activeBooking ? (
        <>
          <button
            type="button"
            onClick={() => setActiveBooking(null)}
            className="flex items-center gap-1.5 body-3 text-neutral-4 hover:text-neutral-6 w-fit transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver al itinerario
          </button>
          {renderBookingContent()}
        </>
      ) : (
        <>
          {/* Contenido principal: sidebar + calendario/actividades */}
          <div className="flex gap-4 items-start">
            {/* Sidebar izquierdo */}
            <div className="hidden lg:flex flex-col gap-4 w-56 shrink-0">
              <TripSummaryCard
                trip={trip}
                activityCount={activities.length}
                budget={Number(trip?.budget) || 0}
              />
              <ParticipantsCard members={members} onInvite={onInvite} />
            </div>

            {/* Área derecha: calendario + actividades del día */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              {tripDays.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-1 p-8 text-center">
                  <p className="body text-neutral-4">Este viaje no tiene fechas definidas</p>
                </div>
              ) : (
                <>
                  <DayCalendar
                    tripDays={tripDays}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                    activitiesByDate={activitiesByDate}
                  />
                  <DayActivities
                    selectedDay={selectedDay}
                    activitiesByDate={activitiesByDate}
                    onAddActivity={onAddActivity}
                  />
                </>
              )}
            </div>
          </div>

          {/* Sidebar en móvil — debajo del contenido */}
          <div className="flex flex-col gap-4 lg:hidden">
            <TripSummaryCard
              trip={trip}
              activityCount={activities.length}
              budget={Number(trip?.budget) || 0}
            />
            <ParticipantsCard members={members} onInvite={onInvite} />
          </div>
        </>
      )}
    </div>
  );
}
