import { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { getCarDetails } from '../../../../../../services/carService';
import { addActivity, addBooking, getBookings } from '../../../../../../services/tripService';
import { useAuth } from '../../../../../../context/AuthContext';
import { fmtDate } from './carUtils';

export default function CarDetailModal({ car, searchParams, tripId, onClose }) {
  const { pickUpDate, dropOffDate, pickUpTime, dropOffTime, currencyCode } = searchParams;
  const { user, profile } = useAuth();
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!car.id || !car.searchKey) { setLoading(false); return; }
    let cancelled = false;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = await getCarDetails({
          vehicleId: car.id,
          searchKey: car.searchKey,
          units: 'metric',
          currencyCode: currencyCode ?? 'EUR',
          languageCode: 'es',
        });
        if (!cancelled) setDetails(data?.data ?? data);
      } catch {
        // mostrar info básica del resultado de búsqueda
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDetails();
    return () => { cancelled = true; };
  }, [car.id, car.searchKey, currencyCode]);

  const vehicle = details?.vehicle ?? {};
  const spec = vehicle.specification ?? {};
  const supplier = details?.supplier ?? {};
  const whatsIncluded = details?.whatsIncluded?.items ?? [];
  const extras = details?.extras ?? [];
  const importantInfo = details?.importantInfo?.items ?? [];

  const specRows = [
    ['Transmisión',        spec.transmission       ?? car.transmission],
    ['Plazas',             spec.numberOfSeats      ?? car.seats],
    ['Puertas',            spec.numberOfDoors      ?? car.doors],
    ['Aire acond.',        (spec.airConditioning   ?? car.airConditioning) ? 'Sí' : 'No'],
    ['Kilometraje',        spec.mileage            ?? car.mileage],
    ['Combustible',        spec.fuelPolicy         ?? car.fuelPolicy],
    ['Maletas grandes',    spec.bigSuitcases       ?? car.bigSuitcases],
    ['Maletas pequeñas',   spec.smallSuitcases     ?? car.smallSuitcases],
  ].filter(([, v]) => v != null && v !== '');

  const supplierName   = supplier.name        ?? car.supplier?.name ?? '';
  const supplierImg    = supplier.imageUrl     ?? car.supplier?.imageUrl ?? null;
  const supplierRating = supplier.rating?.average ?? car.supplier?.rating ?? null;
  const supplierTitle  = supplier.rating?.title   ?? car.supplier?.ratingTitle ?? '';

  const handleBooked = async () => {
    if (!tripId || !user) return;
    setBooking(true);
    try {
      const existing = await getBookings(tripId);
      const isDuplicate = existing.some(
        (b) => b.type === 'car' && b.carId === car.id && b.pickUpDate === pickUpDate && b.dropOffDate === dropOffDate
      );
      if (isDuplicate) { setDuplicate(true); return; }

      const activityId = await addActivity(tripId, {
        date: pickUpDate,
        startTime: pickUpTime || '10:00',
        endTime: dropOffTime || '10:00',
        name: car.name,
        type: 'car',
        notes: car.pricePerDay != null ? `Reservado · ${car.pricePerDay} ${car.currency}/día · ${car.days} día${car.days !== 1 ? 's' : ''}` : 'Reservado',
        status: 'reservado',
      });

      await addBooking(tripId, {
        type: 'car',
        carId: car.id,
        carName: car.name,
        carClass: car.carClass ?? null,
        supplierName,
        pickUpDate,
        dropOffDate,
        pickUpTime: pickUpTime ?? null,
        dropOffTime: dropOffTime ?? null,
        days: car.days ?? null,
        pricePerDay: car.pricePerDay ?? null,
        totalPrice: car.price ?? null,
        currency: car.currency ?? currencyCode ?? 'EUR',
        status: 'reservado',
        bookingUrl: 'https://cars.booking.com',
        activityId,
        createdBy: {
          uid: user.uid,
          name: profile?.displayName || profile?.firstName || user.email,
          photoURL: profile?.photoURL || null,
        },
      });

      setBooked(true);
    } catch (err) {
      console.error('[CarDetailModal] Error al guardar reserva:', err);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-neutral-7/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-1 shrink-0">
          <div className="min-w-0">
            <p className="body-2-semibold text-neutral-7 truncate">{car.name}</p>
            {car.carClass && <p className="body-3 text-neutral-4">{car.carClass}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-2 flex items-center justify-center text-neutral-5 hover:bg-neutral-1 transition shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1">

          {car.imageUrl && (
            <div className="h-48 bg-neutral-1 flex items-center justify-center overflow-hidden">
              <img src={car.imageUrl} alt={car.name} className="h-full object-contain p-4" />
            </div>
          )}

          <div className="p-5">

            {/* Proveedor y precio */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                {supplierImg && (
                  <img src={supplierImg} alt={supplierName} className="h-6 object-contain" />
                )}
                <div>
                  {supplierName && <p className="body-2-semibold text-neutral-7">{supplierName}</p>}
                  {supplierRating && (
                    <p className="body-3 text-neutral-4">{supplierRating} · {supplierTitle}</p>
                  )}
                </div>
              </div>
              {car.pricePerDay != null && (
                <div className="text-right shrink-0">
                  <p className="body-3 text-neutral-4">desde</p>
                  <p className="title-h3-desktop text-neutral-7 leading-tight">
                    {car.pricePerDay} {car.currency}<span className="body-3 text-neutral-4 font-normal"> /día</span>
                  </p>
                  {car.days > 0 && car.price != null && (
                    <p className="body-3 font-bold text-primary-3 mt-0.5">
                      {car.price} {car.currency} total ({car.days} día{car.days !== 1 ? 's' : ''})
                    </p>
                  )}
                </div>
              )}
            </div>

            {loading && (
              <div className="flex items-center gap-2 body-3 text-neutral-4 mb-4">
                <span className="w-4 h-4 border-2 border-neutral-2 border-t-secondary-3 rounded-full animate-spin" />
                Cargando detalles…
              </div>
            )}

            {/* Especificaciones */}
            {specRows.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Especificaciones</p>
                <div className="grid grid-cols-2 gap-2">
                  {specRows.map(([label, value]) => (
                    <div key={label} className="bg-neutral-1 rounded-lg p-2.5">
                      <p className="text-[11px] text-neutral-4 mb-0.5">{label}</p>
                      <p className="body-3 font-semibold text-neutral-7">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="bg-secondary-1/40 rounded-xl p-4 mb-5">
              <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Fechas</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="body-3 text-neutral-4 mb-0.5">Recogida</p>
                  <p className="body-2-semibold text-neutral-7">{fmtDate(pickUpDate)}</p>
                  {pickUpTime && <p className="body-3 text-neutral-4">{pickUpTime}</p>}
                </div>
                <div>
                  <p className="body-3 text-neutral-4 mb-0.5">Devolución</p>
                  <p className="body-2-semibold text-neutral-7">{fmtDate(dropOffDate)}</p>
                  {dropOffTime && <p className="body-3 text-neutral-4">{dropOffTime}</p>}
                </div>
              </div>
            </div>

            {/* Incluido */}
            {whatsIncluded.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Incluido</p>
                <div className="bg-auxiliary-green-1 border border-auxiliary-green-3 rounded-xl p-4 flex flex-col gap-2">
                  {whatsIncluded.map((item, i) => (
                    <p key={i} className="body-3 text-neutral-6" dangerouslySetInnerHTML={{ __html: item.text }} />
                  ))}
                </div>
              </div>
            )}

            {/* Información importante */}
            {importantInfo.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Información importante</p>
                <div className="flex flex-col gap-2">
                  {importantInfo.map((item, i) => (
                    <p key={i} className="body-3 text-neutral-6" dangerouslySetInnerHTML={{ __html: item.text }} />
                  ))}
                </div>
              </div>
            )}

            {/* Extras disponibles */}
            {extras.length > 0 && (
              <div className="mb-5">
                <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">Extras disponibles</p>
                <div className="flex flex-col gap-2">
                  {extras.map((extra) => (
                    <div key={extra.id} className="border border-neutral-1 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="body-3 font-semibold text-neutral-7">{extra.name}</p>
                        {extra.detail && <p className="text-[11px] text-neutral-4">{extra.detail}</p>}
                      </div>
                      {extra.price?.perRental?.display?.value != null && (
                        <p className="body-3 font-semibold text-neutral-7 shrink-0">
                          +{extra.price.perRental.display.value} {extra.price.perRental.display.currency}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-1 shrink-0 bg-white">
          {duplicate ? (
            <div className="h-11 rounded-lg bg-feedback-warning border border-feedback-warning-strong text-feedback-warning-strong flex items-center justify-center gap-2 body-2-semibold">
              ⚠️ Ya tienes este coche reservado
            </div>
          ) : booked ? (
            <>
              <div className="h-11 rounded-lg bg-auxiliary-green-2 text-auxiliary-green-5 flex items-center justify-center gap-2 body-2-semibold mb-3">
                ✓ Reserva guardada
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full h-10 rounded-lg border border-neutral-2 body-3 text-neutral-5 hover:bg-neutral-1 transition"
              >
                Continuar
              </button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              {tripId && (
                <button
                  onClick={handleBooked}
                  disabled={booking}
                  className={`flex-1 h-11 rounded-lg body-2-semibold text-white flex items-center justify-center gap-2 transition ${
                    booking ? 'bg-neutral-2 cursor-not-allowed' : 'bg-auxiliary-green-4 hover:bg-auxiliary-green-5'
                  }`}
                >
                  {booking ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando…</>
                  ) : '✓ He reservado'}
                </button>
              )}
              <a
                href="https://cars.booking.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-4 rounded-lg border border-secondary-3 text-secondary-3 flex items-center justify-center gap-2 body-2-semibold hover:bg-secondary-1 transition"
              >
                <ExternalLink className="w-4 h-4" /> Booking.com
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
