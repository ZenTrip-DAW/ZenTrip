import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export async function createTrip(uid, form) {
  const ref = collection(db, 'viajes');
  const docRef = await addDoc(ref, {
    ...form,
    uid,
    creadoEn: serverTimestamp(),
  });
  return docRef.id;
}
