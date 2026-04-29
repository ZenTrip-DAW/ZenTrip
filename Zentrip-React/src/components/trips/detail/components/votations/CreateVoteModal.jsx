import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { createVote, updateVote } from '../../../../../services/votesService';

const CATEGORIES = [
  { key: 'restaurante', label: 'Restaurante', emoji: '🍽️' },
  { key: 'actividad',   label: 'Actividad',   emoji: '🎯' },
  { key: 'alojamiento', label: 'Alojamiento', emoji: '🏨' },
  { key: 'transporte',  label: 'Transporte',  emoji: '✈️' },
  { key: 'otro',        label: 'Otro',        emoji: '💬' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function CreateVoteModal({ tripId, editingVote = null, onClose, onCreated }) {
  const isEditing = !!editingVote;

  const [title, setTitle]       = useState(editingVote?.title ?? '');
  const [category, setCategory] = useState(editingVote?.category ?? '');
  const [type, setType]         = useState(editingVote?.type ?? 'single');
  const [options, setOptions]   = useState(
    editingVote?.options?.length
      ? editingVote.options.map((o) => ({ ...o }))
      : [{ id: generateId(), label: '' }, { id: generateId(), label: '' }],
  );
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);

  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, []);

  // Cierra con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const addOption = () => setOptions((prev) => [...prev, { id: generateId(), label: '' }]);

  const removeOption = (id) =>
    setOptions((prev) => prev.filter((o) => o.id !== id));

  const updateOption = (id, value) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label: value } : o)));

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'El título es obligatorio';
    const filled = options.filter((o) => o.label.trim());
    if (filled.length < 2) errs.options = 'Añade al menos 2 opciones';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const cleanOptions = options
        .filter((o) => o.label.trim())
        .map((o) => ({ id: o.id, label: o.label.trim() }));

      if (isEditing) {
        await updateVote(tripId, editingVote.id, { title: title.trim(), category, type, options: cleanOptions });
      } else {
        const id = await createVote(
          tripId,
          { title: title.trim(), category, type, options: cleanOptions },
          onCreated.user,
        );
        onCreated.onSuccess(id, title.trim());
      }
      onClose();
    } catch (err) {
      console.error('[CreateVoteModal]', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-1 shrink-0">
          <h2 className="title-h3-desktop text-secondary-6">
            {isEditing ? 'Editar encuesta' : 'Nueva encuesta'}
          </h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full border border-neutral-1 flex items-center justify-center text-neutral-4 hover:text-neutral-6 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto px-5 py-4 flex-1">

          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5">Pregunta</label>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
              placeholder="¿Dónde cenamos el viernes?"
              className={`w-full px-4 py-2.5 rounded-xl border body-2 text-neutral-7 outline-none transition-colors
                ${errors.title ? 'border-feedback-error' : 'border-neutral-2 focus:border-secondary-3'}`}
            />
            {errors.title && <p className="body-3 text-feedback-error-strong">{errors.title}</p>}
          </div>

          {/* Categoría (opcional) */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5">Categoría <span className="text-neutral-3 font-normal">(opcional)</span></label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(category === c.key ? '' : c.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border body-3 font-semibold transition-colors cursor-pointer
                    ${category === c.key
                      ? 'bg-secondary-1 border-secondary-3 text-secondary-5'
                      : 'border-neutral-1 text-neutral-4 hover:border-secondary-2'}`}
                >
                  <span>{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de votación */}
          <div className="flex flex-col gap-1.5">
            <label className="body-3 font-semibold text-neutral-5">Tipo de votación</label>
            <div className="flex gap-2">
              {[
                { key: 'single',   label: 'Opción única',   desc: 'Cada persona elige una' },
                { key: 'multiple', label: 'Opción múltiple', desc: 'Puedes elegir varias' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`flex-1 flex flex-col items-start px-3 py-2.5 rounded-xl border transition-colors cursor-pointer text-left
                    ${type === t.key
                      ? 'bg-secondary-1 border-secondary-3'
                      : 'border-neutral-1 hover:border-secondary-2'}`}
                >
                  <span className={`body-3 font-semibold ${type === t.key ? 'text-secondary-5' : 'text-neutral-5'}`}>{t.label}</span>
                  <span className="body-3 text-neutral-3">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opciones */}
          <div className="flex flex-col gap-2">
            <label className="body-3 font-semibold text-neutral-5">Opciones</label>
            {options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input
                  value={opt.label}
                  onChange={(e) => { updateOption(opt.id, e.target.value); setErrors((p) => ({ ...p, options: undefined })); }}
                  placeholder={`Opción ${i + 1}`}
                  className={`flex-1 px-3 py-2 rounded-xl border body-2 text-neutral-7 outline-none transition-colors
                    ${errors.options ? 'border-feedback-error' : 'border-neutral-2 focus:border-secondary-3'}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(opt.id)}
                    className="w-8 h-8 rounded-full border border-neutral-1 flex items-center justify-center text-neutral-3 hover:text-feedback-error-strong hover:border-feedback-error transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {errors.options && <p className="body-3 text-feedback-error-strong">{errors.options}</p>}
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-2 body-3 font-semibold text-secondary-4 hover:text-secondary-5 transition-colors cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" /> Añadir opción
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-neutral-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-2 text-neutral-5 body-2-semibold hover:border-neutral-4 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-secondary-5 hover:bg-secondary-6 text-white body-2-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear encuesta'}
          </button>
        </div>
      </div>
    </div>
  );
}
