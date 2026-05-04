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
    <div className="bg-white rounded-2xl border border-neutral-1 p-4 flex flex-col gap-4 sticky top-4">
      <p className="body-3 text-neutral-4 font-semibold uppercase tracking-wide">Resumen</p>

      {/* En curso */}
      {activeVotes.length > 0 && (
        <div>
          <p className="body-3 text-neutral-4 font-semibold uppercase tracking-wide mb-3">
            En curso · {activeVotes.length}
          </p>
          <div className="flex flex-col gap-2">
            {activeVotes.map((vote) => {
              const pending = memberCount - (vote.voters?.length ?? 0);
              return (
                <div key={vote.id} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50">
                  <span className="body-3 font-semibold text-secondary-5 line-clamp-2 leading-tight">{vote.title}</span>
                  <span className={`text-[11px] font-medium ${pending > 0 ? 'text-amber-600' : 'text-auxiliary-green-5'}`}>
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
          <p className="body-3 text-neutral-4 font-semibold uppercase tracking-wide mb-3">
            Finalizadas · {closedVotes.length}
          </p>
          <div className="flex flex-col gap-2">
            {closedVotes.map((vote) => {
              const winner = getWinner(vote);
              return (
                <div key={vote.id} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50">
                  <span className="body-3 font-semibold text-secondary-5 line-clamp-2 leading-tight">{vote.title}</span>
                  <span className="text-[11px] text-neutral-4 line-clamp-1">→ {winner}</span>
                  {vote.addedToItinerary ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-auxiliary-green-5">
                      <CalendarCheck className="w-3 h-3" />En itinerario
                    </span>
                  ) : (
                    <span className="text-[11px] text-neutral-3">Sin añadir</span>
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
          <p className="body-3 text-neutral-4 font-semibold uppercase tracking-wide mb-2">Tu voto</p>
          <div className="p-3 rounded-xl bg-slate-50">
            {myPending.length === 0 ? (
              <span className="text-[11px] font-medium text-auxiliary-green-5">Has votado en todas ✓</span>
            ) : (
              <span className="text-[11px] font-medium text-amber-600">
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
  members = [],
  currentUser,
  currentProfile,
  onActivitySaved,   // (activityData) => Promise — callback de TripDetail para guardar actividad
}) {
  const { votes, loading, myVotes } = useVotes(
    tripId,
    currentUser?.uid,
    members,
    trip?.name,
  );

  const [modal, setModal] = useState(null);          // null | { mode: 'create' } | { mode: 'edit', vote }
  const [activityModal, setActivityModal] = useState(null); // null | { voteId, winnerLabel }

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
    setActivityModal({ voteId: vote.id, winnerLabel: winner.label });
  };

  const handleActivitySaved = async (activityData) => {
    try {
      await onActivitySaved(activityData);
      if (activityModal?.voteId) {
        await markVoteAddedToItinerary(tripId, activityModal.voteId);
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
      <div className="flex gap-5 p-4 sm:p-5 items-start">

        {/* Columna principal */}
        <div className="flex flex-col gap-5 flex-1 min-w-0">

          {/* Cabecera */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="title-h3-desktop text-secondary-6">Votaciones</h2>
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
                  tripDays={trip?.tripDays ?? []}
                  onEdit={(v) => setModal({ mode: 'edit', vote: v })}
                  onAddToItinerary={handleAddToItinerary}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel resumen — solo cuando hay encuestas y en pantallas md+ */}
        {!loading && votes.length > 0 && (
          <div className="hidden md:block w-56 lg:w-64 shrink-0">
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
      {activityModal && (
        <AddActivityModal
          date={null}
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
