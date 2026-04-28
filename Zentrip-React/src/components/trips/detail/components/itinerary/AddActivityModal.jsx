import { useState, useRef, useEffect } from 'react';
import { X, MapPin, Clock, FileText, Tag, UserCircle, AlertCircle, AlertTriangle, Pencil, Image, CalendarDays, Plane, Hotel, Utensils, Car, Train } from 'lucide-react';
import AirportInput from '../bookings/flights/AirportInput';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import Button from '../../../../ui/Button';
import PassengerSelector from '../../../shared/PassengerSelector';
import BookingReceiptUpload from '../bookings/BookingReceiptUpload';

const LIBRARIES = ['places'];
const NOTES_MAX = 300;
const NAME_MAX = 50;

const TYPE_OPTIONS = [
  { value: 'actividad',   label: 'Actividad',   Icon: CalendarDays },
  { value: 'vuelo',       label: 'Vuelo',        Icon: Plane },
  { value: 'hotel',       label: 'Hotel',        Icon: Hotel },
  { value: 'restaurante', label: 'Restaurante',  Icon: Utensils },
  { value: 'coche',       label: 'Coche',        Icon: Car },
  { value: 'tren',        label: 'Tren',         Icon: Train },
];

function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="flex items-center gap-1 body-3 text-feedback-error mt-0.5">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </span>
  );
}

function timeLt(a, b) { return a && b && a >= b; }

function timesOverlap(newStart, newEnd, existStart, existEnd) {
  if (!existStart || !existEnd) return false;
  return newStart < existEnd && newEnd > existStart;
}

function getMemberNames(selectedMembers, members) {
  const accepted = members.filter((m) => m.invitationStatus === 'accepted');
  if (selectedMembers === 'all') return accepted.map((m) => m.name || m.username || 'Miembro');
  if (Array.isArray(selectedMembers)) {
    return selectedMembers.map((uid) => {
      const m = accepted.find((x) => x.uid === uid);
      return m ? (m.name || m.username || 'Miembro') : null;
    }).filter(Boolean);
  }
  return [];
}

function isPdfUrl(url) {
  return url?.startsWith('pdf::') ||
    url?.toLowerCase().includes('.pdf') ||
    url?.includes('/raw/upload/');
}

function getPrivatePdfId(url) {
  return url?.startsWith('pdf::') ? url.slice(5) : null;
}

// mode: 'create' | 'view' | 'edit'
export default function AddActivityModal({
  date, creator, existingActivities = [], members = [],
  onClose, onSave, onUpdate,
  mode = 'create', initialActivity = null,
}) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  const parseFlightAddress = (addr) => {
    if (!addr) return { origin: '', destination: '' };
    const parts = addr.split('→').map((s) => s.trim());
    return { origin: parts[0] || '', destination: parts[1] || '' };
  };

  const [activityType, setActivityType] = useState(initialActivity?.type ?? 'actividad');
  const isVuelo = activityType === 'vuelo';

  const [name, setName] = useState(initialActivity?.name ?? '');
  const [startTime, setStartTime] = useState(initialActivity?.startTime ?? '');
  const [endTime, setEndTime] = useState(initialActivity?.endTime ?? '');
  const [address, setAddress] = useState(
    initialActivity?.type === 'vuelo' ? '' : (initialActivity?.address ?? '')
  );
  // Guardar objeto con cityName y code para vuelo
  const [origin, setOrigin] = useState(
    initialActivity?.type === 'vuelo'
      ? parseFlightAddress(initialActivity?.address).origin
      : ''
  );
  const [originObj, setOriginObj] = useState(null);
  const [destination, setDestination] = useState(
    initialActivity?.type === 'vuelo'
      ? parseFlightAddress(initialActivity?.address).destination
      : ''
  );
  const [destinationObj, setDestinationObj] = useState(null);
  const [notes, setNotes] = useState(initialActivity?.notes ?? '');
  const [selectedMembers, setSelectedMembers] = useState(initialActivity?.members ?? 'all');
  const [receiptUrls, setReceiptUrls] = useState(initialActivity?.receiptUrls ?? []);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOverlapWarn, setShowOverlapWarn] = useState(false);
  const [viewingUrl, setViewingUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);

 
  const openPdf = async (entry) => {
    setPdfLoading(entry);
    try {
      window.open(entry, '_blank', 'noopener,noreferrer');
    } catch {
      // silently ignore — the user will see nothing happened
    } finally {
      setPdfLoading(null);
    }
  };
  const acRef = useRef(null);
  const addressRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  // Reposiciona el pac-container de Google en cada frame para que siga al input cuando el modal hace scroll
  useEffect(() => {
    if (!isLoaded) return;
    let rafId;
    let lastTop, lastLeft, lastWidth;
    const tick = () => {
      if (addressRef.current) {
        const rect = addressRef.current.getBoundingClientRect();
        const top = Math.round(rect.bottom + window.scrollY);
        const left = Math.round(rect.left + window.scrollX);
        const width = Math.round(rect.width);
        if (top !== lastTop || left !== lastLeft || width !== lastWidth) {
          lastTop = top; lastLeft = left; lastWidth = width;
          document.querySelectorAll('.pac-container').forEach((pac) => {
            pac.style.top = `${top}px`;
            pac.style.left = `${left}px`;
            pac.style.width = `${width}px`;
          });
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isLoaded]);

  const handlePlaceChanged = () => {
    const place = acRef.current?.getPlace();
    if (place?.formatted_address) setAddress(place.formatted_address);
    else if (place?.name) setAddress(place.name);
  };

  // Formato consistente: Ciudad (COD) → Ciudad (COD)
  const formatAirport = (obj, fallback) => {
    if (!obj) return fallback?.trim() || '';
    const city = obj.cityName || obj.label || obj.name || obj.code || fallback || '';
    const code = obj.code || '';
    return city && code ? `${city} (${code})` : city || code || fallback || '';
  };
  const finalAddress = isVuelo
    ? [formatAirport(originObj, origin), formatAirport(destinationObj, destination)].filter(Boolean).join(' → ')
    : address.trim();

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
    address: isVuelo
      ? (!origin.trim() || !destination.trim() ? 'Origen y destino son obligatorios' : null)
      : (!address.trim() ? 'La dirección es obligatoria' : null),
  };

  const isValid = !Object.values(errors).some(Boolean);

  const otherActivities = existingActivities.filter((a) => a.id !== initialActivity?.id);
  const hasOverlap = isValid && otherActivities.some(
    (act) => act.startTime && act.endTime && timesOverlap(startTime, endTime, act.startTime, act.endTime)
  );

  const doSave = async () => {
    setSaving(true);
    const status = activityType === 'actividad' ? 'pendiente' : 'reservado';
    if (isEdit) {
      await onUpdate(initialActivity.id, {
        name: name.trim(), startTime, endTime,
        address: finalAddress, notes: notes.trim() || null,
        type: activityType, status, members: selectedMembers, receiptUrls,
      });
    } else {
      await onSave({
        date, name: name.trim(), startTime, endTime,
        address: finalAddress, notes: notes.trim() || null,
        type: activityType, status, source: 'manual',
        createdBy: creator ?? null, members: selectedMembers, receiptUrls,
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

  const addressMeta = {
    tren: { label: 'Ruta del tren', placeholder: 'Ej. Madrid → Barcelona' },
  }[activityType] ?? { label: 'Dirección', placeholder: 'Busca una dirección...' };

  const inputBase = 'border rounded-xl px-3 py-2 body-2 text-secondary-5 placeholder:text-neutral-3 focus:outline-none focus:ring-2 transition-colors';
  const inputOk = `${inputBase} border-neutral-2 focus:ring-primary-3/40`;
  const inputReadOnly = `${inputBase} border-neutral-1 bg-neutral-1 text-neutral-5 cursor-default`;
  const fieldClass = (field) => (submitted && errors[field]
    ? `${inputBase} border-feedback-error focus:ring-feedback-error/30 bg-feedback-error-bg/30`
    : inputOk);

  const addressInput = (
    <input
      ref={addressRef}
      type="text"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder={addressMeta.placeholder}
      className={`w-full ${fieldClass('address')}`}
      readOnly={isView}
    />
  );

  const titleMap = { create: 'Nueva actividad', view: 'Detalle de actividad', edit: 'Editar actividad' };
  const acceptedMembers = members.filter((m) => m.invitationStatus === 'accepted');
  const typeOption = TYPE_OPTIONS.find((t) => t.value === activityType) || TYPE_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Visor de imagen en grande */}
      {viewingUrl && (
        <div
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setViewingUrl(null)}
        >
          <button
            type="button"
            onClick={() => setViewingUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={viewingUrl}
            alt="Comprobante"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md flex flex-col max-h-[90vh] overflow-hidden">

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

        {/* Header fijo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-1 shrink-0">
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

        {/* Contenido scrollable */}
        <div className="flex flex-col gap-4 px-6 py-5 overflow-y-auto">
          <form onSubmit={isView ? (e) => e.preventDefault() : handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <label className="body-3 font-semibold text-neutral-5">Tipo</label>
              {isView ? (
                <span className="flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full border border-primary-3 bg-primary-1 body-3 text-primary-3">
                  <typeOption.Icon className="w-3.5 h-3.5" />
                  {typeOption.label}
                </span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActivityType(value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border body-3 transition-colors
                        ${activityType === value
                          ? 'border-primary-3 bg-primary-1 text-primary-3 font-semibold'
                          : 'border-neutral-1 bg-white text-neutral-5 hover:border-primary-2 hover:text-primary-3'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={fieldClass('startTime')} />
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
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={fieldClass('endTime')} />
                      {submitted && <FieldError message={errors.endTime} />}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Dirección / Ruta */}
            <div className="flex flex-col gap-1.5">
              <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary-3" />
                {isVuelo ? 'Vuelo' : addressMeta.label} {!isView && <span className="text-feedback-error">*</span>}
              </label>

              {isVuelo ? (
                isView ? (
                  <p className={`${inputReadOnly} px-3 py-2 wrap-break-word`}>{finalAddress || address || '—'}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="body-3 font-semibold text-neutral-5">Origen</span>
                      <AirportInput
                        displayValue={origin}
                        placeholder="Ej. Madrid, Barajas…"
                        onlyAirports
                        fixedDropdown
                        onSelect={(a) => {
                          setOrigin(a.label || a.cityName || '');
                          setOriginObj(a);
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="body-3 font-semibold text-neutral-5">Destino</span>
                      <AirportInput
                        displayValue={destination}
                        placeholder="Ej. Valencia, Manises…"
                        onlyAirports
                        fixedDropdown
                        onSelect={(a) => {
                          setDestination(a.label || a.cityName || '');
                          setDestinationObj(a);
                        }}
                      />
                    </div>
                  </div>
                )
              ) : isView ? (
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

            {/* Para quién */}
            {acceptedMembers.length > 0 && (
              isView ? (
                <div className="flex flex-col gap-1.5">
                  <label className="body-3 font-semibold text-neutral-5">¿Para quién?</label>
                  <p className={`${inputReadOnly} px-3 py-2`}>
                    {getMemberNames(selectedMembers, members).join(', ') || 'Todos'}
                  </p>
                </div>
              ) : (
                <PassengerSelector
                  members={acceptedMembers}
                  value={selectedMembers}
                  onChange={setSelectedMembers}
                  label="¿Para quién?"
                />
              )
            )}

            {/* Comprobantes */}
            {isView ? (
              receiptUrls.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="body-3 font-semibold text-neutral-5 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-primary-3" />
                    Comprobantes
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {receiptUrls.map((url, i) => {
                      const isPdf = isPdfUrl(url);
                      return isPdf ? (
                        <button
                          key={i}
                          type="button"
                          onClick={() => openPdf(url)}
                          disabled={pdfLoading === url}
                          className="aspect-square rounded-lg border border-neutral-2 bg-neutral-1 flex flex-col items-center justify-center gap-1 text-neutral-4 hover:text-secondary-4 hover:border-secondary-3 transition disabled:opacity-50"
                        >
                          {pdfLoading === url
                            ? <span className="w-5 h-5 border-2 border-neutral-3 border-t-secondary-3 rounded-full animate-spin" />
                            : <FileText className="w-7 h-7" />}
                          <span className="text-[10px] font-semibold">PDF</span>
                        </button>
                      ) : (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setViewingUrl(url)}
                          className="aspect-square rounded-lg overflow-hidden border border-neutral-2 bg-neutral-1 block hover:opacity-90 transition"
                        >
                          <img src={url} alt={`Comprobante ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <BookingReceiptUpload
                initialUrls={receiptUrls}
                onUpdate={(urls) => setReceiptUrls(urls)}
                label="Documentos y comprobantes"
                allowPdf
              />
            )}

            {/* Creado por */}
            {(creator || initialActivity?.createdBy?.name) && (
              <div className="flex items-center gap-2 py-2 px-3 bg-neutral-1 rounded-xl">
                <UserCircle className="w-4 h-4 text-neutral-4 shrink-0" />
                <span className="body-3 text-neutral-4">
                  Creado por{' '}
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
    </div>
  );
}
