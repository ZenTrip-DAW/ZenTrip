import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});


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

  const handleSiguiente = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    navigate(ROUTES.TRIPS.INVITACIONES);
  };

  const handleCancelar = () => navigate(ROUTES.HOME);

  return {
    form,
    fieldErrors,
    handleChange,
    handleSiguiente,
    handleCancelar,
  };
}
