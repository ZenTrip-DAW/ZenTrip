import { useEffect, useMemo, useState } from 'react';
import { useMyTrips } from '../../trips/list/hooks/useMyTrips';
import { getActivities } from '../../../services/tripService';

function parseDate(isoStr) {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDaysInRange(startDate, endDate) {
  const days = [];
  const cur = parseDate(startDate);
  const end = parseDate(endDate);
  while (cur <= end) {
    days.push(toISO(new Date(cur)));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function useHomeCalendarData() {
  const { enCurso, proximos, pasados, loading: tripsLoading } = useMyTrips();
  const [activitiesByDate, setActivitiesByDate] = useState({});
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const activeTrips = useMemo(() => [...enCurso, ...proximos], [
    enCurso.map((t) => t.id).join(','),
    proximos.map((t) => t.id).join(','),
  ]);

  // Map dateStr -> tripId for active/upcoming trips (for navigation on click)
  const activeTripDayMap = useMemo(() => {
    const map = {};
    for (const trip of activeTrips) {
      if (!trip.startDate || !trip.endDate) continue;
      for (const day of getDaysInRange(trip.startDate, trip.endDate)) {
        if (!map[day]) map[day] = trip.id;
      }
    }
    return map;
  }, [activeTrips]);

  // Set of days belonging to past trips (just for subtle marking, no navigation)
  const pastTripDaySet = useMemo(() => {
    const set = new Set();
    for (const trip of pasados) {
      if (!trip.startDate || !trip.endDate) continue;
      for (const day of getDaysInRange(trip.startDate, trip.endDate)) {
        set.add(day);
      }
    }
    return set;
  }, [pasados.map((t) => t.id).join(',')]);

  useEffect(() => {
    if (activeTrips.length === 0) {
      setActivitiesByDate({});
      return;
    }
    setActivitiesLoading(true);
    Promise.all(activeTrips.map((t) => getActivities(t.id)))
      .then((results) => {
        const byDate = {};
        results.forEach((activities) => {
          activities.forEach((act) => {
            if (!act.date) return;
            if (!byDate[act.date]) byDate[act.date] = [];
            byDate[act.date].push(act);
          });
        });
        setActivitiesByDate(byDate);
      })
      .catch((err) => console.error('[useHomeCalendarData]', err))
      .finally(() => setActivitiesLoading(false));
  }, [activeTrips.map((t) => t.id).join(',')]);

  return {
    activeTripDayMap,
    pastTripDaySet,
    activitiesByDate,
    loading: tripsLoading || activitiesLoading,
  };
}
