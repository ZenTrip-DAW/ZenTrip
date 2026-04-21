export { fmt, todayStr } from './flightUtils';

export const TIPS = [
  { icon: '🔍', title: 'Busca y compara',    desc: 'Filtra por precio, escalas y horario' },
  { icon: '✅', title: 'Guarda en el viaje', desc: 'El vuelo queda en el itinerario del grupo' },
  { icon: '👥', title: 'Para cada miembro',  desc: 'Indica quién vuela en cada reservas' },
  { icon: '📄', title: 'Comprobante incluido', desc: 'Sube la captura de la reserva' },
];

export function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateShort(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtTime(dt) {
  return dt?.slice(11, 16) ?? '';
}

export function fmtAirport(ap) {
  const city = ap?.cityName ?? '';
  const code = ap?.code ?? '';
  if (!city && !code) return '?';
  return city ? `${city} (${code})` : code;
}

export function getFirstDep(b) {
  return b.segments?.[0]?.departureTime || b.departureTime || '';
}

export function getDisplayLabel(booking) {
  const segs = booking.segments ?? [];
  if (segs.length === 0) return booking.flightLabel || `${booking.origin} → ${booking.destination}`;
  if (segs.length === 2 && booking.isRoundTrip) {
    return `${fmtAirport(segs[0].departureAirport)} ⇄ ${fmtAirport(segs[0].arrivalAirport)}`;
  }
  return segs.map((s) => `${fmtAirport(s.departureAirport)} → ${fmtAirport(s.arrivalAirport)}`).join(' / ');
}

export function getLegLabel(index, total, isRoundTrip) {
  if (isRoundTrip && total === 2) return index === 0 ? 'IDA' : 'VUELTA';
  return `TRAMO ${index + 1}`;
}

export function getTripKind(booking) {
  const segs = booking.segments ?? [];
  if (booking.isRoundTrip) return 'Ida y vuelta';
  if (segs.length > 2) return 'Multidestino';
  if (segs.length <= 1) return 'Solo ida';
  return 'Multidestino';
}

export function getPassengerNames(booking, members) {
  const accepted = members.filter((m) => m.invitationStatus === 'accepted');
  if (booking.passengers === 'all') {
    return accepted.map((m) => m.name || m.username || 'Miembro');
  }
  if (Array.isArray(booking.passengers)) {
    return booking.passengers
      .map((uid) => {
        const m = members.find((x) => x.uid === uid);
        return m ? (m.name || m.username || 'Miembro') : null;
      })
      .filter(Boolean);
  }
  return [];
}
