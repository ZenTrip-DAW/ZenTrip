export const PER_PAGE = 5;

export const FILTERS = [
  { key: 'all',    label: 'Todos' },
  { key: '5star',  label: '★★★★★ 5 estrellas' },
  { key: 'budget', label: 'Hasta 150€/noche' },
];

export const FILTER_FN = {
  '5star':  (h) => h.stars === 5,
  'budget': (h) => h.price != null && h.price <= 150,
};

export const TIPS = [
  { icon: '💡', iconBg: 'bg-primary-1',        title: 'Reserva con antelación',  text: 'En temporada alta los hoteles se agotan rápido. Reservar antes garantiza mejor precio.' },
  { icon: '✅', iconBg: 'bg-auxiliary-green-2', title: 'Cancela gratis',          text: 'Filtra por cancelación gratis para reservar sin riesgo si el plan cambia.' },
  { icon: '🗳️', iconBg: 'bg-secondary-1',       title: 'Votad en grupo',          text: 'Tus compañeros pueden votar los hoteles antes de confirmar la reserva.' },
  { icon: '💰', iconBg: 'bg-primary-1',          title: 'Presupuesto compartido',  text: 'El coste se añade automáticamente al presupuesto del viaje al añadirlo al itinerario.' },
];

/**
 * Transforma un hotel crudo de la API de booking-com15 al shape interno.
 * @param {object} raw - Hotel crudo de la API
 * @param {number} nights - Número de noches de la estancia
 */
export function mapApiHotel(raw, nights = 1) {
  const prop = raw.property || {};
  const stars = Math.round(prop.accuratePropertyClass ?? prop.propertyClass ?? 0);
  const totalPrice = prop.priceBreakdown?.grossPrice?.value ?? null;
  const price = totalPrice !== null ? Math.round(totalPrice / Math.max(nights, 1)) : null;
  const currency = prop.priceBreakdown?.grossPrice?.currency || 'EUR';
  const photo = prop.photoUrls?.[0] || null;
  const score = prop.reviewScore ? Number(prop.reviewScore).toFixed(1) : null;

  const hotelName = prop.name || '';
  const ufi = prop.ufi || '';

  return {
    id: raw.hotel_id ?? prop.id,
    name: hotelName || 'Hotel',
    ufi,
    loc: prop.wishlistName || prop.address || prop.countryCode || '',
    stars,
    score,
    reviewScoreWord: prop.reviewScoreWord || '',
    reviewCount: prop.reviewCount || 0,
    price,
    currency,
    photo,
    avail: 'Disponible',
    tags: (prop.facilities || []).slice(0, 4).map((f) => f.name).filter(Boolean),
    checkin: prop.checkin?.fromTime || null,
    checkout: prop.checkout?.untilTime || null,
  };
}

/**
 * Devuelve el número de noches entre dos fechas YYYY-MM-DD, o 0 si no es válido.
 */
export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

export function getNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const n = Math.round(
    (new Date(checkOut + 'T00:00:00') - new Date(checkIn + 'T00:00:00')) / 86400000,
  );
  return n > 0 ? n : 0;
}
