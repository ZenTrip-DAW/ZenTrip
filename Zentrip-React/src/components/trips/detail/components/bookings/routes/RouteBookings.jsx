import { useEffect, useState } from 'react';
import { Car, Footprints, Bike, Bus, Route, Clock, Trash2, Pencil, Eye, Map } from 'lucide-react';
import { getBookings, deleteBooking } from '../../../../../../services/tripService';
import BookingBanner from '../BookingBanner';
import ImageLoadGate from '../../../../../shared/ImageLoadGate';

const MODE_ICON  = { DRIVING: Car, WALKING: Footprints, BICYCLING: Bike, TRANSIT: Bus };
const MODE_LABEL = { DRIVING: 'Coche', WALKING: 'A pie', BICYCLING: 'Bicicleta', TRANSIT: 'Transporte público' };

const DAY_NAMES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTHS_LONG     = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function formatDayLong(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_NAMES_SHORT[date.getDay()]}, ${date.getDate()} de ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

function RouteCard({ booking, tripId, onDeleted, onOpenRoute }) {
  const [deleting, setDeleting] = useState(false);

  const ModeIcon = MODE_ICON[booking.travelMode] || Route;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBooking(tripId, booking.id);
      onDeleted(booking.id);
    } catch (err) {
      console.error('[RouteBookings] Error deleting:', err);
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onOpenRoute(booking)}
      className="cursor-pointer bg-white border border-neutral-1 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:border-neutral-2 hover:shadow-md transition"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="body-2-semibold text-neutral-7 truncate">{booking.name || 'Ruta guardada'}</p>
          {booking.date && (
            <p className="body-3 text-neutral-4 mt-0.5">{formatDayLong(booking.date)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          disabled={deleting}
          className="cursor-pointer shrink-0 p-1.5 rounded-full text-neutral-3 hover:text-feedback-error hover:bg-feedback-error-bg transition disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mode + stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-2 body-3 text-neutral-5">
          <ModeIcon className="w-3.5 h-3.5" />
          {MODE_LABEL[booking.travelMode] || booking.travelMode}
        </span>
        {booking.distance && (
          <span className="flex items-center gap-1 body-3 text-neutral-4">
            <Route className="w-3.5 h-3.5 text-primary-3" />
            {booking.distance}
          </span>
        )}
        {booking.duration && (
          <span className="flex items-center gap-1 body-3 text-neutral-4">
            <Clock className="w-3.5 h-3.5 text-secondary-4" />
            {booking.duration}
          </span>
        )}
      </div>

      {/* Waypoints */}
      {booking.waypoints?.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {booking.waypoints.map((wp, i) => {
            const isFirst = i === 0;
            const isLast  = i === booking.waypoints.length - 1;
            return (
              <div key={i} className="flex items-start gap-2">
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <div className={`w-2 h-2 rounded-full ${isFirst ? 'bg-auxiliary-green-5' : isLast ? 'bg-feedback-error' : 'bg-primary-3'}`} />
                  {!isLast && <div className="w-px flex-1 min-h-3.5 bg-neutral-2 mt-0.5" />}
                </div>
                <p className="body-3 text-neutral-5 pb-1 truncate">{wp}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onOpenRoute(booking)}
          className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-neutral-2 text-neutral-5 body-3 font-semibold hover:bg-neutral-1 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver ruta
        </button>
        <button
          type="button"
          onClick={() => onOpenRoute({ ...booking, editMode: true })}
          className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl border border-secondary-2 text-secondary-5 body-3 font-semibold hover:bg-secondary-1 transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar ruta
        </button>
      </div>
    </div>
  );
}

function CtaButton({ onGoBook }) {
  return (
    <button
      onClick={() => onGoBook?.('rutas')}
      className="cursor-pointer w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-primary-2 hover:border-primary-3 hover:bg-primary-1 transition group"
    >
      <div className="w-9 h-9 rounded-full bg-primary-1 group-hover:bg-primary-2 flex items-center justify-center transition shrink-0">
        <Map className="w-4 h-4 text-primary-4" />
      </div>
      <div className="text-left">
        <p className="body-3 font-bold text-primary-4">Calcular ruta</p>
        <p className="body-3 text-neutral-4">Ir al explorador de rutas del itinerario</p>
      </div>
    </button>
  );
}

export default function RouteBookings({ tripId, onOpenRoute, onGoBook }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!tripId) return;
    getBookings(tripId)
      .then((all) =>
        setBookings(
          all
            .filter((b) => b.type === 'ruta')
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        )
      )
      .catch((err) => console.error('[RouteBookings] Error loading:', err))
      .finally(() => setLoading(false));
  }, [tripId]);

  const handleDeleted = (id) => setBookings((prev) => prev.filter((b) => b.id !== id));

  return (
    <ImageLoadGate src="/img/background/bookings/routes.jpg" alt="Rutas guardadas">
      <div className="rounded-2xl overflow-hidden">
        <BookingBanner
          src="/img/background/bookings/routes.jpg"
          objectPosition="center 60%"
          alt="Rutas guardadas"
          title="Tus rutas guardadas"
          subtitle="Vuelve a explorar cualquier ruta o ábrela directamente en el itinerario"
        />

        {loading ? (
        <div className="p-8 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-primary-3/30 border-t-primary-3 rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-8 flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="body text-neutral-4 mb-1">Sin rutas guardadas</p>
            <p className="body-3 text-neutral-3">Calcula una ruta desde el itinerario y guárdala aquí</p>
          </div>
          <CtaButton onGoBook={onGoBook} />
        </div>
      ) : (
        <div className="p-4 sm:p-6 flex flex-col gap-6">
          {Object.entries(
            bookings.reduce((acc, b) => {
              const key = b.date || '__sin_fecha__';
              if (!acc[key]) acc[key] = [];
              acc[key].push(b);
              return acc;
            }, {})
          ).map(([date, items]) => (
            <div key={date}>
              <p className="body-3 font-bold text-neutral-5 uppercase tracking-wider mb-3">
                {date === '__sin_fecha__' ? 'Sin fecha' : formatDayLong(date)}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((b) => (
                  <RouteCard
                    key={b.id}
                    booking={b}
                    tripId={tripId}
                    onDeleted={handleDeleted}
                    onOpenRoute={onOpenRoute}
                  />
                ))}
              </div>
            </div>
          ))}
          <CtaButton onGoBook={onGoBook} />
        </div>
        )}
      </div>
    </ImageLoadGate>
  );
}
