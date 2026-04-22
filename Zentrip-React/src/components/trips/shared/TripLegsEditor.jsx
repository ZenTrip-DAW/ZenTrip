import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import CityAutocomplete from '../../ui/CityAutocomplete';
import Input from '../../ui/Input';

function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null;
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function TravelConnector({ prevEndDate, nextStartDate }) {
  const diff = daysBetween(prevEndDate, nextStartDate);
  if (diff === null) return <div className="h-2" />;

  if (diff < 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 mx-4 rounded-lg bg-red-50 border border-red-200">
        <AlertTriangle className="w-3.5 h-3.5 text-feedback-error shrink-0" />
        <span className="body-3 text-feedback-error">Las fechas se solapan — revisa las fechas de estos tramos</span>
      </div>
    );
  }

  if (diff === 0) return <div className="h-1" />;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 mx-4 rounded-lg bg-slate-50 border border-dashed border-slate-200">
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="body-3 text-slate-400">
        {diff === 1 ? '1 día de trayecto' : `${diff} días de trayecto`}
      </span>
    </div>
  );
}

function LegRow({ stop, index, total, originName, onOriginChange, onChange, onRemove }) {
  const isLast = index === total - 1;
  const isFirst = index === 0;

  return (
    <div className={`rounded-xl border p-4 transition ${isLast ? 'border-primary-3 bg-primary-1/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isLast ? 'bg-primary-3 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {index + 1}
        </div>
        <span className="body-bold text-slate-600 text-sm">
          {isLast && total > 1 ? 'Último tramo' : `Tramo ${index + 1}`}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-feedback-error hover:bg-red-50 transition"
            title="Eliminar tramo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          {isFirst ? (
            <div className="flex-1 min-w-0">
              <CityAutocomplete
                label="Origen"
                name="leg-origin"
                value={originName}
                placeholder="¿Desde dónde sales?"
                onChange={(e) => onOriginChange?.(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="block text-slate-600 mb-1 body-bold text-sm">Origen</p>
              <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-400 truncate">
                {originName || <span className="italic text-slate-300">Sin origen</span>}
              </div>
            </div>
          )}
          <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <CityAutocomplete
              label="Destino"
              name={`stop-${stop.id}`}
              value={stop.name}
              placeholder="Ej. París, Francia"
              onChange={(e) => onChange({ ...stop, name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            variant="light"
            size="sm"
            label="Desde"
            type="date"
            value={stop.startDate}
            onChange={(e) => onChange({ ...stop, startDate: e.target.value })}
          />
          <Input
            variant="light"
            size="sm"
            label="Hasta"
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

export default function TripLegsEditor({ stops = [], origin = '', onChange, onOriginChange }) {
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
      <div className="flex flex-col gap-2 mb-2">
        {list.map((stop, idx) => (
          <div key={stop.id}>
            <LegRow
              stop={stop}
              index={idx}
              total={list.length}
              originName={idx === 0 ? origin : list[idx - 1].name}
              onOriginChange={idx === 0 ? onOriginChange : undefined}
              onChange={(updated) => handleChange(idx, updated)}
              onRemove={() => handleRemove(idx)}
            />
            {idx < list.length - 1 && (
              <TravelConnector
                prevEndDate={stop.endDate}
                nextStartDate={list[idx + 1].startDate}
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-primary-3 hover:text-primary-3 text-sm font-semibold transition mt-1"
      >
        <Plus className="w-4 h-4" />
        Añadir tramo
      </button>
    </div>
  );
}
