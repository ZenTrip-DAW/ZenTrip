import { addDoc, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import { apiClient } from './apiClient';

export async function createTrip(uid, form) {
  const { members, ...tripData } = form;
  const tripPayload = {
    uid,
    name: tripData.name || '',
    origin: tripData.origin || '',
    destination: tripData.destination || '',
    startDate: tripData.startDate || '',
    endDate: tripData.endDate || '',
    currency: tripData.currency || '',
    budget: tripData.budget || '',
    hasPet: Boolean(tripData.hasPet),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'trips'), tripPayload);

  const memberRef = doc(db, 'trips', docRef.id, 'members', uid);
  try {
    await setDoc(memberRef, {
      uid,
      email: auth.currentUser?.email || '',
      role: 'coordinator',
      invitationStatus: 'accepted',
      acceptedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('No se pudo guardar el creador en members:', error);
  }

  for (const member of (members || [])) {
    if (!member?.uid) continue;
    const invitedRef = doc(db, 'trips', docRef.id, 'members', member.uid);
    try {
      await setDoc(invitedRef, {
        uid: member.uid,
        email: member.email || '',
        name: member.name || '',
        username: member.username || '',
        avatar: member.avatar || '',
        role: 'member',
        invitationStatus: member.invitationStatus || 'pending',
      }, { merge: true });
    } catch {
      // No bloquear la creación del viaje si falla la escritura de un miembro.
    }
  }

  return docRef.id;
}

export async function saveTripDraft(uid, form, existingDraftId = null) {
  const { members, ...tripData } = form;
  const payload = {
    uid,
    isDraft: true,
    name: tripData.name || '',
    origin: tripData.origin || '',
    destination: tripData.destination || '',
    startDate: tripData.startDate || '',
    endDate: tripData.endDate || '',
    currency: tripData.currency || '',
    budget: tripData.budget || '',
    hasPet: Boolean(tripData.hasPet),
    members: members || [],
    formSnapshot: form,
    updatedAt: serverTimestamp(),
  };

  if (existingDraftId) {
    await setDoc(doc(db, 'trips', existingDraftId), payload, { merge: true });
    return existingDraftId;
  }

  payload.createdAt = serverTimestamp();
  const docRef = await addDoc(collection(db, 'trips'), payload);
  return docRef.id;
}

export async function deleteTrip(tripId) {
  await deleteDoc(doc(db, 'trips', tripId));
}

export async function updateTripCover(tripId, imageUrl) {
  await updateDoc(doc(db, 'trips', tripId), { coverImage: imageUrl });
}

export async function updateTrip(tripId, form) {
  const { members, ...tripData } = form;
  await updateDoc(doc(db, 'trips', tripId), {
    name: tripData.name || '',
    origin: tripData.origin || '',
    destination: tripData.destination || '',
    startDate: tripData.startDate || '',
    endDate: tripData.endDate || '',
    currency: tripData.currency || '',
    budget: tripData.budget || '',
    hasPet: Boolean(tripData.hasPet),
    updatedAt: serverTimestamp(),
  });
  return tripId;
}

export async function getUserTrips(uid) {
  // Viajes creados por el usuario
  const creatorSnapshot = await getDocs(
    query(collection(db, 'trips'), where('uid', '==', uid))
  );
  const creatorTripIds = new Set(creatorSnapshot.docs.map((d) => d.id));
  const creatorTrips = creatorSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Viajes donde el usuario es miembro (aceptado)
  let memberTrips = [];
  try {
    const memberSnapshot = await getDocs(
      query(
        collectionGroup(db, 'members'),
        where('uid', '==', uid),
        where('invitationStatus', '==', 'accepted')
      )
    );

    const memberTripDocs = await Promise.all(
      memberSnapshot.docs
        .map((d) => d.ref.parent.parent)
        .filter((ref) => !creatorTripIds.has(ref.id))
        .map((ref) => getDoc(ref))
    );

    memberTrips = memberTripDocs
      .filter((d) => d.exists())
      .map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    // La query de collectionGroup puede fallar si las reglas o el índice aún no están configurados
  }

  return [...creatorTrips, ...memberTrips].sort(
    (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );
}

export async function sendTripInvitations(payload) {
  return apiClient.post('/invitations/send', payload);
}

export async function getTripPublicInvitePreview() {
  return apiClient.get('/invitations/public-link/preview');
}

export async function getTripPublicInviteLink(tripId, preferredToken = '') {
  return apiClient.post('/invitations/public-link', { tripId, preferredToken });
}

export async function getTripById(tripId) {
  const snap = await getDoc(doc(db, 'trips', tripId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getTripMembers(tripId) {
  return apiClient.get(`/trips/${tripId}/members`);
}

export async function removeMemberFromTrip(tripId, memberUid) {
  await deleteDoc(doc(db, 'trips', tripId, 'members', memberUid));
}

export async function addMemberToTrip(tripId, member) {
  if (!member?.uid) return;
  const memberRef = doc(db, 'trips', tripId, 'members', member.uid);
  await setDoc(memberRef, {
    uid: member.uid,
    email: member.email || '',
    name: member.name || '',
    username: member.username || '',
    avatar: member.avatar || '',
    role: 'member',
    invitationStatus: 'pending',
  }, { merge: true });
}

export async function getActivities(tripId) {
  const snap = await getDocs(collection(db, 'trips', tripId, 'activities'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addActivity(tripId, activity) {
  const docRef = await addDoc(collection(db, 'trips', tripId, 'activities'), {
    ...activity,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteActivity(tripId, activityId) {
  await deleteDoc(doc(db, 'trips', tripId, 'activities', activityId));
}
