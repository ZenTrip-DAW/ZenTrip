export const PER_PAGE = 5;

export const FILTERS = [
  { key: 'all',          label: 'Todos' },
  { key: 'automatic',    label: 'Automático' },
  { key: 'budget',       label: 'Hasta 50€/día' },
  { key: 'cancellation', label: 'Cancelación gratis' },
];

export const FILTER_FN = {
  automatic:    (c) => c.transmission?.toLowerCase().includes('automatic'),
  budget:       (c) => c.pricePerDay != null && c.pricePerDay <= 50,
  cancellation: (c) => c.freeCancellation === true,
};

export const TIPS = [
  { icon: '🚗', iconBg: 'bg-primary-1',        title: 'Reserva con antelación',  text: 'En temporada alta los coches disponibles se agotan rápido. Reservar antes garantiza mejor precio.' },
  { icon: '✅', iconBg: 'bg-auxiliary-green-2', title: 'Cancelación gratuita',    text: 'Muchos proveedores ofrecen cancelación gratis hasta 48h antes de la recogida.' },
  { icon: '🪪', iconBg: 'bg-secondary-1',       title: 'Documentación necesaria', text: 'Necesitarás carnet de conducir, tarjeta de crédito y pasaporte a nombre del conductor principal.' },
  { icon: '⛽', iconBg: 'bg-primary-1',         title: 'Política de combustible', text: 'Devuelve el coche con el mismo nivel de combustible que lo recogiste para evitar cargos extra.' },
];

export function mapApiCar(raw, days = 1) {
  const vehicle = raw.vehicle ?? raw;
  const spec = vehicle.specification ?? {};
  const priceDisplay = vehicle.price?.display ?? vehicle.price?.driveAway ?? {};
  const totalPrice = priceDisplay.value ?? null;
  const pricePerDay = totalPrice !== null ? Math.round(totalPrice / Math.max(days, 1)) : null;
  const supplierRaw = raw.supplier ?? raw.carCard?.supplier ?? {};

  return {
    id: vehicle.id ?? raw.vehicle_id ?? raw.id,
    name: vehicle.makeAndModel ?? vehicle.name ?? 'Coche',
    carClass: vehicle.carClass ?? vehicle.class ?? '',
    imageUrl: vehicle.imageUrl ?? null,
    price: totalPrice,
    pricePerDay,
    currency: priceDisplay.currency ?? 'EUR',
    days: vehicle.rentalDurationInDays ?? days,
    transmission: spec.transmission ?? '',
    seats: spec.numberOfSeats ?? null,
    doors: spec.numberOfDoors ?? null,
    bigSuitcases: spec.bigSuitcases ?? null,
    smallSuitcases: spec.smallSuitcases ?? null,
    airConditioning: spec.airConditioning ?? false,
    mileage: spec.mileage ?? '',
    fuelPolicy: spec.fuelPolicy ?? '',
    freeCancellation: vehicle.freeCancellation ?? false,
    supplier: {
      name: supplierRaw.name ?? '',
      imageUrl: supplierRaw.imageUrl ?? null,
      rating: supplierRaw.rating?.average ?? supplierRaw.rating ?? null,
      ratingTitle: supplierRaw.rating?.title ?? '',
      reviewCount: supplierRaw.rating?.subtitle ?? '',
    },
    searchKey: raw.search_key ?? null,
  };
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

export function getDays(pickUpDate, dropOffDate) {
  if (!pickUpDate || !dropOffDate) return 0;
  const n = Math.round(
    (new Date(dropOffDate + 'T00:00:00') - new Date(pickUpDate + 'T00:00:00')) / 86400000,
  );
  return n > 0 ? n : 0;
}
