import { useState, useRef } from 'react';
import { MapPin, Calendar, Clock, User } from 'lucide-react';
import { getCarLocations } from '../../../../../../services/carService';

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

  const fetchSugg = async (query, setter) => {
    if (!query || query.length < 2) { setter([]); return; }
    try {
      const data = await getCarLocations(query);
      setter(data?.data ?? data ?? []);
    } catch {
      setter([]);
    }
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
    const label = locLabel(loc);
    onDropOffLocationChange(loc);
    onDropOffQueryChange?.(label);
    setDropOffSugg([]);
    setDropOffOpen(false);
  };

  return (
    <div className="bg-white border border-neutral-1 rounded-2xl p-4 flex flex-col gap-4">

      {/* Toggle misma ubicación */}
      <label className="flex items-center gap-2 cursor-pointer body-3 text-neutral-5">
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
      <div className="relative">
        <label className="block body-3 font-bold text-neutral-5 mb-1">
          <MapPin className="inline w-3 h-3 mr-1" />Lugar de recogida
        </label>
        <input
          type="text"
          value={pickUpQuery ?? ''}
          onChange={(e) => handlePickUpInput(e.target.value)}
          onFocus={() => setPickUpOpen(true)}
          onBlur={() => setTimeout(() => setPickUpOpen(false), 200)}
          placeholder="Ciudad, aeropuerto..."
          className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-3 text-neutral-7 outline-none focus:border-primary-3 transition"
        />
        {pickUpOpen && pickUpSugg.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-2 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {pickUpSugg.map((loc, i) => (
              <li
                key={i}
                onMouseDown={() => selectPickUp(loc)}
                className="px-3 py-2 cursor-pointer hover:bg-neutral-1 body-3 text-neutral-6"
              >
                <span className="font-semibold">{loc.name}</span>
                {(loc.city || loc.country) && (
                  <span className="text-neutral-4"> · {[loc.city, loc.country].filter(Boolean).join(', ')}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lugar de devolución (si no es el mismo) */}
      {!sameLocation && (
        <div className="relative">
          <label className="block body-3 font-bold text-neutral-5 mb-1">
            <MapPin className="inline w-3 h-3 mr-1" />Lugar de devolución
          </label>
          <input
            type="text"
            value={dropOffQuery ?? ''}
            onChange={(e) => handleDropOffInput(e.target.value)}
            onFocus={() => setDropOffOpen(true)}
            onBlur={() => setTimeout(() => setDropOffOpen(false), 200)}
            placeholder="Ciudad, aeropuerto..."
            className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-3 text-neutral-7 outline-none focus:border-primary-3 transition"
          />
          {dropOffOpen && dropOffSugg.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-2 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {dropOffSugg.map((loc, i) => (
                <li
                  key={i}
                  onMouseDown={() => selectDropOff(loc)}
                  className="px-3 py-2 cursor-pointer hover:bg-neutral-1 body-3 text-neutral-6"
                >
                  <span className="font-semibold">{loc.name}</span>
                  {(loc.city || loc.country) && (
                    <span className="text-neutral-4"> · {[loc.city, loc.country].filter(Boolean).join(', ')}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Fechas y horas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block body-3 font-bold text-neutral-5 mb-1">
            <Calendar className="inline w-3 h-3 mr-1" />Recogida
          </label>
          <input
            type="date"
            value={pickUpDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onPickUpDateChange(e.target.value)}
            className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-3 text-neutral-7 outline-none focus:border-primary-3 transition"
          />
        </div>
        <div>
          <label className="block body-3 font-bold text-neutral-5 mb-1">
            <Clock className="inline w-3 h-3 mr-1" />Hora
          </label>
          <input
            type="time"
            value={pickUpTime}
            onChange={(e) => onPickUpTimeChange(e.target.value)}
            className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-3 text-neutral-7 outline-none focus:border-primary-3 transition"
          />
        </div>
        <div>
          <label className="block body-3 font-bold text-neutral-5 mb-1">
            <Calendar className="inline w-3 h-3 mr-1" />Devolución
          </label>
          <input
            type="date"
            value={dropOffDate}
            min={pickUpDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => onDropOffDateChange(e.target.value)}
            className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-3 text-neutral-7 outline-none focus:border-primary-3 transition"
          />
        </div>
        <div>
          <label className="block body-3 font-bold text-neutral-5 mb-1">
            <Clock className="inline w-3 h-3 mr-1" />Hora
          </label>
          <input
            type="time"
            value={dropOffTime}
            onChange={(e) => onDropOffTimeChange(e.target.value)}
            className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-3 text-neutral-7 outline-none focus:border-primary-3 transition"
          />
        </div>
      </div>

      {/* Edad del conductor */}
      <div>
        <label className="block body-3 font-bold text-neutral-5 mb-1">
          <User className="inline w-3 h-3 mr-1" />Edad del conductor principal
        </label>
        <input
          type="number"
          min={18}
          max={99}
          value={driverAge}
          onChange={(e) => onDriverAgeChange(Number(e.target.value))}
          className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-3 text-neutral-7 outline-none focus:border-primary-3 transition"
        />
      </div>

      {/* Botón buscar */}
      <button
        onClick={onSearch}
        disabled={!canSearch || loading}
        className={`w-full h-11 rounded-xl body-2-semibold text-white flex items-center justify-center gap-2 transition ${
          !canSearch || loading
            ? 'bg-neutral-2 text-neutral-4 cursor-not-allowed'
            : 'bg-primary-3 hover:bg-primary-4'
        }`}
      >
        {loading ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Buscando…</>
        ) : '🚗 Buscar coches'}
      </button>
    </div>
  );
}
