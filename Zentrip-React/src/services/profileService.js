import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../config/firebaseConfig';

export async function getUserProfile(uid) {
  const ref = doc(db, 'usuarios', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProfile(usuario, form) {
  const ref = doc(db, 'usuarios', usuario.uid);
  await setDoc(
    ref,
    { ...form, email: usuario.email, uid: usuario.uid, perfilCompleto: true },
    { merge: true }
  );

  await updateProfile(usuario, {
    displayName: `${form.nombre} ${form.apellidos}`.trim(),
    photoURL: form.fotoPerfil || null,
  });
}
