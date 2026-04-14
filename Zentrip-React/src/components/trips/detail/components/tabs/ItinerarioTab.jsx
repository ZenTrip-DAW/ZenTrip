import { useState } from 'react';
import BookingBar from '../itinerario/BookingBar';
import TripSummaryCard from '../itinerario/TripSummaryCard';
import ParticipantsCard from '../itinerario/ParticipantsCard';
import DayCalendar from '../itinerario/DayCalendar';
import DayActivities from '../itinerario/DayActivities';

export default function ItinerarioTab({
  trip,
  members,
  activities,
  activitiesByDate,
  tripDays,
  onAddActivity,
  onInvite,
}) {
  const [selectedDay, setSelectedDay] = useState(tripDays[0] ?? null);

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de reservas */}
      <div className="bg-white rounded-2xl border border-neutral-1 px-4 py-3">
        <BookingBar />
      </div>

      {/* Contenido principal: sidebar + calendario/actividades */}
      <div className="flex gap-4 items-start">
        {/* Sidebar izquierdo */}
        <div className="flex flex-col gap-4 w-56 shrink-0 hidden lg:flex">
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
    </div>
  );
}
