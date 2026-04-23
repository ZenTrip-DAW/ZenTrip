import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebaseConfig';
import { useAuth } from '../../../../context/AuthContext';
import { getTripById, getTripMembers, getActivities } from '../../../../services/tripService';

export function useTripDetail(tripId) {
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!tripId || !user?.uid) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      setAccessDenied(false);
      try {
        // El trip es crítico — si falla, mostramos error
        const tripData = await getTripById(tripId);
        if (!tripData) {
          setError('Viaje no encontrado.');
          return;
        }
        setTrip(tripData);

        const isCreator = user?.uid === tripData?.uid;

        // Members y activities son secundarios — no bloquean si fallan
        const [membersResult, activitiesResult] = await Promise.allSettled([
          getTripMembers(tripId),
          getActivities(tripId),
        ]);

        if (membersResult.status === 'fulfilled') {
          setMembers(membersResult.value);
        } else {
          // Si no es el creador y getTripMembers falla, es acceso denegado (miembro eliminado)
          if (!isCreator) {
            setAccessDenied(true);
            return;
          }
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

  // Listener en tiempo real: si el coordinador elimina al usuario mientras está en la página
  useEffect(() => {
    if (!tripId || !user?.uid) return;
    const memberRef = doc(db, 'trips', tripId, 'members', user.uid);
    const unsub = onSnapshot(memberRef, (snap) => {
      if (snap.exists() && snap.data().invitationStatus === 'removed') {
        setAccessDenied(true);
      }
    });
    return unsub;
  }, [tripId, user?.uid]);

  // Actividades agrupadas por fecha: { 'YYYY-MM-DD': [activity, ...] }
  const activitiesByDate = activities.reduce((acc, act) => {
    if (!act.date) return acc;
    if (!acc[act.date]) acc[act.date] = [];
    acc[act.date].push(act);
    return acc;
  }, {});

  // Días del viaje: rango derivado del trip/stops + cualquier fecha de actividad existente
  const tripDays = (() => {
    const daySet = new Set();

    // Rango de fechas desde trip o stops
    let startDate = trip?.startDate || '';
    let endDate   = trip?.endDate   || '';
    if (!startDate || !endDate) {
      const stops = Array.isArray(trip?.stops) ? trip.stops : [];
      const ws = stops.filter((s) => s.startDate);
      const we = stops.filter((s) => s.endDate);
      if (!startDate && ws.length > 0) startDate = ws.map((s) => s.startDate).sort()[0];
      if (!endDate   && we.length > 0) endDate   = we.map((s) => s.endDate).sort().reverse()[0];
    }
    if (startDate && endDate) {
      const cur = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate   + 'T00:00:00');
      while (cur <= end) {
        daySet.add(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Incluir siempre fechas de actividades existentes (aunque queden fuera del rango)
    activities.forEach((act) => { if (act.date) daySet.add(act.date); });

    return [...daySet].sort();
  })();

  return {
    trip,
    members,
    activities,
    activitiesByDate,
    tripDays,
    loading,
    error,
    accessDenied,
    setActivities,
    setMembers,
  };
}
