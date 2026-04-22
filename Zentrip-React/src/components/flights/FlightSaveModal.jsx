import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plane, ChevronRight, CheckCircle2 } from 'lucide-react';
import {
  getUserTrips,
  getTripMembers,
  addStop,
  addBooking,
  addActivity,
  sendFlightBookingNotifications,
} from '../../services/tripService';
import { resolveToEnglish, resolveToSpanish } from '../../services/geocodingService';
import BookingReceiptUpload from '../trips/detail/components/bookings/BookingReceiptUpload';
import PassengerSelector from '../trips/shared/PassengerSelector';
import { toPrice, fmt, fmtDate, fmtTime } from '../trips/detail/components/bookings/flights/flightUtils';
import { fmtAirport } from '../trips/detail/components/bookings/flights/flightBookingUtils';

function buildFlightLabel(offer) {
  const segs = offer?.segments ?? [];
  if (segs.length === 0) return '?';
  if (segs.length === 2) {
    return `${fmtAirport(segs[0].departureAirport)} ⇄ ${fmtAirport(segs[0].arrivalAirport)}`;
  }
  return segs.map((s) => `${fmtAirport(s.departureAirport)} → ${fmtAirport(s.arrivalAirport)}`).join(' / ');
}

function buildPassengerLabel(passengers, members) {
  if (passengers === 'all' || !Array.isArray(passengers)) {
    const count = members.filter((m) => m.invitationStatus === 'accepted').length;
    return `Todos (${count})`;
  }
  const names = passengers
    .map((uid) => members.find((m) => m.uid === uid))
    .filter(Boolean)
    .map((m) => m.name || m.username || 'Miembro');
  return names.length > 0 ? names.join(', ') : 'Sin pasajeros';
}

// ── TripRow ───────────────────────────────────────────────────────────────────
const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function TripRow({ trip, flightDest, onClick }) {
  const destMatch = trip.destination && flightDest &&
    normalize(trip.destination).includes(normalize(flightDest));
  const noDestino = !trip.destination;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 p-4 rounded-2xl border border-neutral-1 hover:border-secondary-3 hover:bg-secondary-1 transition-all text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="body-semibold text-neutral-7 truncate">{trip.name || 'Viaje sin nombre'}</p>
        {trip.destination && <p className="body-3 text-neutral-4">📍 {trip.destination}</p>}
        {!destMatch && !noDestino && flightDest && (
          <p className="body-3 text-primary-3 mt-0.5">⚠ Destino diferente ({flightDest})</p>
        )}
        {noDestino && flightDest && (
          <p className="body-3 text-auxiliary-green-5 mt-0.5">✓ Se añadirá {flightDest} como destino</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-3 shrink-0 mt-0.5" />
    </button>
  );
}

// ── FlightSaveModal ───────────────────────────────────────────────────────────
export default function FlightSaveModal({ offer, user, tripContext, onClose }) {
  const navigate = useNavigate();

  // Estado de selección de viaje (solo cuando no hay tripContext)
  const [trips, setTrips] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(
    tripContext ? { id: tripContext.tripId, name: tripContext.tripName } : null
  );
  const [showTripPicker, setShowTripPicker] = useState(!tripContext);

  // Datos del viaje una vez seleccionado
  const [members, setMembers] = useState([]);
  const [loadingTrip, setLoadingTrip] = useState(false);

  // Estado del formulario
  const [passengers, setPassengers] = useState('all');
  const [receiptUrls, setReceiptUrls] = useState([]);
  const [addDestToTrip, setAddDestToTrip] = useState(false);

  // Estado del guardado
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // null = resolviendo | { autoSave: [{original,display}], userChoice: [{original,display}] }
  const [resolvedNewDests, setResolvedNewDests] = useState(null);

  const seg0 = offer?.segments?.[0];
  const currency = offer?.priceBreakdown?.total?.currencyCode ?? 'EUR';
  const total = toPrice(offer?.priceBreakdown?.total);
  const flightLabel = buildFlightLabel(offer);
  const departureDate = seg0?.departureTime?.slice(0, 10);

  // Extrae solo las ciudades de destino del tramo de ida — excluye tramos de vuelta y ciudades solo de conexión.
  // En ida y vuelta el último segmento llega al origen, así que se descarta.
  // En solo ida o multi-destino se conservan todas las llegadas excepto las que coinciden con la ciudad de salida.
  const segments = offer?.segments ?? [];
  const flightOriginCode = seg0?.departureAirport?.code ?? '';
  const flightOriginCity = (seg0?.departureAirport?.cityName ?? seg0?.departureAirport?.code ?? '').toLowerCase();
  const outboundSegs = segments.filter((seg) => seg.arrivalAirport?.code !== flightOriginCode);
  const segDestCities = [...new Set(
    outboundSegs.map((seg) => seg.arrivalAirport?.cityName ?? seg.arrivalAirport?.code ?? '').filter(Boolean)
  )];
  const flightDest = segDestCities[0] ?? '';

  // Clasifica los destinos del vuelo en dos categorías:
  // - autoSave: coincide con destino/parada existente sin fechas → guardar fechas automáticamente
  // - userChoice: ciudad nueva → checkbox para el usuario
  useEffect(() => {
    let active = true;
    setResolvedNewDests(null);

    const segs = offer?.segments ?? [];
    const originCode = segs[0]?.departureAirport?.code ?? '';
    const outbound = segs.filter((s) => s.arrivalAirport?.code !== originCode);
    const flightCities = [...new Set(outbound.map((s) => s.arrivalAirport?.cityName ?? s.arrivalAirport?.code ?? '').filter(Boolean))];

    if (flightCities.length === 0) { setResolvedNewDests({ autoSave: [], userChoice: [] }); return; }

    const tripOriginRaw = (tripContext?.origin ?? selectedTrip?.origin ?? '').split(',')[0].trim();
    const tripDestRaw = (tripContext?.destination ?? selectedTrip?.destination ?? '').split(',')[0].trim();
    const existingStops = tripContext?.stops ?? selectedTrip?.stops ?? [];
    const stopNamesRaw = existingStops.map((s) => (s.name || '').split(',')[0].trim()).filter(Boolean);

    async function resolve() {
      const [originEn, destEn, ...stopsEn] = await Promise.all([
        tripOriginRaw ? resolveToEnglish(tripOriginRaw) : Promise.resolve(null),
        tripDestRaw ? resolveToEnglish(tripDestRaw) : Promise.resolve(null),
        ...stopNamesRaw.map((n) => resolveToEnglish(n)),
      ]);

      const matchCity = (a, b) => {
        if (!a || !b) return false;
        const na = normalize(a.split(',')[0].trim());
        const nb = normalize(b.split(',')[0].trim());
        return na.length > 2 && nb.length > 2 && (na.includes(nb) || nb.includes(na));
      };

      const isFlightOrigin = (city) =>
        matchCity(city, flightOriginCity) || matchCity(city, originEn || tripOriginRaw) || matchCity(city, tripOriginRaw);

      const matchesTripDest = (city) =>
        matchCity(city, tripDestRaw) || matchCity(city, destEn || tripDestRaw);

      const alreadyInStops = (city) =>
        existingStops.some((s, i) =>
          matchCity(city, s.name) || (stopsEn[i] && matchCity(city, stopsEn[i]))
        );

      const alreadyInStopsWithDates = (city) =>
        existingStops.some((s, i) =>
          s.startDate && (matchCity(city, s.name) || (stopsEn[i] && matchCity(city, stopsEn[i])))
        );

      const autoSave = [];
      const userChoice = [];

      for (const city of flightCities) {
        if (isFlightOrigin(city)) continue;
        if (alreadyInStopsWithDates(city)) continue;

        const display = (await resolveToSpanish(city)) || city;

        if (matchesTripDest(city) && !alreadyInStops(city)) {
          // Destino existente sin fechas → guardar automáticamente
          autoSave.push({ original: city, display });
        } else if (!alreadyInStops(city) && !matchesTripDest(city)) {
          // Ciudad nueva → el usuario decide
          userChoice.push({ original: city, display });
        }
      }

      if (active) setResolvedNewDests({ autoSave, userChoice });
    }

    resolve();
    return () => { active = false; };
  }, [offer, tripContext, selectedTrip?.origin, selectedTrip?.destination, selectedTrip?.stops]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carga los viajes del usuario si no hay tripContext
  useEffect(() => {
    if (tripContext || !user) return;
    getUserTrips(user.uid)
      .then((list) => setTrips(list ?? []))
      .catch(() => setTrips([]));
  }, [user, tripContext]);

  // Carga los miembros y paradas cuando se selecciona un viaje
  useEffect(() => {
    if (!selectedTrip?.id) return;
    setLoadingTrip(true);
    getTripMembers(selectedTrip.id)
      .catch(() => [])
      .then((membersData) => {
        const list = Array.isArray(membersData) ? membersData : [];
        // Garantiza que el usuario actual aparezca con nombre visible
        const enriched = list.map((m) => {
          if (m.uid !== user?.uid || (m.name || m.username)) return m;
          return {
            ...m,
            name: user.displayName || user.email || m.name || '',
            avatar: user.photoURL || m.avatar || '',
          };
        });
        // Si el usuario actual no está en la lista, añadirlo
        if (user?.uid && !enriched.some((m) => m.uid === user.uid)) {
          enriched.unshift({
            uid: user.uid,
            name: user.displayName || user.email || '',
            avatar: user.photoURL || '',
            invitationStatus: 'accepted',
            role: 'coordinator',
          });
        }
        setMembers(enriched);
      })
      .finally(() => setLoadingTrip(false));
  }, [selectedTrip?.id]);

  const canSave = receiptUrls.length > 0 && selectedTrip && (passengers === 'all' || (Array.isArray(passengers) && passengers.length > 0));

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const segs = offer?.segments ?? [];
      const tripOrigin = (tripContext?.origin ?? selectedTrip?.origin ?? '').split(',')[0].trim();
      const tripDest = (tripContext?.destination ?? selectedTrip?.destination ?? '').split(',')[0].trim();

      const saveStop = async ({ original, display }) => {
        const arrSeg = segs.find((s) => normalize(s.arrivalAirport?.cityName ?? s.arrivalAirport?.code ?? '') === normalize(original));
        const depSeg = segs.find((s) => normalize(s.departureAirport?.cityName ?? s.departureAirport?.code ?? '') === normalize(original));
        const startDate = arrSeg?.arrivalTime?.slice(0, 10) || '';
        const endDate = depSeg?.departureTime?.slice(0, 10) || '';

        // Ordenación inteligente:
        // Si el vuelo sale del origen del viaje, insertar antes del destino actual
        // Si el vuelo sale del destino, añadir al final
        // Si no, añadir al final
        const flightDepCity = depSeg?.departureAirport?.cityName ?? depSeg?.departureAirport?.code ?? '';
        const flightDepNorm = normalize(flightDepCity);
        const tripOriginNorm = normalize(tripOrigin);
        const tripDestNorm = normalize(tripDest);

        let insertBeforeLast = false;
        if (flightDepNorm && tripOriginNorm && flightDepNorm.includes(tripOriginNorm)) {
          insertBeforeLast = true;
        }
        // Si el vuelo sale del destino, insertBeforeLast = false (añadir al final)
        // Si no coincide con origen ni destino, por defecto al final

        await addStop(selectedTrip.id, { name: display, startDate, endDate: endDate || startDate }, { insertBeforeLast });
      };

      // Destinos existentes sin fechas → siempre guardar
      for (const dest of (resolvedNewDests?.autoSave ?? [])) await saveStop(dest);

      // Ciudades nuevas → solo si el usuario marcó el checkbox
      if (addDestToTrip) {
        for (const dest of (resolvedNewDests?.userChoice ?? [])) await saveStop(dest);
      }

      const passengerLabel = buildPassengerLabel(passengers, members);
      const activityName = `✈ ${flightLabel} — ${passengerLabel}`;

      // Añade la actividad al itinerario
      const activityId = await addActivity(selectedTrip.id, {
        date: departureDate || '',
        startTime: fmtTime(seg0?.departureTime),
        endTime: fmtTime(seg0?.arrivalTime),
        name: activityName,
        type: 'vuelo',
        status: 'reservado',
        notes: '',
        passengers,
        stopId: null,
      });

      // Construye el objeto de reserva
      const segmentsData = (offer?.segments ?? []).map((seg) => {
        const carriers = [...new Map(
          (seg.legs ?? []).flatMap((l) => l.carriersData ?? [])
            .filter((c) => c?.name)
            .map((c) => [c.name, { name: c.name, logo: c.logo ?? '' }])
        ).values()];
        const flightNumbers = (seg.legs ?? [])
          .map((l) => {
            const code = l.carriersData?.[0]?.code ?? '';
            const num = l.flightInfo?.flightNumber ?? '';
            return code && num ? `${code}${num}` : null;
          })
          .filter(Boolean);
        return {
          departureAirport: { code: seg.departureAirport?.code ?? '', cityName: seg.departureAirport?.cityName ?? '', name: seg.departureAirport?.name ?? '' },
          arrivalAirport: { code: seg.arrivalAirport?.code ?? '', cityName: seg.arrivalAirport?.cityName ?? '', name: seg.arrivalAirport?.name ?? '' },
          departureTime: seg.departureTime ?? '',
          arrivalTime: seg.arrivalTime ?? '',
          carriers,
          flightNumbers,
        };
      });

      const bookingData = {
        type: 'vuelo',
        flightLabel,
        origin: seg0?.departureAirport?.code ?? '',
        originCity: seg0?.departureAirport?.cityName ?? '',
        destination: seg0?.arrivalAirport?.code ?? '',
        destinationCity: seg0?.arrivalAirport?.cityName ?? '',
        departureTime: seg0?.departureTime ?? '',
        arrivalTime: seg0?.arrivalTime ?? '',
        carrier: seg0?.legs?.[0]?.carriersData?.[0]?.name ?? '',
        carrierLogo: seg0?.legs?.[0]?.carriersData?.[0]?.logo ?? '',
        isRoundTrip: (offer?.segments?.length ?? 1) > 1,
        segments: segmentsData,
        totalPrice: Math.round(total * 100) / 100,
        currency,
        status: 'reservado',
        passengers,
        stopId: null,
        receiptUrls,
        activityId,
        createdBy: {
          uid: user.uid,
          name: user.displayName || user.email || '',
          photoURL: user.photoURL || '',
        },
      };

      await addBooking(selectedTrip.id, bookingData);

      sendFlightBookingNotifications(selectedTrip.id, {
        bookerUid: user.uid,
        bookerName: user.displayName || user.email || '',
        flightLabel,
        tripName: selectedTrip.name || '',
      }).catch(() => {});

      setDone(true);
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el vuelo. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-neutral-7/50" />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-auxiliary-green-1 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-auxiliary-green-5" />
          </div>
          <h3 className="title-h3-desktop text-neutral-7">¡Vuelo guardado!</h3>
          <p className="body-2 text-neutral-4">
            <span className="font-semibold text-neutral-7">{flightLabel}</span> añadido al itinerario de{' '}
            <span className="font-semibold text-neutral-7">"{selectedTrip?.name}"</span>.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-primary-3 text-white rounded-full body-bold hover:bg-primary-4 transition-all mt-2"
          >
            Listo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-300 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[92vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-1 shrink-0">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-secondary-3" />
            <h3 className="title-h3-desktop text-neutral-7">Guardar vuelo</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center text-neutral-5 hover:bg-neutral-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen del vuelo */}
        <div className="px-5 pt-4 shrink-0">
          <div className="bg-secondary-1 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Plane className="w-5 h-5 text-secondary-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="body-2-semibold text-neutral-7 truncate">{flightLabel}</p>
              <p className="body-3 text-neutral-4">
                {fmtDate(seg0?.departureTime)} · {seg0?.legs?.[0]?.carriersData?.[0]?.name} · {fmt(total, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de viaje */}
        {showTripPicker && (
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 flex flex-col gap-4">
            <p className="body-2-semibold text-neutral-6">¿A qué viaje quieres añadir este vuelo?</p>

            {trips === null && (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-2 border-secondary-3 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {trips !== null && trips.length === 0 && (
              <div className="text-center py-8">
                <p className="body-2 text-neutral-5 mb-4">No tienes viajes activos.</p>
                <button
                  onClick={() => { navigate('/trips/create'); onClose(); }}
                  className="px-6 py-3 bg-primary-3 text-white rounded-full body-semibold hover:bg-primary-4 transition"
                >
                  Crear viaje
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('zt_pending_flight', JSON.stringify(offer));
                navigate('/trips/create');
                onClose();
              }}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-neutral-2 hover:border-secondary-3 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-full bg-secondary-1 flex items-center justify-center shrink-0">
                <span className="text-secondary-4 font-bold text-lg">+</span>
              </div>
              <span className="body-semibold text-secondary-4">Crear nuevo viaje</span>
            </button>

            {trips?.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                flightDest={flightDest}
                onClick={() => {
                  setSelectedTrip(trip);
                  setShowTripPicker(false);
                }}
              />
            ))}
          </div>
        )}

        {/* Formulario principal (una vez seleccionado el viaje) */}
        {!showTripPicker && selectedTrip && (
          <>
            <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4 flex flex-col gap-6">

              {/* Badge del viaje (desde inicio, permite cambiar) */}
              {!tripContext && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-primary-1 border border-primary-2 rounded-xl px-3 py-2">
                    <span className="text-base">✈</span>
                    <p className="body-3 font-semibold text-primary-4 truncate">{selectedTrip.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowTripPicker(true); setMembers([]); }}
                    className="h-9 px-3 rounded-xl border border-neutral-2 body-3 text-neutral-5 hover:border-neutral-3 hover:bg-neutral-1 transition shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {loadingTrip && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-secondary-3 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loadingTrip && (
                <>
                  {resolvedNewDests === null && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-1 bg-white">
                      <div className="w-4 h-4 border-2 border-primary-3 border-t-transparent rounded-full animate-spin shrink-0" />
                      <p className="body-3 text-neutral-4">Comprobando destinos...</p>
                    </div>
                  )}
                  {resolvedNewDests?.autoSave?.length > 0 && (
                    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-auxiliary-green-2 bg-auxiliary-green-1">
                      <CheckCircle2 className="w-4 h-4 text-auxiliary-green-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="body-3 font-semibold text-auxiliary-green-6">
                          Fechas guardadas para <span className="font-bold">{resolvedNewDests.autoSave.map((d) => d.display).join(', ')}</span>
                        </p>
                        <p className="body-3 text-auxiliary-green-5 text-[11px]">Tu destino ya estaba en el viaje — se actualizan las fechas automáticamente</p>
                      </div>
                    </div>
                  )}
                  {resolvedNewDests?.userChoice?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddDestToTrip((v) => !v)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left w-full
                        ${addDestToTrip
                          ? 'border-primary-3 bg-primary-1'
                          : 'border-neutral-2 bg-white hover:border-primary-2'}`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition
                        ${addDestToTrip ? 'border-primary-3 bg-primary-3' : 'border-neutral-3'}`}>
                        {addDestToTrip && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`body-3 font-semibold ${addDestToTrip ? 'text-primary-4' : 'text-neutral-6'}`}>
                          Añadir <span className="font-bold">{resolvedNewDests.userChoice.map((d) => d.display).join(', ')}</span> como parada{resolvedNewDests.userChoice.length > 1 ? 's' : ''} del viaje
                        </p>
                        <p className="body-3 text-neutral-3 text-[11px]">
                          Se ordenará automáticamente por fecha de llegada
                        </p>
                      </div>
                    </button>
                  )}

                  <PassengerSelector
                    members={members}
                    value={passengers}
                    onChange={setPassengers}
                  />
                </>
              )}

              {/* Subida de comprobante */}
              <div>
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-1">
                  Captura del pago
                </p>
                <p className="body-3 text-neutral-3 mb-3">
                  Sube una captura de la confirmación del pago. El botón de guardar se activará cuando subas al menos una imagen.
                </p>
                <BookingReceiptUpload
                  initialUrls={[]}
                  onUpdate={setReceiptUrls}
                  label="Captura del pago"
                  optional={false}
                />
              </div>

              {error && (
                <p className="body-3 text-feedback-error bg-feedback-error-bg rounded-xl px-3 py-2">
                  ⚠ {error}
                </p>
              )}
            </div>

            {/* Footer de modal */}
            <div className="px-5 py-4 border-t border-neutral-1 shrink-0 bg-white">
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="w-full py-3.5 rounded-full body-bold transition-all flex items-center justify-center gap-2
                  disabled:bg-neutral-2 disabled:text-neutral-4 disabled:cursor-not-allowed
                  enabled:bg-primary-3 enabled:text-white enabled:hover:bg-primary-4"
              >
                {saving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>✓ Guardar en el itinerario</>
                )}
              </button>
              {!canSave && receiptUrls.length === 0 && (
                <p className="body-3 text-neutral-3 text-center mt-2">Sube el comprobante para continuar</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
