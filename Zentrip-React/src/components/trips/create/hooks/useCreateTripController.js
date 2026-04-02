import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';
import { useAuth } from '../../../../context/AuthContext';
import { createTrip } from '../../../../services/tripService';

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
  invitados: [],
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
      const exists = prev.invitados.some((item) => item.uid === member.uid);
      if (exists) return prev;

      return {
        ...prev,
        invitados: [
          ...prev.invitados,
          {
            id: member.uid,
            uid: member.uid,
            nombre: member.nombre,
            username: member.username,
            avatar: member.avatar,
            tipo: 'miembro',
          },
        ],
      };
    });
  };

  const handleEliminarInvitado = (participantId) => {
    setForm((prev) => ({
      ...prev,
      invitados: prev.invitados.filter((item) => item.id !== participantId),
    }));
  };

  const handleCrearViaje = async () => {
    if (!user?.uid) return;

    await createTrip(user.uid, form);
    localStorage.removeItem(STORAGE_KEY);
    navigate(ROUTES.HOME);
  };

  return {
    step,
    form,
    fieldErrors,
    handleChange,
    handleSiguiente,
    handleAtras,
    handleAgregarMiembro,
    handleEliminarInvitado,
    handleCrearViaje,
  };
}
