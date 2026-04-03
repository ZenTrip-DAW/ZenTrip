import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { apiClient } from './apiClient';

export async function createTrip(uid, form) {
  const { miembros, ...tripData } = form;
  const ref = collection(db, 'viajes');
  const docRef = await addDoc(ref, {
    ...tripData,
    uid,
    creadoEn: serverTimestamp(),
  });
  return docRef.id;
}

export async function sendTripInvitations(payload) {
  return apiClient.post('/invitations/send', payload);
}
