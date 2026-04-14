import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTripDetail } from './hooks/useTripDetail';
import { addActivity } from '../../../services/tripService';
import TripDetailHeader from './components/TripDetailHeader';
import TripDetailTabs from './components/TripDetailTabs';
import ItinerarioTab from './components/tabs/ItinerarioTab';
import PlaceholderTab from './components/tabs/PlaceholderTab';


function LoadingState() {
  return (
    <div className="flex justify-center items-center py-32">
      <div className="w-10 h-10 border-4 border-primary-3 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <span className="text-5xl">😕</span>
      <p className="body text-neutral-5">{message}</p>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 border border-neutral-2 rounded-full px-5 py-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a mis viajes
      </button>
    </div>
  );
}

const TAB_COMPONENTS = {
  reservas:    <PlaceholderTab label="Reservas"    emoji="🏨" />,
  votaciones:  <PlaceholderTab label="Votaciones"  emoji="🗳️" />,
  presupuesto: <PlaceholderTab label="Presupuesto" emoji="💰" />,
  equipaje:    <PlaceholderTab label="Equipaje"    emoji="🧳" />,
  galeria:     <PlaceholderTab label="Galería"     emoji="🖼️" />,
  chat:        <PlaceholderTab label="Chat"        emoji="💬" />,
};

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('itinerario');

  const {
    trip,
    members,
    activities,
    activitiesByDate,
    tripDays,
    loading,
    error,
    setActivities,
  } = useTripDetail(tripId);

  const handleAddActivity = async (date) => {
    // Por ahora añade una actividad de ejemplo. En el futuro se abrirá un modal.
    const newActivity = {
      date,
      startTime: '10:00',
      endTime: '11:00',
      name: 'Nueva actividad',
      type: 'actividad',
      notes: '',
      status: 'pendiente',
    };
    try {
      const id = await addActivity(tripId, newActivity);
      setActivities((prev) => [...prev, { id, ...newActivity }]);
    } catch (err) {
      console.error('[TripDetail] Error al añadir actividad:', err);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !trip) return <ErrorState message={error || 'Viaje no encontrado.'} onBack={() => navigate('/trips')} />;

  const renderTab = () => {
    if (activeTab === 'itinerario') {
      return (
        <ItinerarioTab
          trip={trip}
          members={members}
          activities={activities}
          activitiesByDate={activitiesByDate}
          tripDays={tripDays}
          onAddActivity={handleAddActivity}
          onInvite={() => navigate('/trips/create')}
        />
      );
    }
    return TAB_COMPONENTS[activeTab] ?? null;
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-4">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate('/trips')}
        className="flex items-center gap-1.5 body-3 text-neutral-4 hover:text-neutral-6 w-fit transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Mis viajes
      </button>

      {/* Header del viaje */}
      <TripDetailHeader trip={trip} members={members} />

      {/* Pestañas */}
      <TripDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenido de la pestaña activa */}
      {renderTab()}
    </div>
  );
}
