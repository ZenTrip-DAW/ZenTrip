import { useState, useEffect } from 'react';
import { toPrice, fmt, getSegmentStops, DEFAULT_FILTERS, TIME_SLOTS } from './flightUtils';
import { IcX, IcCheck } from './flightIcons';

export default function FilterSheet({ aggregation, offers, filters, tripType, onChange, onClose }) {
  const maxB = toPrice(aggregation?.budget?.max ?? { units: 2000 });
  const minB = toPrice(aggregation?.budget?.min ?? { units: 0 });
  const currency = aggregation?.budget?.min?.currencyCode ?? 'EUR';
  const [local, setLocal] = useState({ ...filters });
  const isRoundTrip = tripType === 'ROUND_TRIP';
  const stopOptions = [
    { label: 'Cualquiera', value: null },
    { label: 'Sin escalas', value: 0 },
    { label: '1 escala', value: 1 },
  ];

  // Calcula qué aerolíneas siguen disponibles con los filtros actuales (sin el filtro de aerolínea)
  const matchesWithoutAirline = (offer) => {
    const segments = offer.segments ?? [];
    const outSeg = segments[0];
    const retSeg = segments.length > 1 ? segments[segments.length - 1] : null;

    if (local.stopsOutbound !== null && getSegmentStops(outSeg) !== local.stopsOutbound) return false;
    if (isRoundTrip && local.stopsReturn !== null) {
      if (!retSeg || getSegmentStops(retSeg) !== local.stopsReturn) return false;
    }
    if (local.maxPrice !== null && toPrice(offer.priceBreakdown?.total) > local.maxPrice) return false;
    if (local.timeSlots?.length > 0) {
      const hour = parseInt(offer.segments[0]?.departureTime?.slice(11, 13) ?? '0', 10);
      const inSlot = local.timeSlots.some(k => {
        const slot = TIME_SLOTS.find(s => s.key === k);
        return slot && hour >= slot.min && hour < slot.max;
      });
      if (!inSlot) return false;
    }
    return true;
  };

  const offersForAirlineFilter = (offers ?? []).filter(matchesWithoutAirline);
  const availableAirlineCodes = new Set(
    offersForAirlineFilter
      .map((offer) => offer.segments?.[0]?.legs?.[0]?.carriersData?.[0]?.code)
      .filter(Boolean)
  );
  const visibleAirlines = (aggregation?.airlines ?? []).filter((al) => availableAirlineCodes.has(al.iataCode));

  // Limpia la aerolínea seleccionada si ya no está disponible con los otros filtros
  useEffect(() => {
    if (local.airline && !availableAirlineCodes.has(local.airline)) {
      setLocal((prev) => ({ ...prev, airline: null }));
    }
  }, [local.airline, local.stopsOutbound, local.stopsReturn, local.maxPrice, local.timeSlots]);

  const toggleSlot = (key) => {
    setLocal(p => {
      const slots = p.timeSlots ?? [];
      return { ...p, timeSlots: slots.includes(key) ? slots.filter(s => s !== key) : [...slots, key] };
    });
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-7/30" />
      <div
        className="relative bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h3 className="title-h3-desktop text-neutral-7">Filtrar vuelos</h3>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors"
          >
            <IcX size={15} color="#7A7270" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-4">
          {/* Escalas ida */}
          <div>
            <p className="body-2-semibold text-neutral-6 mb-3">Escalas ida</p>
            <div className="grid grid-cols-3 gap-2">
              {stopOptions.map((opt) => (
                <button
                  key={`out-${String(opt.value)}`}
                  onClick={() => setLocal((p) => ({ ...p, stopsOutbound: opt.value }))}
                  className={`cursor-pointer py-3 rounded-xl border body-3 font-semibold transition-all ${local.stopsOutbound === opt.value ? 'bg-secondary-3 border-secondary-3 text-white' : 'bg-white border-neutral-2 text-neutral-5 hover:border-secondary-2'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Escalas vuelta (solo ida y vuelta) */}
          {isRoundTrip && (
            <div>
              <p className="body-2-semibold text-neutral-6 mb-3">Escalas vuelta</p>
              <div className="grid grid-cols-3 gap-2">
                {stopOptions.map((opt) => (
                  <button
                    key={`ret-${String(opt.value)}`}
                    onClick={() => setLocal((p) => ({ ...p, stopsReturn: opt.value }))}
                    className={`cursor-pointer py-3 rounded-xl border body-3 font-semibold transition-all ${local.stopsReturn === opt.value ? 'bg-secondary-3 border-secondary-3 text-white' : 'bg-white border-neutral-2 text-neutral-5 hover:border-secondary-2'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Precio máximo */}
          <div>
            <div className="flex justify-between mb-3">
              <p className="body-2-semibold text-neutral-6">Precio máximo</p>
              <p className="body-2-semibold text-secondary-4">{fmt(local.maxPrice ?? maxB, currency)}</p>
            </div>
            <input
              type="range"
              min={Math.floor(minB)}
              max={Math.ceil(maxB)}
              step={10}
              value={local.maxPrice ?? maxB}
              onChange={(e) => setLocal((p) => ({ ...p, maxPrice: Number(e.target.value) }))}
              className="w-full cursor-pointer"
              style={{ accentColor: '#0194FE' }}
            />
            <div className="flex justify-between body-3 text-neutral-4 mt-1">
              <span>{fmt(minB, currency)}</span><span>{fmt(maxB, currency)}</span>
            </div>
          </div>

          {/* Hora de salida */}
          <div>
            <p className="body-2-semibold text-neutral-6 mb-3">Hora de salida</p>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = (local.timeSlots ?? []).includes(slot.key);
                return (
                  <button
                    key={slot.key}
                    onClick={() => toggleSlot(slot.key)}
                    className={`cursor-pointer flex flex-col items-center py-3 px-2 rounded-xl border body-3 transition-all ${active ? 'bg-secondary-3 border-secondary-3 text-white' : 'bg-white border-neutral-2 text-neutral-5 hover:border-secondary-2'}`}
                  >
                    <span className="font-semibold">{slot.label}</span>
                    <span style={{ fontSize: 10 }} className={active ? 'text-white/80' : 'text-neutral-4'}>{slot.sub}</span>
                  </button>
                );
              })}
            </div>
            {(local.timeSlots ?? []).length > 0 && (
              <p className="body-3 text-neutral-4 mt-2">
                Mostrando salidas: {(local.timeSlots ?? []).map(k => TIME_SLOTS.find(s => s.key === k)?.label).join(', ')}
              </p>
            )}
          </div>

          {/* Aerolíneas disponibles */}
          {visibleAirlines?.length > 0 && (
            <div className="pb-2">
              <p className="body-2-semibold text-neutral-6 mb-3">Aerolínea</p>
              <div className="space-y-2">
                {visibleAirlines.map((al) => {
                  const active = local.airline === al.iataCode;
                  return (
                    <button
                      key={al.iataCode}
                      onClick={() => setLocal((p) => ({ ...p, airline: active ? null : al.iataCode }))}
                      className={`cursor-pointer w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${active ? 'bg-secondary-1 border-secondary-3' : 'bg-white border-neutral-1 hover:border-neutral-2'}`}
                    >
                      {al.logoUrl
                        ? <img src={al.logoUrl} alt={al.name} className="w-8 h-8 object-contain rounded-lg border border-neutral-1 p-0.5" />
                        : <div className="w-8 h-8 rounded-lg bg-secondary-1 flex items-center justify-center body-3 font-bold text-secondary-4">{al.iataCode}</div>
                      }
                      <span className="body-2 text-neutral-7 flex-1 text-left">{al.name}</span>
                      {al.minPrice && <span className="body-3 text-neutral-4">desde {fmt(toPrice(al.minPrice), al.minPrice.currencyCode)}</span>}
                      {active && <IcCheck size={15} color="#016FC1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {visibleAirlines?.length === 0 && (
            <div className="rounded-xl bg-neutral-1 px-4 py-3 body-3 text-neutral-5">
              No hay aerolíneas que coincidan con tus filtros actuales.
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-neutral-1 shrink-0">
          <button
            onClick={() => setLocal(DEFAULT_FILTERS)}
            className="cursor-pointer flex-1 py-3 rounded-full border-2 border-neutral-2 body-semibold text-neutral-5 hover:border-neutral-3 transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={() => { onChange(local); onClose(); }}
            className="cursor-pointer flex-1 py-3 rounded-full bg-secondary-3 text-white body-semibold hover:bg-secondary-4 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
