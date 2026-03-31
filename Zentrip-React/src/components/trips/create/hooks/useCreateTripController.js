import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { createTrip } from '../../../../services/tripService';
import { ROUTES } from '../../../../config/routes';

const INITIAL_FORM = {
  nombre: '',
  origen: '',
  destino: '',
  fechaInicio: '',
  fechaFin: '',
  divisa: 'EUR - EURO',
  presupuesto: '',
  conMascota: false,
};

export function useCreateTripController() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = 'El nombre del viaje es obligatorio.';
    if (!form.divisa) errors.divisa = 'La divisa es obligatoria.';
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
      errors.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio.';
    }
    return errors;
  };

  const handleSiguiente = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await createTrip(user.uid, {
        ...form,
        presupuesto: form.presupuesto ? Number(form.presupuesto) : null,
      });
      navigate(ROUTES.HOME);
    } catch (err) {
      console.error('Error al crear el viaje:', err);
      setError('No se pudo crear el viaje. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => navigate(ROUTES.HOME);

  return {
    form,
    fieldErrors,
    guardando,
    error,
    handleChange,
    handleSiguiente,
    handleCancelar,
  };
}
