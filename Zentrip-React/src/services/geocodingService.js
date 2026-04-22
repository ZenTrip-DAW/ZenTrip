const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

async function resolveCityName(cityName, lang = 'en') {
  if (!cityName?.trim()) return null;
  try {
    const params = new URLSearchParams({ q: cityName, format: 'json', limit: '1', 'accept-language': lang });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': 'ZenTrip/1.0 (zentrip3@gmail.com)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.display_name?.split(',')[0].trim() ?? null;
  } catch {
    return null;
  }
}

export const resolveToEnglish = (city) => resolveCityName(city, 'en');
export const resolveToSpanish = (city) => resolveCityName(city, 'es');
