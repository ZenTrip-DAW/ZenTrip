import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../../../../config/firebaseConfig';
import { sendVoteResultsNotifications } from '../../../../../services/votesService';

export function useVotes(tripId, currentUid, members = [], tripName = '') {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);

    const q = query(
      collection(db, 'trips', tripId, 'votes'),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Comprueba si alguna encuesta activa acaba de completarse (todos han votado)
      // y envía la notificación de resultados si aún no se ha enviado.
      const memberCount = members.length;
      if (memberCount > 0) {
        for (const vote of docs) {
          if (
            vote.status === 'active' &&
            !vote.resultNotified &&
            (vote.voters || []).length >= memberCount
          ) {
            const maxVotes = Math.max(...Object.values(vote.votersByOption || {}).map((v) => v.length));
            const winners = (vote.options || [])
              .filter((o) => (vote.votersByOption?.[o.id] || []).length === maxVotes)
              .map((o) => o.label);

            sendVoteResultsNotifications(tripId, vote.id, {
              voteTitle: vote.title,
              winners,
              tripName,
            }).catch(() => {});
          }
        }
      }

      setVotes(docs);
      setLoading(false);
    }, (err) => {
      console.error('[useVotes]', err);
      setLoading(false);
    });

    return unsub;
  }, [tripId, members.length, tripName]);

  // Votos del usuario actual por encuesta: { [voteId]: string[] (optionIds) }
  const myVotes = votes.reduce((acc, vote) => {
    const myOptions = Object.entries(vote.votersByOption || {})
      .filter(([, voters]) => voters.includes(currentUid))
      .map(([optId]) => optId);
    if (myOptions.length > 0) acc[vote.id] = myOptions;
    return acc;
  }, {});

  return { votes, loading, myVotes };
}
