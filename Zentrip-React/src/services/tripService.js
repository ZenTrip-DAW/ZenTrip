import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
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

export async function sendTripInvitations(payload) {
  return apiClient.post('/invitations/send', payload);
}

export async function getTripPublicInvitePreview() {
  return apiClient.get('/invitations/public-link/preview');
}

export async function getTripPublicInviteLink(tripId, preferredToken = '') {
  return apiClient.post('/invitations/public-link', { tripId, preferredToken });
}
