import { useState } from 'react';
import { IcX, IcUser } from './flightIcons';

const PASSENGER_ROWS = [
  { key: 'adults', label: 'Adultos', sub: '12+ años', min: 1, max: 9 },
  { key: 'youth', label: 'Jóvenes', sub: '2–11 años', min: 0, max: 6 },
  { key: 'infants', label: 'Bebés', sub: 'Menos de 2 años', min: 0, max: null },
];

export default function PassengerDropdown({ pax, onChange, onClose }) {
  const [local, setLocal] = useState({ ...pax });

  const counter = (key, min, max) => (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setLocal(p => ({ ...p, [key]: Math.max(min, p[key] - 1) }))}
        disabled={local[key] <= min}
        className="cursor-pointer w-9 h-9 rounded-full border-2 border-secondary-3 flex items-center justify-center text-secondary-3 text-lg font-bold hover:bg-secondary-1 transition-colors disabled:opacity-30"
      >−</button>
      <span className="body-semibold text-neutral-7 w-5 text-center">{local[key]}</span>
      <button
        onClick={() => setLocal(p => ({ ...p, [key]: Math.min(max ?? 99, p[key] + 1) }))}
        disabled={local[key] >= (max ?? 99)}
        className="cursor-pointer w-9 h-9 rounded-full bg-secondary-3 flex items-center justify-center text-white text-lg font-bold hover:bg-secondary-4 transition-colors disabled:opacity-30"
      >+</button>
    </div>
  );

  // El máximo de bebés es igual al número de adultos
  const rows = PASSENGER_ROWS.map(r => ({
    ...r,
    max: r.key === 'infants' ? local.adults : r.max,
  }));

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-7/20" />
      <div
        className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="title-h3-desktop text-neutral-7">Pasajeros</h3>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors"
          >
            <IcX size={15} color="#7A7270" />
          </button>
        </div>

        {rows.map(({ key, label, sub, min, max }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-neutral-1 last:border-0">
            <div>
              <p className="body-semibold text-neutral-7">{label}</p>
              <p className="body-3 text-neutral-4">{sub}</p>
            </div>
            {counter(key, min, max)}
          </div>
        ))}

        <button
          onClick={() => { onChange(local); onClose(); }}
          className="cursor-pointer w-full py-3 bg-primary-3 text-white rounded-full body-semibold hover:bg-primary-4 transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
