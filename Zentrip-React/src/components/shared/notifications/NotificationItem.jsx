import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/apiClient';
import { ROUTES } from '../../../config/routes';
import { useNotifications } from '../../../context/NotificationContext';

const flightImg = new URL('../../home/img/image 34.png', import.meta.url).href;

export default function NotificationItem({ notification }) {
  const navigate = useNavigate();
  const { addAcceptedNotification } = useNotifications();
  const [loading, setLoading] = useState(null); // 'accept' | 'reject' | null
  const [flash, setFlash] = useState(null); // 'already_member' | null

  const { id: invitationId, token, tripName, creatorName } = notification;

  const handleAccept = async () => {
    setLoading('accept');
    try {
      const result = await apiClient.post('/invitations/accept', { token });
      if (result.alreadyAccepted) {
        setFlash('already_member');
      } else {
        addAcceptedNotification({ tripName });
        window.dispatchEvent(new CustomEvent('invitation-accepted'));
      }
      // Si se aceptó bien, el onSnapshot lo elimina de la lista automáticamente
    } catch (err) {
      console.error('Error al aceptar invitación:', err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      await apiClient.post('/invitations/reject', { invitationId });
      // El onSnapshot lo elimina automáticamente
    } catch (err) {
      console.error('Error al rechazar invitación:', err.message);
    } finally {
      setLoading(null);
    }
  };

  if (flash === 'already_member') {
    return (
      <div className="px-4 py-3 rounded-xl bg-secondary-1/20 border border-secondary-2/40">
        <p className="body-3 text-secondary-5 mb-1 font-semibold">Esta invitación ya fue aceptada. Ya eres miembro del viaje.</p>
        <p className="body-3 text-neutral-4">
          Ya eres miembro de <span className="font-semibold text-secondary-5">{tripName}</span>. Entra a ver el itinerario.
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.TRIPS.LIST)}
          className="mt-2 body-3 text-primary-3 font-semibold hover:text-primary-4 transition-colors"
        >
          Ver mis viajes →
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 rounded-xl bg-white border border-neutral-2/60 hover:border-neutral-3 transition-colors">
      <div className="flex items-start gap-3">
        <img src={flightImg} alt="" className="w-8 h-8 object-contain shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="body-3 text-neutral-5 leading-snug">
            <span className="font-semibold text-secondary-5">{creatorName || 'Alguien'}</span>
            {' '}te invitó al viaje{' '}
            <span className="font-semibold text-secondary-5">"{tripName}"</span>
          </p>
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading !== null}
              className="px-3 py-1 rounded-full bg-secondary-5 text-white body-3 font-semibold hover:bg-secondary-6 transition-colors disabled:opacity-50"
            >
              {loading === 'accept' ? 'Aceptando...' : 'Aceptar'}
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading !== null}
              className="px-3 py-1 rounded-full border border-neutral-3 text-neutral-5 body-3 font-semibold hover:border-primary-3 hover:text-primary-3 transition-colors disabled:opacity-50"
            >
              {loading === 'reject' ? 'Rechazando...' : 'Rechazar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
