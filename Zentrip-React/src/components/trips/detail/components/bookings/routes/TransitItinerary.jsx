import { useState } from 'react';
import { Footprints } from 'lucide-react';
import { legColor, VEHICLE_EMOJI } from './routeUtils';

function TransitStep({ step, legColor: color }) {
  const [open, setOpen] = useState(false);
  const isWalk = !step.transit;
  const td = step.transit;

  if (isWalk) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-neutral-3">
        <Footprints className="w-4 h-4 shrink-0" />
        <span className="body-3">Caminar {step.duration.text} · {step.distance.text}</span>
      </div>
    );
  }

  const vehicleType = td?.line?.vehicle?.type || 'BUS';
  const emoji       = VEHICLE_EMOJI[vehicleType] || '🚌';
  const lineName    = td?.line?.short_name || td?.line?.name || '—';
  const vehicleName = td?.line?.vehicle?.name || 'Transporte';
  const lineColor   = td?.line?.color || color;
  const lineText    = td?.line?.text_color || '#fff';
  const departure   = td?.departure_stop?.name || '—';
  const arrival     = td?.arrival_stop?.name || '—';

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: color + '55' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-1/50 transition"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <span className="text-xl shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: lineColor, color: lineText }}>
              {lineName}
            </span>
            <span className="body-3 font-semibold text-neutral-6">{vehicleName}</span>
            <span className="body-3 text-neutral-3">{step.duration.text}</span>
          </div>
          <p className="body-3 text-neutral-5 mt-0.5">
            <span className="text-auxiliary-green-5 font-semibold">Sube en:</span> {departure}
            <span className="text-neutral-3 mx-1.5">·</span>
            <span className="text-feedback-error font-semibold">Baja en:</span> {arrival}
          </p>
        </div>
        <span className="body-3 text-neutral-3 shrink-0 select-none">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 bg-neutral-1/30 flex flex-col gap-2 border-t border-neutral-1">
          {td?.headsign && (
            <p className="body-3 text-neutral-5">
              <span className="font-semibold text-neutral-6">Dirección:</span> {td.headsign}
            </p>
          )}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center shrink-0 pt-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <div className="w-px flex-1 min-h-7 mt-1" style={{ backgroundColor: color + '55' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-feedback-error" />
            </div>
            <div className="flex-1 flex flex-col justify-between gap-1 min-h-11">
              <p className="body-3 text-neutral-5 font-semibold">
                {departure}
                {td?.departure_time?.text && <span className="text-neutral-3 font-normal ml-1.5">{td.departure_time.text}</span>}
              </p>
              {td?.num_stops > 0 && (
                <p className="body-3 text-neutral-3 italic">
                  {td.num_stops} parada{td.num_stops !== 1 ? 's' : ''} intermedias
                </p>
              )}
              <p className="body-3 text-neutral-5 font-semibold">
                {arrival}
                {td?.arrival_time?.text && <span className="text-neutral-3 font-normal ml-1.5">{td.arrival_time.text}</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransitItinerary({ legs }) {
  return (
    <div>
      <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Cómo llegar</p>
      <div className="flex flex-col gap-4">
        {legs.map((leg, li) => (
          <div key={li} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: legColor(li) }} />
              <p className="body-3 font-semibold text-neutral-5">
                {leg.start_address.split(',')[0]} → {leg.end_address.split(',')[0]}
              </p>
              <span className="body-3 text-neutral-3 ml-auto shrink-0">{leg.duration.text}</span>
            </div>
            <div className="flex flex-col gap-1 pl-2 border-l-2" style={{ borderColor: legColor(li) + '66' }}>
              {leg.steps.map((step, si) => (
                <TransitStep key={si} step={step} legColor={legColor(li)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
