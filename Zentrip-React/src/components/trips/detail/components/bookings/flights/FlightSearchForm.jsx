import { useRef, useState } from 'react';
import AirportInput from './AirportInput';
import PassengerDropdown from './PassengerDropdown';
import { CABIN_LABELS, addDays, today, emptyLeg } from './flightUtils';
import { IcSwap, IcUser, IcSeat, IcChevDown, IcCheck, IcTrash, IcPlus } from './flightIcons';

export default function FlightSearchForm({
  tripType,
  onTripTypeChange,
  from, onFromChange,
  to, onToChange,
  departDate, onDepartDateChange,
  returnDate, onReturnDateChange,
  legs, onLegsChange,
  pax, onPaxChange,
  cabinClass, onCabinClassChange,
  isLoading,
  error,
  onSearch,
}) {
  const [showPax, setShowPax] = useState(false);
  const [showCabin, setShowCabin] = useState(false);
  const cabinRef = useRef(null);

  const paxLabel = () => {
    const total = pax.adults + pax.youth + pax.infants;
    return `${total} pasajero${total > 1 ? 's' : ''}`;
  };

  const swap = () => {
    onFromChange(to);
    onToChange(from);
  };

  const updateLeg = (i, field, val) => {
    onLegsChange(legs.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };

  const addLeg = () => {
    onLegsChange([...legs, emptyLeg(addDays(legs[legs.length - 1].date, 3))]);
  };

  const removeLeg = (i) => {
    onLegsChange(legs.filter((_, idx) => idx !== i));
  };

  return (
    <div className="bg-white border border-neutral-1 rounded-2xl overflow-visible">
      {/* Pestañas de tipo de vuelo */}
      <div className="flex border-b border-neutral-1">
        {[['ONE_WAY', 'Solo ida'], ['ROUND_TRIP', 'Ida y vuelta'], ['MULTI_STOP', 'Varios destinos']].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => onTripTypeChange(val)}
            className={`cursor-pointer flex-1 py-2.5 body-3 font-semibold transition-all border-b-2 ${tripType === val ? 'text-secondary-4 border-secondary-3 bg-secondary-1' : 'text-neutral-4 border-transparent hover:text-neutral-6'}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {tripType === 'MULTI_STOP' ? (
          /* Tramos múltiples */
          <div className="space-y-3">
            {legs.map((leg, i) => (
              <div key={i} className="border border-neutral-1 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="body-3 font-semibold text-neutral-5">Tramo {i + 1}</span>
                  {legs.length > 2 && (
                    <button
                      onClick={() => removeLeg(i)}
                      className="cursor-pointer w-6 h-6 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-primary-1 transition-colors"
                    >
                      <IcTrash size={12} color="#A19694" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="w-full sm:flex-1">
                    <AirportInput label="Desde" displayValue={leg.from.label} onSelect={(v) => updateLeg(i, 'from', v)} placeholder="Ciudad de origen" />
                  </div>
                  <button
                    onClick={() => { const t = leg.from; updateLeg(i, 'from', leg.to); updateLeg(i, 'to', t); }}
                    className="cursor-pointer w-10 h-10 rounded-full border border-neutral-2 flex items-center justify-center shrink-0 hover:border-secondary-3 hover:bg-secondary-1 transition-all rotate-90 sm:rotate-0"
                  >
                    <IcSwap size={15} color="#0194FE" />
                  </button>
                  <div className="w-full sm:flex-1">
                    <AirportInput label="Hasta" displayValue={leg.to.label} onSelect={(v) => updateLeg(i, 'to', v)} placeholder="Ciudad de destino" />
                  </div>
                </div>
                <div className="relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Fecha</label>
                  <input
                    type="date"
                    value={leg.date}
                    min={today}
                    onChange={(e) => updateLeg(i, 'date', e.target.value)}
                    className="w-full border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-transparent outline-none focus:border-secondary-3 transition-colors"
                  />
                </div>
              </div>
            ))}
            {legs.length < 5 && (
              <button
                onClick={addLeg}
                className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-neutral-2 hover:border-secondary-3 body-3 font-semibold text-secondary-4 transition-colors"
              >
                <IcPlus size={14} color="#016FC1" /> Añadir tramo
              </button>
            )}
            <div className="bg-secondary-1 rounded-xl px-4 py-3 body-3 text-secondary-4">
              Puedes buscar vuelos en múltiples destinos. Añade los tramos necesarios (mínimo 2) y presiona buscar.
            </div>
          </div>
        ) : (
          /* Ida simple o ida y vuelta */
          <>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="w-full sm:flex-1">
                <AirportInput label="Desde" displayValue={from.label} onSelect={onFromChange} placeholder="Ciudad de origen" />
              </div>
              <button
                onClick={swap}
                className="cursor-pointer w-10 h-10 rounded-full border border-neutral-2 flex items-center justify-center shrink-0 hover:border-secondary-3 hover:bg-secondary-1 transition-all rotate-90 sm:rotate-0"
              >
                <IcSwap size={15} color="#0194FE" />
              </button>
              <div className="w-full sm:flex-1">
                <AirportInput label="Hasta" displayValue={to.label} onSelect={onToChange} placeholder="Ciudad de destino" />
              </div>
            </div>

            {/* Fechas — el input type=date ya incluye el icono de calendario */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Salida</label>
                <input
                  type="date"
                  value={departDate}
                  min={today}
                  onChange={(e) => onDepartDateChange(e.target.value)}
                  className="w-full border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-transparent outline-none focus:border-secondary-3 transition-colors"
                />
              </div>
              {tripType === 'ROUND_TRIP' && (
                <div className="flex-1 relative">
                  <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Regreso</label>
                  <input
                    type="date"
                    value={returnDate}
                    min={departDate}
                    onChange={(e) => onReturnDateChange(e.target.value)}
                    className="w-full border border-neutral-2 rounded-xl px-3 py-3 body-2 text-neutral-7 bg-transparent outline-none focus:border-secondary-3 transition-colors"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Pasajeros y clase */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Pasajeros</label>
            <button
              onClick={() => setShowPax(true)}
              className="cursor-pointer w-full flex items-center gap-2 border border-neutral-2 rounded-xl px-3 py-3 hover:border-secondary-3 transition-colors text-left"
            >
              <IcUser size={16} color="#A19694" />
              <span className="body-2 text-neutral-7 flex-1">{paxLabel()}</span>
              <IcChevDown size={13} color="#A19694" />
            </button>
          </div>

          <div ref={cabinRef} className="relative min-w-35">
            <label className="absolute -top-2 left-3 bg-white px-1 body-3 text-neutral-4 z-10">Clase</label>
            <button
              onClick={() => setShowCabin(!showCabin)}
              className="cursor-pointer w-full flex items-center gap-2 border border-neutral-2 rounded-xl px-3 py-3 hover:border-secondary-3 transition-colors text-left"
            >
              <IcSeat size={16} color="#A19694" />
              <span className="body-2 text-neutral-7 flex-1 truncate">{CABIN_LABELS[cabinClass]}</span>
              <IcChevDown size={13} color="#A19694" className={`transition-transform shrink-0 ${showCabin ? 'rotate-180' : ''}`} />
            </button>
            {showCabin && (
              <div className="absolute bottom-[calc(100%+6px)] right-0 z-50 bg-white border border-neutral-1 rounded-2xl shadow-xl p-2 w-52">
                {Object.entries(CABIN_LABELS).map(([val, lbl]) => (
                  <button
                    key={val}
                    onClick={() => { onCabinClassChange(val); setShowCabin(false); }}
                    className={`cursor-pointer w-full flex items-center justify-between px-3 py-2.5 rounded-xl body-2 transition-all ${cabinClass === val ? 'bg-secondary-1 text-secondary-4 font-semibold' : 'text-neutral-6 hover:bg-neutral-1'}`}
                  >
                    {lbl}
                    {cabinClass === val && <IcCheck size={14} color="#016FC1" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="body-3 text-primary-3 bg-primary-1 rounded-xl px-4 py-2.5">{error}</p>}

        <button
          onClick={onSearch}
          disabled={isLoading}
          className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-xl body-bold hover:bg-primary-4 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isLoading ? 'Buscando...' : 'Buscar vuelos'}
        </button>
      </div>

      {/* Dropdown de pasajeros */}
      {showPax && (
        <PassengerDropdown pax={pax} onChange={onPaxChange} onClose={() => setShowPax(false)} />
      )}
    </div>
  );
}
