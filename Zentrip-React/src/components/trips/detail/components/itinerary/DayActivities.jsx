import { Plus, MapPin, CalendarDays } from 'lucide-react';
import ActivityCard from './ActivityCard';
import WeatherPanel from './WeatherPanel';
import { formatDayHeader } from './dayActivitiesUtils';

function EmptyDay() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <CalendarDays className="w-10 h-10 text-neutral-2" />
      <p className="body text-neutral-4">Sin actividades para este día</p>
      <p className="body-3 text-neutral-3">Añade tu primera actividad pulsando el botón</p>
    </div>
  );
}

export default function DayActivities({ selectedDay, activitiesByDate, onAddActivity, onViewActivity, onEditActivity, onDeleteActivity, onGoToReservas, weatherData, location, members = [], highlightActivityId = null }) {
  const today = new Date().toISOString().split('T')[0];
  const isPast = selectedDay && selectedDay < today;

  if (!selectedDay) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-1 p-6 flex flex-col items-center justify-center py-16 gap-2">
        <CalendarDays className="w-10 h-10 text-neutral-2" />
        <p className="body text-neutral-4">Selecciona un día para ver sus actividades</p>
      </div>
    );
  }

  const dayActivities = (activitiesByDate[selectedDay] || []).slice().sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-4">
      {/* Cabecera del día */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="title-h3-desktop text-secondary-5">{formatDayHeader(selectedDay)}</h3>
          <div className="flex items-center gap-1 body-3 text-neutral-3 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location || '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <WeatherPanel weatherData={weatherData} />
          <button
            type="button"
            onClick={() => !isPast && onAddActivity?.(selectedDay)}
            disabled={isPast}
            title={isPast ? 'No puedes añadir actividades en días pasados' : undefined}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full body-3 font-semibold transition-colors shadow-sm shrink-0 ${
              isPast
                ? 'bg-neutral-2 text-neutral-4 cursor-not-allowed'
                : 'bg-primary-3 hover:bg-orange-400 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Actividad</span>
          </button>
        </div>
      </div>

      {/* Línea de tiempo */}
      {dayActivities.length === 0 ? (
        <EmptyDay />
      ) : (
        <div className="mt-2">
          {dayActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              members={members}
              onDelete={onDeleteActivity}
              onView={onViewActivity}
              onEdit={onEditActivity}
              onGoToReservas={onGoToReservas}
              highlighted={act.id === highlightActivityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
