import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { ROUTES } from '../config/routes';

function buildDefaultProfile(user) {
  const [nombre = '', ...rest] = (user.displayName || '').split(' ');
  return {
    uid: user.uid,
    email: user.email,
    nombre,
    apellidos: rest.join(' '),
    username: '',
    bio: '',
    telefono: '',
    pais: '',
    fotoPerfil: user.photoURL || '',
    idioma: 'Español',
    moneda: 'EUR €',
    viajesSoloGrupo: 'ambos',
    petFriendly: false,
    perfilCompleto: false,
  };
}

export async function getOrCreateUserProfile(user) {
  const ref = doc(db, 'usuarios', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = buildDefaultProfile(user);
    await setDoc(ref, profile);
    return { profile, isNew: true };
  }

  return { profile: snap.data(), isNew: false };
}

export async function getPostLoginPath(user) {
  const { profile, isNew } = await getOrCreateUserProfile(user);
  if (isNew) return ROUTES.PROFILE.EDIT;
  return profile.perfilCompleto ? ROUTES.HOME : ROUTES.PROFILE.EDIT;
}
