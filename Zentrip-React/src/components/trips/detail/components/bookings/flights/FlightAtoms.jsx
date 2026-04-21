import { Plane, Calendar, Clock } from 'lucide-react';
import { fmtAirport, fmtDate, fmtTime } from './flightBookingUtils';

export function SectionLabel({ children, muted = false }) {
  return (
    <p className={`body-3 font-bold uppercase tracking-wider mb-3 ${muted ? 'text-neutral-4' : 'text-neutral-5'}`}>
      {children}
    </p>
  );
}

export function TipCard({ icon, title, desc }) {
  return (
    <div className="bg-neutral-1/60 rounded-xl p-3">
      <p className="text-lg mb-1">{icon}</p>
      <p className="body-3 font-semibold text-neutral-6">{title}</p>
      <p className="body-3 text-neutral-4">{desc}</p>
    </div>
  );
}

export function SegmentRow({ seg, label }) {
  const depDate = fmtDate(seg.departureTime);
  const depTime = fmtTime(seg.departureTime);
  const arrTime = fmtTime(seg.arrivalTime);
  const carriers = seg.carriers ?? [];
  const flightNumbers = seg.flightNumbers ?? [];

  return (
    <div className="flex flex-col gap-1.5 py-2.5 border-t border-neutral-1 first:border-0 first:pt-0">
      {/* Label + ruta + números de vuelo */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-bold text-secondary-3 uppercase tracking-wide" style={{ fontSize: 10 }}>{label}</span>
        <span className="body-3 font-bold text-neutral-7">
          {fmtAirport(seg.departureAirport)} → {fmtAirport(seg.arrivalAirport)}
        </span>
        {flightNumbers.length > 0 && (
          <span className="body-3 text-neutral-3 font-mono">{flightNumbers.join(' · ')}</span>
        )}
      </div>

      {/* Nombre del aeropuerto */}
      {(seg.departureAirport?.name || seg.arrivalAirport?.name) && (
        <p className="text-neutral-3" style={{ fontSize: 11 }}>
          {seg.departureAirport?.name}
          {seg.departureAirport?.name && seg.arrivalAirport?.name && <span className="mx-1.5">→</span>}
          {seg.arrivalAirport?.name}
        </p>
      )}

      {/* Fecha + hora */}
      {(depDate || depTime) && (
        <div className="flex items-center gap-2 body-3 text-neutral-5">
          <Calendar className="w-3.5 h-3.5 text-neutral-3 shrink-0" />
          <span>{depDate}</span>
          {depTime && (
            <>
              <Clock className="w-3.5 h-3.5 text-neutral-3 shrink-0" />
              <span>{depTime}{arrTime ? ` → ${arrTime}` : ''}</span>
            </>
          )}
        </div>
      )}

      {/* Aerolíneas */}
      {carriers.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {carriers.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 body-3 text-neutral-5">
              {c.logo
                ? <img src={c.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
                : <Plane className="w-3.5 h-3.5 text-neutral-3 shrink-0" />
              }
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
