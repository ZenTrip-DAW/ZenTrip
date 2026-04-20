import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import CityAutocomplete from '../../ui/CityAutocomplete';
import Input from '../../ui/Input';

function StopRow({ stop, index, total, onChange, onRemove }) {
  const isDestination = index === total - 1;

  return (
    <div className={`rounded-xl border p-4 transition ${isDestination ? 'border-primary-3 bg-primary-1/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isDestination ? 'bg-primary-3 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {index + 1}
        </div>
        <span className="body-bold text-slate-600 text-sm">
          {isDestination ? 'Destino principal' : `Parada ${index + 1}`}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-feedback-error hover:bg-red-50 transition"
            title="Eliminar parada"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <CityAutocomplete
          name={`stop-${stop.id}`}
          value={stop.name}
          placeholder={isDestination ? 'Ej. París, Francia' : 'Ej. Lyon, Francia'}
          onChange={(e) => onChange({ ...stop, name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            variant="light"
            size="sm"
            label="Llegada"
            type="date"
            value={stop.startDate}
            onChange={(e) => onChange({ ...stop, startDate: e.target.value })}
          />
          <Input
            variant="light"
            size="sm"
            label="Salida"
            type="date"
            value={stop.endDate}
            onChange={(e) => onChange({ ...stop, endDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function newStop(order) {
  return { id: crypto.randomUUID(), name: '', order, startDate: '', endDate: '' };
}

export default function TripLegsEditor({ stops = [], onChange }) {
  const [list, setList] = useState(() => {
    if (stops.length > 0) return [...stops].sort((a, b) => a.order - b.order);
    return [newStop(1)];
  });

  const prevStopsRef = useRef(stops);
  useEffect(() => {
    const prev = prevStopsRef.current;
    if (stops.length > 0 && JSON.stringify(stops) !== JSON.stringify(prev)) {
      prevStopsRef.current = stops;
      setList([...stops].sort((a, b) => a.order - b.order));
    }
  }, [stops]);

  const emit = (next) => {
    const sorted = next.map((s, i) => ({ ...s, order: i + 1 }));
    setList(sorted);
    prevStopsRef.current = sorted;
    onChange?.(sorted);
  };

  const handleChange = (idx, updated) => emit(list.map((s, i) => (i === idx ? updated : s)));
  const handleRemove = (idx) => { if (list.length > 1) emit(list.filter((_, i) => i !== idx)); };

  const handleAdd = () => {
    const dest = list[list.length - 1];
    const intermediate = newStop(list.length);
    emit([...list.slice(0, -1), intermediate, dest]);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-primary-3" />
        <label className="block text-slate-600 body-bold">Destinos</label>
      </div>
      {list.length > 1 && (
        <p className="body-3 text-slate-400 mb-3">
          La última parada es el destino principal.
        </p>
      )}

      <div className="flex flex-col gap-2 mb-2">
        {list.map((stop, idx) => (
          <StopRow
            key={stop.id}
            stop={stop}
            index={idx}
            total={list.length}
            onChange={(updated) => handleChange(idx, updated)}
            onRemove={() => handleRemove(idx)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-primary-3 hover:text-primary-3 text-sm font-semibold transition mt-1"
      >
        <Plus className="w-4 h-4" />
        Añadir parada intermedia
      </button>
    </div>
  );
}
