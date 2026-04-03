import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';
import { useAuth } from '../../../../context/AuthContext';
import { createTrip, getTripPublicInviteLink, getTripPublicInvitePreview, sendTripInvitations } from '../../../../services/tripService';

// Nombre para guardar el progreso en el navegador.
const STORAGE_KEY = 'zentrip:create-trip-wizard';

// Valores por defecto del formulario.
const INITIAL_FORM = {
  nombre: '',
  origen: '',
  destino: '',
  fechaInicio: '',
  fechaFin: '',
  divisa: 'EUR - EURO',
  presupuesto: '',
  conMascota: false,
  miembros: [],
};

export function useCreateTripController() {
  const navigate = useNavigate();

  // Paso actual del formulario (0, 1, 2).
  const { user } = useAuth();

  const [step, setStep] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 0;
      const saved = JSON.parse(raw);
      return Number.isInteger(saved?.step) ? Math.min(Math.max(saved.step, 0), 2) : 0;
    } catch {
      return 0;
    }
  });

  // Todos los datos que va rellenando el usuario.
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return INITIAL_FORM;
      const saved = JSON.parse(raw);
      return saved?.form ? { ...INITIAL_FORM, ...saved.form } : INITIAL_FORM;
    } catch {
      return INITIAL_FORM;
    }
  });

  // Errores para mostrar debajo de los campos.
  const [fieldErrors, setFieldErrors] = useState({});
  const [previewJoinToken, setPreviewJoinToken] = useState('');
  const [enlaceInvitacion, setEnlaceInvitacion] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [tripCreationLocked, setTripCreationLocked] = useState(false);
  const creatingTripRef = useRef(false);
  const pageIsUnloadingRef = useRef(false);

  useEffect(() => {
    let active = true;

    getTripPublicInvitePreview()
      .then((data) => {
        if (!active) return;
        setPreviewJoinToken(data?.token || '');
        setEnlaceInvitacion(data?.shareLink || '');
      })
      .catch((error) => {
        if (!active) return;
        console.warn('No se pudo obtener preview de enlace de invitación:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  // Conserva el borrador solo en recarga real de página (F5/refresh).
  useEffect(() => {
    const markPageUnload = () => {
      pageIsUnloadingRef.current = true;
    };

    window.addEventListener('beforeunload', markPageUnload);

    return () => {
      window.removeEventListener('beforeunload', markPageUnload);
    };
  }, []);

  // Si se abandona la pantalla por navegación interna, se limpia el borrador.
  useEffect(() => {
    return () => {
      if (!pageIsUnloadingRef.current) {
        localStorage.removeItem(STORAGE_KEY);
      }
    };
  }, []);

  // Cada cambio se guarda para no perder datos al recargar.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, form }));
  }, [step, form]);

  // Actualiza el campo que se está editando.
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Si el usuario corrige, se limpia su error.
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Reglas básicas para poder pasar al siguiente paso.
  const validate = () => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre del viaje es obligatorio.';
    if (!form.divisa) errors.divisa = 'La divisa es obligatoria.';
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
      errors.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio.';
    }
    return errors;
  };

  // Ir al siguiente paso.
  const handleSiguiente = (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (step === 0) {
      const errors = validate();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    if (step < 2) {
      setStep((s) => s + 1);
    }
  };

  // Volver al paso anterior o salir a Home.
  const handleAtras = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      navigate(ROUTES.HOME);
    }
  };

  const handleAgregarMiembro = (member) => {
    if (!member?.uid) return;

    setForm((prev) => {
      const exists = prev.miembros.some((item) => item.uid === member.uid);
      if (exists) return prev;

      return {
        ...prev,
        miembros: [
          ...prev.miembros,
          {
            id: member.uid,
            uid: member.uid,
            email: member.email || '',
            nombre: member.nombre,
            username: member.username,
            avatar: member.avatar,
            tipo: 'miembro',
            estadoInvitacion: 'pendiente',
          },
        ],
      };
    });
  };

  const handleAgregarInvitadoEmail = (invitedUser) => {
    const email = String(invitedUser?.email || '').trim().toLowerCase();
    if (!email) return;

    setForm((prev) => {
      const exists = prev.miembros.some(
        (item) => (item.email || '').toLowerCase() === email || (item.uid && item.uid === invitedUser?.uid),
      );

      if (exists) return prev;

      const isRegisteredMember = Boolean(invitedUser?.uid);

      return {
        ...prev,
        miembros: [
          ...prev.miembros,
          {
            id: invitedUser?.uid || email,
            uid: invitedUser?.uid || null,
            email,
            nombre: invitedUser?.nombre || email,
            avatar: invitedUser?.avatar || '',
            tipo: isRegisteredMember ? 'miembro' : 'email',
            estadoInvitacion: isRegisteredMember ? 'pendiente' : 'pendiente_correo',
          },
        ],
      };
    });
  };

  const handleEliminarInvitado = (participantId) => {
    setForm((prev) => ({
      ...prev,
      miembros: prev.miembros.filter((item) => item.id !== participantId),
    }));
  };

  const handleCrearViaje = async () => {
    if (!user?.uid || creatingTripRef.current || tripCreationLocked) return;

    creatingTripRef.current = true;
    setIsCreatingTrip(true);

    let tripCreated = false;

    try {
      const tripId = await createTrip(user.uid, form);
      tripCreated = true;
      setTripCreationLocked(true);

      let sharedLink = '';
      try {
        const linkResponse = await getTripPublicInviteLink(tripId, previewJoinToken);
        sharedLink = linkResponse?.shareLink || '';

        if (sharedLink) {
          setEnlaceInvitacion(sharedLink);
        }

        if (sharedLink && navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(sharedLink);
        }
      } catch (error) {
        console.warn('No se pudo generar o copiar el enlace compartible del viaje:', error);
      }

      const pendingInvites = form.miembros.filter(
        (item) => item.email && (item.estadoInvitacion === 'pendiente' || item.estadoInvitacion === 'pendiente_correo'),
      );

      if (pendingInvites.length > 0) {
        try {
          const response = await sendTripInvitations({
            tripId,
            tripName: form.nombre,
            creatorName: user.displayName || user.email || 'ZenTrip',
            invites: pendingInvites,
          });

          if (response?.failed > 0) {
            console.warn('Invitaciones con errores:', response);
          } else {
            console.info('Invitaciones enviadas correctamente:', response);
          }
        } catch (error) {
          console.error('No se pudieron enviar todas las invitaciones por correo:', error);
        }
      }

      localStorage.removeItem(STORAGE_KEY);
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('No se pudo crear el viaje:', error);
      if (!tripCreated) {
        setTripCreationLocked(false);
      }
    } finally {
      creatingTripRef.current = false;
      setIsCreatingTrip(false);
    }
  };

  return {
    step,
    form,
    fieldErrors,
    isCreatingTrip,
    tripCreationLocked,
    enlaceInvitacion,
    handleChange,
    handleSiguiente,
    handleAtras,
    handleAgregarMiembro,
    handleAgregarInvitadoEmail,
    handleEliminarInvitado,
    handleCrearViaje,
  };
}
