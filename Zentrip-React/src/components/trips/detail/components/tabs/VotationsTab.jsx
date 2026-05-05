import { useState } from 'react';
import { Vote, CalendarCheck } from 'lucide-react';
import { useVotes } from '../votations/useVotes';
import VoteCard from '../votations/VoteCard';
import CreateVoteModal from '../votations/CreateVoteModal';
import { sendVoteCreatedNotifications, markVoteAddedToItinerary } from '../../../../../services/votesService';
import AddActivityModal from '../itinerary/AddActivityModal';

function getWinner(vote) {
  const { options = [], votersByOption = {} } = vote;
  const counts = options.map((opt) => ({
    label: opt.label,
    count: (votersByOption[opt.id] ?? []).length,
  }));
  const max = Math.max(...counts.map((c) => c.count));
  if (max === 0) return 'Sin votos';
  const winners = counts.filter((c) => c.count === max);
  return winners.length > 1 ? 'Empate' : winners[0].label;
}

function VotesSummaryPanel({ votes, myVotes, memberCount }) {
  const activeVotes = votes.filter((v) => v.status === 'active');
  const closedVotes = votes.filter((v) => v.status === 'closed');
  const myPending   = activeVotes.filter((v) => !(myVotes[v.id]?.length));

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-5 flex flex-col gap-5 sticky top-4">
      <h3 className="title-h3-desktop text-secondary-5 text-center">Resumen</h3>

      {/* En curso */}
      {activeVotes.length > 0 && (
        <div>
          <p className="body-2 text-neutral-4 font-semibold uppercase tracking-wide mb-3">
            En curso · {activeVotes.length}
          </p>
          <div className="flex flex-col gap-2">
            {activeVotes.map((vote) => {
              const pending = memberCount - (vote.voters?.length ?? 0);
              return (
                <div key={vote.id} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50">
                  <span className="body-2 font-semibold text-secondary-5 line-clamp-2 leading-tight">{vote.title}</span>
                  <span className={`body-3 font-medium ${pending > 0 ? 'text-amber-600' : 'text-auxiliary-green-5'}`}>
                    {pending > 0 ? `${pending} sin votar` : 'Todos han votado'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Finalizadas */}
      {closedVotes.length > 0 && (
        <div>
          <p className="body-2 text-neutral-4 font-semibold uppercase tracking-wide mb-3">
            Finalizadas · {closedVotes.length}
          </p>
          <div className="flex flex-col gap-2">
            {closedVotes.map((vote) => {
              const winner = getWinner(vote);
              return (
                <div key={vote.id} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50">
                  <span className="body-2 font-semibold text-secondary-5 line-clamp-2 leading-tight">{vote.title}</span>
                  <span className="body-3 text-neutral-4 line-clamp-1">→ {winner}</span>
                  {vote.addedToItinerary ? (
                    <span className="flex items-center gap-1 body-3 font-medium text-auxiliary-green-5">
                      <CalendarCheck className="w-3.5 h-3.5" />
                      {vote.itineraryDate
                        ? (() => { const [y,m,d] = vote.itineraryDate.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('es-ES',{day:'numeric',month:'short'}); })()
                        : 'En itinerario'}
                    </span>
                  ) : (
                    <span className="body-3 text-neutral-3">Sin añadir</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tu participación */}
      {activeVotes.length > 0 && (
        <div className="border-t border-neutral-1 pt-4">
          <p className="body-2 text-neutral-4 font-semibold uppercase tracking-wide mb-2">Tu voto</p>
          <div className="p-3 rounded-xl bg-slate-50">
            {myPending.length === 0 ? (
              <span className="body-3 font-medium text-auxiliary-green-5">Has votado en todas ✓</span>
            ) : (
              <span className="body-3 font-medium text-amber-600">
                {myPending.length} pendiente{myPending.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VotationsTab({
  tripId,
  trip,
  tripDays = [],
  members = [],
  currentUser,
  currentProfile,
  onActivitySaved,
}) {
  const { votes, loading, myVotes } = useVotes(
    tripId,
    currentUser?.uid,
    members,
    trip?.name,
  );

  const [modal, setModal] = useState(null);
  const [daySelector, setDaySelector] = useState(null);   // null | { voteId, winnerLabel }
  const [activityModal, setActivityModal] = useState(null); // null | { voteId, winnerLabel, date }

  const tripOrganizerUid = trip?.uid;
  const memberCount      = members.length;

  const userName = currentProfile?.firstName
    || currentProfile?.displayName
    || currentUser?.displayName
    || currentUser?.email?.split('@')[0]
    || 'Miembro';

  // ── Crear encuesta ─────────────────────────────────────────────────────────
  const handleCreated = {
    user: { uid: currentUser?.uid, name: userName },
    onSuccess: (voteId, voteTitle) => {
      sendVoteCreatedNotifications(tripId, {
        creatorUid: currentUser?.uid,
        creatorName: userName,
        voteTitle: voteTitle ?? '',
        tripName: trip?.name,
      }).catch(() => {});
    },
  };

  // ── Añadir ganador al itinerario ───────────────────────────────────────────
  const handleAddToItinerary = (vote, winner) => {
    setDaySelector({ voteId: vote.id, winnerLabel: winner.label });
  };

  const handleDaySelected = (date) => {
    setActivityModal({ ...daySelector, date });
    setDaySelector(null);
  };

  const handleActivitySaved = async (activityData) => {
    try {
      await onActivitySaved(activityData);
      if (activityModal?.voteId) {
        await markVoteAddedToItinerary(tripId, activityModal.voteId, activityModal.date ?? null);
      }
    } catch (err) {
      console.error('[VotationsTab] handleActivitySaved', err);
    } finally {
      setActivityModal(null);
    }
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!loading && votes.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary-1 flex items-center justify-center">
            <Vote className="w-8 h-8 text-secondary-4" />
          </div>
          <div>
            <h3 className="title-h3-desktop text-secondary-6 mb-1">Sin encuestas todavía</h3>
            <p className="body-2 text-neutral-3">Crea una encuesta para decidir en grupo sin dramas</p>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            className="mt-2 px-5 py-2.5 rounded-full bg-secondary-5 hover:bg-secondary-6 text-white body-2-semibold transition-colors cursor-pointer"
          >
            + Crear primera encuesta
          </button>
        </div>

        {modal?.mode === 'create' && (
          <CreateVoteModal
            tripId={tripId}
            onClose={() => setModal(null)}
            onCreated={handleCreated}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex gap-5 items-start md:gap-8">

        {/* Columna principal */}
        <div className="flex flex-col gap-5 flex-1 min-w-0">

          {/* Cabecera */}
          <div className="flex items-start justify-between gap-3 pt-4 px-4 sm:pt-5 sm:px-5">
            <div>
              <h2 className="title-h3-desktop text-secondary-5">Votaciones</h2>
              <p className="body-3 text-neutral-3 mt-0.5">Proponed y decidid juntos sin dramas</p>
            </div>
            <button
              type="button"
              onClick={() => setModal({ mode: 'create' })}
              className="shrink-0 px-4 py-2 rounded-full bg-secondary-5 hover:bg-secondary-6 text-white body-3 font-semibold transition-colors cursor-pointer"
            >
              + Nueva encuesta
            </button>
          </div>

          {/* Lista de encuestas */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-neutral-1 rounded-2xl h-40 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {votes.map((vote) => (
                <VoteCard
                  key={vote.id}
                  vote={vote}
                  currentUid={currentUser?.uid}
                  tripOrganizerUid={tripOrganizerUid}
                  mySelectedOptions={myVotes[vote.id] ?? []}
                  memberCount={memberCount}
                  tripId={tripId}
                  tripDays={tripDays}
                  onEdit={(v) => setModal({ mode: 'edit', vote: v })}
                  onAddToItinerary={handleAddToItinerary}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel resumen — solo cuando hay encuestas y en pantallas md+ */}
        {!loading && votes.length > 0 && (
          <div className="hidden md:block w-80 lg:w-96 shrink-0">
            <VotesSummaryPanel votes={votes} myVotes={myVotes} memberCount={memberCount} />
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal?.mode === 'create' && (
        <CreateVoteModal
          tripId={tripId}
          onClose={() => setModal(null)}
          onCreated={handleCreated}
        />
      )}
      {modal?.mode === 'edit' && (
        <CreateVoteModal
          tripId={tripId}
          editingVote={modal.vote}
          onClose={() => setModal(null)}
          onCreated={handleCreated}
        />
      )}

      {/* Modal añadir al itinerario */}
      {/* Selector de día */}
      {daySelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={() => setDaySelector(null)} />
          <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="title-h3-desktop text-secondary-5 mb-1">¿En qué día?</h3>
            <p className="body-3 text-neutral-4 mb-4">Selecciona el día del viaje donde añadir esta actividad</p>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {tripDays.map((day) => {
                const [y, m, d] = day.split('-').map(Number);
                const label = new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDaySelected(day)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-secondary-1 hover:text-secondary-6 body-3 font-medium text-neutral-6 transition-colors cursor-pointer capitalize"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setDaySelector(null)}
              className="mt-4 w-full h-10 rounded-lg border border-neutral-2 body-3 font-bold text-neutral-5 hover:bg-neutral-1 transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {activityModal && (
        <AddActivityModal
          date={activityModal.date}
          creator={{ uid: currentUser?.uid, name: userName }}
          existingActivities={[]}
          members={members}
          onClose={() => setActivityModal(null)}
          onSave={handleActivitySaved}
          mode="create"
          initialActivity={{ name: activityModal.winnerLabel, type: 'actividad' }}
        />
      )}
    </>
  );
}
