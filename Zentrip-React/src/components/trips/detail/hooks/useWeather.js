import { useState, useEffect } from 'react';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

// WMO weather code → emoji (Microsoft Fluent style)
const WMO_EMOJI = {
  0:  '☀️',   // Clear sky
  1:  '🌤️',  // Mainly clear
  2:  '⛅',   // Partly cloudy
  3:  '☁️',   // Overcast
  45: '🌫️',  // Fog
  48: '🌫️',  // Rime fog
  51: '🌦️',  // Light drizzle
  53: '🌦️',  // Moderate drizzle
  55: '🌧️',  // Dense drizzle
  56: '🌨️',  // Freezing drizzle light
  57: '🌨️',  // Freezing drizzle heavy
  61: '🌦️',  // Slight rain
  63: '🌧️',  // Moderate rain
  65: '🌧️',  // Heavy rain
  66: '🌨️',  // Freezing rain light
  67: '🌨️',  // Freezing rain heavy
  71: '🌨️',  // Slight snow
  73: '❄️',   // Moderate snow
  75: '❄️',   // Heavy snow
  77: '❄️',   // Snow grains
  80: '🌦️',  // Slight showers
  81: '🌧️',  // Moderate showers
  82: '🌧️',  // Violent showers
  85: '🌨️',  // Slight snow showers
  86: '❄️',   // Heavy snow showers
  95: '⛈️',  // Thunderstorm
  96: '⛈️',  // Thunderstorm + slight hail
  99: '⛈️',  // Thunderstorm + heavy hail
};

async function geocode(address) {
  const res  = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`
  );
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.[0]) return null;
  return data.results[0].geometry.location; // { lat, lng }
}

async function fetchOpenMeteo(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=weather_code,temperature_2m_max` +
    `&timezone=auto&forecast_days=16`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

export function useWeather(destination) {
  const [weatherByDate, setWeatherByDate] = useState({});

  useEffect(() => {
    if (!destination || !MAPS_KEY) return;
    let active = true;

    (async () => {
      try {
        const coords = await geocode(destination);
        if (!coords || !active) return;

        const data = await fetchOpenMeteo(coords.lat, coords.lng);
        if (!data?.daily || !active) return;

        const { time, weather_code, temperature_2m_max } = data.daily;
        const byDate = {};
        time.forEach((date, i) => {
          const code = weather_code[i];
          const temp = temperature_2m_max[i];
          byDate[date] = {
            emoji: WMO_EMOJI[code] ?? '🌡️',
            temp:  temp != null ? Math.round(temp) : null,
          };
        });

        if (active) setWeatherByDate(byDate);
      } catch (err) {
        console.warn('[useWeather]', err.message);
      }
    })();

    return () => { active = false; };
  }, [destination]);

  return weatherByDate;
}
