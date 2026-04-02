import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { ROUTES } from '../config/routes';
import { apiClient } from './apiClient';

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
    avatarColor: '',
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
  if (isNew) return ROUTES.PROFILE.SETUP;
  return profile.perfilCompleto ? ROUTES.HOME : ROUTES.PROFILE.SETUP;
}

export async function searchUsersByUsername(username, maxResults = 8) {
  const term = username.trim().toLowerCase();
  if (!term) return [];

  try {
    const results = await apiClient.get(`/search-users?query=${encodeURIComponent(term)}&limit=${maxResults}`);
    return results;
  } catch (error) {
    throw error;
  }
}

export async function searchUsersByEmail(email, maxResults = 5) {
  const term = email.trim().toLowerCase();
  if (!term) return [];

  try {
    const results = await apiClient.get(`/search-users?query=${encodeURIComponent(term)}&limit=${maxResults}&type=email`);
    return results;
  } catch (error) {
    throw error;
  }
}
