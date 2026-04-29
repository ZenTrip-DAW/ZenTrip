import {
  addDoc, collection, deleteDoc, doc, getDocs,
  onSnapshot, runTransaction, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createVote(tripId, { title, category, type, options }, { uid, name }) {
  const ref = await addDoc(collection(db, 'trips', tripId, 'votes'), {
    title,
    category: category || null,
    type,             // 'single' | 'multiple'
    options,          // [{ id: string, label: string }]
    votersByOption: Object.fromEntries(options.map((o) => [o.id, []])),
    voters: [],
    status: 'active',
    createdBy: { uid, name },
    createdAt: serverTimestamp(),
    resultNotified: false,
    addedToItinerary: false,
  });
  return ref.id;
}

export async function updateVote(tripId, voteId, { title, category, type, options }) {
  await updateDoc(doc(db, 'trips', tripId, 'votes', voteId), {
    title,
    category: category || null,
    type,
    options,
  });
}

export async function deleteVote(tripId, voteId) {
  await deleteDoc(doc(db, 'trips', tripId, 'votes', voteId));
}

export async function closeVote(tripId, voteId) {
  await updateDoc(doc(db, 'trips', tripId, 'votes', voteId), {
    status: 'closed',
    closedAt: serverTimestamp(),
  });
}

export async function markVoteAddedToItinerary(tripId, voteId) {
  await updateDoc(doc(db, 'trips', tripId, 'votes', voteId), {
    addedToItinerary: true,
  });
}

// ─── VOTING ───────────────────────────────────────────────────────────────────

// Emite o cambia el voto de un usuario usando una transacción para evitar conflictos.
// selectedOptionIds: string[] (uno para 'single', varios para 'multiple')
export async function castVote(tripId, voteId, uid, selectedOptionIds, memberCount) {
  const voteRef = doc(db, 'trips', tripId, 'votes', voteId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(voteRef);
    if (!snap.exists()) throw new Error('Vote not found');
    const data = snap.data();
    if (data.status !== 'active') throw new Error('Vote is closed');

    // Limpia opciones anteriores del usuario
    const updatedByOption = { ...data.votersByOption };
    Object.keys(updatedByOption).forEach((optId) => {
      updatedByOption[optId] = (updatedByOption[optId] || []).filter((u) => u !== uid);
    });

    // Añade a las nuevas opciones
    selectedOptionIds.forEach((optId) => {
      if (!updatedByOption[optId]) updatedByOption[optId] = [];
      if (!updatedByOption[optId].includes(uid)) updatedByOption[optId].push(uid);
    });

    // Registra al usuario como votante (si no estaba)
    const voters = data.voters || [];
    const updatedVoters = voters.includes(uid) ? voters : [...voters, uid];

    tx.update(voteRef, {
      votersByOption: updatedByOption,
      voters: updatedVoters,
    });
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

async function getRecipients(tripId, excludeUid) {
  const snap = await getDocs(collection(db, 'trips', tripId, 'members'));
  return snap.docs.map((d) => d.data()).filter((m) => m.uid && m.uid !== excludeUid);
}

export async function sendVoteCreatedNotifications(tripId, { creatorUid, creatorName, voteTitle, tripName }) {
  const recipients = await getRecipients(tripId, creatorUid);
  await Promise.all(recipients.map((m) =>
    addDoc(collection(db, 'notifications'), {
      recipientUid: m.uid,
      type: 'vote_created',
      tripId,
      tripName: tripName || '',
      voteTitle,
      creatorName: creatorName || 'Un miembro',
      read: false,
      createdAt: serverTimestamp(),
    }),
  ));
}

// Llama esto cuando todos los miembros hayan votado (winner o empate).
// winners: string[] (labels de las opciones ganadoras — más de uno = empate)
export async function sendVoteResultsNotifications(tripId, voteId, { voteTitle, winners, tripName }) {
  const snap = await getDocs(collection(db, 'trips', tripId, 'members'));
  const recipients = snap.docs.map((d) => d.data()).filter((m) => m.uid);
  const isTie = winners.length > 1;

  await Promise.all(recipients.map((m) =>
    addDoc(collection(db, 'notifications'), {
      recipientUid: m.uid,
      type: 'vote_results',
      tripId,
      voteId,
      tripName: tripName || '',
      voteTitle,
      winners,
      isTie,
      read: false,
      createdAt: serverTimestamp(),
    }),
  ));

  // Marca la encuesta como notificada para no enviar de nuevo
  await updateDoc(doc(db, 'trips', tripId, 'votes', voteId), { resultNotified: true });
}
