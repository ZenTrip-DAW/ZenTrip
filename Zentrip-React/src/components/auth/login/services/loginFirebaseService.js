import {
  GoogleAuthProvider,
  browserSessionPersistence,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../../../../config/firebaseConfig';
import { getPostLoginPath } from '../../../../services/userService';

export { getPostLoginPath };

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hora

export function saveSessionExpiry() {
  sessionStorage.setItem('sessionExpiry', Date.now() + SESSION_DURATION_MS);
}

export function clearSessionExpiry() {
  sessionStorage.removeItem('sessionExpiry');
}

export function isSessionExpired() {
  const expiry = sessionStorage.getItem('sessionExpiry');
  if (!expiry) return false;
  return Date.now() > Number(expiry);
}

export async function signInWithEmail(email, password) {
  await setPersistence(auth, browserSessionPersistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function refreshAuthenticatedUser(user) {
  if (!user) return null;
  await reload(user);
  return auth.currentUser || user;
}

export async function signInWithGoogle() {
  await setPersistence(auth, browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function sendResetPasswordEmail(email, redirectUrl) {
  await sendPasswordResetEmail(auth, email, { url: redirectUrl });
}

export async function sendVerificationEmail(user, redirectUrl) {
  await sendEmailVerification(user, { url: redirectUrl });
}

export async function signOutUser() {
  await signOut(auth);
}

export async function verifyRecaptchaToken(token) {
  const { apiClient } = await import('../../../../services/apiClient');
  await apiClient.post('/auth/verify-recaptcha', { recaptchaToken: token });
}

export async function saveUserToken(user) {
  const idToken = await user.getIdToken();
  localStorage.setItem('firebaseIdToken', idToken);
}
