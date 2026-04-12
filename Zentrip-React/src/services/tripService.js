import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import { apiClient } from './apiClient';

export async function createTrip(uid, form) {
  const { miembros, ...tripData } = form;
  const tripPayload = {
    uid,
    name: tripData.nombre || '',
    origin: tripData.origen || '',
    destination: tripData.destino || '',
    startDate: tripData.fechaInicio || '',
    endDate: tripData.fechaFin || '',
    currency: tripData.divisa || '',
    budget: tripData.presupuesto || '',
    hasPet: Boolean(tripData.conMascota),
    createdAt: serverTimestamp(),
  };

  const ref = collection(db, 'viajes');
  const docRef = await addDoc(ref, tripPayload);

  // El creador debe aparecer siempre en la subcoleccion de miembros.
  const memberRef = doc(db, 'viajes', docRef.id, 'miembros', uid);
  try {
    const userEmail = auth.currentUser?.email || '';
    await setDoc(memberRef, {
      uid,
      email: userEmail,
      role: 'coordinador',
      invitationStatus: 'aceptada',
      acceptedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    // No bloqueamos la creacion del viaje por reglas de Firestore en miembros.
    console.warn('No se pudo guardar el creador en miembros (revisar reglas de Firestore):', error);
  }

  // Guardar los miembros invitados con sus datos para poder recuperarlos como recientes.
  for (const member of (miembros || [])) {
    if (!member?.uid) continue;
    const invitedRef = doc(db, 'viajes', docRef.id, 'miembros', member.uid);
    try {
      await setDoc(invitedRef, {
        uid: member.uid,
        email: member.email || '',
        nombre: member.nombre || '',
        username: member.username || '',
        avatar: member.avatar || '',
        role: 'miembro',
        invitationStatus: member.estadoInvitacion || 'pendiente',
      }, { merge: true });
    } catch {
      // No bloqueamos la creacion del viaje si falla algún miembro.
    }
  }

  return docRef.id;
}

export async function saveTripDraft(uid, form) {
  const { miembros, ...tripData } = form;
  const payload = {
    uid,
    isDraft: true,
    name: tripData.nombre || '',
    origin: tripData.origen || '',
    destination: tripData.destino || '',
    startDate: tripData.fechaInicio || '',
    endDate: tripData.fechaFin || '',
    currency: tripData.divisa || '',
    budget: tripData.presupuesto || '',
    hasPet: Boolean(tripData.conMascota),
    miembros: miembros || [],
    formSnapshot: form,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'viajes'), payload);
  return docRef.id;
}

export async function deleteTrip(tripId) {
  await deleteDoc(doc(db, 'viajes', tripId));
}

export async function getUserTrips(uid) {
  const q = query(collection(db, 'viajes'), where('uid', '==', uid));
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Ordenar por fecha de creación descendente en el cliente para evitar índice compuesto en Firestore
  return docs.sort((a, b) => {
    const aTs = a.createdAt?.seconds ?? 0;
    const bTs = b.createdAt?.seconds ?? 0;
    return bTs - aTs;
  });
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
