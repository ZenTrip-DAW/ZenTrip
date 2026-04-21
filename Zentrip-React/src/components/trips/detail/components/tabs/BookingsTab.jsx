import { useState } from 'react';
import { Hotel, Plane, Car, Train, Compass, Map, Utensils } from 'lucide-react';
import HotelBookings from '../bookings/hotels/HotelBookings';
import CarSearch from '../bookings/cars/CarSearch';
import FlightSearch from '../bookings/flights/FlightSearch';
import PlaceholderTab from './PlaceholderTab';

const SUBTABS = [
  { key: 'hoteles',      label: 'Hoteles',       Icon: Hotel,   available: true  },
  { key: 'vuelos',       label: 'Vuelos',        Icon: Plane,   available: true  },
  { key: 'coches',       label: 'Coches',        Icon: Car,     available: true  },
  { key: 'trenes',       label: 'Trenes',        Icon: Train,   available: false },
  { key: 'actividades',  label: 'Actividades',   Icon: Compass, available: false },
  { key: 'rutas',        label: 'Rutas',         Icon: Map,     available: false },
  { key: 'restaurantes', label: 'Restaurantes',  Icon: Utensils,available: false },
];

export default function ReservasTab({ trip, members, tripId, initialSubTab = 'hoteles', onGoBook }) {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);

  const renderContent = () => {
    if (activeSubTab === 'hoteles') {
      return <HotelBookings trip={trip} members={members} tripId={tripId} onGoBook={onGoBook} />;
    }
    if (activeSubTab === 'coches') {
      return <CarSearch trip={trip} members={members} tripId={tripId} />;
    }
    if (activeSubTab === 'vuelos') {
      return <FlightSearch members={members} tripId={tripId} onGoBook={setActiveSubTab} />;
    }
    const tab = SUBTABS.find((t) => t.key === activeSubTab);
    return <PlaceholderTab label={tab?.label ?? 'Próximamente'} emoji="🚧" />;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tabs de tipo de reserva */}
      <div className="bg-white rounded-2xl border border-neutral-1 px-4 py-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1">
          {SUBTABS.map(({ key, label, Icon, available }) => {
            const isActive = activeSubTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSubTab(key)}
                className={`
                  relative flex items-center gap-1.5 px-3 py-3.5 body-3 font-semibold whitespace-nowrap transition-colors shrink-0 rounded
                  ${isActive
                    ? 'text-secondary-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-secondary-3 after:rounded-t-full'
                    : 'text-neutral-4 hover:text-neutral-6'}
                  ${!available && !isActive ? 'opacity-60' : ''}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido del sub-tab activo */}
      <div className="bg-white rounded-2xl border border-neutral-1 p-4 sm:p-6">
        {renderContent()}
      </div>
    </div>
  );
}
