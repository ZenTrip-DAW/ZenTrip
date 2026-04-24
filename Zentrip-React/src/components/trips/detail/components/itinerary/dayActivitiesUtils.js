const MONTHS_LONG = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DAY_NAMES_LONG = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

export function parseDate(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayHeader(isoStr) {
  const d = parseDate(isoStr);
  return `${DAY_NAMES_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
}

export const TYPE_CONFIG = {
  actividad:   { label: 'Actividad',    dotClass: 'bg-primary-3' },
  restaurante: { label: 'Restaurante',  dotClass: 'bg-auxiliary-green-5' },
  hotel:       { label: 'Hotel',        dotClass: 'bg-secondary-3' },
  vuelo:       { label: 'Vuelo',        dotClass: 'bg-secondary-5' },
  tren:        { label: 'Tren',         dotClass: 'bg-neutral-5' },
  coche:       { label: 'Coche',        dotClass: 'bg-neutral-4' },
  ruta:        { label: 'Ruta',         dotClass: 'bg-amber-500' },
};

export const STATUS_CONFIG = {
  reservado: { label: '✓ Reservado', className: 'bg-auxiliary-green-2 text-auxiliary-green-5' },
  pendiente: { label: 'Pendiente',   className: 'bg-neutral-1 text-neutral-4' },
  cancelado: { label: 'Cancelado',   className: 'bg-feedback-error-bg text-feedback-error' },
};
