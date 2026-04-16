import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { getTripById, getTripMembers, getActivities } from '../../../../services/tripService';

export function useTripDetail(tripId) {
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId || !user?.uid) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // El trip es crítico — si falla, mostramos error
        const tripData = await getTripById(tripId);
        if (!tripData) {
          setError('Viaje no encontrado.');
          return;
        }
        setTrip(tripData);

        // Members y activities son secundarios — no bloquean si fallan
        const [membersResult, activitiesResult] = await Promise.allSettled([
          getTripMembers(tripId),
          getActivities(tripId),
        ]);

        if (membersResult.status === 'fulfilled') {
          setMembers(membersResult.value);
        } else {
          console.warn('[useTripDetail] No se pudieron cargar los miembros:', membersResult.reason);
        }

        if (activitiesResult.status === 'fulfilled') {
          setActivities(activitiesResult.value);
        } else {
          console.warn('[useTripDetail] No se pudieron cargar las actividades:', activitiesResult.reason);
        }
      } catch (err) {
        console.error('[useTripDetail] Error al cargar el viaje:', err);
        setError('No se pudo cargar el viaje.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [tripId, user?.uid]);

  // Actividades agrupadas por fecha: { 'YYYY-MM-DD': [activity, ...] }
  const activitiesByDate = activities.reduce((acc, act) => {
    if (!act.date) return acc;
    if (!acc[act.date]) acc[act.date] = [];
    acc[act.date].push(act);
    return acc;
  }, {});

  // Días del viaje generados desde startDate hasta endDate
  const tripDays = (() => {
    if (!trip?.startDate || !trip?.endDate) return [];
    const days = [];
    const start = new Date(trip.startDate + 'T00:00:00');
    const end = new Date(trip.endDate + 'T00:00:00');
    const cur = new Date(start);
    while (cur <= end) {
      const iso = cur.toISOString().split('T')[0];
      days.push(iso);
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  })();

  return {
    trip,
    members,
    activities,
    activitiesByDate,
    tripDays,
    loading,
    error,
    setActivities,
    setMembers,
  };
}
