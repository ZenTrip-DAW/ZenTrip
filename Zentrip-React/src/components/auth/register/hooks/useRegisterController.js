import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { auth } from '../../../../config/firebaseConfig';
import { ROUTES } from '../../../../config/routes';
import { apiClient } from '../../../../services/apiClient';
import { getOrCreateUserProfile, getPostLoginPath } from '../../../../services/userService';
import { getFirebaseErrorByField } from '../../../../utils/errors/firebaseErrors';
import {
  validateEmail,
  validatePassword,
  validatePolicies,
  validateConfirmPassword,
} from '../../../../utils/validation/register/rules';
import { registerFeedbackMessages } from '../../../../utils/validation/register/messages';
import {
  saveUserToken,
  signInWithGoogle,
  signOutUser,
  verifyRecaptchaToken,
} from '../../login/services/loginFirebaseService';

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

export function useRegisterController(navigate) {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() || '';
  const { inviteToken, joinToken } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const emailToken = params.get('inviteToken');
    const publicToken = params.get('join') || params.get('tripInviteToken');
    return {
      inviteToken: emailToken ? emailToken.trim() : '',
      joinToken: publicToken ? publicToken.trim() : '',
    };
  }, []);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    policies: false,
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaKey, setRecaptchaKey] = useState(0);
  const [invitationInfo, setInvitationInfo] = useState(null);
  const [invitationError, setInvitationError] = useState('');

  useEffect(() => {
    if (!inviteToken && !joinToken) return;

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
          setForm((prev) => ({ ...prev, email: data.email }));
        }
      })
      .catch((error) => {
        if (!active) return;
        setInvitationInfo(null);
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

  const validateField = (name, value, allValues = form) => {
    switch (name) {
      case 'email': {
        const emailErrors = validateEmail(value);
        return emailErrors.length > 0 ? emailErrors[0] : '';
      }
      case 'password':
        return validatePassword(value, allValues.confirmPassword);
      case 'confirmPassword':
        return validateConfirmPassword(value, allValues.password);
      case 'policies': {
        const policiesErrors = validatePolicies(value);
        return policiesErrors.length > 0 ? policiesErrors[0] : '';
      }
      default:
        return '';
    }
  };

  const handleFieldChange = (event) => {
    const { name, type, value, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    const nextForm = { ...form, [name]: fieldValue };

    setForm(nextForm);
    setErrors({
      email: validateField('email', nextForm.email, nextForm),
      password: validateField('password', nextForm.password, nextForm),
      confirmPassword: validateField('confirmPassword', nextForm.confirmPassword, nextForm),
      policies: validateField('policies', nextForm.policies, nextForm),
    });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setGeneralError(null);
    setSuccess(false);

    const nextErrors = {
      email: validateField('email', form.email, form),
      password: validateField('password', form.password, form),
      confirmPassword: validateField('confirmPassword', form.confirmPassword, form),
      policies: validateField('policies', form.policies, form),
    };

    setErrors(nextErrors);

    if (
      nextErrors.email
      || nextErrors.policies
      || nextErrors.confirmPassword
      || (Array.isArray(nextErrors.password) && nextErrors.password.some((rule) => rule.valid === false))
    ) {
      return;
    }

    if (recaptchaSiteKey && !recaptchaToken) {
      setGeneralError('Por favor, completa el reCAPTCHA.');
      return;
    }

    try {
      if (recaptchaSiteKey) {
        await verifyRecaptchaToken(recaptchaToken);
      }

      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const { user } = userCredential;

      await sendEmailVerification(user, { url: `${window.location.origin}${ROUTES.AUTH.ACTION}` });
      await getOrCreateUserProfile(user);

      const idToken = await user.getIdToken();
      localStorage.setItem('firebaseIdToken', idToken);

      if (inviteToken) {
        try {
          await apiClient.post('/invitations/accept', { token: inviteToken });
        } catch (acceptError) {
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

      await signOutUser();
      localStorage.removeItem('firebaseIdToken');

      setSuccess(true);
      navigate(ROUTES.AUTH.VERIFY_EMAIL, { state: { email: user.email || form.email } });
    } catch (registerError) {
      if (!registerError.code) {
        setGeneralError(registerError.message);
      } else {
        const { field, message } = getFirebaseErrorByField(registerError);
        if (field === 'email' || field === 'password') {
          setErrors((previous) => ({ ...previous, [field]: message }));
        } else {
          setGeneralError(message);
        }
      }
    } finally {
      setRecaptchaToken(null);
      setRecaptchaKey((prev) => prev + 1);
    }
  };

  const handleGoogleSignUp = async () => {
    setGeneralError(null);

    try {
      const user = await signInWithGoogle();
      await getOrCreateUserProfile(user);
      await saveUserToken(user);

      if (inviteToken) {
        try {
          await apiClient.post('/invitations/accept', { token: inviteToken });
        } catch (acceptError) {
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

      if (inviteToken && invitationInfo?.tripName) {
        window.dispatchEvent(new CustomEvent('zt-invitation-accepted-email', { detail: { tripName: invitationInfo.tripName } }));
      }

      navigate(await getPostLoginPath(user));
    } catch (googleError) {
      const { message } = getFirebaseErrorByField(googleError);
      setGeneralError(message || registerFeedbackMessages.googleGenericError);
    }
  };

  return {
    form,
    errors,
    generalError,
    success,
    successMessage: registerFeedbackMessages.success,
    hasRegisterMessage: Boolean(generalError || success),
    inviteToken,
    joinToken,
    invitationInfo,
    invitationError,
    recaptchaKey,
    recaptchaSiteKey,
    setRecaptchaToken,
    handleFieldChange,
    handleRegister,
    handleGoogleSignUp,
  };
}
