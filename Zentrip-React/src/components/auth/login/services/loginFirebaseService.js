import {
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '../../../../config/firebaseConfig';
import { getPostLoginPath } from '../../../../services/userService';

export { getPostLoginPath };

export async function signInWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signInWithGoogle() {
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

export async function saveUserToken(user) {
  const idToken = await user.getIdToken();
  localStorage.setItem('firebaseIdToken', idToken);
}
