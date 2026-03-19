import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { ROUTES } from '../../../config/routes';
import { getUserProfile, saveUserProfile } from '../services/editProfileFirebaseService';
import { validateProfileForm } from '../../../utils/validation/profile/rules';

const INITIAL_FORM = {
  nombre: '',
  apellidos: '',
  username: '',
  bio: '',
  telefono: '',
  pais: 'España',
  idioma: 'Español',
  moneda: 'EUR €',
  fotoPerfil: '',
  viajesSoloGrupo: 'ambos',
  petFriendly: false,
};

export function useEditProfileController(navigate) {
  const { user, loading: authLoading } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeSection, setActiveSection] = useState('datosPersonales');
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (authLoading || !user) return;

    getUserProfile(user.uid)
      .then((data) => {
        if (data) {
          setForm((prev) => ({ ...prev, ...data }));
        } else {
          const [nombre = '', ...rest] = (user.displayName || '').split(' ');
          setForm((prev) => ({ ...prev, nombre, apellidos: rest.join(' '), fotoPerfil: user.photoURL || '' }));
        }
      })
      .catch((err) => console.error('Error loading profile:', err));
  }, [user, authLoading]);

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
      return;
    }

    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      await saveUserProfile(user, form);
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
    setActiveSection,
    handleChange,
    handleGuardar,
    handleCerrar,
    setForm,
  };
}
