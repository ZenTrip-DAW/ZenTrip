import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { useNotifications } from '../../../context/NotificationContext';
import { ROUTES } from '../../../config/routes';
import NotificationItem from './NotificationItem';

const flightImg = new URL('../../home/img/image 34.png', import.meta.url).href;

function formatNotificationDate(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getTripDetailPath(tripId) {
  return ROUTES.TRIPS.DETAIL.replace(':tripId', tripId);
}

function getTimestamp(n) {
  if (n.createdAt?.seconds) return n.createdAt.seconds;
  if (n.createdAt) return new Date(n.createdAt).getTime() / 1000;
  return 0;
}

export default function NotificationPanel({ onClose }) {
  const {
    notifications, tripNotifications, acceptedNotifications,
    markTripNotificationRead, markAllRead, consumeAcceptedNotification,
  } = useNotifications();
  const navigate = useNavigate();
  const panelRef = useRef(null);

  // Filtra invitaciones cuyos viajes ya no existen
  const [validInvitationIds, setValidInvitationIds] = useState(null);
  useEffect(() => {
    if (!notifications.length) { setValidInvitationIds(new Set()); return; }
    let cancelled = false;
    Promise.all(
      notifications.map(async (n) => {
        try {
          const snap = await getDoc(doc(db, 'trips', n.tripId));
          return snap.exists() ? n.id : null;
        } catch { return null; }
      })
    ).then((ids) => {
      if (!cancelled) setValidInvitationIds(new Set(ids.filter(Boolean)));
    });
    return () => { cancelled = true; };
  }, [notifications]);

  const validInvitations = validInvitationIds === null
    ? notifications
    : notifications.filter((n) => validInvitationIds.has(n.id));

  // Lista única ordenada por fecha descendente (más reciente arriba)
  const allSorted = [
    ...acceptedNotifications.map((n) => ({ ...n, _kind: 'accepted' })),
    ...tripNotifications.map((n) => ({ ...n, _kind: 'trip' })),
    ...validInvitations.map((n) => ({ ...n, _kind: 'invitation' })),
  ].sort((a, b) => getTimestamp(b) - getTimestamp(a));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  const hasAny = validInvitations.length > 0 || acceptedNotifications.length > 0 || tripNotifications.length > 0;
  const hasDismissable = tripNotifications.length > 0 || acceptedNotifications.length > 0;

  const goToTrip = (tripId) => {
    if (!tripId) return;
    navigate(getTripDetailPath(tripId));
    onClose();
  };

  return (
    <div
      ref={panelRef}
      className="fixed left-2 right-2 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80 rounded-2xl border border-secondary-1 shadow-lg z-50 overflow-hidden"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(8px)' }}
    >
      {/* Cabecera */}
      <div className="px-4 py-3 border-b border-neutral-1">
        <span className="body-2-semibold text-secondary-5">Notificaciones</span>
        {(validInvitations.length > 0 || hasDismissable) && (
          <div className="flex items-center justify-between mt-1.5">
            <span className="body-3 text-neutral-3">
              {validInvitations.length > 0
                ? `${validInvitations.length} pendiente${validInvitations.length > 1 ? 's' : ''}`
                : ''}
            </span>
            {hasDismissable && (
              <button
                type="button"
                onClick={markAllRead}
                className="body-3 text-neutral-3 hover:text-primary-3 transition-colors cursor-pointer"
              >
                Marcar todo como leído
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="max-h-96 overflow-y-auto p-3 flex flex-col gap-2">
        {!hasAny ? (
          <div className="py-8 text-center">
            <p className="body-2-semibold text-secondary-5">Todo tranquilo por aquí</p>
            <p className="body-3 text-neutral-3 mt-1">No tienes notificaciones pendientes</p>
          </div>
        ) : (
          <>
            {allSorted.map((n) => {
              if (n._kind === 'accepted') {
                return (
                  <div
                    key={n.uiId ?? n.createdAt}
                    className="px-4 py-3 rounded-xl bg-linear-to-br from-secondary-1/30 to-primary-1/20 border border-secondary-2/40"
                  >
                    <div className="flex items-start gap-3">
                      <img src={flightImg} alt="" className="w-8 h-8 object-contain shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="body-3 font-semibold text-secondary-5 mb-0.5">¡Ya estás a bordo! ✈️</p>
                        <p className="body-3 text-neutral-5 leading-snug">
                          Ahora formas parte de{' '}
                          <span className="font-semibold text-secondary-5">"{n.tripName}"</span>
                          . El aventurero que hay en ti está listo.
                        </p>
                        {formatNotificationDate(n.createdAt) && (
                          <p className="body-3 text-neutral-3 mt-2">{formatNotificationDate(n.createdAt)}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => { consumeAcceptedNotification(n.uiId); if (n.tripId) goToTrip(n.tripId); }}
                          className="mt-2 body-3 font-semibold text-primary-3 hover:text-primary-4 transition-colors cursor-pointer"
                        >
                          Ver viaje →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              if (n._kind === 'trip') {
                const isFlight = n.type === 'flight_booked';
                const isRestaurant = n.type === 'restaurant_booked';
                const isActivity = n.type === 'activity_booked';
                const emoji = isFlight ? '✈️' : isRestaurant ? '🍽️' : isActivity ? '🎯' : '🏨';
                const title = isFlight ? 'Nuevo vuelo reservado' : isRestaurant ? 'Nuevo restaurante anotado' : isActivity ? 'Nueva actividad anotada' : 'Nueva reserva de hotel';
                const itemName = isFlight ? n.flightLabel : isRestaurant ? n.restaurantName : isActivity ? n.activityName : n.hotelName;
                const nameColor = isFlight ? 'text-secondary-4' : isRestaurant ? 'text-primary-3' : isActivity ? 'text-primary-4' : 'text-auxiliary-green-5';
                const cardClass = isFlight
                  ? 'bg-secondary-1 border-secondary-2'
                  : isRestaurant ? 'bg-primary-1 border-primary-2'
                    : isActivity ? 'bg-primary-1 border-primary-2'
                      : 'bg-auxiliary-green-1 border-auxiliary-green-3';
                return (
                  <div key={n.id} className={`px-4 py-3 rounded-xl border ${cardClass}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={async () => { await markTripNotificationRead(n.id); goToTrip(n.tripId); }}
                          className="body-3 font-semibold text-neutral-7 mb-0.5 text-left hover:text-neutral-8 transition-colors cursor-pointer"
                        >
                          {title}
                        </button>
                        <p className="body-3 text-neutral-5 leading-snug">
                          <span className={`font-semibold ${nameColor}`}>{n.bookerName}</span>
                          {' '}ha anotado{' '}
                          <button
                            type="button"
                            onClick={async () => { await markTripNotificationRead(n.id); goToTrip(n.tripId); }}
                            className="font-semibold text-neutral-7 hover:text-neutral-8 transition-colors cursor-pointer"
                          >
                            "{itemName}"
                          </button>
                          {n.tripName ? <> en <span className="font-semibold text-neutral-7">"{n.tripName}"</span></> : ''}
                        </p>
                        {formatNotificationDate(n.createdAt) && (
                          <p className="body-3 text-neutral-3 mt-2">{formatNotificationDate(n.createdAt)}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => markTripNotificationRead(n.id)}
                          className="mt-2 body-3 font-semibold text-neutral-3 hover:text-neutral-5 transition-colors cursor-pointer"
                        >
                          Marcar como leído ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return <NotificationItem key={n.id} notification={n} />;
            })}
          </>
        )}
      </div>
    </div>
  );
}
