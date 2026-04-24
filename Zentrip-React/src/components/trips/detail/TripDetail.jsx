import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTripDetail } from './hooks/useTripDetail';
import { useWeather } from './hooks/useWeather';
import { addActivity, deleteActivity, removeMemberFromTrip } from '../../../services/tripService';
import ConfirmModal from '../../ui/ConfirmModal';
import AddActivityModal from './components/itinerary/AddActivityModal';
import TripDetailHeader from './components/TripDetailHeader';
import TripDetailTabs from './components/TripDetailTabs';
import ItineraryTab from './components/tabs/ItineraryTab';
import BookingsTab from './components/tabs/BookingsTab';
import InvitationsTab from './components/tabs/InvitationsTab';
import GalleryTab from './components/tabs/GalleryTab';
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

const TAB_PLACEHOLDERS = {
  votaciones:  <PlaceholderTab label="Votaciones"  emoji="🗳️" />,
  presupuesto: <PlaceholderTab label="Presupuesto" emoji="💰" />,
  equipaje:    <PlaceholderTab label="Equipaje"    emoji="🧳" />,
  chat:        <PlaceholderTab label="Chat"        emoji="💬" />,
};

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab ?? 'itinerario');
  const [initialBooking, setInitialBooking]     = useState(null);
  const [initialRouteData, setInitialRouteData] = useState(null);
  const [showLeaveModal, setShowLeaveModal]     = useState(false);

  const handleGoBook = (bookingKey) => {
    setInitialBooking(bookingKey);
    setActiveTab('itinerario');
  };

  const handleOpenRoute = (routeData) => {
    setInitialRouteData(routeData);
    setInitialBooking('rutas');
    setActiveTab('itinerario');
  };

  const {
    trip,
    members,
    activities,
    activitiesByDate,
    tripDays,
    loading,
    error,
    accessDenied,
    setActivities,
    setMembers,
  } = useTripDetail(tripId);

  const { weatherByDate, locationByDate, currentWeather } = useWeather(trip?.destination, trip?.stops);

  const [addActivityModal, setAddActivityModal] = useState({ open: false, date: null });

  const handleAddActivity = (date) => {
    setAddActivityModal({ open: true, date });
  };

  const handleSaveActivity = async (activityData) => {
    try {
      const id = await addActivity(tripId, activityData);
      setActivities((prev) => [...prev, { id, ...activityData }]);
      setAddActivityModal({ open: false, date: null });
    } catch (err) {
      console.error('[TripDetail] Error al añadir actividad:', err);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      await deleteActivity(tripId, activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
    } catch (err) {
      console.error('[TripDetail] Error al eliminar actividad:', err);
    }
  };

  if (loading) return <LoadingState />;
  if (accessDenied) return <ErrorState message="Ya no tienes acceso a este viaje." onBack={() => navigate('/trips')} />;
  if (error || !trip) return <ErrorState message={error || 'Viaje no encontrado.'} onBack={() => navigate('/trips')} />;

  const isCreator = user?.uid === trip?.uid;

  const handleLeaveTrip = async () => {
    try {
      await removeMemberFromTrip(tripId, user.uid);
      navigate('/trips');
    } catch (err) {
      console.error('[TripDetail] Error al salir del viaje:', err);
    }
  };

  const renderTab = () => {
    if (activeTab === 'itinerario') {
      return (
        <ItineraryTab
          trip={trip}
          members={members}
          activities={activities}
          activitiesByDate={activitiesByDate}
          tripDays={tripDays}
          tripId={tripId}
          onAddActivity={handleAddActivity}
          onDeleteActivity={handleDeleteActivity}
          onInvite={isCreator ? () => setActiveTab('invitaciones') : null}
          initialActiveBooking={initialBooking}
          initialRouteData={initialRouteData}
          onBookingOpened={() => { setInitialBooking(null); setInitialRouteData(null); }}
          weatherByDate={weatherByDate}
          locationByDate={locationByDate}
        />
      );
    }
    if (activeTab === 'invitaciones') {
      return (
        <InvitationsTab
          tripId={tripId}
          tripName={trip.name}
          members={members}
          isCreator={isCreator}
          onLeaveTrip={isCreator ? null : () => setShowLeaveModal(true)}
          onMemberRemoved={(uid) => setMembers((prev) => prev.filter((m) => m.uid !== uid))}
        />
      );
    }
    if (activeTab === 'reservas') {
      return (
        <BookingsTab
          trip={trip}
          members={members}
          tripId={tripId}
          onGoBook={handleGoBook}
          onOpenRoute={handleOpenRoute}
        />
      );
    }
    if (activeTab === 'galeria') {
      return <GalleryTab tripId={tripId} />;
    }
    return TAB_PLACEHOLDERS[activeTab] ?? null;
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-4">
      {addActivityModal.open && (
        <AddActivityModal
          date={addActivityModal.date}
          creator={profile ? { uid: user.uid, name: profile.displayName || profile.username || user.email } : null}
          existingActivities={addActivityModal.date ? (activitiesByDate[addActivityModal.date] || []) : []}
          onClose={() => setAddActivityModal({ open: false, date: null })}
          onSave={handleSaveActivity}
        />
      )}
      {showLeaveModal && (
        <ConfirmModal
          title="Salir del viaje"
          message="¿Seguro que quieres salir de este viaje? No podrás volver a acceder a menos que te inviten de nuevo."
          confirmLabel="Salir"
          cancelLabel="Cancelar"
          confirmVariant="danger"
          onConfirm={handleLeaveTrip}
          onCancel={() => setShowLeaveModal(false)}
        />
      )}
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
      <TripDetailHeader trip={trip} members={members} currentWeather={currentWeather} />

      {/* Pestañas */}
      <TripDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenido de la pestaña activa */}
      {renderTab()}
    </div>
  );
}
