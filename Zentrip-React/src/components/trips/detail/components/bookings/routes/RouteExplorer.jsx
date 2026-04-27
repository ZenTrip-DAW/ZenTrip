import { useState, useRef, useEffect, useCallback } from 'react';
import { useJsApiLoader, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { Plus, X, Navigation, Clock, Route, MapPin, Car, Shuffle, Footprints, Bike, Bus, Save, Check, Pencil } from 'lucide-react';
import BookingBanner from '../BookingBanner';
import ImageLoadGate from '../../../../../shared/ImageLoadGate';
import { addBooking, updateBooking, getBookings } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';
import WaypointRow from './WaypointRow';
import TransitItinerary from './TransitItinerary';
import {
  LIBRARIES, MAP_STYLE, STATUS_MSGS, legColor,
  newWp, activityToWaypoint, formatDayLong, buildRouteInfo,
} from './routeUtils';

const TRAVEL_MODES = [
  { key: 'DRIVING',   label: 'Coche',               Icon: Car },
  { key: 'WALKING',   label: 'A pie',                Icon: Footprints },
  { key: 'BICYCLING', label: 'Bicicleta',            Icon: Bike },
  { key: 'TRANSIT',   label: 'Transporte público',   Icon: Bus },
];

export default function RouteExplorer({ trip, tripId, tripDays = [], activitiesByDate = {}, initialData = null }) {
  const { user } = useAuth();
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const today = new Date().toISOString().split('T')[0];
  const [selectedDay, setSelectedDay] = useState(() => {
    if (initialData?.date) return initialData.date;
    return tripDays.includes(today) ? today : (tripDays[0] ?? null);
  });
  const [waypoints, setWaypoints] = useState(() =>
    initialData?.waypoints?.length > 0
      ? initialData.waypoints.map((v) => newWp(v))
      : [newWp(), newWp()]
  );
  const [travelMode, setTravelMode] = useState(initialData?.travelMode || 'DRIVING');
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState(null);
  const existingId = initialData?.id ?? null;
  const [savingRoute, setSavingRoute] = useState(false);
  const [routeName, setRouteName] = useState(initialData?.name || '');
  const [saved, setSaved] = useState(false);
  const [saveMode, setSaveMode] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(initialData?.editMode ?? false);
  const [bookings, setBookings] = useState([]);
  const bookingsLoadedRef = useRef(false);
  const mapRef = useRef(null);
  const isMounted = useRef(false);
  const skipNextFillRef = useRef(!!initialData);
  const shouldAutoCalculateRef = useRef(!!initialData);

  // Carga reservas para detectar hotel por rango de fechas
  useEffect(() => {
    if (!tripId) return;
    getBookings(tripId)
      .then((bks) => {
        setBookings(bks);
        bookingsLoadedRef.current = true;
      })
      .catch(() => { bookingsLoadedRef.current = true; });
  }, [tripId]);

  // Rellena waypoints inteligentemente: hotel detectado por rango, vuelo de llegada como origen
  const fillFromDay = useCallback((day) => {
    if (!day) return;
    const acts = (activitiesByDate[day] || [])
      .filter((a) => a.type !== 'ruta')
      .slice()
      .sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });

    // Hotel: primero en actividades del día, luego en reservas que abarquen ese día
    let hotel = acts.find((a) => a.type === 'hotel');
    if (!hotel) {
      const hotelBk = bookings.find(
        (b) => b.type === 'hotel' && b.checkIn && b.checkOut && b.checkIn <= day && b.checkOut >= day
      );
      if (hotelBk) {
        hotel = {
          type: 'hotel',
          name: hotelBk.hotelName || hotelBk.name || '',
          address: hotelBk.address || '',
          city: hotelBk.city || '',
          lat: hotelBk.lat ?? null,
          lng: hotelBk.lng ?? null,
          startTime: null,
        };
      }
    }

    const nonHotel = acts.filter((a) => a.type !== 'hotel');
    // Vuelo de llegada: primer vuelo del día (ordenado por hora) → aeropuerto de origen
    const arrivalFlight = nonHotel.length > 0 && nonHotel[0].type === 'vuelo' ? nonHotel[0] : null;
    const restActs = arrivalFlight ? nonHotel.slice(1) : nonHotel;

    let wps = [];
    if (arrivalFlight) {
      wps = [activityToWaypoint(arrivalFlight)];
      if (hotel) wps.push(activityToWaypoint(hotel));
      wps.push(...restActs.map(activityToWaypoint));
    } else if (hotel) {
      wps = [activityToWaypoint(hotel), ...restActs.map(activityToWaypoint)];
    } else if (acts.length >= 1) {
      wps = acts.map(activityToWaypoint);
    }
    if (wps.length < 2) wps.push(newWp());
    setWaypoints(wps);
    setDirections(null);
    setRouteInfo(null);
    setError(null);
    setSaved(false);
  }, [activitiesByDate, trip?.destination, bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (skipNextFillRef.current) { skipNextFillRef.current = false; return; }
    fillFromDay(selectedDay);
  }, [selectedDay]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-rellena cuando las reservas cargan por primera vez (para detectar hotel por rango)
  useEffect(() => {
    if (bookings.length === 0 || skipNextFillRef.current) return;
    fillFromDay(selectedDay);
  }, [bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calcula automáticamente si venimos de una ruta guardada
  useEffect(() => {
    if (!shouldAutoCalculateRef.current || !isLoaded) return;
    shouldAutoCalculateRef.current = false;
    handleCalculate();
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isDirty && existingId) setShowEditPanel(true);
  }, [isDirty, existingId]);

  // Al editar manualmente un campo, limpia la etiqueta de actividad y marca como modificado
  const handleChange = useCallback((id, value) => {
    setWaypoints((prev) => prev.map((w) => (w.id === id ? { ...w, value, fromActivity: false, label: null } : w)));
    setIsDirty(true);
  }, []);

  const handleRemove = useCallback((id) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    setIsDirty(true);
  }, []);

  const handleMove = useCallback((from, to) => {
    setWaypoints((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setIsDirty(true);
  }, []);

  const routeOneLeg = (service, origin, destination, mode) =>
    new Promise((resolve, reject) => {
      service.route(
        { origin, destination, travelMode: window.google.maps.TravelMode[mode], language: 'es' },
        (result, status) => (status === 'OK' ? resolve(result) : reject(status)),
      );
    });

  const handleCalculate = useCallback(() => {
    if (!isLoaded) return;
    const filled = waypoints.filter((w) => w.value.trim());
    if (filled.length < 2) {
      setError('Necesitas al menos 2 paradas para calcular una ruta.');
      return;
    }
    setCalculating(true);
    setError(null);
    setDirections(null);
    setRouteInfo(null);
    setSaved(false);

    const service = new window.google.maps.DirectionsService();

    if (travelMode === 'TRANSIT') {
      const pairs = filled
        .map((w, i) => (i < filled.length - 1 ? [w.value, filled[i + 1].value] : null))
        .filter(Boolean);
      Promise.all(pairs.map(([o, d]) => routeOneLeg(service, o, d, 'TRANSIT')))
        .then((results) => {
          setCalculating(false);
          setDirections(results);
          setRouteInfo(buildRouteInfo(results.flatMap((r) => r.routes[0].legs)));
        })
        .catch((status) => {
          setCalculating(false);
          setError(STATUS_MSGS[status] || `Error de Google Maps: ${status}`);
        });
      return;
    }

    const origin = filled[0].value;
    const destination = filled[filled.length - 1].value;
    const midpoints = filled.slice(1, -1).map((w) => ({ location: w.value, stopover: true }));
    service.route(
      { origin, destination, waypoints: midpoints, travelMode: window.google.maps.TravelMode[travelMode], language: 'es' },
      (result, status) => {
        setCalculating(false);
        if (status === 'OK') {
          setDirections(result);
          setRouteInfo(buildRouteInfo(result.routes[0].legs));
        } else {
          setError(STATUS_MSGS[status] || `Error de Google Maps: ${status}`);
        }
      },
    );
  }, [isLoaded, waypoints, travelMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpia resultados al cambiar modo; recalcula si ya había resultado previo
  const prevModeRef = useRef(travelMode);
  const hadResultRef = useRef(false);
  useEffect(() => {
    if (routeInfo) hadResultRef.current = true;
  }, [routeInfo]);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (prevModeRef.current === travelMode) return;
    prevModeRef.current = travelMode;
    const wasCalculated = hadResultRef.current;
    setDirections(null);
    setRouteInfo(null);
    setError(null);
    setSaved(false);
    hadResultRef.current = false;
    if (wasCalculated && isLoaded && waypoints.filter((w) => w.value.trim()).length >= 2) {
      // Pequeño timeout para que el estado se estabilice antes de recalcular
      setTimeout(() => handleCalculate(), 50);
    }
  }, [travelMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOptimize = () => {
    const filled = waypoints.filter((w) => w.value.trim());
    if (filled.length < 3) {
      setError('Necesitas al menos 3 paradas para optimizar el orden.');
      return;
    }
    setOptimizing(true);
    setError(null);

    const origin = filled[0].value;
    const destination = filled[filled.length - 1].value;
    const midpoints = filled.slice(1, -1).map((w) => ({ location: w.value, stopover: true }));

    const service = new window.google.maps.DirectionsService();
    service.route(
      { origin, destination, waypoints: midpoints, optimizeWaypoints: true, travelMode: window.google.maps.TravelMode[travelMode], language: 'es' },
      (result, status) => {
        setOptimizing(false);
        if (status === 'OK') {
          const order = result.routes[0].waypoint_order;
          const mids = filled.slice(1, -1);
          const reordered = [filled[0], ...order.map((i) => mids[i]), filled[filled.length - 1]];
          setWaypoints(reordered.map((w) => newWp(w.value)));
          setDirections(result);
          setRouteInfo(buildRouteInfo(result.routes[0].legs));
        } else {
          setError(`No se pudo optimizar la ruta (${status}). Comprueba que los lugares son correctos.`);
        }
      }
    );
  };

  const handleAddStop = () => {
    setWaypoints((prev) => {
      const copy = [...prev];
      copy.splice(copy.length - 1, 0, newWp());
      return copy;
    });
    setIsDirty(true);
  };

  const buildRoutePayload = (name) => ({
    name,
    date: selectedDay || null,
    travelMode,
    waypoints: waypoints.filter((w) => w.value.trim()).map((w) => w.value),
    distance: routeInfo.distance,
    duration: routeInfo.duration,
  });

  const handleUpdateRoute = async () => {
    if (!existingId || !routeInfo) return;
    const name = routeName.trim() || initialData?.name || (selectedDay ? formatDayLong(selectedDay) : 'Ruta guardada');
    try {
      await updateBooking(tripId, existingId, buildRoutePayload(name));
      setSaved(true);
      setSaveMode('updated');
      setIsDirty(false);
    } catch (err) {
      console.error('[RouteExplorer] Error al actualizar ruta:', err);
    }
  };

  const handleSaveRoute = async () => {
    if (!tripId || !routeInfo) return;
    const name = routeName.trim() || (selectedDay ? formatDayLong(selectedDay) : 'Ruta guardada');
    try {
      await addBooking(tripId, {
        type: 'ruta',
        status: 'reservado',
        createdBy: { uid: user?.uid ?? null, name: user?.displayName || user?.email || null },
        ...buildRoutePayload(name),
      });
      setSaved(true);
      setSavingRoute(false);
      setSaveMode('new');
      setIsDirty(false);
    } catch (err) {
      console.error('[RouteExplorer] Error al guardar ruta:', err);
    }
  };

  if (loadError) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-1 p-8 text-center">
        <p className="body text-feedback-error">Error al cargar Google Maps.</p>
      </div>
    );
  }

  return (
    <ImageLoadGate src="/img/background/bookings/routes.jpg" alt="Rutas">
      <div className="bg-white rounded-2xl border border-neutral-1 overflow-hidden">
        <BookingBanner
          src="/img/background/bookings/routes.jpg"
          objectPosition="center 60%"
          alt="Rutas"
          title="¿Qué ruta queréis explorar?"
          subtitle="Calcula el recorrido óptimo para tu día de viaje"
        />

        <div className="p-4 sm:p-6 flex flex-col gap-5">

          {/* Selector de día del itinerario */}
          {tripDays.length > 0 && (
            <div>
              <label className="flex items-center gap-1 body-3 font-bold text-neutral-5 uppercase tracking-wider mb-2">
                <MapPin className="w-3 h-3" />
                Día del itinerario
              </label>
              <select
                value={selectedDay || ''}
                onChange={(e) => { setSelectedDay(e.target.value || null); setIsDirty(true); }}
                className="cursor-pointer w-full max-w-xs h-10 px-3 pr-8 border border-neutral-2 rounded-xl text-sm font-semibold text-secondary-5 bg-white outline-none focus:border-primary-3 focus:ring-2 focus:ring-primary-3/10 transition font-body appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23A19694%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-position-[right_10px_center]"
              >
                <option value="">Sin día seleccionado</option>
                {tripDays.map((day) => {
                  const actCount = (activitiesByDate[day] || []).length;
                  return (
                    <option key={day} value={day}>
                      {formatDayLong(day)}{actCount > 0 ? `  ·  ${actCount} actividad${actCount !== 1 ? 'es' : ''}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Cabecera: nombre de ruta guardada + edición */}
          {existingId && (
            saved ? (
              <p className="body-3 text-auxiliary-green-5 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {saveMode === 'updated' ? 'Cambios guardados en Reservas → Rutas' : 'Nueva ruta guardada en Reservas → Rutas'}
              </p>
            ) : showEditPanel ? (
              <div className="flex flex-col gap-2 border border-neutral-2 rounded-xl px-4 py-3">
                <input
                  autoFocus
                  value={routeName}
                  onChange={(e) => { setRouteName(e.target.value); setIsDirty(true); }}
                  placeholder={initialData?.name || 'Nombre de la ruta'}
                  className="w-full body-2 text-neutral-7 outline-none placeholder:text-neutral-3 border-b border-neutral-1 pb-2"
                  onKeyDown={(e) => { if (e.key === 'Enter' && isDirty) handleUpdateRoute(); }}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleUpdateRoute}
                    disabled={!isDirty}
                    className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary-3 hover:bg-primary-4 text-white rounded-lg body-3 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" /> Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRoute}
                    className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-neutral-2 hover:border-secondary-3 text-neutral-5 hover:text-secondary-5 rounded-lg body-3 font-semibold transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Guardar como nueva ruta
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="body-2-semibold text-neutral-7 truncate">{routeName || initialData?.name || 'Ruta guardada'}</p>
                <button
                  type="button"
                  title="Editar nombre / guardar cambios"
                  onClick={() => setShowEditPanel(true)}
                  className="cursor-pointer shrink-0 p-1 rounded-full text-neutral-3 hover:text-secondary-5 hover:bg-secondary-1 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}

          {/* Panel de paradas y configuración */}
          <div className="bg-white border border-neutral-1 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <span className="body-3 font-bold text-neutral-5 uppercase tracking-wider">Paradas</span>
              <div className="flex items-center gap-3 flex-wrap">
                {waypoints.filter((w) => w.value.trim()).length >= 3 && (
                  <button
                    type="button"
                    onClick={handleOptimize}
                    disabled={optimizing || !isLoaded}
                    className="cursor-pointer flex items-center gap-1 body-3 text-auxiliary-green-5 hover:text-auxiliary-green-6 font-semibold transition disabled:opacity-40"
                  >
                    {optimizing
                      ? <span className="w-3 h-3 border-2 border-auxiliary-green-5/30 border-t-auxiliary-green-5 rounded-full animate-spin" />
                      : <Shuffle className="w-3.5 h-3.5" />}
                    Optimizar orden
                    <span className="font-normal text-neutral-3 hidden sm:inline">(origen y destino fijos)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="cursor-pointer flex items-center gap-1 body-3 text-primary-3 hover:text-primary-4 font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir parada
                </button>
              </div>
            </div>

            <div className="mb-2">
              {waypoints.map((wp, idx) => (
                <WaypointRow
                  key={wp.id}
                  wp={wp}
                  index={idx}
                  total={waypoints.length}
                  onChange={handleChange}
                  onRemove={handleRemove}
                  onMove={handleMove}
                  isLoaded={isLoaded}
                />
              ))}
            </div>
            {waypoints.some((w) => w.fromActivity) && (
              <p className="body-3 text-amber-500 mb-4 flex items-center gap-1.5">
                <span>⚠</span> Confirma o ajusta las direcciones con ayuda del desplegable
              </p>
            )}

            {/* Modo de transporte */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {TRAVEL_MODES.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setTravelMode(key); setIsDirty(true); }}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full border body-3 transition ${
                    travelMode === key
                      ? 'border-primary-3 bg-primary-1 text-primary-3 font-bold'
                      : 'border-neutral-2 text-neutral-5 hover:border-primary-3 hover:text-primary-3'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="border-t border-neutral-1 pt-4">
              <button
                type="button"
                onClick={handleCalculate}
                disabled={calculating || !isLoaded}
                className={`cursor-pointer w-full h-12 rounded-lg font-titles font-bold text-white flex items-center justify-center gap-2 transition ${
                  !calculating && isLoaded ? 'bg-primary-3 hover:bg-primary-4' : 'bg-neutral-2 cursor-not-allowed'
                }`}
              >
                {calculating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Calculando…
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    Calcular ruta
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="bg-feedback-error-bg border border-feedback-error/30 rounded-xl px-4 py-3 body-3 text-feedback-error flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {/* Resumen de la ruta + guardar */}
          {routeInfo && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-3 bg-primary-1 border border-primary-2 rounded-xl px-4 py-3 flex-1 min-w-36">
                  <Route className="w-5 h-5 text-primary-3 shrink-0" />
                  <div>
                    <p className="body-3 text-neutral-4">Distancia total</p>
                    <p className="body-bold text-primary-4">{routeInfo.distance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-secondary-1 border border-secondary-2 rounded-xl px-4 py-3 flex-1 min-w-36">
                  <Clock className="w-5 h-5 text-secondary-4 shrink-0" />
                  <div>
                    <p className="body-3 text-neutral-4">Duración estimada</p>
                    <p className="body-bold text-secondary-4">{routeInfo.duration}</p>
                  </div>
                </div>
              </div>

              {/* Guardar ruta nueva */}
              {tripId && !existingId && (
                saved ? (
                  <p className="body-3 text-auxiliary-green-5 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Nueva ruta guardada en Reservas → Rutas
                  </p>
                ) : savingRoute ? (
                    <div className="flex items-center gap-2 border border-neutral-2 rounded-xl px-4 py-3">
                      <input
                        autoFocus
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder={selectedDay ? formatDayLong(selectedDay) : 'Nombre de la ruta'}
                        className="flex-1 body-2 text-neutral-7 outline-none placeholder:text-neutral-3"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRoute(); if (e.key === 'Escape') setSavingRoute(false); }}
                      />
                      <button type="button" onClick={handleSaveRoute} className="cursor-pointer shrink-0 px-3 py-1.5 bg-primary-3 hover:bg-primary-4 text-white rounded-lg body-3 font-semibold transition flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Guardar
                      </button>
                      <button type="button" onClick={() => setSavingRoute(false)} className="cursor-pointer shrink-0 p-1.5 text-neutral-3 hover:text-neutral-5 transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setRouteName(selectedDay ? formatDayLong(selectedDay) : ''); setSavingRoute(true); }}
                      className="cursor-pointer flex items-center gap-2 body-3 font-semibold text-secondary-5 hover:text-secondary-4 transition w-fit"
                    >
                      <Save className="w-4 h-4" />
                      Guardar ruta en Reservas
                    </button>
                  )
              )}
            </div>
          )}

          {/* Mapa */}
          {isLoaded && (
            <div className="rounded-2xl overflow-hidden border border-neutral-1">
              <GoogleMap
                mapContainerStyle={MAP_STYLE}
                zoom={directions ? undefined : 5}
                center={directions ? undefined : { lat: 40.4, lng: 3.7 }}
                onLoad={(map) => { mapRef.current = map; }}
                options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true, zoomControl: true }}
              >
                {directions && (
                  Array.isArray(directions)
                    ? directions.map((d, i) => (
                        <DirectionsRenderer
                          key={i}
                          directions={d}
                          options={{ polylineOptions: { strokeColor: legColor(i), strokeWeight: 5 }, suppressMarkers: i > 0 }}
                        />
                      ))
                    : (
                      <DirectionsRenderer
                        directions={directions}
                        options={{ polylineOptions: { strokeColor: legColor(0), strokeWeight: 5 } }}
                      />
                    )
                )}
              </GoogleMap>
            </div>
          )}

          {/* Indicaciones de ruta */}
          {routeInfo?.legs?.length > 0 && (
            travelMode === 'TRANSIT'
              ? <TransitItinerary legs={routeInfo.legs} />
              : (
                <div>
                  <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Tramos</p>
                  <div className="flex flex-col gap-2">
                    {routeInfo.legs.map((leg, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 border border-neutral-1 rounded-xl px-4 py-3 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-primary-1 text-primary-3 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                          <p className="body-3 text-neutral-5 truncate">
                            {leg.start_address.split(',').slice(0, 2).join(', ')} → {leg.end_address.split(',').slice(0, 2).join(', ')}
                          </p>
                        </div>
                        <span className="body-3 text-neutral-3 shrink-0">{leg.distance.text} · {leg.duration.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    </ImageLoadGate>
  );
}
