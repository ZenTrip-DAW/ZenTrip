import { Share2, Settings, Users, Sun } from 'lucide-react';

const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatHeaderDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'Fechas sin definir';
  const parse = (d) => { const [y, m, day] = d.split('-'); return { y: +y, m: +m, d: +day }; };
  if (startDate && endDate) {
    const s = parse(startDate);
    const e = parse(endDate);
    if (s.y === e.y && s.m === e.m)
      return `${s.d}-${e.d} ${MONTHS_SHORT[s.m - 1]} ${s.y}`;
    return `${s.d} ${MONTHS_SHORT[s.m - 1]} - ${e.d} ${MONTHS_SHORT[e.m - 1]} ${e.y}`;
  }
  const MONTHS_LONG = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  if (startDate) { const s = parse(startDate); return `${s.d} ${MONTHS_LONG[s.m - 1]} ${s.y}`; }
  const e = parse(endDate); return `Hasta ${e.d} ${MONTHS_LONG[e.m - 1]} ${e.y}`;
}

function countTripDays(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const s = new Date(startDate + 'T00:00:00');
  const e = new Date(endDate + 'T00:00:00');
  return Math.round((e - s) / 86400000) + 1;
}

export default function TripDetailHeader({ trip, members }) {
  const acceptedMembers = members.filter((m) => m.invitationStatus === 'accepted');
  const memberCount = acceptedMembers.length;
  const dateLabel = formatHeaderDateRange(trip.startDate, trip.endDate);
  const days = countTripDays(trip.startDate, trip.endDate);

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 px-4 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-3 flex-wrap">
      {/* Info del viaje */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h1 className="title-h2-mobile md:title-h2-desktop text-secondary-5 truncate">
          {trip.name || 'Viaje sin nombre'}
        </h1>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 body-3 text-neutral-4">
          <span>{dateLabel}</span>
          {days && <><span>·</span><span>{days} días</span></>}
          {memberCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {memberCount} {memberCount === 1 ? 'participante' : 'participantes'}
              </span>
            </>
          )}
          {trip.currency && <><span>·</span><span>{trip.currency}</span></>}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Weather chip — vacío hasta integración de API */}
        <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 body-3 text-amber-700">
          <Sun className="w-4 h-4" />
          <span>— · {trip.destination || '—'}</span>
        </div>

        {/* En móvil: solo icono. En sm+: icono + texto */}
        <button
          type="button"
          className="flex items-center gap-1.5 border border-neutral-2 rounded-full p-2 sm:px-4 sm:py-1.5 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors"
          aria-label="Compartir"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Compartir</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 border border-neutral-2 rounded-full p-2 sm:px-4 sm:py-1.5 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors"
          aria-label="Acciones"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Acciones</span>
        </button>
      </div>
    </div>
  );
}
