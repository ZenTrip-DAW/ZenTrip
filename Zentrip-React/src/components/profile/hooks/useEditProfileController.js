import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../auth/register/firebaseConfig';
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
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeSection, setActiveSection] = useState('datosPersonales');
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCargando(false);
        return;
      }
      setUsuario(user);
      try {
        const data = await getUserProfile(user.uid);
        if (data) {
          setForm((prev) => ({ ...prev, ...data }));
        } else {
          const [nombre = '', ...resto] = (user.displayName || '').split(' ');
          setForm((prev) => ({
            ...prev,
            nombre,
            apellidos: resto.join(' '),
            fotoPerfil: user.photoURL || '',
          }));
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      }
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!usuario) return;

    const errors = validateProfileForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      await saveUserProfile(usuario, form);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
    } catch (err) {
      console.error('Error guardando perfil:', err);
      setError('No se pudo guardar el perfil. Inténtalo de nuevo.');
    }
    setGuardando(false);
  };

  const handleCancelar = () => navigate('/home');

  return {
    usuario,
    cargando,
    guardando,
    exito,
    error,
    fieldErrors,
    form,
    activeSection,
    setActiveSection,
    handleChange,
    handleGuardar,
    handleCancelar,
    setForm,
  };
}
