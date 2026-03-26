import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../config/routes';
import { saveUserProfile } from '../../../services/profileService';
import { validateProfileForm } from '../../../utils/validation/profile/rules';

const INITIAL_FORM = {
  nombre: '',
  apellidos: '',
  username: '',
  bio: '',
  telefono: '',
  pais: '',
  idioma: 'Español',
  moneda: 'EUR €',
  fotoPerfil: '',
  avatarColor: '',
  viajesSoloGrupo: 'ambos',
  petFriendly: false,
};

export function useEditProfileController(navigate) {
  const { user, authLoading, profile, profileLoading, setProfile, refreshProfile } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeSection, setActiveSection] = useState('datosPersonales');
  const [form, setForm] = useState(INITIAL_FORM);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  useEffect(() => {
    if (authLoading || profileLoading || !user) return;

    if (profile) {
      setForm((prev) => ({ ...prev, ...profile }));
      if (profile.nombre?.trim() && profile.apellidos?.trim() && profile.username?.trim()) {
        setHasSavedOnce(true);
      }
      return;
    }

    setForm((prev) => ({
      ...prev,
      nombre: '',
      apellidos: '',
      fotoPerfil: '',
      avatarColor: '',
    }));
  }, [user, authLoading, profileLoading, profile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!user) return;

    const errors = validateProfileForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const personalFields = ['nombre', 'apellidos', 'username', 'telefono', 'fotoPerfil'];
      if (Object.keys(errors).some((k) => personalFields.includes(k))) {
        setActiveSection('datosPersonales');
      }
      return;
    }

    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      await saveUserProfile(user, form);
      setProfile((prev) => ({
        ...(prev || {}),
        nombre: form.nombre,
        apellidos: form.apellidos,
        username: form.username,
        fotoPerfil: form.fotoPerfil,
        displayName: `${form.nombre} ${form.apellidos}`.trim(),
      }));
      await refreshProfile();
      setHasSavedOnce(true);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('No se pudo guardar el perfil. Inténtalo de nuevo.');
    }
    setGuardando(false);
  };

  const handleCerrar = () => navigate(ROUTES.HOME);

  return {
    usuario: user,
    cargando: authLoading,
    guardando,
    exito,
    error,
    fieldErrors,
    form,
    activeSection,
    hasSavedOnce,
    setActiveSection,
    handleChange,
    handleGuardar,
    handleCerrar,
    setForm,
  };
}
