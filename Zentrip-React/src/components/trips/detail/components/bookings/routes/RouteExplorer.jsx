import { useState, useRef, useEffect, useCallback } from 'react';
import { useJsApiLoader, GoogleMap, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import { Plus, X, Navigation, Clock, Route, MapPin, Car, Shuffle, Footprints, Bike, Bus, Save, Check, GripVertical, Hotel, Plane, Train, Compass, Utensils } from 'lucide-react';
import BookingBanner from '../BookingBanner';
import { addBooking, updateBooking, getBookings } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';

const LIBRARIES = ['places'];
const MAP_STYLE = { width: '100%', height: '420px' };

const TRAVEL_MODES = [
  { key: 'DRIVING',   label: 'Coche',               Icon: Car },
  { key: 'WALKING',   label: 'A pie',                Icon: Footprints },
  { key: 'BICYCLING', label: 'Bicicleta',            Icon: Bike },
  { key: 'TRANSIT',   label: 'Transporte público',   Icon: Bus },
];

const DAY_NAMES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_LONG = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDayLong(iso) {
  const d = parseDate(iso);
  return `${DAY_NAMES_SHORT[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

let _wpCounter = 0;
function newWp(value = '', fromActivity = false, label = null) {
  return { id: `wp-${++_wpCounter}`, value, fromActivity, label };
}

const ACTIVITY_LABEL_CFG = {
  hotel:       { Icon: Hotel,   text: 'Hotel' },
  vuelo:       { Icon: Plane,   text: 'Aeropuerto' },
  actividad:   { Icon: Compass, text: 'Actividad' },
  restaurante: { Icon: Utensils, text: 'Restaurante' },
  restaurant:  { Icon: Utensils, text: 'Restaurante' },
  car:         { Icon: Car,     text: 'Recogida coche' },
  tren:        { Icon: Train,   text: 'Tren' },
};

function activityLabel(activity) {
  const cfg = ACTIVITY_LABEL_CFG[activity.type];
  const name = activity.hotelName || activity.name || '';
  return cfg ? { Icon: cfg.Icon, text: cfg.text, name } : { Icon: MapPin, text: '', name };
}

// Extracts "Madrid (MAD)" from "✈ Madrid (MAD) → Barcelona (BCN) — passengers"

// Extrae el aeropuerto de DESTINO del nombre de actividad de vuelo (fallback para reservas antiguas sin address)
// Extrae el aeropuerto de llegada y su dirección para vuelos
function extractFlightArrivalWaypoint(activity) {
  if (activity.arrivalAirportAddress) return activity.arrivalAirportAddress;
  if (activity.arrivalAirportName) return activity.arrivalAirportName;
  if (activity.address) return activity.address;
  const m = activity.name?.match(/[→⇄]\s*([^—]+)/);
  if (m) return m[1].replace(/\(.+\)/, '').trim();
  return activity.name;
}

function appendCity(text, city) {
  if (!city || !text) return text;
  return text.toLowerCase().includes(city.toLowerCase()) ? text : `${text}, ${city}`;
}

function extractAddressOrName(activity) {
  const city = activity.city || '';
  if (activity.address) return appendCity(activity.address, city);
  const base = activity.hotelName || activity.name || '';
  if (base && city) return `${base}, ${city}`;
  if (base) return base;
  if (activity.lat != null && activity.lng != null) return `${activity.lat},${activity.lng}`;
  return '';
}

function activityToWaypoint(activity) {
  const label = activityLabel(activity);
  if (activity.type === 'vuelo') {
    return newWp(extractFlightArrivalWaypoint(activity), true, label);
  }
  return newWp(extractAddressOrName(activity), true, label);
}

function WaypointRow({ wp, index, total, onChange, onRemove, onMove, isLoaded }) {
  const acRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handlePlaceChanged = () => {
    const place = acRef.current?.getPlace();
    const name = place?.formatted_address || place?.name || '';
    if (name) onChange(wp.id, name, false);
  };

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const dotColor = isFirst || isLast ? 'bg-auxiliary-green-5' : 'bg-primary-3';

  const inputEl = (
    <input
      value={wp.value}
      onChange={(e) => onChange(wp.id, e.target.value, false)}
      placeholder={isFirst ? 'Punto de salida…' : isLast ? 'Destino final…' : `Parada ${index}…`}
      className={`w-full h-10 px-3 border rounded-lg body-2 text-neutral-7 bg-white outline-none focus:ring-2 focus:ring-primary-3/10 transition placeholder:text-neutral-3 ${
        wp.fromActivity ? 'border-amber-400 focus:border-amber-400' : 'border-neutral-2 focus:border-primary-3'
      }`}
    />
  );

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const from = Number(e.dataTransfer.getData('text/plain')); if (from !== index) onMove(from, index); }}
      onDragEnd={() => setIsDragOver(false)}
      className={`flex items-start gap-2 mb-1 transition-opacity ${isDragOver ? 'opacity-50' : ''}`}
    >
      <div className="shrink-0 pt-3 cursor-grab text-neutral-2 hover:text-neutral-4 transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex flex-col items-center shrink-0 pt-3">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        {!isLast && <div className="w-px flex-1 min-h-20px bg-neutral-2 mt-1" />}
      </div>

      <div className="flex-1 min-w-0">
        {wp.label && (
          <div className="flex items-center gap-1.5 mb-1">
            <wp.label.Icon className="w-3.5 h-3.5 text-neutral-4 shrink-0" />
            <p className="body-3 text-neutral-4 font-semibold truncate">
              {wp.label.text}{wp.label.name ? ` · ${wp.label.name}` : ''}
            </p>
          </div>
        )}
        {isLoaded ? (
          <Autocomplete onLoad={(ac) => { acRef.current = ac; }} onPlaceChanged={handlePlaceChanged}>
            {inputEl}
          </Autocomplete>
        ) : inputEl}
      </div>

      {total > 2 ? (
        <button
          type="button"
          onClick={() => onRemove(wp.id)}
          className="cursor-pointer shrink-0 mt-1.5 p-1.5 rounded-full text-neutral-3 hover:text-feedback-error hover:bg-feedback-error-bg transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="w-7 shrink-0" />
      )}
    </div>
  );
}

const LEG_COLORS = ['#FF6B35','#0194FE','#2E7D32','#9C27B0','#FF9800','#E91E63','#00BCD4'];
const legColor = (i) => LEG_COLORS[i % LEG_COLORS.length];

const VEHICLE_EMOJI = {
  BUS: '🚌', SUBWAY: '🚇', TRAM: '🚋', RAIL: '🚆',
  COMMUTER_TRAIN: '🚆', HEAVY_RAIL: '🚂', FERRY: '⛴️',
  CABLE_CAR: '🚡', GONDOLA_LIFT: '🚡', FUNICULAR: '🚟',
};

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

function TransitItinerary({ legs }) {
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
  const [saveMode, setSaveMode] = useState(null); // 'updated' | 'new'
  const [isDirty, setIsDirty] = useState(false);
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

  // Rellena waypoints inteligentemente: hotel detectado por rango, vuelo de llegada primero
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

    // Hotel: primero buscar en actividades del día, luego en reservas que abarquen el día
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
    // Vuelo de llegada: el primer vuelo del día ordenado por hora (suele ser llegada al destino)
    const arrivalFlight = nonHotel.length > 0 && nonHotel[0].type === 'vuelo' ? nonHotel[0] : null;
    const restActs = arrivalFlight ? nonHotel.slice(1) : nonHotel;

    let wps = [];
    if (arrivalFlight) {
      // Aeropuerto de llegada como origen, luego hotel, luego resto
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

  // Auto-calculate when API loads if we came from a saved route
  useEffect(() => {
    if (!shouldAutoCalculateRef.current || !isLoaded) return;
    shouldAutoCalculateRef.current = false;
    handleCalculate();
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((id, value) => {
    setWaypoints((prev) => prev.map((w) => (w.id === id ? { ...w, value, fromActivity: false } : w)));
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

  const STATUS_MSGS = {
    NOT_FOUND: 'No se encontró alguna de las ubicaciones. Prueba a ser más específico.',
    ZERO_RESULTS: 'No hay ruta disponible entre estos puntos con el modo seleccionado.',
    REQUEST_DENIED: 'La clave de API no tiene la Directions API activada o le falta facturación.',
    OVER_QUERY_LIMIT: 'Límite de consultas alcanzado. Inténtalo en unos segundos.',
    INVALID_REQUEST: 'Solicitud inválida. Revisa que todas las paradas tengan texto.',
  };

  const buildRouteInfo = (allLegs) => {
    const totalDist = allLegs.reduce((s, l) => s + l.distance.value, 0);
    const totalDur  = allLegs.reduce((s, l) => s + l.duration.value, 0);
    return {
      distance: totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`,
      duration: formatDuration(totalDur),
      legs: allLegs,
    };
  };

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

  // Clear results when travel mode changes; auto-recalculate if there were results
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
      // Use a small timeout so state settles before recalculating
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
          const legs = result.routes[0].legs;
          const totalDist = legs.reduce((s, l) => s + l.distance.value, 0);
          const totalDur = legs.reduce((s, l) => s + l.duration.value, 0);
          setRouteInfo({
            distance: totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`,
            duration: formatDuration(totalDur),
            legs,
          });
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
    <div className="bg-white rounded-2xl border border-neutral-1 overflow-hidden">
      <BookingBanner
        src="/img/background/bookings/attraction.jpg"
        objectPosition="center 60%"
        alt="Rutas"
        title="¿Qué ruta quereis explorar?"
        subtitle="Calcula el recorrido óptimo para tu día de viaje"
      />

      <div className="p-4 sm:p-6 flex flex-col gap-5">

        {/* Day selector */}
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

        {/* Waypoints + config */}
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
              <span>⚠</span> Confirma o ajusta las direcciones en el desplegable de Google
            </p>
          )}

          {/* Travel mode */}
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

        {/* Error */}
        {error && (
          <div className="bg-feedback-error-bg border border-feedback-error/30 rounded-xl px-4 py-3 body-3 text-feedback-error flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Route summary + save */}
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

            {/* Save route */}
            {tripId && (
              saved ? (
                <p className="body-3 text-auxiliary-green-5 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {saveMode === 'updated' ? 'Cambios guardados en Reservas → Rutas' : 'Nueva ruta guardada en Reservas → Rutas'}
                </p>
              ) : existingId && !isDirty ? null : existingId && isDirty ? (
                /* Editing a saved route → show update + save-as-new */
                <div className="flex flex-col gap-2 border border-neutral-2 rounded-xl px-4 py-3">
                  <input
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder={initialData?.name || 'Nombre de la ruta'}
                    className="w-full body-2 text-neutral-7 outline-none placeholder:text-neutral-3 border-b border-neutral-1 pb-2"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateRoute(); }}
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleUpdateRoute}
                      className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-primary-3 hover:bg-primary-4 text-white rounded-lg body-3 font-semibold transition"
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
                /* New route → collapsed button → expand name input */
                savingRoute ? (
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
              )
            )}
          </div>
        )}

        {/* Map */}
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

        {/* Indicaciones */}
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
  );
}
