import { useState, useRef } from 'react';
import { X, MapPin, Clock, FileText, Tag, UserCircle, AlertCircle } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import Button from '../../../../ui/Button';

const LIBRARIES = ['places'];
const NOTES_MAX = 300;

function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="flex items-center gap-1 body-3 text-feedback-error mt-0.5">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </span>
  );
}

export default function AddActivityModal({ date, creator, onClose, onSave }) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const acRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const handlePlaceChanged = () => {
    const place = acRef.current?.getPlace();
    if (place?.formatted_address) setAddress(place.formatted_address);
    else if (place?.name) setAddress(place.name);
  };

  const errors = {
    name: !name.trim() ? 'El nombre es obligatorio' : null,
    startTime: !startTime ? 'La hora de inicio es obligatoria' : null,
    endTime: !endTime ? 'La hora de fin es obligatoria' : null,
    address: !address.trim() ? 'La dirección es obligatoria' : null,
  };

  const isValid = !Object.values(errors).some(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    setSaving(true);
    await onSave({
      date,
      name: name.trim(),
      startTime,
      endTime,
      address: address.trim(),
      notes: notes.trim() || null,
      type: 'actividad',
      status: 'pendiente',
      createdBy: creator ?? null,
    });
    setSaving(false);
  };

  const inputBase = 'border rounded-xl px-3 py-2 body-2 text-secondary-5 placeholder:text-neutral-3 focus:outline-none focus:ring-2 transition-colors';
  const inputOk = `${inputBase} border-neutral-2 focus:ring-primary-3/40`;
  const inputErr = `${inputBase} border-feedback-error focus:ring-feedback-error/30 bg-feedback-error-bg/30`;

  const fieldClass = (field) => (submitted && errors[field] ? inputErr : inputOk);

  const addressInput = (
    <input
      type="text"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="Busca una dirección..."
      className={`w-full ${fieldClass('address')}`}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="title-h3-desktop text-secondary-5">Nueva actividad</h2>
          <button type="button" onClick={onClose} className="text-neutral-3 hover:text-neutral-5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary-3" />
              Nombre <span className="text-feedback-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Visita al museo"
              className={fieldClass('name')}
            />
            {submitted && <FieldError message={errors.name} />}
          </div>

          {/* Horario */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-3" />
              Horario <span className="text-feedback-error">*</span>
            </label>
            <div className="flex gap-3 items-start">
              <div className="flex-1 flex flex-col gap-1">
                <span className="body-3 text-neutral-3">Inicio</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={fieldClass('startTime')}
                />
                {submitted && <FieldError message={errors.startTime} />}
              </div>
              <span className="body-3 text-neutral-3 mt-8">—</span>
              <div className="flex-1 flex flex-col gap-1">
                <span className="body-3 text-neutral-3">Fin</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={startTime || undefined}
                  className={fieldClass('endTime')}
                />
                {submitted && <FieldError message={errors.endTime} />}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-3" />
              Dirección <span className="text-feedback-error">*</span>
            </label>
            {isLoaded ? (
              <Autocomplete onLoad={(ac) => { acRef.current = ac; }} onPlaceChanged={handlePlaceChanged}>
                {addressInput}
              </Autocomplete>
            ) : addressInput}
            {submitted && <FieldError message={errors.address} />}
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary-3" />
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
              placeholder="Cualquier detalle adicional..."
              rows={3}
              className={`${inputOk} resize-none`}
            />
            <span className={`body-3 text-right ${notes.length >= NOTES_MAX ? 'text-feedback-error' : 'text-neutral-3'}`}>
              {notes.length}/{NOTES_MAX}
            </span>
          </div>

          {/* Creado por */}
          {creator && (
            <div className="flex items-center gap-2 py-2 px-3 bg-neutral-1 rounded-xl">
              <UserCircle className="w-4 h-4 text-neutral-4 shrink-0" />
              <span className="body-3 text-neutral-4">
                Creado por <span className="font-semibold text-secondary-5">{creator.name}</span>
              </span>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 mt-1">
            <Button type="button" variant="ghost" className="flex-1 w-auto!" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="orange" className="flex-1 w-auto!" disabled={saving}>
              {saving ? 'Guardando...' : 'Añadir'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
