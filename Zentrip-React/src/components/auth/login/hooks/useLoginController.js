import { useEffect, useState } from 'react';
import { ROUTES } from '../../../../config/routes';
import { apiClient } from '../../../../services/apiClient';
import { getFirebaseErrorByField } from '../../../../utils/errors/firebaseErrors';
import { loginFeedbackMessages } from '../../../../utils/validation/login/messages';
import {
  refreshAuthenticatedUser,
  getPostLoginPath,
  saveUserToken,
  saveSessionExpiry,
  sendResetPasswordEmail,
  sendVerificationEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  verifyRecaptchaToken,
} from '../services/loginFirebaseService';

// Espera mínima antes de volver a reenviar verificación (1 minuto y medio)
const WAIT_TO_RESEND_SECONDS = 90;
const VERIFICATION_MAX_RETRIES = 4;
const VERIFICATION_RETRY_DELAY_MS = 700;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeJwtPayload(token) {
  try {
    const [, payload] = String(token || '').split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

export function useLoginController(navigate) {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() || '';
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('inviteToken')?.trim() || '';
  const joinToken = urlParams.get('join')?.trim() || urlParams.get('tripInviteToken')?.trim() || '';

  const [invitationInfo, setInvitationInfo] = useState(null);
  const [invitationError, setInvitationError] = useState('');

  const reconcileInvitationAccess = async () => {
    if (inviteToken) {
      try {
        await apiClient.post('/invitations/accept', { token: inviteToken });
      } catch (acceptError) {
        const msg = acceptError?.message || '';
        if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('email')) {
          return { emailMismatch: true };
        }
        console.warn('No se pudo aceptar por token, se intentará reclamar por correo:', acceptError);
      }
    } else if (joinToken) {
      try {
        await apiClient.post('/invitations/public-accept', { token: joinToken });
      } catch (acceptError) {
        console.warn('No se pudo aceptar por enlace público del viaje:', acceptError);
      }
    }

    try {
      await apiClient.post('/invitations/claim-my-invitations', {});
    } catch (claimError) {
      console.warn('No se pudieron reclamar invitaciones pendientes por correo:', claimError);
    }

    return {};
  };

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

  // Token de reCAPTCHA y clave para forzar reset del widget
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaKey, setRecaptchaKey] = useState(0);

  // Este efecto va bajando el contador de segundos cada 1 segundo
  useEffect(() => {
    if (secondsToResend <= 0) return undefined;

    const timeoutId = setTimeout(() => {
      setSecondsToResend((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [secondsToResend]);

  useEffect(() => {
    if (!inviteToken && !joinToken) return undefined;

    let active = true;

    const decodedJoin = !inviteToken && joinToken ? decodeJwtPayload(joinToken) : null;

    const verifyPath = inviteToken
      ? `/invitations/verify?token=${encodeURIComponent(inviteToken)}`
      : `/invitations/public-verify?token=${encodeURIComponent(joinToken)}`;

    apiClient
      .get(verifyPath)
      .then((data) => {
        if (!active) return;
        setInvitationInfo(data);
        setInvitationError('');
        if (data?.email) {
          setEmail(data.email);
        }
      })
      .catch((error) => {
        if (!active) return;
        setInvitationInfo(null);

        if (error.expired) {
          setInvitationError(
            inviteToken
              ? 'Tu invitación ha caducado. Pide al organizador que te reenvíe el correo.'
              : 'El enlace ha caducado. Pide al organizador que comparta el nuevo enlace.',
          );
          return;
        }

        if (error.rotated) {
          setInvitationError('Este enlace ya no es válido. El organizador ha generado uno nuevo, pídele que lo comparta.');
          return;
        }

        if (decodedJoin?.scope === 'preview') {
          setInvitationError('Este enlace es válido, pero el viaje todavía no existe (aún no se ha creado). Pide al creador que finalice y guarde el viaje.');
          return;
        }

        setInvitationError(error.message || 'No se pudo validar la invitación.');
      });

    return () => {
      active = false;
    };
  }, [inviteToken, joinToken]);

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

    if (recaptchaSiteKey && !recaptchaToken) {
      setError('Por favor, completa el reCAPTCHA.');
      return;
    }

    // Activamos loading para bloquear doble envío
    setIsLoading(true);
    try {
      // Verificamos el token de reCAPTCHA en el servidor antes de continuar
      if (recaptchaSiteKey) {
        await verifyRecaptchaToken(recaptchaToken);
      }

      // Intentamos autenticación con Firebase
      const user = await signInWithEmail(normalizedEmail, normalizedPassword);

      const resolveVerificationState = async (currentUser) => {
        let latestUser = currentUser;

        for (let attempt = 0; attempt < VERIFICATION_MAX_RETRIES; attempt += 1) {
          latestUser = await refreshAuthenticatedUser(latestUser);
          if (latestUser.emailVerified) {
            return latestUser;
          }

          if (attempt < VERIFICATION_MAX_RETRIES - 1) {
            await delay(VERIFICATION_RETRY_DELAY_MS);
          }
        }

        return latestUser;
      };

      const refreshedUser = await resolveVerificationState(user);

      if (!refreshedUser.emailVerified) {
        // Si no verificó correo, mostramos aviso y habilitamos el botón de reenviar
        setError(loginFeedbackMessages.emailNotVerified);
        setCanResendVerification(true);
        await signOutUser();
        localStorage.removeItem('firebaseIdToken');
        return;
      }

      // Si todo salió bien, guardamos token, marcamos expiración y vamos a la ruta final
      await saveUserToken(refreshedUser);
      const { emailMismatch } = await reconcileInvitationAccess();
      if (inviteToken && !emailMismatch && invitationInfo?.tripName) {
        window.dispatchEvent(new CustomEvent('zt-invitation-accepted-email', { detail: { tripName: invitationInfo.tripName } }));
      }
      saveSessionExpiry();
      const destination = emailMismatch ? ROUTES.HOME : await getPostLoginPath(refreshedUser);
      navigate(emailMismatch ? `${ROUTES.HOME}?inviteError=emailMismatch` : destination);
    } catch (loginError) {
      setCanResendVerification(false);
      const { message } = getFirebaseErrorByField(loginError);
      setError(message || loginFeedbackMessages.invalidCredentials);
      console.error('Error al iniciar sesión:', loginError.message);
    } finally {
      setIsLoading(false);
      setRecaptchaToken(null);
      setRecaptchaKey((prev) => prev + 1);
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
      await sendResetPasswordEmail(normalizedEmail, `${window.location.origin}${ROUTES.AUTH.ACTION}`);
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
      const refreshedUser = await refreshAuthenticatedUser(user);

      if (refreshedUser.emailVerified) {
        setInfo(loginFeedbackMessages.emailAlreadyVerified);
        setCanResendVerification(false);
        await signOutUser();
        return;
      }

      // AQUÍ definimos la URL de vuelta para el correo de verificación
      await sendVerificationEmail(refreshedUser, `${window.location.origin}${ROUTES.AUTH.ACTION}`);
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
      const { emailMismatch } = await reconcileInvitationAccess();
      if (inviteToken && !emailMismatch && invitationInfo?.tripName) {
        window.dispatchEvent(new CustomEvent('zt-invitation-accepted-email', { detail: { tripName: invitationInfo.tripName } }));
      }
      saveSessionExpiry();
      navigate(emailMismatch ? `${ROUTES.HOME}?inviteError=emailMismatch` : await getPostLoginPath(user));
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
    recaptchaToken,
    recaptchaKey,
    recaptchaSiteKey,
    inviteToken,
    joinToken,
    invitationInfo,
    invitationError,
    setEmail,
    setPassword,
    setRecaptchaToken,
    handleLogin,
    handleForgotPassword,
    handleResendVerification,
    handleGoogleLogin,
  };
}
