// src/utils/firebaseErrorMessages.js

// Mapea los códigos de error de Firebase a mensajes personalizados y a qué campo afectan
export const firebaseErrorMap = {
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
  
};

export function getFirebaseErrorByField(error) {
  if (!error || !error.code) return { field: 'general', message: 'Ocurrió un error desconocido.' };
  return firebaseErrorMap[error.code] || { field: 'general', message: error.message || 'Ocurrió un error desconocido.' };
}
