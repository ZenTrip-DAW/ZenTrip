import { useEffect, useState } from 'react';
import { getFirebaseErrorByField } from '../../../../utils/auth/firebaseErrors';
import { loginFeedbackMessages } from '../../../../utils/validation/login/messages';
import {
  getPostLoginPath,
  saveUserToken,
  sendResetPasswordEmail,
  sendVerificationEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
} from '../services/loginFirebaseService';

// Espera mínima antes de volver a reenviar verificación (1 minuto y medio)
const WAIT_TO_RESEND_SECONDS = 90;

export function useLoginController(navigate) {
  // Datos que el usuario escribe en el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mensajes para mostrar en pantalla
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Estado del botón de reenviar verificación
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isSendingAgain, setIsSendingAgain] = useState(false);
  const [secondsToResend, setSecondsToResend] = useState(0);

  // Estados de carga para evitar doble clic
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Este efecto va bajando el contador de segundos cada 1 segundo
  useEffect(() => {
    if (secondsToResend <= 0) return undefined;

    const timeoutId = setTimeout(() => {
      setSecondsToResend((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [secondsToResend]);

  // Login normal con email y contraseña
  const handleLogin = async (event) => {
    // Evita que el formulario recargue toda la página
    event.preventDefault();
    setError('');
    setInfo('');
    setCanResendVerification(false);
    setSecondsToResend(0);

    // Limpiamos espacios por si el usuario puso " " al inicio/final
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail && !normalizedPassword) {
      setError(loginFeedbackMessages.requiredEmailAndPassword);
      return;
    }

    if (!normalizedEmail) {
      setError(loginFeedbackMessages.requiredEmail);
      return;
    }

    if (!normalizedPassword) {
      setError(loginFeedbackMessages.requiredPassword);
      return;
    }

    // Activamos loading para bloquear doble envío
    setIsLoading(true);
    try {
      // Intentamos autenticación con Firebase
      const user = await signInWithEmail(normalizedEmail, normalizedPassword);

      if (!user.emailVerified) {
        // Si no verificó correo, mostramos aviso y habilitamos el botón de reenviar
        setError(loginFeedbackMessages.emailNotVerified);
        setCanResendVerification(true);
        await signOutUser();
        return;
      }

      // Si todo salió bien, guardamos token y vamos a la ruta final
      await saveUserToken(user);
      navigate(await getPostLoginPath(user));
    } catch (loginError) {
      setCanResendVerification(false);
      const { message } = getFirebaseErrorByField(loginError);
      setError(message || loginFeedbackMessages.invalidCredentials);
      console.error('Error al iniciar sesión:', loginError.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar correo para recuperar contraseña
  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError(loginFeedbackMessages.requiredEmail);
      return;
    }

    try {
      // Firebase envía el email de recuperación al correo indicado
      // AQUÍ defines a qué URL vuelve el usuario después del correo
      await sendResetPasswordEmail(normalizedEmail, `${window.location.origin}/Auth/Login`);
      setInfo(loginFeedbackMessages.forgotPasswordSuccess);
    } catch (forgotError) {
      const { message } = getFirebaseErrorByField(forgotError);
      setError(message || loginFeedbackMessages.forgotPasswordFailed);
      console.error('Error al enviar recuperación:', forgotError.message);
    }
  };

  // Reenviar correo de verificación (con espera para no spamear)
  const handleResendVerification = async () => {
    setError('');
    setInfo('');

    if (secondsToResend > 0) {
      // Si todavía está en espera (cooldown), le decimos cuánto falta
      setInfo(`Espera ${secondsToResend}s para volver a reenviar el correo de verificación y evitar bloqueos temporales.`);
      return;
    }

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError(loginFeedbackMessages.resendNeedsCredentials);
      return;
    }

    // Mostramos "cargando" (loading) en el botón de reenviar
    setIsSendingAgain(true);
    try {
      // Reautenticamos para poder reenviar verificación
      const user = await signInWithEmail(normalizedEmail, normalizedPassword);

      if (user.emailVerified) {
        setInfo(loginFeedbackMessages.emailAlreadyVerified);
        setCanResendVerification(false);
        await signOutUser();
        return;
      }

      // AQUÍ definimos la URL de vuelta para el correo de verificación
      await sendVerificationEmail(user, `${window.location.origin}/Auth/Login`);
      setInfo(loginFeedbackMessages.resendVerificationSuccess);
      setCanResendVerification(true);
      // Tras enviar, activamos espera de 90s para evitar límite de Firebase
      setSecondsToResend(WAIT_TO_RESEND_SECONDS);
      await signOutUser();
    } catch (resendError) {
      if (resendError?.code === 'auth/too-many-requests') {
        // Firebase frenó los intentos: mostramos un aviso claro y activamos la espera (cooldown)
        setError(loginFeedbackMessages.resendTooManyRequests);
        setSecondsToResend(WAIT_TO_RESEND_SECONDS);
      } else {
        const { message } = getFirebaseErrorByField(resendError);
        setError(message || loginFeedbackMessages.resendVerificationFailed);
      }
      console.error('Error al reenviar verificación:', resendError.message);
    } finally {
      setIsSendingAgain(false);
    }
  };

  // Login con Google
  const handleGoogleLogin = async () => {
    setError('');
    setInfo('');
    setCanResendVerification(false);
    setIsGoogleLoading(true);

    try {
      // Inicia popup de Google y devuelve el usuario autenticado
      const user = await signInWithGoogle();
      await saveUserToken(user);
      navigate(await getPostLoginPath(user));
    } catch (googleError) {
      const { message } = getFirebaseErrorByField(googleError);
      setError(message || loginFeedbackMessages.invalidCredentials);
      console.error('Error al iniciar sesión con Google:', googleError.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Todo lo que devolvemos aquí lo usa el componente Login.jsx
  return {
    email,
    password,
    error,
    info,
    canResendVerification,
    isSendingAgain,
    secondsToResend,
    isLoading,
    isGoogleLoading,
    setEmail,
    setPassword,
    handleLogin,
    handleForgotPassword,
    handleResendVerification,
    handleGoogleLogin,
  };
}
