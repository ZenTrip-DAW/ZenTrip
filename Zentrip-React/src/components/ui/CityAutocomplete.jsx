import { useEffect, useRef, useState } from 'react';

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

async function fetchCities(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&accept-language=es`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ZenTrip/1.0 (student project)' },
  });
  if (!res.ok) return [];
  return res.json();
}

function formatCity(item) {
  const addr = item.address || {};
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || item.name;
  const country = addr.country || '';
  return city && country ? `${city}, ${country}` : item.display_name;
}

export default function CityAutocomplete({ name, value, onChange, label, error, placeholder }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(!!value);
  const containerRef = useRef(null);
  const debouncedInput = useDebounced(inputValue, 350);

  useEffect(() => {
    setInputValue(value || '');
    setLocked(!!value);
  }, [value]);

  useEffect(() => {
    if (locked || !debouncedInput || debouncedInput.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCities(debouncedInput)
      .then((data) => {
        if (cancelled) return;
        setSuggestions(data);
        setOpen(data.length > 0);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedInput, locked]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        if (!locked) {
          setInputValue('');
          onChange({ target: { name, value: '' } });
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [locked, name, onChange]);

  const handleSelect = (item) => {
    const formatted = formatCity(item);
    setInputValue(formatted);
    setLocked(true);
    setOpen(false);
    setSuggestions([]);
    onChange({ target: { name, value: formatted } });
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setLocked(false);
    if (!e.target.value) onChange({ target: { name, value: '' } });
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-slate-600 mb-1 body-bold">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition px-4 py-2 body-2 text-sm ${error ? 'border-red-400' : 'border-slate-300'}`}
        />
        {loading && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <div className="w-4 h-4 border-2 border-primary-3 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {locked && inputValue && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setInputValue('');
              setLocked(false);
              onChange({ target: { name, value: '' } });
            }}
            className="absolute inset-y-0 right-3 flex items-center text-neutral-3 hover:text-neutral-5"
            aria-label="Limpiar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {!locked && inputValue.length > 0 && inputValue.length < 3 && (
        <p className="mt-1 body-3 text-neutral-3">Escribe al menos 3 letras para ver sugerencias</p>
      )}
      {error && <p className="mt-1 body-3 text-feedback-error">{error}</p>}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onMouseDown={() => handleSelect(item)}
              className="px-4 py-2.5 text-sm text-neutral-6 hover:bg-primary-1 cursor-pointer"
            >
              {formatCity(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
