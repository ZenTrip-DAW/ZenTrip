import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../context/NotificationContext';
import { ROUTES } from '../../../config/routes';
import NotificationItem from './NotificationItem';

const flightImg = new URL('../../home/img/image 34.png', import.meta.url).href;

export default function NotificationPanel({ onClose }) {
  const { notifications, tripNotifications, acceptedNotifications, clearAcceptedNotifications, markAsSeen, markTripNotificationRead } = useNotifications();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    markAsSeen();
  }, [markAsSeen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  const hasAny = notifications.length > 0 || acceptedNotifications.length > 0 || tripNotifications.length > 0;

  return (
    <div
      ref={panelRef}
      className="fixed left-2 right-2 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80 rounded-2xl border border-secondary-1 shadow-lg z-50 overflow-hidden"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(8px)' }}
    >
      {/* Cabecera */}
      <div className="px-4 py-3 border-b border-neutral-1 flex items-center justify-between">
        <span className="body-2-semibold text-secondary-5">Notificaciones</span>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <span className="body-3 text-neutral-3">{notifications.length} pendiente{notifications.length > 1 ? 's' : ''}</span>
          )}
          {acceptedNotifications.length > 0 && (
            <button
              type="button"
              onClick={clearAcceptedNotifications}
              className="body-3 text-neutral-3 hover:text-primary-3 transition-colors cursor-pointer"
            >
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="max-h-96 overflow-y-auto p-3 flex flex-col gap-2">
        {!hasAny ? (
          <div className="py-8 text-center">
            <p className="body-2-semibold text-secondary-5">Todo tranquilo por aquí</p>
            <p className="body-3 text-neutral-3 mt-1">No tienes invitaciones pendientes</p>
          </div>
        ) : (
          <>
            {/* Notificaciones de invitaciones aceptadas */}
            {acceptedNotifications.map((n, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-xl bg-linear-to-br from-secondary-1/30 to-primary-1/20 border border-secondary-2/40"
              >
                <div className="flex items-start gap-3">
                  <img src={flightImg} alt="" className="w-8 h-8 object-contain shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="body-3 font-semibold text-secondary-5 mb-0.5">¡Ya estás a bordo! ✈️</p>
                    <p className="body-3 text-neutral-5 leading-snug">
                      Ahora formas parte de{' '}
                      <span className="font-semibold text-secondary-5">"{n.tripName}"</span>.
                      El aventurero que hay en ti está listo. Entra y ayuda a dar forma a la escapada perfecta.
                    </p>
                    <button
                      type="button"
                      onClick={() => { navigate(ROUTES.TRIPS.LIST); onClose(); }}
                      className="mt-2 body-3 font-semibold text-primary-3 hover:text-primary-4 transition-colors cursor-pointer"
                    >
                      Ver mis viajes →
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Notificaciones de reservas */}
            {tripNotifications.map((n) => {
              const isFlight = n.type === 'flight_booked';
              const isRestaurant = n.type === 'restaurant_booked';
              const isActivity = n.type === 'activity_booked';
              const emoji = isFlight ? '✈️' : isRestaurant ? '🍽️' : isActivity ? '🎯' : '🏨';
              const title = isFlight ? 'Nuevo vuelo reservado' : isRestaurant ? 'Nuevo restaurante anotado' : isActivity ? 'Nueva actividad anotada' : 'Nueva reserva de hotel';
              const itemName = isFlight ? n.flightLabel : isRestaurant ? n.restaurantName : isActivity ? n.activityName : n.hotelName;
              const nameColor = isFlight ? 'text-secondary-4' : isRestaurant ? 'text-primary-3' : isActivity ? 'text-primary-4' : 'text-auxiliary-green-5';
              const cardClass = isFlight
                ? 'bg-secondary-1 border-secondary-2'
                : isRestaurant
                  ? 'bg-primary-1 border-primary-2'
                  : isActivity
                    ? 'bg-primary-1 border-primary-2'
                    : 'bg-auxiliary-green-1 border-auxiliary-green-3';
              return (
                <div key={n.id} className={`px-4 py-3 rounded-xl border ${cardClass}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="body-3 font-semibold text-neutral-7 mb-0.5">{title}</p>
                      <p className="body-3 text-neutral-5 leading-snug">
                        <span className={`font-semibold ${nameColor}`}>{n.bookerName}</span>
                        {' '}ha anotado{' '}
                        <span className="font-semibold text-neutral-7">"{itemName}"</span>
                        {n.tripName ? <> en <span className="font-semibold text-neutral-7">"{n.tripName}"</span></> : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => { markTripNotificationRead(n.id); onClose(); }}
                        className="mt-2 body-3 font-semibold text-neutral-3 hover:text-neutral-5 transition-colors cursor-pointer"
                      >
                        Marcar como leído ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Invitaciones pendientes */}
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
