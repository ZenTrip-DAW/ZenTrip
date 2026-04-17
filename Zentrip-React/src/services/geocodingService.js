const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function resolveToEnglish(cityName) {
  if (!cityName?.trim()) return null;
  try {
    const params = new URLSearchParams({ q: cityName, format: 'json', limit: '1', 'accept-language': 'en' });
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
