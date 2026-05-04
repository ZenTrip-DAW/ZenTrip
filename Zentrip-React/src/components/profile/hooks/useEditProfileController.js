import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../config/routes';
import { saveUserProfile } from '../../../services/profileService';
import { validateProfileForm } from '../../../utils/validation/profile/rules';
import { isUsernameUnique, isPhoneUnique } from '../../../services/userService';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  username: '',
  bio: '',
  phone: '',
  country: '',
  language: 'Español',
  currency: 'EUR €',
  profilePhoto: '',
  avatarColor: '',
  tripGroupType: 'both',
  petFriendly: false,
};

export function useEditProfileController(navigate) {
  const { user, authLoading, profile, profileLoading, setProfile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [activeSection, setActiveSection] = useState('personal');
  const [form, setForm] = useState(INITIAL_FORM);
  const [savedForm, setSavedForm] = useState(INITIAL_FORM);

  // En onboarding, solo permitimos salir cuando los datos obligatorios ya están guardados en perfil.
  const hasSavedOnce = Boolean(
    profile?.firstName?.trim() && profile?.lastName?.trim() && profile?.username?.trim()
  );

  useEffect(() => {
    if (authLoading || profileLoading || !user) return;

    if (profile) {
      const loaded = { ...INITIAL_FORM, ...profile };
      setForm(loaded);
      setSavedForm(loaded);
      return;
    }

    const empty = { ...INITIAL_FORM, firstName: '', lastName: '', profilePhoto: '', avatarColor: '' };
    setForm(empty);
    setSavedForm(empty);
  }, [user, authLoading, profileLoading, profile]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    const errors = validateProfileForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const personalFields = ['firstName', 'lastName', 'username', 'phone', 'profilePhoto'];
      if (Object.keys(errors).some((k) => personalFields.includes(k))) {
        setActiveSection('personal');
      }
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const [usernameOk, phoneOk] = await Promise.all([
        isUsernameUnique(form.username, user.uid).catch(() => true),
        form.phone ? isPhoneUnique(form.phone, user.uid).catch(() => true) : Promise.resolve(true),
      ]);

      const uniqueErrors = {};
      if (!usernameOk) uniqueErrors.username = 'Este nombre de usuario ya está en uso.';
      if (!phoneOk) uniqueErrors.phone = 'Este teléfono ya está registrado.';

      if (Object.keys(uniqueErrors).length > 0) {
        setFieldErrors(uniqueErrors);
        setActiveSection('personal');
        setSaving(false);
        return;
      }

      await saveUserProfile(user, form);
      setProfile((prev) => ({
        ...(prev || {}),
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        profilePhoto: form.profilePhoto,
        displayName: `${form.firstName} ${form.lastName}`.trim(),
      }));
      await refreshProfile();
      setSavedForm({ ...form });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('No se pudo guardar el perfil. Inténtalo de nuevo.');
    }
    setSaving(false);
  };

  const handleClose = () => navigate(ROUTES.HOME);

  return {
    user,
    loading: authLoading,
    saving,
    success,
    error,
    fieldErrors,
    form,
    activeSection,
    hasSavedOnce,
    isDirty,
    setActiveSection,
    handleChange,
    handleSave,
    handleClose,
    setForm,
  };
}
