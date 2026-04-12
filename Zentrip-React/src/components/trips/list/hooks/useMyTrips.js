import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { deleteTrip, getUserTrips } from '../../../../services/tripService';

function getTripStatus(startDate, endDate) {
  if (!startDate && !endDate) return 'proximo';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (start && end && today >= start && today <= end) return 'en_curso';
  if (end && today > end) return 'pasado';
  return 'proximo';
}

export function useMyTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    getUserTrips(user.uid)
      .then((data) => setTrips(data))
      .catch((err) => console.error('[useMyTrips] Error al cargar viajes:', err))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const borradores = trips.filter((t) => t.isDraft);
  const reales     = trips.filter((t) => !t.isDraft).map((t) => ({
    ...t,
    status: getTripStatus(t.startDate, t.endDate),
  }));

  const handleDeleteTrip = async (tripId) => {
    try {
      await deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err) {
      console.error('[useMyTrips] Error al eliminar viaje:', err);
    }
  };

  return {
    borradores,
    enCurso:  reales.filter((t) => t.status === 'en_curso'),
    proximos: reales.filter((t) => t.status === 'proximo'),
    pasados:  reales.filter((t) => t.status === 'pasado'),
    loading,
    handleDeleteTrip,
  };
}
