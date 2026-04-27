import { useState, useRef } from 'react';
import { X, MapPin, Clock, FileText, Tag, UserCircle, AlertCircle, AlertTriangle, Pencil } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import Button from '../../../../ui/Button';

const LIBRARIES = ['places'];
const NOTES_MAX = 300;
const NAME_MAX = 50;

function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="flex items-center gap-1 body-3 text-feedback-error mt-0.5">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </span>
  );
}

function timeLt(a, b) {
  return a && b && a >= b;
}

function timesOverlap(newStart, newEnd, existStart, existEnd) {
  if (!existStart || !existEnd) return false;
  return newStart < existEnd && newEnd > existStart;
}

// mode: 'create' | 'view' | 'edit'
export default function AddActivityModal({ date, creator, existingActivities = [], onClose, onSave, onUpdate, mode = 'create', initialActivity = null }) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const [name, setName] = useState(initialActivity?.name ?? '');
  const [startTime, setStartTime] = useState(initialActivity?.startTime ?? '');
  const [endTime, setEndTime] = useState(initialActivity?.endTime ?? '');
  const [address, setAddress] = useState(initialActivity?.address ?? '');
  const [notes, setNotes] = useState(initialActivity?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOverlapWarn, setShowOverlapWarn] = useState(false);
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
    name: !name.trim()
      ? 'El nombre es obligatorio'
      : name.trim().length > NAME_MAX
        ? `Máximo ${NAME_MAX} caracteres`
        : null,
    startTime: !startTime ? 'La hora de inicio es obligatoria' : null,
    endTime: !endTime
      ? 'La hora de fin es obligatoria'
      : timeLt(startTime, endTime)
        ? 'La hora de fin debe ser posterior a la de inicio'
        : null,
    address: !address.trim() ? 'La dirección es obligatoria' : null,
  };

  const isValid = !Object.values(errors).some(Boolean);

  const otherActivities = existingActivities.filter((a) => a.id !== initialActivity?.id);
  const hasOverlap = isValid && otherActivities.some(
    (act) => act.startTime && act.endTime && timesOverlap(startTime, endTime, act.startTime, act.endTime)
  );

  const doSave = async () => {
    setSaving(true);
    if (isEdit) {
      await onUpdate(initialActivity.id, {
        name: name.trim(),
        startTime,
        endTime,
        address: address.trim(),
        notes: notes.trim() || null,
      });
    } else {
      await onSave({
        date,
        name: name.trim(),
        startTime,
        endTime,
        address: address.trim(),
        notes: notes.trim() || null,
        type: 'actividad',
        status: 'pendiente',
        source: 'manual',
        createdBy: creator ?? null,
      });
    }
    setSaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    if (hasOverlap) { setShowOverlapWarn(true); return; }
    await doSave();
  };

  const inputBase = 'border rounded-xl px-3 py-2 body-2 text-secondary-5 placeholder:text-neutral-3 focus:outline-none focus:ring-2 transition-colors';
  const inputOk = `${inputBase} border-neutral-2 focus:ring-primary-3/40`;
  const inputErr = `${inputBase} border-feedback-error focus:ring-feedback-error/30 bg-feedback-error-bg/30`;
  const inputReadOnly = `${inputBase} border-neutral-1 bg-neutral-1 text-neutral-5 cursor-default`;
  const fieldClass = (field) => (submitted && errors[field] ? inputErr : inputOk);

  const addressInput = (
    <input
      type="text"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="Busca una dirección..."
      className={`w-full ${fieldClass('address')}`}
      readOnly={isView}
    />
  );

  const titleMap = { create: 'Nueva actividad', view: 'Detalle de actividad', edit: 'Editar actividad' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto">

        {/* Aviso solapamiento */}
        {showOverlapWarn && (
          <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col gap-4 p-6 justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="title-h3-desktop text-secondary-5">Horario ocupado</h3>
            </div>
            <p className="body-2 text-neutral-4">
              Ya tienes una actividad dentro de este tiempo. ¿Seguro que deseas agregar otra?
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="ghost" className="flex-1 w-auto!" onClick={() => setShowOverlapWarn(false)}>
                Revisar horario
              </Button>
              <Button variant="orange" className="flex-1 w-auto!" disabled={saving} onClick={async () => { setShowOverlapWarn(false); await doSave(); }}>
                {saving ? 'Guardando...' : 'Sí, agregar'}
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="title-h3-desktop text-secondary-5">{titleMap[mode]}</h2>
          <div className="flex items-center gap-1">
            {isView && (
              <button
                type="button"
                title="Editar actividad"
                onClick={() => onUpdate('__switch_to_edit__')}
                className="cursor-pointer p-1.5 rounded-full text-neutral-3 hover:text-secondary-5 hover:bg-secondary-1 transition"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={onClose} className="text-neutral-3 hover:text-neutral-5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={isView ? (e) => e.preventDefault() : handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary-3" />
              Nombre {!isView && <span className="text-feedback-error">*</span>}
            </label>
            {isView ? (
              <p className={`${inputReadOnly} px-3 py-2`}>{name || '—'}</p>
            ) : (
              <>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, NAME_MAX + 1))}
                  placeholder="Ej. Visita al museo"
                  className={fieldClass('name')}
                />
                <div className="flex items-start justify-between gap-2">
                  {submitted ? <FieldError message={errors.name} /> : <span />}
                  <span className={`body-3 shrink-0 ${name.length >= NAME_MAX ? 'text-feedback-error' : 'text-neutral-3'}`}>
                    {name.length}/{NAME_MAX}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Horario */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-3" />
              Horario {!isView && <span className="text-feedback-error">*</span>}
            </label>
            <div className="flex gap-3 items-start">
              <div className="flex-1 flex flex-col gap-1">
                <span className="body-3 text-neutral-3">Inicio</span>
                {isView ? (
                  <p className={`${inputReadOnly} px-3 py-2`}>{startTime || '—'}</p>
                ) : (
                  <>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={fieldClass('startTime')}
                    />
                    {submitted && <FieldError message={errors.startTime} />}
                  </>
                )}
              </div>
              <span className="body-3 text-neutral-3 mt-8">—</span>
              <div className="flex-1 flex flex-col gap-1">
                <span className="body-3 text-neutral-3">Fin</span>
                {isView ? (
                  <p className={`${inputReadOnly} px-3 py-2`}>{endTime || '—'}</p>
                ) : (
                  <>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={fieldClass('endTime')}
                    />
                    {submitted && <FieldError message={errors.endTime} />}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary-3" />
              Dirección {!isView && <span className="text-feedback-error">*</span>}
            </label>
            {isView ? (
              <p className={`${inputReadOnly} px-3 py-2 wrap-break-word`}>{address || '—'}</p>
            ) : isLoaded ? (
              <Autocomplete onLoad={(ac) => { acRef.current = ac; }} onPlaceChanged={handlePlaceChanged}>
                {addressInput}
              </Autocomplete>
            ) : addressInput}
            {!isView && submitted && <FieldError message={errors.address} />}
          </div>

          {/* Notas */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary-3" />
              Notas
            </label>
            {isView ? (
              <p className={`${inputReadOnly} px-3 py-2 wrap-break-word`}>{notes || '—'}</p>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Creado por */}
          {(creator || initialActivity?.createdBy?.name) && (
            <div className="flex items-center gap-2 py-2 px-3 bg-neutral-1 rounded-xl">
              <UserCircle className="w-4 h-4 text-neutral-4 shrink-0" />
              <span className="body-3 text-neutral-4">
                {isView ? 'Creado por' : 'Creado por'}{' '}
                <span className="font-semibold text-secondary-5">
                  {initialActivity?.createdBy?.name ?? creator?.name}
                </span>
              </span>
            </div>
          )}

          {/* Acciones */}
          {!isView && (
            <div className="flex gap-3 mt-1">
              <Button type="button" variant="ghost" className="flex-1 w-auto!" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="orange" className="flex-1 w-auto!" disabled={saving}>
                {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Añadir'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
