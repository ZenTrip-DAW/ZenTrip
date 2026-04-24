import { useState, useEffect, useMemo } from 'react';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

const WMO_EMOJI = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  56: '🌨️', 57: '🌨️',
  61: '🌦️', 63: '🌧️', 65: '🌧️',
  66: '🌨️', 67: '🌨️',
  71: '🌨️', 73: '❄️', 75: '❄️', 77: '❄️',
  80: '🌦️', 81: '🌧️', 82: '🌧️', 85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

const WMO_DESC = {
  0: 'Cielo despejado', 1: 'Principalmente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Niebla', 48: 'Niebla con escarcha',
  51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna intensa',
  56: 'Llovizna helada ligera', 57: 'Llovizna helada intensa',
  61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia intensa',
  66: 'Lluvia helada ligera', 67: 'Lluvia helada intensa',
  71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada intensa', 77: 'Granos de nieve',
  80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos violentos',
  85: 'Chubascos de nieve ligeros', 86: 'Chubascos de nieve intensos',
  95: 'Tormenta', 96: 'Tormenta con granizo ligero', 99: 'Tormenta con granizo intenso',
};

async function geocode(address) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`
  );
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.[0]) return null;
  return data.results[0].geometry.location;
}

async function fetchOpenMeteo(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max` +
    `&timezone=auto&forecast_days=16`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function parseDailyWeather(data) {
  if (!data?.daily) return {};
  const { time, weather_code, temperature_2m_max, precipitation_probability_max, wind_speed_10m_max } = data.daily;
  const byDate = {};
  time.forEach((date, i) => {
    const code = weather_code[i];
    const temp = temperature_2m_max[i];
    byDate[date] = {
      emoji: WMO_EMOJI[code] ?? '🌡️',
      temp: temp != null ? Math.round(temp) : null,
      description: WMO_DESC[code] ?? '',
      humidity: precipitation_probability_max[i] != null ? Math.round(precipitation_probability_max[i]) : null,
      windSpeed: wind_speed_10m_max[i] != null ? Math.round(wind_speed_10m_max[i]) : null,
    };
  });
  return byDate;
}

// destination: string (main destination)
// stops: array of { name, startDate, endDate }
export function useWeather(destination, stops = []) {
  const [weatherByDate, setWeatherByDate] = useState({});
  const [locationByDate, setLocationByDate] = useState({});
  const [currentWeather, setCurrentWeather] = useState(null);

  const stopsKey = useMemo(
    () => JSON.stringify((stops || []).map((s) => ({ n: s.name, s: s.startDate, e: s.endDate }))),
    [stops] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!MAPS_KEY) return;

    const validStops = (stops || []).filter((s) => s.name && s.startDate && s.endDate);
    const mainDest = destination;

    // Collect all unique location names to fetch
    const uniqueLocations = new Set();
    if (validStops.length > 0) validStops.forEach((s) => uniqueLocations.add(s.name));
    if (mainDest) uniqueLocations.add(mainDest);
    if (uniqueLocations.size === 0) return;

    let active = true;

    (async () => {
      try {
        // Geocode + fetch weather for each unique location in parallel
        const results = await Promise.all(
          [...uniqueLocations].map(async (loc) => {
            const coords = await geocode(loc);
            if (!coords) return [loc, null];
            const data = await fetchOpenMeteo(coords.lat, coords.lng);
            return [loc, data];
          })
        );

        if (!active) return;

        const weatherByLocation = {};
        let mainCurrentWeather = null;

        results.forEach(([loc, data]) => {
          if (!data) return;
          weatherByLocation[loc] = parseDailyWeather(data);

          // Current weather from main destination (or first available)
          if (loc === mainDest && data.current) {
            const code = data.current.weather_code;
            const temp = data.current.temperature_2m;
            mainCurrentWeather = {
              emoji: WMO_EMOJI[code] ?? '🌡️',
              temp: temp != null ? Math.round(temp) : null,
              description: WMO_DESC[code] ?? '',
            };
          }
        });

        // Fallback current weather from first result if main destination had no data
        if (!mainCurrentWeather) {
          const first = results.find(([, d]) => d?.current);
          if (first) {
            const [, d] = first;
            const code = d.current.weather_code;
            const temp = d.current.temperature_2m;
            mainCurrentWeather = {
              emoji: WMO_EMOJI[code] ?? '🌡️',
              temp: temp != null ? Math.round(temp) : null,
              description: WMO_DESC[code] ?? '',
            };
          }
        }

        // Collect all dates from all location weather maps
        const allDates = new Set();
        Object.values(weatherByLocation).forEach((wMap) => {
          Object.keys(wMap).forEach((d) => allDates.add(d));
        });

        // For each date: find which stop covers it, use that stop's weather
        const byDate = {};
        const locByDate = {};

        allDates.forEach((dateStr) => {
          let loc = mainDest;
          if (validStops.length > 0) {
            const covering = validStops.find((s) => s.startDate <= dateStr && s.endDate >= dateStr);
            if (covering) loc = covering.name;
          }
          const dayWeather = loc ? weatherByLocation[loc]?.[dateStr] : null;
          if (dayWeather) {
            byDate[dateStr] = dayWeather;
            locByDate[dateStr] = loc;
          }
        });

        if (active) {
          setWeatherByDate(byDate);
          setLocationByDate(locByDate);
          if (mainCurrentWeather) setCurrentWeather(mainCurrentWeather);
        }
      } catch (err) {
        console.warn('[useWeather]', err.message);
      }
    })();

    return () => { active = false; };
  }, [destination, stopsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { weatherByDate, locationByDate, currentWeather };
}
