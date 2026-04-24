import { Plus, MapPin, CalendarDays, Droplets, Wind, CloudSun, Users } from 'lucide-react';

const MONTHS_LONG = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DAY_NAMES_LONG = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function parseDate(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDayHeader(isoStr) {
  const d = parseDate(isoStr);
  return `${DAY_NAMES_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
}

const TYPE_CONFIG = {
  actividad:   { label: 'Actividad',    dotClass: 'bg-primary-3' },
  restaurante: { label: 'Restaurante',  dotClass: 'bg-auxiliary-green-5' },
  hotel:       { label: 'Hotel',        dotClass: 'bg-secondary-3' },
  vuelo:       { label: 'Vuelo',        dotClass: 'bg-secondary-5' },
  tren:        { label: 'Tren',         dotClass: 'bg-neutral-5' },
  coche:       { label: 'Coche',        dotClass: 'bg-neutral-4' },
  ruta:        { label: 'Ruta',         dotClass: 'bg-amber-500' },
};

const STATUS_CONFIG = {
  reservado: { label: '✓ Reservado', className: 'bg-auxiliary-green-2 text-auxiliary-green-5' },
  pendiente: { label: 'Pendiente',   className: 'bg-neutral-1 text-neutral-4' },
  cancelado: { label: 'Cancelado',   className: 'bg-feedback-error-bg text-feedback-error' },
};

function ActivityCard({ activity }) {
  const typeCfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.actividad;
  const statusCfg = activity.status ? STATUS_CONFIG[activity.status] : null;

  return (
    <div className="flex gap-3">
      {/* Tiempo */}
      <div className="flex flex-col items-end shrink-0 w-12 pt-1">
        <span className="body-3 text-neutral-5 font-semibold">{activity.startTime || '—'}</span>
        {activity.endTime && (
          <span className="body-3 text-neutral-3 mt-auto">{activity.endTime}</span>
        )}
      </div>

      {/* Línea y punto */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${typeCfg.dotClass}`} />
        <div className="w-px flex-1 bg-neutral-1 mt-1" />
      </div>

      {/* Tarjeta */}
      <div className={`flex-1 rounded-2xl border p-4 mb-3 ${activity.status === 'reservado' ? 'bg-auxiliary-green-1 border-auxiliary-green-3' : 'bg-white border-neutral-1'}`}>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h4 className="body-bold text-secondary-5">{activity.name}</h4>
          <div className="flex flex-wrap gap-1.5">
            <span className="body-3 px-2 py-0.5 rounded-full font-semibold bg-primary-1 text-primary-3">
              {typeCfg.label}
            </span>
            {statusCfg && (
              <span className={`body-3 px-2 py-0.5 rounded-full font-semibold ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            )}
          </div>
        </div>
        {activity.notes && (
          <p className="body-3 text-neutral-4 mt-1">{activity.notes}</p>
        )}
        {activity.type === 'vuelo' && activity.passengers && (
          <div className="flex items-center gap-1 mt-1.5 body-3 text-neutral-4">
            <Users className="w-3 h-3 shrink-0" />
            <span>
              {activity.passengers === 'all'
                ? 'Todos'
                : Array.isArray(activity.passengers)
                  ? `${activity.passengers.length} pasajero${activity.passengers.length !== 1 ? 's' : ''}`
                  : activity.passengers}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyDay() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <CalendarDays className="w-10 h-10 text-neutral-2" />
      <p className="body text-neutral-4">Sin actividades para este día</p>
      <p className="body-3 text-neutral-3">Añade tu primera actividad pulsando el botón</p>
    </div>
  );
}

function WeatherPanel({ weatherData }) {
  if (!weatherData) {
    return (
      <div className="hidden sm:flex items-center gap-2 border border-neutral-1 rounded-xl px-3 py-2">
        <CloudSun className="w-6 h-6 text-neutral-2" />
        <div className="flex flex-col">
          <span className="body-3 text-neutral-5 font-semibold">—</span>
          <span className="body-3 text-neutral-3 text-xs">Sin datos de clima</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-3 border border-blue-100 bg-blue-50 rounded-xl px-3 py-2">
      <span className="text-3xl leading-none">{weatherData.emoji}</span>
      <div className="flex flex-col min-w-0">
        <span className="body-2 font-bold text-secondary-5 leading-tight">
          {weatherData.temp != null ? `${weatherData.temp}ºC` : '—'}
        </span>
        <span className="body-3 text-neutral-4 leading-tight truncate">
          {weatherData.description || '—'}
        </span>
      </div>
      {(weatherData.humidity != null || weatherData.windSpeed != null) && (
        <div className="pl-3 border-l border-blue-200 flex flex-col gap-1">
          {weatherData.humidity != null && (
            <span className="flex items-center gap-1 body-3 text-neutral-4 whitespace-nowrap">
              <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {weatherData.humidity}%
            </span>
          )}
          {weatherData.windSpeed != null && (
            <span className="flex items-center gap-1 body-3 text-neutral-4 whitespace-nowrap">
              <Wind className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {weatherData.windSpeed} km/h
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function DayActivities({ selectedDay, activitiesByDate, onAddActivity, weatherData, location }) {
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
      {/* Header del día */}
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="title-h3-desktop text-secondary-5">{formatDayHeader(selectedDay)}</h3>
          <div className="flex items-center gap-1 body-3 text-neutral-3 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location || '—'}</span>
          </div>
        </div>

        {/* Weather + button grouped together */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <WeatherPanel weatherData={weatherData} />
          <button
            type="button"
            onClick={() => onAddActivity?.(selectedDay)}
            className="flex items-center gap-1.5 bg-primary-3 hover:bg-orange-400 text-white px-3 sm:px-4 py-2 rounded-full body-3 font-semibold transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Actividad</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      {dayActivities.length === 0 ? (
        <EmptyDay />
      ) : (
        <div className="mt-2">
          {dayActivities.map((act) => (
            <ActivityCard key={act.id} activity={act} />
          ))}
        </div>
      )}
    </div>
  );
}
