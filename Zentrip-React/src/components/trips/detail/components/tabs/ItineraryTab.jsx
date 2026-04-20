import { useState } from 'react';
import BookingBar from '../itinerary/BookingBar';
import TripSummaryCard from '../itinerary/TripSummaryCard';
import ParticipantsCard from '../itinerary/ParticipantsCard';
import DayCalendar from '../itinerary/DayCalendar';
import DayActivities from '../itinerary/DayActivities';
import HotelSearch from '../bookings/hotels/HotelSearch';
import FlightsExplorer from '../../../../flights/FlightsExplorer';
import PlaceholderTab from './PlaceholderTab';

const BOOKING_LABELS = {
  coches: 'Coches', trenes: 'Trenes', actividades: 'Actividades',
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
}) {
  const [selectedDay, setSelectedDay] = useState(tripDays[0] ?? null);
  const [activeBooking, setActiveBooking] = useState(null);

  const handleBookingSelect = (key) => setActiveBooking((prev) => (prev === key ? null : key));

  const renderBookingContent = () => {
    if (activeBooking === 'hoteles') return <HotelSearch trip={trip} members={members} tripId={tripId} />;
    if (activeBooking === 'vuelos') {
      const acceptedCount = members.filter((m) => m.invitationStatus === 'accepted').length;
      return (
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
        /* Booking seleccionado — reemplaza todo el contenido del itinerario */
        renderBookingContent()
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
