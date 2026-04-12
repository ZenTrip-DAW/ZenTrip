import { useState } from 'react';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const GRADIENTS = [
  'from-sky-300 to-blue-500',
  'from-orange-300 to-rose-500',
  'from-teal-300 to-emerald-500',
  'from-violet-400 to-indigo-600',
  'from-amber-300 to-orange-500',
  'from-cyan-300 to-teal-500',
];

const STATUS_CONFIG = {
  en_curso:  { label: 'En curso',      className: 'bg-primary-1 text-primary-3' },
  proximo:   { label: 'Próximamente',  className: 'bg-secondary-1 text-secondary-5' },
  pasado:    { label: 'Pasado',        className: 'bg-neutral-1 text-neutral-4' },
  borrador:  { label: 'Borrador',      className: 'bg-neutral-1 text-neutral-4' },
};

function getGradient(str) {
  const hash = [...(str || 'ZenTrip')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return { year: +y, month: +m, day: +d };
}

function formatDateRange(startDate, endDate) {
  const s = formatDate(startDate);
  const e = formatDate(endDate);
  if (s && e) {
    if (s.year === e.year && s.month === e.month)
      return `${s.day}-${e.day} ${MONTHS[s.month - 1]} ${s.year}`;
    return `${s.day} ${MONTHS[s.month - 1]} - ${e.day} ${MONTHS[e.month - 1]} ${e.year}`;
  }
  if (s) return `${s.day} ${MONTHS[s.month - 1]} ${s.year}`;
  if (e) return `Hasta ${e.day} ${MONTHS[e.month - 1]} ${e.year}`;
  return 'Fechas sin definir';
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.37M9 20H4v-2a4 4 0 015-3.37m6-4.63a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default function TripCard({ trip, isDraft, memberCount, onClick, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const name       = trip.name   || trip.nombre    || 'Viaje sin nombre';
  const origin     = trip.origin  || trip.origen    || '';
  const destination= trip.destination || trip.destino || '';
  const startDate  = trip.startDate   || trip.fechaInicio || '';
  const endDate    = trip.endDate     || trip.fechaFin    || '';
  const status     = isDraft ? 'borrador' : (trip.status || 'proximo');

  const gradient   = getGradient(destination || name);
  const statusCfg  = STATUS_CONFIG[status] || STATUS_CONFIG.proximo;
  const dateLabel  = formatDateRange(startDate, endDate);

  return (
    <div
      onClick={!confirming ? onClick : undefined}
      className="bg-white rounded-2xl shadow-sm border border-neutral-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow w-60 shrink-0 flex flex-col relative"
    >
      {/* Imagen / gradiente */}
      <div className={`h-36 bg-linear-to-br ${gradient} relative flex items-start justify-between p-3`}>
        <span className={`body-3 px-2 py-0.5 rounded-full font-semibold ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-neutral-4 hover:text-feedback-error transition-colors"
            aria-label="Eliminar viaje"
          >
            <IconTrash />
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="body-bold text-secondary-5 truncate">{name}</h3>

        {(origin || destination) && (
          <p className="body-3 text-neutral-3 truncate">
            {origin && destination ? `${origin} → ${destination}` : origin || destination}
          </p>
        )}

        <div className="flex items-center gap-1.5 body-3 text-neutral-4">
          <IconCalendar />
          <span className="truncate">{dateLabel}</span>
        </div>

        {memberCount != null && memberCount > 0 && (
          <div className="flex items-center gap-1.5 body-3 text-neutral-4">
            <IconPeople />
            <span>{memberCount} {memberCount === 1 ? 'persona' : 'personas'}</span>
          </div>
        )}

        {isDraft && (
          <p className="body-3 text-primary-3 mt-auto pt-1">Toca para continuar →</p>
        )}
      </div>

      {/* Overlay de confirmación de borrado */}
      {confirming && (
        <div
          className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center gap-4 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <IconTrash />
          <p className="body-bold text-neutral-6 text-center">¿Eliminar este viaje?</p>
          <p className="body-3 text-neutral-3 text-center -mt-2">Esta acción no se puede deshacer.</p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="flex-1 py-2 rounded-xl border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex-1 py-2 rounded-xl bg-primary-3 text-white body-3 font-semibold hover:opacity-90 transition-opacity"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
