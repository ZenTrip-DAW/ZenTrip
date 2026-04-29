import { useState } from 'react';
import { Pencil, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { castVote, closeVote, deleteVote } from '../../../../../services/votesService';

const CATEGORY_LABELS = {
  restaurante: { label: 'Restaurante', emoji: '🍽️' },
  actividad:   { label: 'Actividad',   emoji: '🎯' },
  alojamiento: { label: 'Alojamiento', emoji: '🏨' },
  transporte:  { label: 'Transporte',  emoji: '✈️' },
  otro:        { label: 'Otro',        emoji: '💬' },
};

export default function VoteCard({
  vote,
  currentUid,
  tripOrganizerUid,
  mySelectedOptions = [],   // optionIds que ya votó el usuario
  memberCount,
  tripId,
  tripDays = [],
  onEdit,
  onAddToItinerary,
}) {
  const [pendingOptions, setPendingOptions] = useState(null); // selección en curso antes de confirmar
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isCreator    = vote.createdBy?.uid === currentUid;
  const isOrganizer  = tripOrganizerUid === currentUid;
  const isClosed     = vote.status === 'closed';
  const isMultiple   = vote.type === 'multiple';
  const totalVoters  = (vote.voters || []).length;
  const allVoted     = memberCount > 0 && totalVoters >= memberCount;

  // Cálculos de resultados
  const votesPerOption = (vote.options || []).map((opt) => ({
    ...opt,
    count: (vote.votersByOption?.[opt.id] || []).length,
  }));
  const maxVotes = Math.max(...votesPerOption.map((o) => o.count), 0);
  const winners  = isClosed || allVoted
    ? votesPerOption.filter((o) => o.count === maxVotes && o.count > 0)
    : [];
  const isTie = winners.length > 1;

  // Gestión de selección temporal (antes de confirmar)
  const activeSelection = pendingOptions ?? mySelectedOptions;

  const toggleOption = (optId) => {
    if (isClosed || saving) return;
    if (isMultiple) {
      setPendingOptions((prev) => {
        const cur = prev ?? mySelectedOptions;
        return cur.includes(optId) ? cur.filter((id) => id !== optId) : [...cur, optId];
      });
    } else {
      setPendingOptions([optId]);
    }
  };

  const handleConfirmVote = async () => {
    if (!pendingOptions || saving) return;
    setSaving(true);
    try {
      await castVote(tripId, vote.id, currentUid, pendingOptions, memberCount);
      setPendingOptions(null);
    } catch (err) {
      console.error('[VoteCard] castVote', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    try { await closeVote(tripId, vote.id); } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    try { await deleteVote(tripId, vote.id); } catch (err) { console.error(err); }
  };

  const cat = vote.category ? CATEGORY_LABELS[vote.category] : null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-1 p-5 flex flex-col gap-4">

      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {cat && (
              <span className="body-3 font-semibold bg-secondary-1 text-secondary-5 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span>{cat.emoji}</span>{cat.label}
              </span>
            )}
            <span className={`body-3 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${isClosed ? 'bg-neutral-1 text-neutral-4' : 'bg-auxiliary-green-1 text-auxiliary-green-5'}`}>
              {isClosed ? <Lock className="w-3 h-3" /> : <span className="w-2 h-2 rounded-full bg-auxiliary-green-5 inline-block" />}
              {isClosed ? 'Cerrada' : 'Activa'}
            </span>
            {isMultiple && (
              <span className="body-3 font-semibold bg-primary-1 text-primary-4 px-2 py-0.5 rounded-full">
                Múltiple
              </span>
            )}
          </div>
          <h3 className="title-h3-desktop text-secondary-6 leading-snug">{vote.title}</h3>
          <p className="body-3 text-neutral-3">
            {vote.createdBy?.name} · {totalVoters}/{memberCount} {totalVoters === 1 ? 'voto' : 'votos'}
          </p>
        </div>

        {/* Acciones del creador */}
        {isCreator && !isClosed && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(vote)}
              className="w-8 h-8 rounded-full border border-neutral-1 flex items-center justify-center text-neutral-4 hover:text-secondary-5 hover:border-secondary-2 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-8 h-8 rounded-full border border-neutral-1 flex items-center justify-center text-neutral-4 hover:text-feedback-error-strong hover:border-feedback-error transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button type="button" onClick={handleDelete} className="body-3 font-semibold text-white bg-feedback-error-strong px-2.5 py-1 rounded-full cursor-pointer hover:opacity-90">
                  Eliminar
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="body-3 font-semibold text-neutral-4 px-2 py-1 cursor-pointer">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Opciones ── */}
      <div className="flex flex-col gap-2">
        {votesPerOption.map((opt) => {
          const pct     = totalVoters > 0 ? Math.round((opt.count / totalVoters) * 100) : 0;
          const isWinner = winners.some((w) => w.id === opt.id);
          const isSelected = activeSelection.includes(opt.id);
          const hasPending = pendingOptions !== null;

          let barColor = 'bg-secondary-1';
          if (isWinner && !isTie) barColor = 'bg-primary-2';
          else if (isWinner && isTie) barColor = 'bg-secondary-2';

          let borderClass = 'border-neutral-1';
          if (isSelected && !isClosed) borderClass = 'border-secondary-3';
          else if (isWinner && !isTie) borderClass = 'border-primary-2';
          else if (isWinner && isTie) borderClass = 'border-secondary-2';

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isClosed || saving}
              onClick={() => toggleOption(opt.id)}
              className={`relative rounded-xl border overflow-hidden text-left transition-all w-full
                ${isClosed ? 'cursor-default' : 'cursor-pointer hover:border-secondary-3'}
                ${borderClass}`}
            >
              {/* Barra de progreso */}
              <div
                className={`absolute inset-y-0 left-0 transition-all ${barColor} opacity-30`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Checkbox/radio visual */}
                  {!isClosed && (
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                      ${isSelected ? 'border-secondary-4 bg-secondary-4' : 'border-neutral-2'}`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  )}
                  <span className="body-2 text-secondary-6 font-semibold truncate">{opt.label}</span>
                  {isWinner && !isTie && <CheckCircle2 className="w-4 h-4 text-primary-3 shrink-0" />}
                  {isWinner && isTie && <span className="body-3 font-semibold text-secondary-4 shrink-0">Empate</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(isClosed || hasPending || mySelectedOptions.length > 0) && (
                    <span className="body-3 font-semibold text-primary-3">{opt.count} · {pct}%</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Confirmar voto / hint ── */}
      {!isClosed && pendingOptions !== null && (
        <button
          type="button"
          disabled={saving || pendingOptions.length === 0}
          onClick={handleConfirmVote}
          className="w-full py-2.5 rounded-xl bg-secondary-5 hover:bg-secondary-6 text-white body-2-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Guardando…' : mySelectedOptions.length > 0 ? 'Cambiar voto' : 'Confirmar voto'}
        </button>
      )}
      {!isClosed && pendingOptions === null && mySelectedOptions.length === 0 && (
        <p className="body-3 text-neutral-3 text-center">Toca una opción para votar</p>
      )}

      {/* ── Cerrar encuesta (solo creador) ── */}
      {isCreator && !isClosed && (
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-2 rounded-xl border border-neutral-2 text-neutral-4 body-3 font-semibold hover:border-neutral-4 hover:text-neutral-6 transition-colors cursor-pointer"
        >
          Cerrar encuesta
        </button>
      )}

      {/* ── Añadir al itinerario (solo organizador del viaje) ── */}
      {isClosed && !vote.addedToItinerary && isOrganizer && winners.length === 1 && (
        <div className="bg-primary-1 border border-primary-2 rounded-xl p-4 flex flex-col gap-3">
          <p className="body-3 font-semibold text-primary-4">
            🗓️ ¿Añadir "{winners[0].label}" al itinerario?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onAddToItinerary(vote, winners[0])}
              className="flex-1 py-2 rounded-xl bg-primary-3 hover:bg-primary-4 text-white body-3 font-semibold transition-colors cursor-pointer"
            >
              Añadir al itinerario
            </button>
            <button
              type="button"
              onClick={async () => {
                const { markVoteAddedToItinerary } = await import('../../../../../services/votesService');
                markVoteAddedToItinerary(tripId, vote.id);
              }}
              className="px-3 py-2 rounded-xl border border-neutral-2 text-neutral-4 body-3 font-semibold hover:border-neutral-4 transition-colors cursor-pointer"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

      {isClosed && vote.addedToItinerary && (
        <div className="flex items-center gap-2 bg-auxiliary-green-1 border border-auxiliary-green-3 rounded-xl px-4 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-auxiliary-green-5 shrink-0" />
          <span className="body-3 font-semibold text-auxiliary-green-5">Añadido al itinerario</span>
        </div>
      )}

      {/* Empate cerrado — no hay ganador único */}
      {isClosed && !vote.addedToItinerary && isTie && isOrganizer && (
        <p className="body-3 text-neutral-3 text-center">Empate — decide manualmente y añade la actividad al itinerario</p>
      )}
    </div>
  );
}
