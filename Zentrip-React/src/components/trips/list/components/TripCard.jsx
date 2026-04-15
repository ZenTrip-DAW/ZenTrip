import { useRef, useState } from 'react';
import { uploadImage } from '../../../../services/cloudinaryService';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const GRADIENTS = [
  'from-sky-300 to-blue-500',
  'from-orange-300 to-rose-500',
  'from-teal-300 to-emerald-500',
  'from-violet-400 to-indigo-600',
  'from-amber-300 to-orange-500',
  'from-cyan-300 to-teal-500',
];

const STATUS_CONFIG = {
  en_curso:  { label: 'En curso',      className: 'bg-primary-1 text-primary-3' },
  proximo:   { label: 'Próximamente',  className: 'bg-secondary-1 text-secondary-5' },
  pasado:    { label: 'Pasado',        className: 'bg-neutral-1 text-neutral-4' },
  borrador:  { label: 'Borrador',      className: 'bg-neutral-1 text-neutral-4' },
};

function getGradient(str) {
  const hash = [...(str || 'ZenTrip')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return { year: +y, month: +m, day: +d };
}

function formatDateRange(startDate, endDate) {
  const s = formatDate(startDate);
  const e = formatDate(endDate);
  if (s && e) {
    if (s.year === e.year && s.month === e.month)
      return `${s.day}-${e.day} ${MONTHS[s.month - 1]} ${s.year}`;
    return `${s.day} ${MONTHS[s.month - 1]} - ${e.day} ${MONTHS[e.month - 1]} ${e.year}`;
  }
  if (s) return `${s.day} ${MONTHS[s.month - 1]} ${s.year}`;
  if (e) return `Hasta ${e.day} ${MONTHS[e.month - 1]} ${e.year}`;
  return 'Fechas sin definir';
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.37M9 20H4v-2a4 4 0 015-3.37m6-4.63a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function CoverUploadModal({ onSave, onClose }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const MAX_MB = 5;

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG, WebP...)');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`La imagen no puede superar ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSave = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onSave(url);
    } catch (err) {
      console.error('Error uploading trip cover:', err);
      setError('No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <p className="body-bold text-neutral-6">Imagen del viaje</p>

        {/* Drop zone / preview */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden
            ${dragging ? 'border-primary-3 bg-primary-1' : 'border-neutral-2 hover:border-primary-3 hover:bg-primary-1'}`}
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-3 pointer-events-none">
              <IconUpload />
              <p className="body-3 text-center">Arrastra una imagen aquí<br />o <span className="text-primary-3 font-medium">selecciona un archivo</span></p>
              <p className="text-xs text-neutral-3">JPG, PNG, WebP · máx. 5 MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview && (
          <button
            type="button"
            onClick={() => { setFile(null); setPreview(null); setError(null); }}
            className="body-3 text-neutral-3 hover:text-neutral-5 text-center -mt-2"
          >
            Cambiar imagen
          </button>
        )}

        {error && <p className="body-3 text-feedback-error text-center -mt-2">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!file || uploading}
            className="flex-1 py-2 rounded-xl bg-primary-3 text-white body-3 font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:opacity-90"
          >
            {uploading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripCard({ trip, isDraft, memberCount, onClick, onDelete, onImageUpload }) {
  const [confirming, setConfirming] = useState(false);
  const [nameConfirm, setNameConfirm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [coverModalOpen, setCoverModalOpen] = useState(false);

  const name        = trip.name        || 'Viaje sin nombre';
  const origin      = trip.origin      || '';
  const destination = trip.destination || '';
  const startDate   = trip.startDate   || '';
  const endDate     = trip.endDate     || '';
  const status      = isDraft ? 'borrador' : (trip.status || 'proximo');

  const gradient  = getGradient(destination || name);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.proximo;
  const dateLabel = formatDateRange(startDate, endDate);

  const blockClick = confirming || nameConfirm || coverModalOpen;

  return (
    <>
      <div
        onClick={!blockClick ? onClick : undefined}
        className="bg-white rounded-2xl shadow-sm border border-neutral-1 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col relative"
      >
        {/* Imagen / gradiente */}
        <div
          className={`h-36 relative flex items-start justify-between p-3 ${trip.coverImage ? '' : `bg-linear-to-br ${gradient}`}`}
          style={trip.coverImage ? { backgroundImage: `url(${trip.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <span className={`body-3 px-2 py-0.5 rounded-full font-semibold ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
          <div className="flex gap-1.5">
            {onImageUpload && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCoverModalOpen(true); }}
                className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-neutral-4 hover:text-primary-3 transition-colors"
                aria-label="Cambiar imagen del viaje"
              >
                <IconCamera />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
                className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-neutral-4 hover:text-feedback-error transition-colors"
                aria-label="Eliminar viaje"
              >
                <IconTrash />
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="body-bold text-secondary-5 truncate">{name}</h3>

          {(origin || destination) && (
            <p className="body-3 text-neutral-3 truncate">
              {origin && destination ? `${origin} → ${destination}` : origin || destination}
            </p>
          )}

          <div className="flex items-center gap-1.5 body-3 text-neutral-4">
            <IconCalendar />
            <span className="truncate">{dateLabel}</span>
          </div>

          {memberCount != null && memberCount > 0 && (
            <div className="flex items-center gap-1.5 body-3 text-neutral-4">
              <IconPeople />
              <span>{memberCount} {memberCount === 1 ? 'persona' : 'personas'}</span>
            </div>
          )}

          {isDraft && (
            <p className="body-3 text-primary-3 mt-auto pt-1">Toca para continuar →</p>
          )}
        </div>

        {/* Overlay de confirmación de borrado */}
        {confirming && (
          <div
            className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center gap-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <IconTrash />
            <p className="body-bold text-neutral-6 text-center">¿Eliminar este viaje?</p>
            <p className="body-3 text-neutral-3 text-center -mt-2">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                className="flex-1 py-2 rounded-xl border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirming(false); setNameInput(''); setNameConfirm(true); }}
                className="flex-1 py-2 rounded-xl bg-primary-3 text-white body-3 font-semibold hover:opacity-90 transition-opacity"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación por nombre — fuera de la tarjeta para evitar conflictos de click */}
      {nameConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="body-bold text-neutral-6">Confirmar eliminación</p>
              <p className="body-3 text-neutral-3">
                Escribe <span className="font-semibold text-neutral-6">{name}</span> para confirmar que quieres eliminar este viaje. Esta acción no se puede deshacer.
              </p>
            </div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={name}
              className="w-full border border-neutral-2 rounded-xl px-3 py-2 body-3 text-neutral-6 focus:outline-none focus:border-primary-3"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setNameConfirm(false); setNameInput(''); }}
                className="flex-1 py-2 rounded-xl border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={nameInput !== name}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex-1 py-2 rounded-xl bg-feedback-error-solid text-white body-3 font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:opacity-90"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de subida de imagen del viaje */}
      {coverModalOpen && (
        <CoverUploadModal
          onSave={(url) => { onImageUpload(url); setCoverModalOpen(false); }}
          onClose={() => setCoverModalOpen(false)}
        />
      )}
    </>
  );
}
