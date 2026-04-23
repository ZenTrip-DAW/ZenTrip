import { useState, useRef } from 'react';
import { Search, MapPin, Calendar, Clock, User } from 'lucide-react';
import { getCarLocations } from '../../../../../../services/carService';
import { SectionLabel } from '../hotels/HotelAtoms';

function FormField({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 body-3 font-bold text-neutral-5 uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full h-10 px-3 border border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-secondary-3 focus:ring-2 focus:ring-secondary-3/20 transition';

export default function CarSearchForm({
  pickUpLocation, onPickUpLocationChange,
  dropOffLocation, onDropOffLocationChange,
  sameLocation, onSameLocationChange,
  pickUpDate, onPickUpDateChange,
  dropOffDate, onDropOffDateChange,
  pickUpTime, onPickUpTimeChange,
  dropOffTime, onDropOffTimeChange,
  driverAge, onDriverAgeChange,
  pickUpQuery, onPickUpQueryChange,
  dropOffQuery, onDropOffQueryChange,
  loading, canSearch, onSearch,
}) {
  const [pickUpSugg, setPickUpSugg]   = useState([]);
  const [dropOffSugg, setDropOffSugg] = useState([]);
  const [pickUpOpen, setPickUpOpen]   = useState(false);
  const [dropOffOpen, setDropOffOpen] = useState(false);
  const pickUpTimer  = useRef(null);
  const dropOffTimer = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const maxDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 2); return d.toISOString().split('T')[0]; })();

  const fetchSugg = async (query, setter) => {
    if (!query || query.length < 2) { setter([]); return; }
    try {
      const data = await getCarLocations(query);
      setter(data?.data ?? data ?? []);
    } catch { setter([]); }
  };

  const handlePickUpInput = (val) => {
    onPickUpLocationChange(null);
    onPickUpQueryChange?.(val);
    clearTimeout(pickUpTimer.current);
    pickUpTimer.current = setTimeout(() => fetchSugg(val, setPickUpSugg), 350);
  };

  const handleDropOffInput = (val) => {
    onDropOffLocationChange(null);
    onDropOffQueryChange?.(val);
    clearTimeout(dropOffTimer.current);
    dropOffTimer.current = setTimeout(() => fetchSugg(val, setDropOffSugg), 350);
  };

  const locLabel = (loc) => loc.name + (loc.city ? ` – ${loc.city}` : '');

  const selectPickUp = (loc) => {
    const label = locLabel(loc);
    onPickUpLocationChange(loc);
    onPickUpQueryChange?.(label);
    setPickUpSugg([]);
    setPickUpOpen(false);
    if (sameLocation) {
      onDropOffLocationChange(loc);
      onDropOffQueryChange?.(label);
    }
  };

  const selectDropOff = (loc) => {
    onDropOffLocationChange(loc);
    onDropOffQueryChange?.(locLabel(loc));
    setDropOffSugg([]);
    setDropOffOpen(false);
  };

  return (
    <div className="bg-white border border-neutral-1 rounded-2xl p-4 sm:p-6 shadow-sm">
      <SectionLabel>Buscar alquiler de coche</SectionLabel>

      {/* Toggle misma ubicación */}
      <label className="flex items-center gap-2 cursor-pointer body-3 text-neutral-5 mb-4">
        <input
          type="checkbox"
          checked={sameLocation}
          onChange={(e) => {
            onSameLocationChange(e.target.checked);
            if (e.target.checked && pickUpLocation) {
              onDropOffQueryChange?.(pickUpQuery);
              onDropOffLocationChange(pickUpLocation);
            }
          }}
          className="w-4 h-4 rounded accent-primary-3"
        />
        Devolver en el mismo lugar
      </label>

      {/* Lugar de recogida */}
      <div className="mb-4">
        <FormField label="Lugar de recogida" icon={MapPin}>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-3 pointer-events-none" />
            <input
              type="text"
              value={pickUpQuery ?? ''}
              onChange={(e) => handlePickUpInput(e.target.value)}
              onFocus={() => setPickUpOpen(true)}
              onBlur={() => setTimeout(() => setPickUpOpen(false), 200)}
              placeholder="Ciudad, aeropuerto…"
              className="w-full h-12 pl-9 pr-3 border-2 border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-primary-3 focus:ring-2 focus:ring-primary-3/10 transition placeholder:text-neutral-3"
            />
            {pickUpOpen && pickUpSugg.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-2 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {pickUpSugg.map((loc, i) => (
                  <li key={i} onMouseDown={() => selectPickUp(loc)} className="px-3 py-2 cursor-pointer hover:bg-neutral-1 body-3 text-neutral-6">
                    <span className="font-semibold">{loc.name}</span>
                    {(loc.city || loc.country) && <span className="text-neutral-4"> · {[loc.city, loc.country].filter(Boolean).join(', ')}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FormField>
      </div>

      {/* Lugar de devolución */}
      {!sameLocation && (
        <div className="mb-4">
          <FormField label="Lugar de devolución" icon={MapPin}>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-3 pointer-events-none" />
              <input
                type="text"
                value={dropOffQuery ?? ''}
                onChange={(e) => handleDropOffInput(e.target.value)}
                onFocus={() => setDropOffOpen(true)}
                onBlur={() => setTimeout(() => setDropOffOpen(false), 200)}
                placeholder="Ciudad, aeropuerto…"
                className="w-full h-12 pl-9 pr-3 border-2 border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-primary-3 focus:ring-2 focus:ring-primary-3/10 transition placeholder:text-neutral-3"
              />
              {dropOffOpen && dropOffSugg.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-2 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {dropOffSugg.map((loc, i) => (
                    <li key={i} onMouseDown={() => selectDropOff(loc)} className="px-3 py-2 cursor-pointer hover:bg-neutral-1 body-3 text-neutral-6">
                      <span className="font-semibold">{loc.name}</span>
                      {(loc.city || loc.country) && <span className="text-neutral-4"> · {[loc.city, loc.country].filter(Boolean).join(', ')}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </FormField>
        </div>
      )}

      {/* Fechas y horas */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <FormField label="Recogida" icon={Calendar}>
          <input type="date" value={pickUpDate} min={today} max={maxDate} onChange={(e) => { if (e.target.value <= maxDate) onPickUpDateChange(e.target.value); }} className={inputCls} />
        </FormField>
        <FormField label="Hora recogida" icon={Clock}>
          <input type="time" value={pickUpTime} onChange={(e) => onPickUpTimeChange(e.target.value)} className={inputCls} />
        </FormField>
        <FormField label="Devolución" icon={Calendar}>
          <input type="date" value={dropOffDate} min={pickUpDate || today} max={maxDate} onChange={(e) => { if (e.target.value <= maxDate) onDropOffDateChange(e.target.value); }} className={inputCls} />
        </FormField>
        <FormField label="Hora devolución" icon={Clock}>
          <input type="time" value={dropOffTime} onChange={(e) => onDropOffTimeChange(e.target.value)} className={inputCls} />
        </FormField>
      </div>

      {/* Edad conductor */}
      <div className="mb-6">
        <FormField label="Edad del conductor" icon={User}>
          <input
            type="number"
            min={18}
            max={99}
            value={driverAge}
            onChange={(e) => onDriverAgeChange(Number(e.target.value))}
            className={inputCls}
          />
        </FormField>
      </div>

      <div className="border-t border-neutral-1 mb-6" />

      <button
        onClick={onSearch}
        disabled={!canSearch || loading}
        className={`w-full h-12 rounded-lg font-titles font-bold text-white flex items-center justify-center gap-2 transition ${
          canSearch && !loading ? 'bg-primary-3 hover:bg-primary-4' : 'bg-neutral-2 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Buscando…
          </>
        ) : (
          <><Search className="w-4 h-4" /> Buscar coches</>
        )}
      </button>
    </div>
  );
}
