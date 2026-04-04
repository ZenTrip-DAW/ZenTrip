import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../../../../config/firebaseConfig';
import { ROUTES } from '../../../../config/routes';
import { useAuth } from '../../../../context/AuthContext';
import { getUserByUid } from '../../../../services/userService';
import { createTrip, getTripPublicInviteLink, getTripPublicInvitePreview, sendTripInvitations } from '../../../../services/tripService';

// Nombre para guardar el progreso en el navegador.
const STORAGE_KEY = 'zentrip:create-trip-wizard';
const RECENT_MEMBERS_KEY_PREFIX = 'zentrip:create-trip-recent-members';
const MAX_RECENT_MEMBERS = 8;

function getRecentMembersStorageKey(uid) {
  return `${RECENT_MEMBERS_KEY_PREFIX}:${uid}`;
}

function normalizeRecentMembers(items = [], currentUserUid = '') {
  const seen = new Set();
  const seenEmails = new Set();
  const normalized = [];

  for (const item of items) {
    const uid = String(item?.uid || '').trim();
    const email = String(item?.email || '').trim().toLowerCase();
    if (!uid || uid === currentUserUid || seen.has(uid)) continue;
    if (email && seenEmails.has(email)) continue;

    const rawFirstName = String(item?.nombre || '').trim();
    const rawLastName = String(item?.apellidos || '').trim();
    const emailLocalPart = email.includes('@') ? email.split('@')[0] : '';

    // Limpia datos legacy donde "nombre" era la parte local del email.
    const cleanedFirstName = rawFirstName && rawFirstName !== emailLocalPart ? rawFirstName : '';

    // Si "nombre" es el nombre completo (tiene espacio) y "apellidos" está vacío, separar.
    let firstName = cleanedFirstName;
    let lastName = rawLastName;
    if (firstName && firstName.includes(' ') && !lastName) {
      const parts = firstName.split(/\s+/).filter(Boolean);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    seen.add(uid);
    if (email) seenEmails.add(email);
    normalized.push({
      id: uid,
      uid,
      nombre: firstName,
      apellidos: lastName,
      email,
      username: String(item?.username || '').trim(),
      avatar: item?.avatar || '',
    });

    if (normalized.length >= MAX_RECENT_MEMBERS) break;
  }

  return normalized;
}

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

  const [recientes, setRecientes] = useState([]);

  // Paso actual del formulario (0, 1, 2).
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) {
      setRecientes([]);
      return;
    }

    try {
      const raw = localStorage.getItem(getRecentMembersStorageKey(user.uid));
      if (!raw) {
        setRecientes([]);
        return;
      }

      const saved = JSON.parse(raw);
      setRecientes(normalizeRecentMembers(Array.isArray(saved) ? saved : [], user.uid));
    } catch {
      setRecientes([]);
    }
  }, [user?.uid]);

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
    if (!user?.uid) return;

    let active = true;

    const loadRecientesFromPreviousTrips = async () => {
      try {
        const tripsQuery = query(
          collection(db, 'viajes'),
          where('uid', '==', user.uid),
          limit(20),
        );

        const tripsSnapshot = await getDocs(tripsQuery);
        const membersFromTrips = [];

        for (const tripDoc of tripsSnapshot.docs) {
          const membersSnapshot = await getDocs(collection(db, 'viajes', tripDoc.id, 'miembros'));

          membersSnapshot.forEach((memberDoc) => {
            const data = memberDoc.data() || {};
            const memberUid = String(data.uid || '').trim();
            const memberEmail = String(data.email || '').trim().toLowerCase();

            if (!memberUid || memberUid === user.uid) return;

            membersFromTrips.push({
              id: memberUid,
              uid: memberUid,
              nombre: String(data.nombre || '').trim(),
              apellidos: String(data.apellidos || '').trim(),
              email: memberEmail,
              username: String(data.username || '').trim(),
              avatar: data.avatar || data.fotoPerfil || '',
            });
          });
        }

        if (!active) return;

        let cachedRecents = [];
        try {
          const raw = localStorage.getItem(getRecentMembersStorageKey(user.uid));
          cachedRecents = normalizeRecentMembers(raw ? JSON.parse(raw) : [], user.uid);
        } catch {
          cachedRecents = [];
        }

        const mergedBaseRecents = normalizeRecentMembers([...cachedRecents, ...membersFromTrips], user.uid);
        const recentsToEnrich = mergedBaseRecents.slice(0, MAX_RECENT_MEMBERS);

        const profileEntries = await Promise.all(
          recentsToEnrich.map(async (recentMember) => {
            try {
              // Usar el endpoint de admin que bypasea las reglas de Firestore.
              const profile = await getUserByUid(recentMember.uid);

              let nombre = recentMember.nombre || '';
              let apellidos = recentMember.apellidos || '';
              let username = recentMember.username || '';
              let avatar = recentMember.avatar || '';

              if (profile) {
                const fullName = String(profile.nombre || '').trim();
                const parts = fullName.split(/\s+/).filter(Boolean);
                nombre = parts[0] || nombre;
                apellidos = parts.slice(1).join(' ') || apellidos;
                username = profile.username || username;
                avatar = profile.avatar || avatar;
              }

              return {
                ...recentMember,
                 nombre,
                 apellidos,
                 username,
                 avatar,
              };
            } catch {
              return recentMember;
            }
          }),
        );

        if (active) {
          setRecientes(normalizeRecentMembers(profileEntries, user.uid));
        }
      } catch (error) {
        console.warn('No se pudieron cargar miembros recientes desde viajes anteriores:', error);
      }
    };

    loadRecientesFromPreviousTrips();

    return () => {
      active = false;
    };
  }, [user?.uid]);

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

  useEffect(() => {
    if (!user?.uid) return;
    localStorage.setItem(
      getRecentMembersStorageKey(user.uid),
      JSON.stringify(normalizeRecentMembers(recientes, user.uid)),
    );
  }, [recientes, user?.uid]);

  const addToRecentMembers = (member) => {
    if (!member?.uid) return;

    setRecientes((prev) => {
      const normalized = {
        id: member.uid,
        uid: member.uid,
        nombre: String(member.nombre || '').trim(),
        apellidos: String(member.apellidos || '').trim(),
        email: String(member.email || '').trim().toLowerCase(),
        username: String(member.username || '').trim(),
        avatar: member.avatar || '',
      };

      return normalizeRecentMembers([normalized, ...prev], user?.uid || '');
    });
  };

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

      // Guardar miembros como recientes solo cuando el viaje se crea con éxito.
      for (const member of form.miembros) {
        if (member?.uid) addToRecentMembers(member);
      }

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
    recientes,
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
