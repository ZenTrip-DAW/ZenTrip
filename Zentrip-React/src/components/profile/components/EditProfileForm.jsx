import { useRef, useState } from 'react';
import { getNames } from 'country-list';
import ISO6391 from 'iso-639-1';
import { uploadImage } from '../../../services/cloudinaryService';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import AlertMessage from '../../ui/AlertMessage';

const IDIOMAS = ISO6391.getAllNativeNames().sort();
const MONEDAS = ['EUR €', 'USD $', 'GBP £', 'JPY ¥', 'MXN $'];
const PAISES = getNames().sort();

const PERSONAL_FIELDS = [
  { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Tu nombre' },
  { name: 'apellidos', label: 'Apellidos', type: 'text', placeholder: 'Tus apellidos' },
  { name: 'username', label: 'Nombre de usuario', type: 'text', placeholder: 'usuario123' },
  { name: 'telefono', label: 'Teléfono', type: 'tel', placeholder: '+34 600 000 000' },
];

const PREFERENCE_SELECTS = [
  { name: 'idioma', label: 'Idioma', options: IDIOMAS },
  { name: 'moneda', label: 'Moneda preferida', options: MONEDAS },
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

function AvatarUpload({ value, onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUploaded(url);
    } catch {
      setUploadError('No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block body-bold text-slate-600 mb-1">Foto de perfil</label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 shrink-0">
          {value
            ? <img src={value} alt="Avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl">👤</div>
          }
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current.click()}
            disabled={uploading}
            className="text-sm font-medium text-orange-500 hover:text-orange-600 disabled:opacity-50 cursor-pointer text-left"
          >
            {uploading ? 'Subiendo...' : 'Cambiar foto'}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onUploaded('')}
              className="text-xs text-slate-400 hover:text-red-400 cursor-pointer text-left"
            >
              Eliminar
            </button>
          )}
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function PersonalSection({ form, fieldErrors, onChange, setForm }) {
  return (
    <>
      <SectionDivider label="Información personal" />

      <div className="grid grid-cols-2 gap-4">
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
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>País</label>
          <select name="pais" value={form.pais} onChange={onChange} className={SELECT_CLASS}>
            {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <AvatarUpload
          value={form.fotoPerfil}
          onUploaded={(url) => setForm((p) => ({ ...p, fotoPerfil: url }))}
        />
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
          {['solo', 'grupo', 'ambos'].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setForm((p) => ({ ...p, viajesSoloGrupo: op }))}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition cursor-pointer
                ${form.viajesSoloGrupo === op
                  ? 'border-orange-400 bg-orange-50 text-orange-600'
                  : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {op === 'solo' ? 'Solo' : op === 'grupo' ? 'En grupo' : 'Ambos'}
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
  exito,
  guardando,
  onChange,
  onGuardar,
  onCerrar,
  setForm,
}) {
  return (
    <div className="bg-white flex flex-col justify-center px-6 py-8 md:px-10 w-full overflow-y-auto max-h-screen">
      <h2 className="title-h2-desktop text-secondary-5">Editar Perfil</h2>
      <p className="body-2 text-slate-500 mb-4">
        Actualiza tu información personal y preferencias de viaje
      </p>

      <form className="space-y-4" onSubmit={onGuardar}>
        {activeSection === 'datosPersonales' && (
          <PersonalSection form={form} fieldErrors={fieldErrors} onChange={onChange} setForm={setForm} />
        )}
        {activeSection === 'preferencias' && (
          <PreferencesSection form={form} onChange={onChange} setForm={setForm} />
        )}
        {activeSection === 'seguridad' && <SecuritySection />}

        <AlertMessage message={error} variant="error" />
        <AlertMessage message={exito ? '¡Perfil guardado correctamente!' : null} variant="success" />

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onCerrar} className="flex-1">
            Cerrar
          </Button>
          <Button variant="orange" type="submit" disabled={guardando} className="flex-1">
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
