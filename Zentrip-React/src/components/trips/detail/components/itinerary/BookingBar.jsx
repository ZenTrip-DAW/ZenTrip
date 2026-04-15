import { Hotel, Plane, Car, Train, Compass, Map, Utensils } from 'lucide-react';

const BOOKING_TYPES = [
  { key: 'hoteles',      label: 'Hoteles',      Icon: Hotel },
  { key: 'vuelos',       label: 'Vuelos',       Icon: Plane },
  { key: 'coches',       label: 'Coches',       Icon: Car },
  { key: 'trenes',       label: 'Trenes',       Icon: Train },
  { key: 'actividades',  label: 'Actividades',  Icon: Compass },
  { key: 'rutas',        label: 'Rutas',        Icon: Map },
  { key: 'restaurantes', label: 'Restaurantes', Icon: Utensils },
];

export default function BookingBar({ onBook }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
      <span className="body-3 text-neutral-5 shrink-0 font-bold">Reservar:</span>
      {BOOKING_TYPES.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onBook?.(key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-1 bg-white hover:border-primary-3 hover:bg-primary-1 body-3 text-neutral-5 hover:text-primary-3 transition-colors shrink-0 whitespace-nowrap"
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
