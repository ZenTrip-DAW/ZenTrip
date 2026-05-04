import { useRef, useState } from 'react';
import { getNames } from 'country-list';
import ISO6391 from 'iso-639-1';
import { createAvatar } from '@dicebear/core';
import { adventurer, funEmoji } from '@dicebear/collection';
import { Upload, Sparkles, X, RefreshCw } from 'lucide-react';
import { uploadImage, validateImageFile } from '../../../services/cloudinaryService';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import AlertMessage from '../../ui/AlertMessage';
import UserAvatar from '../../ui/UserAvatar';

const AVATAR_STYLES = [
  { key: 'adventurer', label: 'Aventurero', generator: adventurer },
  { key: 'funEmoji', label: 'Fun Emoji', generator: funEmoji },
];

function generateAvatarDataUrl(style, seed) {
  const svg = createAvatar(style, { seed }).toString();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function generateSeeds(count = 8) {
  return Array.from({ length: count }, () => Math.random().toString(36).slice(2));
}

function AvatarPicker({ onSelect }) {
  const [activeStyle, setActiveStyle] = useState('adventurer');
  const [seeds, setSeeds] = useState(() => generateSeeds());

  const currentStyle = AVATAR_STYLES.find((s) => s.key === activeStyle);

  return (
    <div className="mt-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {AVATAR_STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveStyle(s.key)}
              className={`px-2 py-1 text-xs font-medium rounded transition cursor-pointer ${
                activeStyle === s.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSeeds(generateSeeds())}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-500 cursor-pointer transition"
          title="Generar nuevos"
        >
          <RefreshCw size={12} />
          Nuevos
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {seeds.map((seed) => {
          const url = generateAvatarDataUrl(currentStyle.generator, seed);
          return (
            <button
              key={seed}
              type="button"
              onClick={() => onSelect(url)}
              className="rounded-full overflow-hidden border-2 border-transparent hover:border-orange-400 focus:border-orange-500 transition cursor-pointer aspect-square"
            >
              <img src={url} alt="avatar" className="w-full h-full" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const LANGUAGES = ISO6391.getAllNativeNames().sort();
const CURRENCIES = ['EUR €', 'USD $', 'GBP £', 'JPY ¥', 'MXN $'];
const COUNTRIES = getNames().sort();

const PERSONAL_FIELDS = [
  { name: 'firstName', label: 'Nombre', type: 'text', placeholder: 'Tu nombre', required: true },
  { name: 'lastName', label: 'Apellidos', type: 'text', placeholder: 'Tus apellidos', required: true },
  { name: 'username', label: 'Nombre de usuario', type: 'text', placeholder: 'usuario123', required: true },
  { name: 'phone', label: 'Teléfono', type: 'tel', placeholder: '+34 600 000 000', required: true },
];

const PREFERENCE_SELECTS = [
  { name: 'language', label: 'Idioma', options: LANGUAGES },
  { name: 'currency', label: 'Moneda preferida', options: CURRENCIES },
];

const SELECT_CLASS =
  'w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition px-4 py-2 text-sm text-slate-700 bg-white';
const LABEL_CLASS = 'block body-bold text-slate-600 mb-1';

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function AvatarUpload({ value, fullName, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUploaded(url);
    } catch (err) {
      setUploadError(err?.message || 'No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block body-bold text-slate-600 mb-3">Foto de perfil</label>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
        <UserAvatar
          src={value}
          alt="Avatar"
          fullName={fullName}
          sizeClass="w-20 h-20"
          containerClass="border-2 border-slate-200 shrink-0 shadow-sm"
          initialsClass="text-xl font-semibold text-slate-500"
        />

        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition disabled:opacity-50 cursor-pointer"
            >
              <Upload size={14} />
              {uploading ? 'Subiendo...' : 'Subir foto'}
            </button>

            <button
              type="button"
              onClick={() => setShowPicker((p) => !p)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition cursor-pointer ${
                showPicker
                  ? 'border-orange-400 bg-orange-50 text-orange-600'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-orange-300 hover:text-orange-500'
              }`}
            >
              <Sparkles size={14} />
              Elegir avatar
            </button>
          </div>

          {value && !uploading && (
            <button
              type="button"
              onClick={() => onUploaded('')}
              className="flex items-center justify-center sm:justify-start gap-1 text-xs text-slate-400 hover:text-red-400 cursor-pointer transition"
            >
              <X size={12} />
              Eliminar foto
            </button>
          )}

          {uploadError && <p className="text-xs text-red-500 text-center sm:text-left">{uploadError}</p>}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {showPicker && (
        <AvatarPicker
          onSelect={(url) => {
            onUploaded(url);
            setShowPicker(false);
          }}
        />
      )}
    </div>
  );
}

const REQUIRED_CHECKLIST = [
  { name: 'firstName', label: 'Nombre' },
  { name: 'lastName', label: 'Apellidos' },
  { name: 'username', label: 'Nombre de usuario' },
  { name: 'phone', label: 'Teléfono' },
  { name: 'country', label: 'País' },
];

function PersonalSection({ form, fieldErrors, onChange, setForm }) {
  const pending = REQUIRED_CHECKLIST.filter((f) => !form[f.name]?.trim());

  return (
    <>
      <SectionDivider label="Información personal" />

      <div className="mt-2">
        <AvatarUpload
          value={form.profilePhoto}
          fullName={`${form.firstName || ''} ${form.lastName || ''}`}
          onUploaded={(url) => setForm((p) => ({ ...p, profilePhoto: url }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PERSONAL_FIELDS.map((field) => (
          <Input
            key={field.name}
            variant="light"
            size="md"
            label={field.label}
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            value={form[field.name]}
            onChange={onChange}
            error={fieldErrors[field.name]}
            required={field.required}
          />
        ))}
      </div>

      {pending.length > 0 && (
        <ul className="space-y-1">
          {pending.map((f) => (
            <li key={f.name} className="body-3 flex items-center gap-2 text-primary-3">
              <span aria-hidden="true" className="shrink-0">✕</span>
              <span>{f.label} es obligatorio</span>
            </li>
          ))}
        </ul>
      )}

      <div>
        <label className={LABEL_CLASS}>
          País<span className="text-red-500 ml-0.5">*</span>
        </label>
        <select
          name="country"
          value={form.country}
          onChange={onChange}
          className={`${SELECT_CLASS} ${fieldErrors.country ? 'border-feedback-error focus:ring-feedback-error' : ''}`}
        >
          <option value="" disabled>Seleccione país</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {fieldErrors.country && (
          <p className="mt-1 body-3 text-feedback-error">{fieldErrors.country}</p>
        )}
      </div>

      <div>
        <label className={LABEL_CLASS}>Biografía</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={onChange}
          rows={3}
          placeholder="Cuéntanos algo sobre ti y cómo viajas..."
          className="w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 resize-none"
        />
      </div>
    </>
  );
}

function PreferencesSection({ form, onChange, setForm }) {
  return (
    <>
      <SectionDivider label="Preferencias de viaje" />

      <div className="grid grid-cols-2 gap-4">
        {PREFERENCE_SELECTS.map(({ name, label, options }) => (
          <div key={name}>
            <label className={LABEL_CLASS}>{label}</label>
            <select name={name} value={form[name]} onChange={onChange} className={SELECT_CLASS}>
              {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div>
        <label className={LABEL_CLASS}>Tipo de viaje preferido</label>
        <div className="flex gap-2 mt-1">
          {['solo', 'group', 'both'].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setForm((p) => ({ ...p, tripGroupType: op }))}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition cursor-pointer
                ${form.tripGroupType === op
                  ? 'border-orange-400 bg-orange-50 text-orange-600'
                  : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {op === 'solo' ? 'Solo' : op === 'group' ? 'En grupo' : 'Ambos'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Viajero pet-friendly</p>
          <p className="text-xs text-slate-500">Busca alojamientos y actividades con mascotas</p>
        </div>
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, petFriendly: !p.petFriendly }))}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none cursor-pointer
            ${form.petFriendly ? 'bg-orange-500' : 'bg-slate-300'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
              ${form.petFriendly ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <SectionDivider label="Seguridad" />
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
        <p className="text-sm text-slate-500">
          El cambio de contraseña estará disponible próximamente.
        </p>
      </div>
    </>
  );
}

export default function EditProfileForm({
  activeSection,
  form,
  fieldErrors,
  error,
  success,
  saving,
  isOnboarding,
  hasSavedOnce,
  onChange,
  onSave,
  onClose,
  setForm,
}) {
  return (
    <div className="bg-white flex flex-col justify-center px-6 py-8 md:px-10 w-full">
      <h2 className="title-h2-desktop text-secondary-5">{isOnboarding ? 'Completa tu perfil' : 'Editar Perfil'}</h2>
      <p className="body-2 text-slate-500 mb-4">
        {isOnboarding ? 'Cuéntanos un poco sobre ti para empezar' : 'Actualiza tu información personal y preferencias de viaje'}
      </p>

      <form className="space-y-4" onSubmit={onSave}>
        {activeSection === 'personal' && (
          <PersonalSection form={form} fieldErrors={fieldErrors} onChange={onChange} setForm={setForm} />
        )}
        {activeSection === 'preferences' && (
          <PreferencesSection form={form} onChange={onChange} setForm={setForm} />
        )}
        {activeSection === 'security' && <SecuritySection />}

        <AlertMessage message={error} variant="error" />
        <AlertMessage message={success ? '¡Datos guardados correctamente!' : null} variant="success" />

        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={isOnboarding && !hasSavedOnce}
            className="flex-1"
            title={isOnboarding && !hasSavedOnce ? 'Guarda tu perfil para continuar' : undefined}
          >
            {isOnboarding ? 'Ir al inicio' : 'Cerrar'}
          </Button>
          <Button variant="orange" type="submit" disabled={saving} className="flex-1">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
