import { useState } from 'react';
import { Plane, Users, X, ExternalLink, Calendar, Clock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteFlightBooking } from '../../../../../../services/tripService';
import ReceiptManagerModal from '../ReceiptManagerModal';
import { SegmentRow } from './FlightAtoms';
import {
  fmt, fmtDate, fmtDateShort, fmtTime,
  getDisplayLabel, getLegLabel, getTripKind, getPassengerNames, getFirstDep,
} from './flightBookingUtils';

function CancelModal({ booking, tripId, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await deleteFlightBooking(tripId, booking.id);
      onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="title-h3-desktop text-neutral-7 mb-2">¿Cancelar reserva?</h3>
        <p className="body-2 text-neutral-5 mb-4">
          Esto eliminará el vuelo de ZenTrip.{' '}
          <span className="font-bold text-neutral-7">Cancela también en la aerolínea</span> si aplica.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-neutral-2 body-3 font-bold text-neutral-5 hover:bg-neutral-1 transition"
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 h-10 rounded-lg bg-red-600 text-white body-3 font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            {deleting ? 'Eliminando…' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptGallery({ urls, onClose }) {
  const [current, setCurrent] = useState(0);
  const total = urls.length;
  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-7/85 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          <img src={urls[current]} alt={`Comprobante ${current + 1}`} className="w-full object-contain max-h-[65vh]" />
          {total > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-7/60 hover:bg-neutral-7/80 text-white flex items-center justify-center transition">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-7/60 hover:bg-neutral-7/80 text-white flex items-center justify-center transition">
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 body-3 text-white bg-neutral-7/50 rounded-full px-2.5 py-0.5">
                {current + 1} / {total}
              </div>
            </>
          )}
        </div>
        {total > 1 && (
          <div className="flex gap-2 justify-center">
            {urls.map((url, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${i === current ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <a
            href={urls[current]}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/20 text-white rounded-full body-3 font-semibold hover:bg-white/30 transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir en nueva pestaña
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-neutral-7 rounded-full body-3 font-semibold hover:bg-neutral-1 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FlightBookingCard({ booking, tripId, members = [], onCancelled, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showCancel, setShowCancel] = useState(false);
  const [showReceipts, setShowReceipts] = useState(false);
  const [receiptUrls, setReceiptUrls] = useState(booking.receiptUrls ?? []);

  const segments = booking.segments ?? [];
  const hasSegments = segments.length > 0;
  const isRoundTrip = booking.isRoundTrip;
  const tripKind = getTripKind(booking);
  const firstDep = getFirstDep(booking);
  const firstDepShort = fmtDateShort(firstDep);
  const firstDepTime = fmtTime(firstDep);
  const passengerNames = getPassengerNames(booking, members);

  return (
    <>
      <div className="bg-white border border-secondary-2 rounded-2xl overflow-hidden">

        {/* Cabecera clicable */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full bg-secondary-1 px-4 py-3 flex items-start gap-3 hover:bg-secondary-2 transition text-left"
        >
          <div className="w-8 h-8 rounded-full bg-secondary-2 flex items-center justify-center shrink-0 mt-0.5">
            <Plane className="w-4 h-4 text-secondary-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="body-2-semibold text-neutral-7 leading-snug">{getDisplayLabel(booking)}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="body-3 text-neutral-4">{tripKind}</span>
              {!expanded && firstDepShort && (
                <span className="body-3 text-neutral-5">
                  · {firstDepShort}{firstDepTime ? ` · ${firstDepTime}` : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-1">
            {booking.totalPrice != null && (
              <p className="body-2-semibold text-secondary-4">{fmt(booking.totalPrice, booking.currency)}</p>
            )}
            <ChevronDown className={`w-4 h-4 text-neutral-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Contenido desplegable */}
        {expanded && (
          <>
            {/* Tramos */}
            <div className="px-4 pt-3">
              {hasSegments
                ? segments.map((seg, i) => (
                    <SegmentRow key={i} seg={seg} label={getLegLabel(i, segments.length, isRoundTrip)} />
                  ))
                : (booking.departureTime || booking.carrier) && (
                    <div className="flex flex-col gap-1.5 py-2">
                      {booking.departureTime && (
                        <div className="flex items-center gap-2 body-3 text-neutral-5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-3 shrink-0" />
                          <span>{fmtDate(booking.departureTime)}</span>
                          {fmtTime(booking.departureTime) && (
                            <>
                              <Clock className="w-3.5 h-3.5 text-neutral-3 shrink-0" />
                              <span>
                                {fmtTime(booking.departureTime)}
                                {fmtTime(booking.arrivalTime) ? ` → ${fmtTime(booking.arrivalTime)}` : ''}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      {booking.carrier && (
                        <div className="flex items-center gap-1.5 body-3 text-neutral-5">
                          {booking.carrierLogo
                            ? <img src={booking.carrierLogo} alt="" className="w-4 h-4 object-contain shrink-0" />
                            : <Plane className="w-3.5 h-3.5 text-neutral-3 shrink-0" />
                          }
                          <span>{booking.carrier}</span>
                        </div>
                      )}
                    </div>
                  )
              }
            </div>

            {/* Pasajeros + reservado por */}
            <div className="px-4 pb-3 mt-2 flex flex-col gap-1.5">
              {passengerNames.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-neutral-4 uppercase tracking-wide" style={{ fontSize: 10 }}>Pasajeros</p>
                  <div className="flex items-start gap-2 body-3 text-neutral-6">
                    <Users className="w-3.5 h-3.5 text-neutral-3 shrink-0 mt-0.5" />
                    <span>{passengerNames.join(', ')}</span>
                  </div>
                </div>
              )}
              {booking.createdBy?.name && (
                <p className="body-3 text-neutral-3">
                  Reservado por <span className="font-semibold text-neutral-5">{booking.createdBy.name}</span>
                </p>
              )}
            </div>

            {/* Footer: comprobante + cancelar */}
            <div className="px-4 pb-3 border-t border-neutral-1 pt-3 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowReceipts(true)}
                className="flex items-center gap-1.5 body-3 text-auxiliary-green-5 font-semibold px-2.5 py-1.5 bg-auxiliary-green-1 border border-auxiliary-green-2 rounded-lg hover:bg-auxiliary-green-2 transition"
              >
                🧾 {receiptUrls.length > 0 ? `${receiptUrls.length} comprobante${receiptUrls.length > 1 ? 's' : ''}` : 'Añadir comprobante'}
              </button>
              <button
                onClick={() => setShowCancel(true)}
                className="ml-auto h-8 px-3 rounded-lg border border-red-300 text-red-600 body-3 font-semibold hover:bg-red-50 transition flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Cancelar
              </button>
            </div>
          </>
        )}
      </div>

      {showReceipts && (
        <ReceiptManagerModal
          booking={{ ...booking, receiptUrls }}
          tripId={tripId}
          onClose={() => setShowReceipts(false)}
          onUpdated={(urls) => setReceiptUrls(urls)}
        />
      )}
      {showCancel && (
        <CancelModal
          booking={booking}
          tripId={tripId}
          onConfirm={() => { setShowCancel(false); onCancelled(); }}
          onClose={() => setShowCancel(false)}
        />
      )}
    </>
  );
}
