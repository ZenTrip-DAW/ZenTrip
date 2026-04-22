import { useState, useRef, useEffect, useCallback } from 'react';
import { useJsApiLoader, GoogleMap, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import { Plus, X, Navigation, Clock, Route, MapPin, Car } from 'lucide-react';
import BookingBanner from '../BookingBanner';

const LIBRARIES = ['places'];
const MAP_STYLE = { width: '100%', height: '420px' };

const TRAVEL_MODES = [
  { key: 'DRIVING',   label: 'Coche',      Icon: Car },
  { key: 'WALKING',   label: 'A pie',       Icon: Navigation },
  { key: 'BICYCLING', label: 'Bicicleta',   Icon: Route },
];

const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DAY_NAMES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDayLabel(iso) {
  const d = parseDate(iso);
  return `${DAY_NAMES_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

let _wpCounter = 0;
function newWp(value = '') {
  return { id: `wp-${++_wpCounter}`, value };
}

function WaypointRow({ wp, index, total, onChange, onRemove, isLoaded }) {
  const acRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = acRef.current?.getPlace();
    const name = place?.formatted_address || place?.name || '';
    if (name) onChange(wp.id, name);
  };

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const dotColor = isFirst
    ? 'bg-auxiliary-green-5'
    : isLast
    ? 'bg-feedback-error'
    : 'bg-primary-3';

  const input = (
    <input
      value={wp.value}
      onChange={(e) => onChange(wp.id, e.target.value)}
      placeholder={
        isFirst ? 'Punto de salida…' : isLast ? 'Destino final…' : `Parada ${index}…`
      }
      className="w-full h-10 px-3 border border-neutral-2 rounded-lg body-2 text-neutral-7 bg-white outline-none focus:border-primary-3 focus:ring-2 focus:ring-primary-3/10 transition placeholder:text-neutral-3"
    />
  );

  return (
    <div className="flex items-start gap-2 mb-1">
      {/* Dot + line */}
      <div className="flex flex-col items-center shrink-0 pt-3">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        {!isLast && <div className="w-px flex-1 min-h-[20px] bg-neutral-2 mt-1" />}
      </div>

      {/* Autocomplete input */}
      <div className="flex-1 min-w-0">
        {isLoaded ? (
          <Autocomplete
            onLoad={(ac) => { acRef.current = ac; }}
            onPlaceChanged={handlePlaceChanged}
          >
            {input}
          </Autocomplete>
        ) : (
          input
        )}
      </div>

      {/* Remove button — only if > 2 stops */}
      {total > 2 ? (
        <button
          type="button"
          onClick={() => onRemove(wp.id)}
          className="shrink-0 mt-1.5 p-1.5 rounded-full text-neutral-3 hover:text-feedback-error hover:bg-feedback-error-bg transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="w-7 shrink-0" />
      )}
    </div>
  );
}

export default function RouteExplorer({ trip, tripDays = [], activitiesByDate = {} }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  const [selectedDay, setSelectedDay] = useState(tripDays[0] ?? null);
  const [waypoints, setWaypoints] = useState([newWp(), newWp()]);
  const [travelMode, setTravelMode] = useState('DRIVING');
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Pre-populate from day activities when day changes
  useEffect(() => {
    if (!selectedDay) return;
    const acts = (activitiesByDate[selectedDay] || [])
      .filter((a) => a.type !== 'vuelo' && a.type !== 'ruta')
      .slice()
      .sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });

    if (acts.length >= 2) {
      setWaypoints(acts.map((a) => newWp(a.name)));
    } else if (acts.length === 1) {
      setWaypoints([newWp(acts[0].name), newWp()]);
    } else {
      const dest = trip?.destination?.split(',')[0]?.trim() || '';
      setWaypoints([newWp(dest), newWp()]);
    }
    setDirections(null);
    setRouteInfo(null);
    setError(null);
  }, [selectedDay]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((id, value) => {
    setWaypoints((prev) => prev.map((w) => (w.id === id ? { ...w, value } : w)));
  }, []);

  const handleRemove = useCallback((id) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleAddStop = () => {
    setWaypoints((prev) => {
      const copy = [...prev];
      copy.splice(copy.length - 1, 0, newWp());
      return copy;
    });
  };

  const handleCalculate = () => {
    const filled = waypoints.filter((w) => w.value.trim());
    if (filled.length < 2) {
      setError('Necesitas al menos 2 paradas para calcular una ruta.');
      return;
    }
    setCalculating(true);
    setError(null);
    setDirections(null);
    setRouteInfo(null);

    const origin = filled[0].value;
    const destination = filled[filled.length - 1].value;
    const midpoints = filled
      .slice(1, -1)
      .map((w) => ({ location: w.value, stopover: true }));

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination,
        waypoints: midpoints,
        travelMode: window.google.maps.TravelMode[travelMode],
        language: 'es',
      },
      (result, status) => {
        setCalculating(false);
        if (status === 'OK') {
          setDirections(result);
          const legs = result.routes[0].legs;
          const totalDist = legs.reduce((s, l) => s + l.distance.value, 0);
          const totalDur = legs.reduce((s, l) => s + l.duration.value, 0);
          setRouteInfo({
            distance:
              totalDist >= 1000
                ? `${(totalDist / 1000).toFixed(1)} km`
                : `${totalDist} m`,
            duration: formatDuration(totalDur),
            legs,
          });
        } else {
          setError(
            'No se pudo calcular la ruta. Comprueba que los lugares son correctos.'
          );
        }
      }
    );
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
        title="Planifica tu ruta"
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
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full border body-3 transition ${
                  !selectedDay
                    ? 'border-primary-3 bg-primary-1 text-primary-3 font-bold'
                    : 'border-neutral-2 text-neutral-5 hover:border-primary-3 hover:text-primary-3'
                }`}
              >
                Libre
              </button>
              {tripDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`shrink-0 px-3 py-1.5 rounded-full border body-3 transition whitespace-nowrap ${
                    selectedDay === day
                      ? 'border-primary-3 bg-primary-1 text-primary-3 font-bold'
                      : 'border-neutral-2 text-neutral-5 hover:border-primary-3 hover:text-primary-3'
                  }`}
                >
                  {formatDayLabel(day)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Waypoints + config */}
        <div className="bg-white border border-neutral-1 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="body-3 font-bold text-neutral-5 uppercase tracking-wider">
              Paradas
            </span>
            <button
              type="button"
              onClick={handleAddStop}
              className="flex items-center gap-1 body-3 text-primary-3 hover:text-primary-4 font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir parada
            </button>
          </div>

          <div className="mb-4">
            {waypoints.map((wp, idx) => (
              <WaypointRow
                key={wp.id}
                wp={wp}
                index={idx}
                total={waypoints.length}
                onChange={handleChange}
                onRemove={handleRemove}
                isLoaded={isLoaded}
              />
            ))}
          </div>

          {/* Travel mode */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {TRAVEL_MODES.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTravelMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border body-3 transition ${
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
              className={`w-full h-12 rounded-lg font-titles font-bold text-white flex items-center justify-center gap-2 transition ${
                !calculating && isLoaded
                  ? 'bg-primary-3 hover:bg-primary-4'
                  : 'bg-neutral-2 cursor-not-allowed'
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

        {/* Route summary */}
        {routeInfo && (
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
        )}

        {/* Map */}
        {isLoaded && (
          <div className="rounded-2xl overflow-hidden border border-neutral-1">
            <GoogleMap
              mapContainerStyle={MAP_STYLE}
              zoom={directions ? undefined : 5}
              center={directions ? undefined : { lat: 40.4, lng: 3.7 }}
              onLoad={(map) => { mapRef.current = map; }}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
                zoomControl: true,
              }}
            >
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    polylineOptions: {
                      strokeColor: '#FF6B35',
                      strokeWeight: 5,
                    },
                  }}
                />
              )}
            </GoogleMap>
          </div>
        )}

        {/* Step by step legs */}
        {routeInfo?.legs?.length > 0 && (
          <div>
            <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">
              Tramos
            </p>
            <div className="flex flex-col gap-2">
              {routeInfo.legs.map((leg, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 border border-neutral-1 rounded-xl px-4 py-3 flex-wrap"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-primary-1 text-primary-3 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="body-3 text-neutral-5 truncate">
                      {leg.start_address.split(',').slice(0, 2).join(', ')}
                      {' → '}
                      {leg.end_address.split(',').slice(0, 2).join(', ')}
                    </p>
                  </div>
                  <span className="body-3 text-neutral-3 shrink-0">
                    {leg.distance.text} · {leg.duration.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
