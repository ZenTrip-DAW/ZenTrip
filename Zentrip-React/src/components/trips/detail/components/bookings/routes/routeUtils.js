import { Hotel, Plane, Compass, Utensils, Car, Train, MapPin } from 'lucide-react';

export const LIBRARIES = ['places'];
export const MAP_STYLE = { width: '100%', height: '420px' };

export const LEG_COLORS = ['#FF6B35', '#0194FE', '#2E7D32', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4'];
export const legColor = (i) => LEG_COLORS[i % LEG_COLORS.length];

export const VEHICLE_EMOJI = {
  BUS: '🚌', SUBWAY: '🚇', TRAM: '🚋', RAIL: '🚆',
  COMMUTER_TRAIN: '🚆', HEAVY_RAIL: '🚂', FERRY: '⛴️',
  CABLE_CAR: '🚡', GONDOLA_LIFT: '🚡', FUNICULAR: '🚟',
};

export const STATUS_MSGS = {
  NOT_FOUND: 'No se encontró alguna de las ubicaciones. Prueba a ser más específico.',
  ZERO_RESULTS: 'No hay ruta disponible entre estos puntos con el modo seleccionado.',
  REQUEST_DENIED: 'La clave de API no tiene la Directions API activada o le falta facturación.',
  OVER_QUERY_LIMIT: 'Límite de consultas alcanzado. Inténtalo en unos segundos.',
  INVALID_REQUEST: 'Solicitud inválida. Revisa que todas las paradas tengan texto.',
};

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLong(iso) {
  const d = parseDate(iso);
  return `${DAY_NAMES_SHORT[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

let _wpCounter = 0;
export function newWp(value = '', fromActivity = false, label = null) {
  return { id: `wp-${++_wpCounter}`, value, fromActivity, label };
}

const ACTIVITY_LABEL_CFG = {
  hotel:       { Icon: Hotel,    text: 'Hotel' },
  vuelo:       { Icon: Plane,    text: 'Aeropuerto' },
  actividad:   { Icon: Compass,  text: 'Actividad' },
  restaurante: { Icon: Utensils, text: 'Restaurante' },
  restaurant:  { Icon: Utensils, text: 'Restaurante' },
  car:         { Icon: Car,      text: 'Recogida coche' },
  tren:        { Icon: Train,    text: 'Tren' },
};

export function activityLabel(activity) {
  const cfg = ACTIVITY_LABEL_CFG[activity.type];
  const name = activity.hotelName || activity.name || '';
  return cfg ? { Icon: cfg.Icon, text: cfg.text, name } : { Icon: MapPin, text: '', name };
}

// Extrae el aeropuerto de llegada y su dirección para vuelos
export function extractFlightArrivalWaypoint(activity) {
  if (activity.arrivalAirportAddress) return activity.arrivalAirportAddress;
  if (activity.arrivalAirportName) return activity.arrivalAirportName;
  if (activity.address) return activity.address;
  const m = activity.name?.match(/[→⇄]\s*([^—]+)/);
  if (m) return m[1].replace(/\(.+\)/, '').trim();
  return activity.name;
}

export function appendCity(text, city) {
  if (!city || !text) return text;
  return text.toLowerCase().includes(city.toLowerCase()) ? text : `${text}, ${city}`;
}

export function extractAddressOrName(activity) {
  const city = activity.city || '';
  if (activity.address) return appendCity(activity.address, city);
  const base = activity.hotelName || activity.name || '';
  if (base && city) return `${base}, ${city}`;
  if (base) return base;
  if (activity.lat != null && activity.lng != null) return `${activity.lat},${activity.lng}`;
  return '';
}

export function activityToWaypoint(activity) {
  const label = activityLabel(activity);
  if (activity.type === 'vuelo') {
    return newWp(extractFlightArrivalWaypoint(activity), true, label);
  }
  return newWp(extractAddressOrName(activity), true, label);
}

export function buildRouteInfo(allLegs) {
  const totalDist = allLegs.reduce((s, l) => s + l.distance.value, 0);
  const totalDur  = allLegs.reduce((s, l) => s + l.duration.value, 0);
  return {
    distance: totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`,
    duration: formatDuration(totalDur),
    legs: allLegs,
  };
}
