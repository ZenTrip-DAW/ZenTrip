import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const TRIP_TABS = [
  { key: 'itinerario',   label: 'Itinerario' },
  { key: 'reservas',     label: 'Reservas' },
  { key: 'invitaciones', label: 'Participantes' },
  { key: 'votaciones',   label: 'Votaciones' },
  { key: 'presupuesto',  label: 'Presupuesto' },
  { key: 'equipaje',     label: 'Equipaje' },
  { key: 'galeria',      label: 'Galería' },
];

// Muestra el header y las tabs del viaje cuando se navega fuera de TripDetail
// (vuelos, hoteles, trenes, actividades, restaurantes…)
// tripContext: { tripId, tripName, origin, destination, … }
// activeTab: tab a resaltar (default 'reservas')
export default function TripContextBanner({ tripContext, activeTab = 'reservas' }) {
  const navigate = useNavigate();

  const goToTrip = (tab) => {
    navigate(`/trips/${tripContext.tripId}`, { state: { activeTab: tab } });
  };

  return (
    <div className="flex flex-col gap-2 mb-2">
      {/* Header del viaje */}
      <div className="bg-white rounded-2xl border border-neutral-1 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => goToTrip(activeTab)}
          className="flex items-center gap-1.5 text-neutral-4 hover:text-neutral-6 transition body-3 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex-1 min-w-0">
          <p className="body-2-semibold text-secondary-5 truncate">{tripContext.tripName || 'Viaje'}</p>
          {(tripContext.origin || tripContext.destination) && (
            <p className="body-3 text-neutral-4 truncate">
              {tripContext.origin && tripContext.destination
                ? `${tripContext.origin} → ${tripContext.destination}`
                : tripContext.destination || tripContext.origin}
            </p>
          )}
        </div>
      </div>

      {/* Tabs del viaje */}
      <div className="bg-white rounded-2xl border border-neutral-1 overflow-x-auto scrollbar-hide px-2">
        <div className="flex items-center">
          {TRIP_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => goToTrip(tab.key)}
              className={`relative flex items-center px-3 sm:px-4 py-4 body-3 font-semibold whitespace-nowrap transition-colors shrink-0
                ${tab.key === activeTab
                  ? 'text-primary-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-3 after:rounded-t-full'
                  : 'text-neutral-4 hover:text-neutral-6'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
