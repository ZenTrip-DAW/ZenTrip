import {
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../register/firebaseConfig';

// Decide a qué pantalla va el usuario después del login
export async function getPostLoginPath(user) {
  // Buscamos su perfil en Firestore
  const userRef = doc(db, 'usuarios', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Si es nuevo, creamos el perfil con valores por defecto
    const [nombre = '', ...resto] = (user.displayName || '').split(' ');

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      nombre,
      apellidos: resto.join(' '),
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
    });

    // Usuario nuevo: primero debe completar su perfil
    return '/perfil/editar';
  }

  // Usuario existente: si su perfil está completo, va a home
  const userData = userSnap.data();
  return userData?.perfilCompleto ? '/home' : '/perfil/editar';
}

// Login con correo y contraseña
export async function signInWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Login con Google (popup)
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// Envia correo para cambiar contraseña
export async function sendResetPasswordEmail(email, redirectUrl) {
  await sendPasswordResetEmail(auth, email, {
    url: redirectUrl,
  });
}

// Reenvia correo de verificación
export async function sendVerificationEmail(user, redirectUrl) {
  await sendEmailVerification(user, {
    url: redirectUrl,
  });
}

// Cierra sesión actual
export async function signOutUser() {
  await signOut(auth);
}

// Guarda token de Firebase en localStorage
export async function saveUserToken(user) {
  const idToken = await user.getIdToken();
  localStorage.setItem('firebaseIdToken', idToken);
}
