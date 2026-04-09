import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
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

export async function getUserByUid(uid) {
  if (!uid) return null;
  try {
    return await apiClient.get(`/users/${encodeURIComponent(uid)}`);
  } catch {
    return null;
  }
}

export async function isUsernameUnique(username, currentUid) {
  const q = query(
    collection(db, 'usuarios'),
    where('username', '==', username.trim())
  );
  const snap = await getDocs(q);
  return snap.empty || snap.docs.every((d) => d.id === currentUid);
}

export async function isPhoneUnique(telefono, currentUid) {
  const q = query(
    collection(db, 'usuarios'),
    where('telefono', '==', telefono.trim())
  );
  const snap = await getDocs(q);
  return snap.empty || snap.docs.every((d) => d.id === currentUid);
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
