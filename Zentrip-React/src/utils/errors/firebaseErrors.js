export const firebaseAuthErrorMap = {
  'auth/email-already-in-use': {
    field: 'email',
    message: 'El correo electrónico ya está registrado.'
  },
  'auth/invalid-email': {
    field: 'email',
    message: 'El correo electrónico no es válido.'
  },
  'auth/weak-password': {
    field: 'password',
    message: 'La contraseña es demasiado débil. Usa al menos 6 caracteres.'
  },
  'auth/missing-password': {
    field: 'password',
    message: 'Debes ingresar una contraseña.'
  },
  'auth/missing-email': {
    field: 'email',
    message: 'Debes ingresar un correo electrónico.'
  },
  'auth/internal-error': {
    field: 'general',
    message: 'Ocurrió un error interno. Intenta de nuevo más tarde.'
  },
  'auth/user-not-found': {
    field: 'email',
    message: 'No existe una cuenta con ese correo.'
  },
  'auth/wrong-password': {
    field: 'password',
    message: 'La contraseña no es correcta.'
  },
  'auth/invalid-credential': {
    field: 'general',
    message: 'Credenciales inválidas. Revisa email y contraseña.'
  },
  'auth/too-many-requests': {
    field: 'general',
    message: 'Demasiados intentos. Intenta nuevamente más tarde.'
  },
  'auth/popup-closed-by-user': {
    field: 'general',
    message: 'El registro/inicio de sesión con Google fue cancelado.'
  },
  'auth/popup-blocked': {
    field: 'general',
    message: 'El navegador bloqueó la ventana emergente de Google. Permite pop-ups e inténtalo de nuevo.'
  }
};

const UNKNOWN_ERROR = {
  field: 'general',
  message: 'Ocurrió un error desconocido.'
};

export function getFirebaseErrorByField(error) {
  if (!error || !error.code) return UNKNOWN_ERROR;
  return firebaseAuthErrorMap[error.code] || { field: 'general', message: error.message || UNKNOWN_ERROR.message };
}

export function getFirebaseErrorMessage(error) {
  return getFirebaseErrorByField(error).message;
}
