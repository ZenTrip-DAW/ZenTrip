// ── Formateadores de precio y tiempo ──────────────────────────────────────────
export const toPrice = (p) => (p?.units ?? 0) + (p?.nanos ?? 0) / 1e9;

export const fmt = (amount, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

export const secToHM = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

export const minToHM = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
};

export const fmtTime = (dt) => dt?.slice(11, 16) ?? '--:--';

export const fmtDate = (dt) => {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

// ── Helpers de segmentos y equipaje ──────────────────────────────────────────
export const getLegsWithStops = (seg) => seg?.legs ?? [];

export const getStops = (offer) => {
  const seg = offer.segments[0];
  if (!seg) return 0;
  return (seg.legs.length - 1) + seg.legs.reduce((a, l) => a + (l.flightStops?.length ?? 0), 0);
};

export const getSegmentStops = (seg) => {
  if (!seg?.legs?.length) return 0;
  return (seg.legs.length - 1) + seg.legs.reduce((a, l) => a + (l.flightStops?.length ?? 0), 0);
};

export const getSegmentStopDetails = (seg) => {
  const legs = seg?.legs ?? [];
  if (legs.length <= 1) return null;
  return legs.slice(0, -1).map((leg, i) => {
    const nextLeg = legs[i + 1];
    const arrMs = new Date(leg.arrivalTime).getTime();
    const depMs = new Date(nextLeg?.departureTime).getTime();
    const diffMin = Math.round((depMs - arrMs) / 60000);
    return {
      city: leg.arrivalAirport?.cityName ?? leg.arrivalAirport?.code ?? '?',
      waitMin: Number.isFinite(diffMin) && diffMin > 0 ? diffMin : null,
    };
  });
};

export const getCheckin = (offer, segIdx = 0) => {
  const ip = offer.includedProducts;
  const list = ip?.areAllSegmentsIdentical ? (ip.segments[0] ?? []) : (ip?.segments[segIdx] ?? []);
  return list?.find((b) => b.luggageType === 'CHECKED_IN');
};

export const getHand = (offer, segIdx = 0) => {
  const ip = offer.includedProducts;
  const list = ip?.areAllSegmentsIdentical ? (ip.segments[0] ?? []) : (ip?.segments[segIdx] ?? []);
  return list?.find((b) => b.luggageType === 'HAND');
};

// ── Helpers de fechas ─────────────────────────────────────────────────────────
export const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const todayStr = new Date().toISOString().split('T')[0];
export const today = new Date().toISOString().split('T')[0];
export const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

// ── Constructor de URL para Booking.com ───────────────────────────────────────
export const buildBookingUrl = (offer, fromState, toState) => {
  const seg0 = offer.segments[0];
  const segLast = offer.segments[offer.segments.length - 1];
  const isRound = offer.segments.length > 1;
  const from = fromState?.type === 'CITY' ? fromState.code : (seg0?.departureAirport?.code);
  const to = toState?.type === 'CITY' ? toState.code : (seg0?.arrivalAirport?.code);
  const date = seg0?.departureTime?.slice(0, 10);
  const returnDate = isRound ? segLast?.departureTime?.slice(0, 10) : null;

  if (!from || !to || !date) return null;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return null;
  if (isRound && (!returnDate || !dateRegex.test(returnDate))) return null;

  const adults = offer.travellerPrices?.filter(tp => tp.travellerType === 'ADULT').length || 1;
  const children = offer.travellerPrices?.filter(tp => tp.travellerType === 'CHILD' || tp.travellerType === 'KID').length || 0;
  let url = `https://www.booking.com/flights/searchresults.html?origin=${from}&destination=${to}&depart=${date}`;
  if (isRound && returnDate) url += `&return=${returnDate}`;
  url += `&adults=${adults}`;
  if (children > 0) url += `&children=${children}`;
  return url;
};

// ── Constantes ────────────────────────────────────────────────────────────────
export const CABIN_LABELS = {
  ECONOMY: 'Económica',
  PREMIUM_ECONOMY: 'Premium Economy',
  BUSINESS: 'Business',
  FIRST: 'Primera clase',
};

export const PAGE_SIZE = 10;

export const DEFAULT_FILTERS = {
  stopsOutbound: null,
  stopsReturn: null,
  airline: null,
  maxPrice: null,
  timeSlots: [],
};

export const TIME_SLOTS = [
  { key: 'madrugada', label: 'Madrugada', sub: '00–06h', min: 0, max: 6 },
  { key: 'manana', label: 'Mañana', sub: '06–12h', min: 6, max: 12 },
  { key: 'tarde', label: 'Tarde', sub: '12–18h', min: 12, max: 18 },
  { key: 'noche', label: 'Noche', sub: '18–24h', min: 18, max: 24 },
];

export const paxToApiChildren = (pax) => {
  const ages = [];
  for (let i = 0; i < pax.youth; i++) ages.push(8);
  for (let i = 0; i < pax.infants; i++) ages.push(1);
  return ages.length ? ages.join(',') : undefined;
};

export const emptyLeg = (date) => ({ from: { id: '', label: '' }, to: { id: '', label: '' }, date });

// Filtra ofertas según los filtros activos
export const matchesFilters = (offer, activeFilters, tripType) => {
  const segments = offer.segments ?? [];
  const outSeg = segments[0];
  const retSeg = segments.length > 1 ? segments[segments.length - 1] : null;

  if (activeFilters.stopsOutbound !== null && getSegmentStops(outSeg) !== activeFilters.stopsOutbound) return false;
  if (tripType === 'ROUND_TRIP' && activeFilters.stopsReturn !== null) {
    if (!retSeg || getSegmentStops(retSeg) !== activeFilters.stopsReturn) return false;
  }
  if (activeFilters.airline && offer.segments[0]?.legs[0]?.carriersData?.[0]?.code !== activeFilters.airline) return false;
  if (activeFilters.maxPrice !== null && toPrice(offer.priceBreakdown?.total) > activeFilters.maxPrice) return false;
  if (activeFilters.timeSlots?.length > 0) {
    const hour = parseInt(offer.segments[0]?.departureTime?.slice(11, 13) ?? '0', 10);
    const inSlot = activeFilters.timeSlots.some(k => {
      const slot = TIME_SLOTS.find(s => s.key === k);
      return slot && hour >= slot.min && hour < slot.max;
    });
    if (!inSlot) return false;
  }
  return true;
};
