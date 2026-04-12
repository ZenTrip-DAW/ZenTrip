import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';

const STORAGE_KEY = 'zentrip:create-trip-wizard';

const INITIAL_FORM = {
  nombre: '',
  origen: '',
  destino: '',
  fechaInicio: '',
  fechaFin: '',
  divisa: '',
  presupuesto: '',
  conMascota: false,
  miembros: [],
};

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export { STORAGE_KEY, INITIAL_FORM };

export function useTripDraft() {
  const navigate = useNavigate();
  const pageIsUnloadingRef = useRef(false);

  const [step, setStep] = useState(() => {
    const saved = loadDraft();
    return Number.isInteger(saved?.step) ? Math.min(Math.max(saved.step, 0), 2) : 0;
  });

  const [form, setForm] = useState(() => {
    const saved = loadDraft();
    return saved?.form ? { ...INITIAL_FORM, ...saved.form } : INITIAL_FORM;
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Persiste el borrador en cada cambio.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, form }));
  }, [step, form]);

  // Marca si la página se está recargando (F5) para no borrar el borrador.
  useEffect(() => {
    const mark = () => { pageIsUnloadingRef.current = true; };
    window.addEventListener('beforeunload', mark);
    return () => window.removeEventListener('beforeunload', mark);
  }, []);

  // Limpia el borrador al navegar internamente.
  useEffect(() => {
    return () => {
      if (!pageIsUnloadingRef.current) localStorage.removeItem(STORAGE_KEY);
    };
  }, []);

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
    if (e?.preventDefault) e.preventDefault();
    if (step === 0) {
      const errors = validate();
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    }
    if (step < 2) setStep((s) => s + 1);
  };

  const handleAtras = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigate(ROUTES.HOME);
  };

  const handleGoToStep = (index) => {
    if (index >= 0 && index <= step) setStep(index);
  };

  return {
    step,
    form,
    setForm,
    fieldErrors,
    handleChange,
    handleSiguiente,
    handleAtras,
    handleGoToStep,
  };
}
