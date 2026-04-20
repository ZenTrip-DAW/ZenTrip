import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { STORAGE_KEY } from '../create/hooks/useTripDraft';
import Button from '../../ui/Button';
import TripCard from './components/TripCard';
import { useMyTrips } from './hooks/useMyTrips';

function SectionTitle({ children }) {
  return (
    <h2 className="title-h3-desktop text-secondary-5 mb-4">{children}</h2>
  );
}

const INITIAL_COUNT = 5;

function TripRow({ trips, isDraft, onCardClick, onDelete, onEdit, onImageUpload, userId }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = trips.length > INITIAL_COUNT;
  const visible = expanded ? trips : trips.slice(0, INITIAL_COUNT);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visible.map((trip, i) => (
          <TripCard
            key={trip.id || i}
            trip={trip}
            isDraft={isDraft}
            memberCount={isDraft ? (trip.members?.length ?? 0) + 1 : undefined}
            onClick={() => onCardClick(trip)}
            onDelete={onDelete && trip.uid === userId ? () => onDelete(trip.id) : undefined}
            onEdit={onEdit && trip.uid === userId ? () => onEdit(trip) : undefined}
            onImageUpload={onImageUpload && trip.uid === userId ? (url) => onImageUpload(trip.id, url) : undefined}
          />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="self-start body-3 text-primary-3 font-semibold hover:underline flex items-center gap-1"
        >
          {expanded ? 'Ver menos ↑' : `Ver más (${trips.length - INITIAL_COUNT} más) ↓`}
        </button>
      )}
    </div>
  );
}

function EmptyState({ onCreateClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-3 opacity-40">
        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
        <path d="M20 44 C20 28 44 28 44 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="22" r="6" stroke="currentColor" strokeWidth="2" />
      </svg>
      <p className="body text-neutral-4">Todavía no tienes viajes.</p>
      <p className="body-3 text-neutral-3">¡Empieza a planificar tu próxima aventura!</p>
      <Button variant="orange" onClick={onCreateClick} className="w-auto! px-8 mt-2">
        Crear mi primer viaje
      </Button>
    </div>
  );
}

export default function MisViajes() {
  const navigate = useNavigate();
  const { borradores, enCurso, proximos, pasados, loading, userId, handleDeleteTrip, handleUpdateTripCover } = useMyTrips();

  const handleEditTrip = (trip) => {
    const tripForm = {
      name: trip.name || '',
      origin: trip.origin || '',
      destination: trip.destination || '',
      stops: trip.stops || [],
      startDate: trip.startDate || '',
      endDate: trip.endDate || '',
      currency: trip.currency || '',
      budget: trip.budget || '',
      hasPet: Boolean(trip.hasPet),
      members: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: 0, form: tripForm }));
    navigate(ROUTES.TRIPS.CREATE, { state: { editTripId: trip.id } });
  };

  const hasDraft    = borradores.length > 0;
  const hasTrips    = enCurso.length + proximos.length + pasados.length > 0;
  const hasAnything = hasDraft || hasTrips;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Cabecera */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="body-3 text-primary-3 font-semibold uppercase tracking-wide mb-1">Mi espacio</p>
            <h1 className="title-h1-mobile md:title-h1-desktop text-secondary-5">
              Mis viajes
            </h1>
            <p className="body-3 text-neutral-3 mt-1">Continúa donde lo dejaste o empieza algo nuevo</p>
          </div>
          <Button
            variant="orange"
            type="button"
            className="w-auto! px-6 shrink-0 mt-1"
            onClick={() => navigate(ROUTES.TRIPS.CREATE)}
          >
            + Crear viaje
          </Button>
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-3 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !hasAnything ? (
          <EmptyState onCreateClick={() => navigate(ROUTES.TRIPS.CREATE)} />
        ) : (
          <div className="flex flex-col gap-10">

            {/* Borradores */}
            {hasDraft && (
              <section>
                <SectionTitle>Borradores</SectionTitle>
                <TripRow
                  trips={borradores}
                  isDraft={true}
                  onDelete={handleDeleteTrip}
                  onImageUpload={handleUpdateTripCover}
                  userId={userId}
                  onCardClick={(trip) => {
                    if (trip.formSnapshot) {
                      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: 0, form: trip.formSnapshot }));
                    }
                    navigate(ROUTES.TRIPS.CREATE, { state: { draftId: trip.id } });
                  }}
                />
              </section>
            )}

            {/* En curso */}
            {enCurso.length > 0 && (
              <section>
                <SectionTitle>En curso</SectionTitle>
                <TripRow
                  trips={enCurso}
                  onDelete={handleDeleteTrip}
                  onEdit={handleEditTrip}
                  onImageUpload={handleUpdateTripCover}
                  userId={userId}
                  onCardClick={(t) => navigate(`/trips/${t.id}`)}
                />
              </section>
            )}

            {/* Próximos viajes */}
            {proximos.length > 0 && (
              <section>
                <SectionTitle>Próximos viajes</SectionTitle>
                <TripRow
                  trips={proximos}
                  onDelete={handleDeleteTrip}
                  onEdit={handleEditTrip}
                  onImageUpload={handleUpdateTripCover}
                  userId={userId}
                  onCardClick={(t) => navigate(`/trips/${t.id}`)}
                />
              </section>
            )}

            {/* Viajes pasados */}
            {pasados.length > 0 && (
              <section>
                <SectionTitle>Viajes pasados</SectionTitle>
                <TripRow
                  trips={pasados}
                  onDelete={handleDeleteTrip}
                  onEdit={handleEditTrip}
                  onImageUpload={handleUpdateTripCover}
                  userId={userId}
                  onCardClick={(t) => navigate(`/trips/${t.id}`)}
                />
              </section>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
