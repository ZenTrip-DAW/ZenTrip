import { useState } from 'react';
import { toPrice, fmt, fmtDate, buildBookingUrl } from './flightUtils';
import { IcPlane, IcX, IcCheck, IcCreditCard } from './flightIcons';

export default function PurchaseModal({ offer, fromState, toState, onClose, onSave }) {
  const [step, setStep] = useState('resumen'); // resumen | listo
  const [saving, setSaving] = useState(false);

  if (!offer) return null;
  const currency = offer.priceBreakdown?.total?.currencyCode ?? 'EUR';
  const total = toPrice(offer.priceBreakdown?.total);
  const seg0 = offer.segments[0];
  const bookingUrl = buildBookingUrl(offer, fromState, toState);

  return (
    <div
      className="fixed inset-0 z-300 flex items-center justify-center p-4"
      onClick={step !== 'listo' ? onClose : undefined}
    >
      <div className="absolute inset-0 bg-neutral-7/50" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-1 shrink-0">
          <h3 className="title-h3-desktop text-neutral-7">
            {step === 'resumen' ? 'Reservar vuelo' : '¡Vuelo añadido!'}
          </h3>
          {step !== 'listo' && (
            <button
              onClick={onClose}
              className="cursor-pointer w-8 h-8 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors"
            >
              <IcX size={15} color="#7A7270" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Resumen del vuelo */}
          <div className="bg-secondary-1 rounded-2xl px-4 py-3 flex items-center gap-3">
            <IcPlane size={20} color="#016FC1" />
            <div className="flex-1 min-w-0">
              <p className="body-2-semibold text-neutral-7">
                {seg0?.departureAirport?.code} → {seg0?.arrivalAirport?.code}
              </p>
              <p className="body-3 text-neutral-4">
                {fmtDate(seg0?.departureTime)} · {seg0?.legs[0]?.carriersData?.[0]?.name}
              </p>
            </div>
            <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 18 }}>{fmt(total, currency)}</p>
          </div>

          {step === 'resumen' && (
            <>
              {/* Desglose de precio por pasajero */}
              <div className="border border-neutral-1 rounded-2xl p-4 space-y-2">
                {offer.travellerPrices?.map((tp, i) => (
                  <div key={i} className="flex justify-between body-3 text-neutral-6">
                    <span>{tp.travellerType === 'ADULT' ? 'Adulto' : 'Niño'} {tp.travellerReference}</span>
                    <span className="font-semibold">{fmt(toPrice(tp.travellerPriceBreakdown?.total), currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between body-semibold text-neutral-7 pt-2 border-t border-neutral-1">
                  <span>Total</span>
                  <span>{fmt(total, currency)}</span>
                </div>
              </div>
              {/* Aviso sobre proceso de reserva y condiciones */}
              <div className="mb-4 p-3 rounded-xl bg-primary-1 text-primary-4 body-3 text-center border border-primary-3 flex flex-col gap-2">
                <span>El vuelo puede no aparecer igual en Booking.com. Los precios y la disponibilidad pueden variar.</span>
                <span className="text-neutral-5">Reserva tu vuelo en Booking.com y luego guarda la reserva en tu itinerario para tener todo organizado en ZenTrip.</span>
              </div>
            </>
          )}

          {step === 'listo' && (
            <div className="flex flex-col items-center py-4 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-auxiliary-green-1 flex items-center justify-center">
                <IcCheck size={28} color="#2E7D32" />
              </div>
              <div>
                <p className="body-semibold text-neutral-7">Vuelo guardado en tu viaje</p>
                <p className="body-3 text-neutral-4 mt-1">{seg0?.departureAirport?.cityName} → {seg0?.arrivalAirport?.cityName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="px-6 py-4 border-t border-neutral-1 shrink-0 space-y-2">
          {step === 'resumen' && (
            <>
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-orange-400 transition-all flex items-center justify-center gap-2 mb-4"
                >
                  Buscar en Booking.com · {fmt(total, currency)}
                </a>
              ) : (
                <span className="w-full py-3.5 bg-neutral-2 text-neutral-5 rounded-full body-bold flex items-center justify-center gap-2 cursor-not-allowed mb-4">
                  <IcCreditCard size={16} color="#A19694" />
                  No se puede abrir Booking.com
                </span>
              )}
              <button
                onClick={async () => {
                  setSaving(true);
                  await onSave(offer);
                  setSaving(false);
                  setStep('listo');
                }}
                disabled={saving}
                className={`cursor-pointer w-full py-3.5 bg-secondary-3 text-white rounded-full body-bold hover:bg-secondary-4 transition-all flex items-center justify-center gap-2 text-lg mt-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {saving
                  ? (<><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>)
                  : (<><span className="text-xl">✓</span> Guardar reserva en el itinerario</>)
                }
              </button>
            </>
          )}
          {step === 'listo' && (
            <button
              onClick={onClose}
              className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-orange-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg mt-2"
            >
              Listo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
