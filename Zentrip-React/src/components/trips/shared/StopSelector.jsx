import { useState } from 'react';
import { MapPin, Plus, ChevronDown } from 'lucide-react';
import CityAutocomplete from '../../ui/CityAutocomplete';

// stops: [{ id, name, order, startDate, endDate }]
// tripDestination: string | null  — destino del viaje si aún no hay stops
// value: stopId | '__destination__' | null
// onSelect(stopId | '__destination__' | null)
// onCreateStop(name) → Promise<stop>
export default function StopSelector({ stops = [], tripDestination, value, onSelect, onCreateStop, label }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isNewDestination, setIsNewDestination] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const sorted = [...stops].sort((a, b) => a.order - b.order);

  // Mostrar el destino del viaje como opción si no está ya en stops
  const hasDestinationOption = tripDestination && !stops.some(
    (s) => s.name.toLowerCase() === tripDestination.toLowerCase()
  );

  const selected = value === '__destination__'
    ? { id: '__destination__', name: tripDestination }
    : stops.find((s) => s.id === value);

  const noOptions = sorted.length === 0 && !hasDestinationOption;
  const defaultLabel = label || '¿A qué destino va este vuelo?';
  const createLabel = noOptions ? 'Añadir destino' : 'Añadir parada';

  const handleCreate = async () => {
    if (!newName.trim() || !onCreateStop) return;
    setSaving(true);
    try {
      const created = await onCreateStop(newName.trim(), isNewDestination);
      onSelect(created.id);
      setCreating(false);
      setNewName('');
      setIsNewDestination(false);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-primary-3" />
        {defaultLabel}
      </p>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full h-10 px-3 rounded-xl border border-neutral-2 flex items-center justify-between body-3 text-neutral-7 hover:border-primary-3 transition bg-white"
        >
          <span className={selected ? 'text-neutral-7' : 'text-neutral-3'}>
            {selected
              ? `${selected.id === '__destination__' || selected.order === sorted.length ? '📍 ' : '🛑 '}${selected.name}`
              : 'Seleccionar destino…'}
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white rounded-xl border border-neutral-2 shadow-lg overflow-hidden">

            {/* Destino del viaje como opción (fallback cuando no hay stops) */}
            {hasDestinationOption && (
              <button
                type="button"
                onClick={() => { onSelect('__destination__'); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2 body-3 transition hover:bg-primary-1
                  ${value === '__destination__' ? 'bg-primary-1 text-primary-4 font-semibold' : 'text-neutral-6'}`}
              >
                <span>📍</span>
                <span className="flex-1">{tripDestination}</span>
                <span className="text-[9px] font-bold text-primary-3 uppercase tracking-wide">destino del viaje</span>
              </button>
            )}

            {/* Paradas definidas */}
            {sorted.map((stop) => {
              const isLast = stop.order === sorted.length;
              return (
                <button
                  key={stop.id}
                  type="button"
                  onClick={() => { onSelect(stop.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-2 body-3 transition hover:bg-primary-1
                    ${stop.id === value ? 'bg-primary-1 text-primary-4 font-semibold' : 'text-neutral-6'}`}
                >
                  <span>{isLast ? '📍' : '🛑'}</span>
                  <span className="flex-1">{stop.name}</span>
                  {isLast && <span className="text-[9px] font-bold text-primary-3 uppercase tracking-wide">destino</span>}
                </button>
              );
            })}

            {noOptions && !creating && (
              <p className="body-3 text-neutral-3 px-3 py-2.5">Sin destinos definidos aún.</p>
            )}

            {/* Botón crear */}
            {onCreateStop && !creating && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2 body-3 text-secondary-3 font-semibold hover:bg-secondary-1 border-t border-neutral-1 transition"
              >
                <Plus className="w-4 h-4" />
                {createLabel}
              </button>
            )}

            {/* Formulario de creación con CityAutocomplete */}
            {onCreateStop && creating && (
              <div className="px-3 py-3 border-t border-neutral-1 flex flex-col gap-2">
                <CityAutocomplete
                  name="newStop"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Buscar ciudad…"
                />
                <button
                  type="button"
                  onClick={() => setIsNewDestination((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border body-3 transition text-left
                    ${isNewDestination ? 'border-primary-3 bg-primary-1 text-primary-4' : 'border-neutral-2 text-neutral-4 hover:border-neutral-3'}`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition
                    ${isNewDestination ? 'border-primary-3 bg-primary-3' : 'border-neutral-3'}`}>
                    {isNewDestination && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span>Es el destino final del viaje</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newName.trim() || saving}
                    className="flex-1 h-8 rounded-lg bg-primary-3 text-white body-3 font-semibold disabled:opacity-50 hover:opacity-90 transition"
                  >
                    {saving ? '…' : 'Añadir'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setNewName(''); setIsNewDestination(false); }}
                    className="h-8 px-3 rounded-lg border border-neutral-2 text-neutral-4 hover:bg-neutral-1 transition body-3"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {noOptions && !onCreateStop && (
        <p className="body-3 text-neutral-3 italic">
          No hay destinos definidos. Añádelos en la configuración del viaje.
        </p>
      )}
    </div>
  );
}
