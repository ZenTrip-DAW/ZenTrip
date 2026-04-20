import { useState, useRef, useEffect } from 'react';
import { getFlightDestinations } from '../../../services/flightService';
import { resolveToEnglish } from '../../../services/geocodingService';
import { IcPlaneFly } from './flightIcons';

export default function AirportInput({ label, displayValue, onSelect, placeholder }) {
  const [query, setQuery] = useState(displayValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => { setQuery(displayValue); }, [displayValue]);

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onSelect({ id: '', label: val, code: '', cityName: val });
    clearTimeout(timerRef.current);
    if (val.length < 2) { setSuggestions([]); setOpen(false); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const lc = (s) => (s ?? '').toLowerCase();
        const originalCity = val.trim().charAt(0).toUpperCase() + val.trim().slice(1);
        const res = await getFlightDestinations(val);
        let all = (res?.data ?? []).filter((i) => i.type === 'CITY' || i.type === 'AIRPORT');

        // Si no hay resultados en el idioma original, intenta buscar en inglés
        if (all.length === 0) {
          const english = await resolveToEnglish(val);
          if (english && lc(english) !== lc(val)) {
            const res2 = await getFlightDestinations(english);
            all = (res2?.data ?? [])
              .filter((i) => i.type === 'CITY' || i.type === 'AIRPORT')
              .map((i) => ({ ...i, cityName: originalCity }));
          }
        } else {
          all = all.map((i) => {
            const cn = i.cityName || i.name || '';
            return lc(cn).startsWith(lc(val.trim())) ? i : { ...i, cityName: originalCity };
          });
        }

        // Ciudades primero, luego aeropuertos individuales
        const sorted = [
          ...all.filter((i) => i.type === 'CITY'),
          ...all.filter((i) => i.type === 'AIRPORT'),
        ];
        setSuggestions(sorted);
        setOpen(sorted.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (item) => {
    const displayName = item.cityName || item.name || item.code;
    const lbl = item.type === 'CITY'
      ? `${displayName} (todos los aeropuertos)`
      : `${displayName} (${item.code})`;
    setQuery(lbl);
    setSuggestions([]);
    setOpen(false);
    onSelect({ id: item.id, label: lbl, code: item.code, cityName: displayName, type: item.type });
  };

  return (
    <div ref={wrapRef} className="flex-1 relative">
      <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">{label}</label>
      <div className="flex items-center gap-2 border border-neutral-2 rounded-xl px-3 py-3 focus-within:border-secondary-3 transition-colors">
        <IcPlaneFly size={15} color="#A19694" />
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 body-2 text-neutral-7 placeholder:text-neutral-3 bg-transparent border-none outline-none"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-secondary-3 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-white border border-neutral-1 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-1 transition-colors text-left border-b border-neutral-1 last:border-0"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'CITY' ? 'bg-primary-1' : 'bg-secondary-1'}`}>
                {item.type === 'CITY' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E85D26" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M3 7v14M21 7v14M6 21V3l6 4 6-4v18M9 21v-4h6v4" />
                  </svg>
                ) : (
                  <span className="body-3 font-bold text-secondary-4">{item.code}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="body-2-semibold text-neutral-7 truncate">{item.cityName || item.name || item.code}</p>
                <p className="body-3 text-neutral-4 truncate">
                  {item.type === 'CITY' ? 'Todos los aeropuertos' : item.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
