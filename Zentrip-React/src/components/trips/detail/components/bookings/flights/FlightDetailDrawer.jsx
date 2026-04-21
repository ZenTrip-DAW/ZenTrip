import {
  toPrice, fmt, secToHM, minToHM, fmtTime, fmtDate,
  getLegsWithStops, getCheckin, getHand,
} from './flightUtils';
import {
  IcPlaneFly, IcX, IcUser, IcChild, IcClock, IcCheck, IcCreditCard, IcWifi,
} from './flightIcons';

export default function FlightDetailDrawer({ offer, onClose, onPurchase }) {
  if (!offer) return null;
  const currency = offer.priceBreakdown?.total?.currencyCode ?? 'EUR';
  const total = toPrice(offer.priceBreakdown?.total);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-stretch sm:justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-7/30" />
      <div
        className="relative bg-white w-full sm:max-w-md h-[90dvh] sm:h-full flex flex-col shadow-2xl rounded-t-3xl sm:rounded-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-1 shrink-0">
          <div>
            <h3 className="title-h3-desktop text-neutral-7">Detalles del vuelo</h3>
            {/* Muestra origen → destino del tramo de ida, no el destino de vuelta */}
            <p className="body-3 text-neutral-4 mt-0.5">
              {offer.segments[0]?.departureAirport?.cityName} → {offer.segments[0]?.arrivalAirport?.cityName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer w-9 h-9 rounded-full bg-neutral-1 flex items-center justify-center hover:bg-neutral-2 transition-colors"
          >
            <IcX size={16} color="#7A7270" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {offer.segments.map((seg, si) => {
            const isReturn = si > 0;
            const checkin = getCheckin(offer, si);
            const hand = getHand(offer, si);
            const legs = getLegsWithStops(seg);

            return (
              <div key={si}>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full body-3 font-semibold mb-4 ${isReturn ? 'bg-primary-1 text-primary-4' : 'bg-secondary-1 text-secondary-4'}`}>
                  <IcPlaneFly size={12} color={isReturn ? '#C35001' : '#016FC1'} />
                  {isReturn ? 'Regreso' : 'Ida'} · {fmtDate(seg.departureTime)}
                </div>

                <div className="space-y-0">
                  {legs.map((leg, li) => {
                    const carrier = leg?.carriersData?.[0];
                    const isFirst = li === 0;
                    const isLast = li === legs.length - 1;
                    const stopTime = !isLast
                      ? (() => {
                          const arrMs = new Date(leg.arrivalTime).getTime();
                          const nextDepMs = new Date(legs[li + 1]?.departureTime).getTime();
                          const diffMin = Math.round((nextDepMs - arrMs) / 60000);
                          return Number.isFinite(diffMin) && diffMin > 0 ? diffMin : null;
                        })()
                      : null;

                    return (
                      <div key={li}>
                        {/* Punto de salida — solo para el primer tramo */}
                        {isFirst && (
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                              <div className="w-3.5 h-3.5 rounded-full bg-secondary-3 border-2 border-white shrink-0 mt-1.5" />
                              <div className="w-0.5 bg-neutral-2 flex-1 mt-1" style={{ minHeight: 32 }} />
                            </div>
                            <div className="pb-3 flex-1">
                              <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 20, lineHeight: 1.1 }}>{fmtTime(leg.departureTime)}</p>
                              <p className="body-2-semibold text-neutral-6">{leg.departureAirport?.cityName} · {leg.departureAirport?.code}</p>
                              {leg.departureAirport?.name && (
                                <p className="body-3 text-neutral-4">{leg.departureAirport.name}{leg.departureTerminal ? ` · T${leg.departureTerminal}` : ''}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Información del vuelo */}
                        <div className="flex items-stretch gap-3">
                          <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                            <div className="w-0.5 bg-neutral-2 flex-1" />
                          </div>
                          <div className="flex-1 bg-neutral-1 rounded-xl px-3 py-2.5 my-1 mb-2 space-y-1">
                            <div className="flex items-center gap-2">
                              {carrier?.logo && <img src={carrier.logo} alt={carrier.name} className="w-5 h-5 object-contain" />}
                              <span className="body-3 font-semibold text-neutral-7">{carrier?.name} · {carrier?.code}{leg?.flightInfo?.flightNumber}</span>
                            </div>
                            <div className="flex items-center gap-3 body-3 text-neutral-5 flex-wrap">
                              <span className="flex items-center gap-1"><IcClock size={12} color="#A19694" />{secToHM(leg.totalTime ?? 0)}</span>
                              {leg.flightInfo?.planeType && <span>· {leg.flightInfo.planeType}</span>}
                              {leg.cabinClass && <span>· {leg.cabinClass}</span>}
                            </div>
                            {leg.amenities && Object.keys(leg.amenities).length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {leg.amenities.wifi?.isAvailable && (
                                  <span className="flex items-center gap-1 body-3 text-secondary-4">
                                    <IcWifi size={12} color="#016FC1" /> Wi-Fi
                                  </span>
                                )}
                                {leg.amenities.seatLegroom && (
                                  <span className="body-3 text-neutral-5">{leg.amenities.seatLegroom} cm espacio</span>
                                )}
                                {leg.amenities.usbPower && <span className="body-3 text-neutral-5">USB</span>}
                                {leg.amenities.videoStreaming && <span className="body-3 text-neutral-5">Video</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Punto de llegada — naranja en escalas, azul en destino final */}
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                            <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shrink-0 mt-1.5 ${isLast ? 'bg-secondary-3' : 'bg-primary-3'}`} />
                            {!isLast && <div className="w-0.5 bg-neutral-2 flex-1 mt-1" style={{ minHeight: 16 }} />}
                          </div>
                          <div className={`${!isLast ? 'pb-2' : ''} flex-1`}>
                            <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 20, lineHeight: 1.1 }}>{fmtTime(leg.arrivalTime)}</p>
                            <p className="body-2-semibold text-neutral-6">{leg.arrivalAirport?.cityName} · {leg.arrivalAirport?.code}</p>
                            {leg.arrivalAirport?.name && (
                              <p className="body-3 text-neutral-4">{leg.arrivalAirport.name}{leg.arrivalTerminal ? ` · T${leg.arrivalTerminal}` : ''}</p>
                            )}
                          </div>
                        </div>

                        {/* Escala: tiempo de espera y salida desde la escala */}
                        {!isLast && (
                          <>
                            <div className="flex items-stretch gap-3">
                              <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                                <div className="flex-1 border-l border-dashed border-primary-2" />
                              </div>
                              <div className="flex-1 bg-primary-1 border border-primary-2 rounded-xl px-3 py-2 my-2">
                                <p className="body-3 text-primary-4 font-semibold">
                                  {stopTime ? `${minToHM(stopTime)} de escala` : 'Escala'} · {leg.arrivalAirport?.cityName ?? leg.arrivalAirport?.code}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center shrink-0" style={{ width: 14 }}>
                                <div className="w-3.5 h-3.5 rounded-full bg-primary-3 border-2 border-white shrink-0 mt-1.5" />
                                <div className="w-0.5 bg-neutral-2 flex-1 mt-1" style={{ minHeight: 32 }} />
                              </div>
                              <div className="pb-3 flex-1">
                                <p className="font-titles font-bold text-neutral-7" style={{ fontSize: 20, lineHeight: 1.1 }}>{fmtTime(legs[li + 1].departureTime)}</p>
                                <p className="body-2-semibold text-neutral-6">{legs[li + 1].departureAirport?.cityName} · {legs[li + 1].departureAirport?.code}</p>
                                {legs[li + 1].departureAirport?.name && (
                                  <p className="body-3 text-neutral-4">{legs[li + 1].departureAirport.name}{legs[li + 1].departureTerminal ? ` · T${legs[li + 1].departureTerminal}` : ''}</p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Equipaje incluido */}
                <div className="mt-4 border border-neutral-1 rounded-2xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-neutral-1">
                    <p className="body-3 font-semibold text-neutral-6">Equipaje incluido</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {checkin ? (
                      <div className="flex items-center gap-2">
                        <IcCheck size={13} color="#2E7D32" />
                        <span className="body-3 text-neutral-7">
                          Maleta facturada{checkin.maxPiece ? ` · ${checkin.maxPiece} pieza${checkin.maxPiece > 1 ? 's' : ''}` : ''}
                          {checkin.maxWeightPerPiece ? ` · ${checkin.maxWeightPerPiece}${checkin.massUnit ?? 'KG'}` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <IcX size={13} color="#DC2626" /><span className="body-3 text-neutral-5">Sin maleta facturada</span>
                      </div>
                    )}
                    {hand ? (
                      <div className="flex items-center gap-2">
                        <IcCheck size={13} color="#2E7D32" />
                        <span className="body-3 text-neutral-7">
                          Equipaje de mano{hand.maxPiece ? ` · ${hand.maxPiece} pieza${hand.maxPiece > 1 ? 's' : ''}` : ''}
                          {hand.maxWeightPerPiece ? ` · ${hand.maxWeightPerPiece}${hand.massUnit ?? 'KG'}` : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <IcX size={13} color="#DC2626" /><span className="body-3 text-neutral-5">Sin equipaje de mano</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Precio desglosado por pasajero */}
          {offer.travellerPrices?.length > 0 && (
            <div className="border border-neutral-1 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 bg-neutral-1">
                <p className="body-3 font-semibold text-neutral-6">Precio por pasajero</p>
              </div>
              {offer.travellerPrices.map((tp, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-t border-neutral-1">
                  <div className="flex items-center gap-2">
                    {tp.travellerType === 'ADULT' ? <IcUser size={14} color="#A19694" /> : <IcChild size={14} color="#A19694" />}
                    <span className="body-2 text-neutral-6">
                      {tp.travellerType === 'ADULT' ? `Adulto ${tp.travellerReference}` : `Niño ${tp.travellerReference}`}
                    </span>
                  </div>
                  <span className="body-2-semibold text-neutral-7">{fmt(toPrice(tp.travellerPriceBreakdown?.total), currency)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-secondary-1 border-t border-secondary-2">
                <span className="body-semibold text-secondary-5">Total del viaje</span>
                <span className="title-h3-desktop text-secondary-4">{fmt(total, currency)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Botón de compra */}
        <div className="px-6 py-4 border-t border-neutral-1 shrink-0">
          <button
            onClick={() => { onPurchase(offer); onClose(); }}
            className="cursor-pointer w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-primary-4 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <IcCreditCard size={16} color="white" />
            Comprar vuelo · {fmt(total, currency)}
          </button>
        </div>
      </div>
    </div>
  );
}
