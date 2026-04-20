import {
  toPrice, fmt, secToHM, minToHM, fmtTime,
  getStops, getSegmentStops, getSegmentStopDetails,
  getCheckin, getHand,
} from './flightUtils';
import { IcPlaneFly, IcBag, IcCheck, IcX } from './flightIcons';

export default function FlightCard({ offer, isBest, onShowDetail, onPurchase }) {
  const currency = offer.priceBreakdown?.total?.currencyCode ?? 'EUR';
  const total = toPrice(offer.priceBreakdown?.total);
  const adultP = offer.travellerPrices?.find((t) => t.travellerType === 'ADULT');
  const kidPs = offer.travellerPrices?.filter((t) => t.travellerType === 'KID') ?? [];
  const stops = getStops(offer);
  const seats = offer.seatAvailability?.numberOfSeatsAvailable;
  const seg0 = offer.segments[0];
  const segR = offer.segments.length > 1 ? offer.segments[offer.segments.length - 1] : null;
  const segRStops = segR ? getSegmentStops(segR) : 0;
  const carrier = seg0?.legs[0]?.carriersData?.[0];
  const checkin = getCheckin(offer, 0);
  const hand = getHand(offer, 0);
  const hasFlex = offer.extraProducts?.some((e) => e.type === 'flexibleTicket');
  const stopDetails = getSegmentStopDetails(seg0);
  const stopDetailsReturn = getSegmentStopDetails(segR);

  return (
    <div className={`bg-white rounded-2xl border transition-all ${isBest ? 'border-primary-3' : 'border-neutral-1 hover:border-secondary-2 hover:shadow-sm'}`}>
      {isBest && (
        <div className="flex items-center gap-2 px-5 py-2 bg-primary-1 rounded-t-2xl border-b border-primary-2">
          <IcPlaneFly size={12} color="#C35001" />
          <span className="body-3 font-bold text-primary-4 uppercase tracking-wide">Mejor opción</span>
        </div>
      )}

      <div className="px-4 sm:px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Aerolínea */}
          <div className="flex sm:flex-col items-center gap-2 sm:gap-1 shrink-0 sm:w-16">
            {carrier?.logo
              ? <img src={carrier.logo} alt={carrier.name} className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl border border-neutral-1 p-1" />
              : <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-secondary-1 flex items-center justify-center body-3 font-bold text-secondary-4">{carrier?.code}</div>
            }
            <p className="body-3 text-neutral-4 sm:text-center leading-tight" style={{ fontSize: 10 }}>{carrier?.name}</p>
          </div>

          {/* Segmentos */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
            {/* Tramo de ida */}
            <div className="flex-1 flex items-center gap-2">
              <div className="text-center">
                <p className="font-titles font-bold text-neutral-7 text-xl sm:text-2xl leading-none">{fmtTime(seg0?.departureTime)}</p>
                <p className="body-3 font-semibold text-neutral-5">{seg0?.departureAirport?.code}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <p className="body-3 text-neutral-4">{secToHM(seg0?.totalTime ?? 0)}</p>
                <div className="flex items-center w-full gap-1">
                  <div className="flex-1 border-t-2 border-dashed border-neutral-2" />
                  <IcPlaneFly size={14} color="#0194FE" />
                  <div className="flex-1 border-t-2 border-dashed border-neutral-2" />
                </div>
                <p className={`body-3 font-semibold ${stops === 0 ? 'text-auxiliary-green-5' : 'text-primary-3'}`}>
                  {stops === 0 ? 'Directo' : `${stops} escala${stops > 1 ? 's' : ''}`}
                </p>
                {stopDetails && stopDetails.length > 0 && (
                  <p className="body-3 text-neutral-4" style={{ fontSize: 9 }}>
                    {stopDetails.map(s => `${s.city}${s.waitMin ? ` ${minToHM(s.waitMin)}` : ''}`).join(' · ')}
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="font-titles font-bold text-neutral-7 text-xl sm:text-2xl leading-none">{fmtTime(seg0?.arrivalTime)}</p>
                <p className="body-3 font-semibold text-neutral-5">{seg0?.arrivalAirport?.code}</p>
              </div>
            </div>

            {/* Tramo de vuelta */}
            {segR && (
              <>
                <div className="hidden sm:block w-px h-12 bg-neutral-1 shrink-0" />
                <div className="flex-1 flex items-center gap-2">
                  <div className="text-center">
                    <p className="font-titles font-bold text-neutral-7 text-xl sm:text-2xl leading-none">{fmtTime(segR.departureTime)}</p>
                    <p className="body-3 font-semibold text-neutral-5">{segR.departureAirport?.code}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-0.5">
                    <p className="body-3 text-neutral-4">{secToHM(segR.totalTime ?? 0)}</p>
                    <div className="flex items-center w-full gap-1">
                      <div className="flex-1 border-t-2 border-dashed border-neutral-2" />
                      <IcPlaneFly size={14} color="#FE6B01" />
                      <div className="flex-1 border-t-2 border-dashed border-neutral-2" />
                    </div>
                    <p className={`body-3 font-semibold ${segRStops === 0 ? 'text-auxiliary-green-5' : 'text-primary-3'}`}>
                      {segRStops === 0 ? 'Directo' : `${segRStops} escala${segRStops > 1 ? 's' : ''}`}
                    </p>
                    {stopDetailsReturn && stopDetailsReturn.length > 0 && (
                      <p className="body-3 text-neutral-4" style={{ fontSize: 9 }}>
                        {stopDetailsReturn.map(s => `${s.city}${s.waitMin ? ` ${minToHM(s.waitMin)}` : ''}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-titles font-bold text-neutral-7 text-xl sm:text-2xl leading-none">{fmtTime(segR.arrivalTime)}</p>
                    <p className="body-3 font-semibold text-neutral-5">{segR.arrivalAirport?.code}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Precio y botón */}
          <div className="shrink-0 flex sm:block items-center justify-between border-t sm:border-t-0 sm:border-l border-neutral-1 pt-3 sm:pt-0 sm:pl-4 sm:text-right sm:min-w-32.5">
            <div>
              {adultP && <p className="body-3 text-neutral-4 hidden sm:block">{fmt(toPrice(adultP.travellerPriceBreakdown?.total), currency)} / adulto</p>}
              {kidPs.length > 0 && <p className="body-3 text-neutral-4 hidden sm:block">{fmt(toPrice(kidPs[0].travellerPriceBreakdown?.total), currency)} / niño</p>}
              <p className="font-titles font-bold text-neutral-7 text-xl sm:text-2xl leading-none mt-0.5">{fmt(total, currency)}</p>
              <p className="body-3 text-neutral-4">precio total</p>
              {seats && <p className="body-3 text-primary-3 font-semibold mt-1 hidden sm:block">¡Solo {seats} plazas!</p>}
            </div>
            <button
              onClick={() => onPurchase(offer)}
              className="cursor-pointer sm:mt-2.5 sm:w-full py-2 sm:py-2.5 px-4 sm:px-0 bg-primary-3 text-white rounded-full body-2-semibold hover:bg-primary-4 active:scale-95 transition-all whitespace-nowrap"
            >
              Ver y reservar
            </button>
          </div>
        </div>

        {/* Etiquetas de equipaje y detalles */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-1 flex-wrap">
          {checkin
            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-auxiliary-green-1 body-3 text-auxiliary-green-5">
                <IcCheck size={11} color="#2E7D32" />
                Maleta incluida{checkin.maxWeightPerPiece ? ` · ${checkin.maxWeightPerPiece}${checkin.massUnit ?? 'KG'}` : ''}
              </span>
            : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-1 body-3 text-neutral-4">
                <IcX size={11} color="#A19694" />Sin maleta
              </span>
          }
          {hand && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary-1 body-3 text-secondary-4">
              <IcBag size={11} color="#016FC1" />
              Mano{hand.maxWeightPerPiece ? ` · ${hand.maxWeightPerPiece}${hand.massUnit ?? 'KG'}` : ''}
            </span>
          )}
          {hasFlex && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-1 body-3 text-primary-4">
              Billete flexible
            </span>
          )}
          {/* Enlace para abrir el panel lateral de detalles */}
          <button
            onClick={() => onShowDetail(offer)}
            className="cursor-pointer ml-auto body-3 text-secondary-4 font-semibold hover:text-secondary-3 transition-colors"
          >
            Ver detalles →
          </button>
        </div>
      </div>
    </div>
  );
}
