const axios = require('axios');
const { AppError } = require('../../errors');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`;

const rapidApiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST,
};

async function searchAttractionLocation({ query, languageCode = 'es' }) {
  const res = await axios.get(`${BASE_URL}/attraction/searchLocation`, {
    headers: rapidApiHeaders,
    params: { query, languagecode: languageCode },
  });
  const data = res.data?.data;
  // Prefer city-level destinations; fallback to cityUfi from first product suggestion
  if (Array.isArray(data?.destinations) && data.destinations.length > 0) {
    return data.destinations[0];
  }
  if (Array.isArray(data?.products) && data.products.length > 0) {
    const p = data.products[0];
    if (p.cityUfi) return { id: p.cityUfi, name: p.cityName ?? query };
  }
  if (Array.isArray(data) && data.length > 0) return data[0];
  return null;
}

async function fetchAttractions({ locationId, page = 1, currencyCode = 'EUR', languageCode = 'es' }) {
  const res = await axios.get(`${BASE_URL}/attraction/searchAttractions`, {
    headers: rapidApiHeaders,
    params: {
      id: locationId,
      page,
      sortBy: 'trending',
      currency_code: currencyCode,
      languagecode: languageCode,
    },
  });
  const products = res.data?.data?.products ?? [];
  return products.map(mapProduct);
}

async function searchAttractionsByCity({ city, page = 1, currencyCode = 'EUR' }) {
  if (!RAPIDAPI_KEY) throw new AppError('RAPIDAPI_KEY no configurada', 500, 'MISSING_API_KEY');

  const location = await searchAttractionLocation({ query: city });
  if (!location) throw new AppError(`No se encontró la ubicación "${city}"`, 404, 'NOT_FOUND');

  const locationId = location.id ?? location.ufi ?? location.dest_id;
  if (!locationId) throw new AppError('No se pudo obtener el ID de la ubicación', 500, 'API_ERROR');

  const attractions = await fetchAttractions({ locationId, page, currencyCode });
  return {
    data: attractions,
    location: { id: locationId, name: location.name ?? location.cityName ?? city },
  };
}

async function getAttractionDetails({ slug, currencyCode = 'EUR' }) {
  if (!RAPIDAPI_KEY) throw new AppError('RAPIDAPI_KEY no configurada', 500, 'MISSING_API_KEY');

  const res = await axios.get(`${BASE_URL}/attraction/getAttractionDetails`, {
    headers: rapidApiHeaders,
    params: { slug, currency_code: currencyCode, languagecode: 'es' },
  });
  const d = res.data?.data ?? res.data ?? {};
  return { status: true, data: mapDetails(d) };
}

function mapProduct(p) {
  return {
    id: p.id ?? null,
    slug: p.slug ?? null,
    name: p.name ?? p.title ?? '',
    photo: p.primaryPhoto?.medium ?? p.primaryPhoto?.small ?? p.primaryPhoto?.large ?? null,
    rating: p.reviewsStats?.combinedNumericStats?.average ?? null,
    reviewCount: p.reviewsStats?.combinedNumericStats?.total ?? p.reviewsStats?.allReviewsCount ?? null,
    price: p.representativePrice?.chargeAmount ?? null,
    currency: p.representativePrice?.currency ?? 'EUR',
    shortDescription: p.shortDescription ?? null,
    city: p.ufiDetails?.bCityName ?? null,
    freeCancellation: p.cancellationPolicy?.hasFreeCancellation ?? false,
    duration: p.duration ?? null,
  };
}

function mapDetails(d) {
  const photos = [];
  const primaryLarge = d.primaryPhoto?.large ?? d.primaryPhoto?.medium;
  if (primaryLarge) photos.push(primaryLarge);
  (d.photos ?? []).forEach((p) => {
    const url = p.large ?? p.medium ?? p.small;
    if (url && !photos.includes(url)) photos.push(url);
  });

  return {
    id: d.id ?? null,
    slug: d.slug ?? null,
    name: d.name ?? d.title ?? '',
    description: d.description ?? d.shortDescription ?? null,
    photos: photos.slice(0, 8),
    rating: d.reviewsStats?.combinedNumericStats?.average ?? null,
    reviewCount: d.reviewsStats?.allReviewsCount ?? null,
    price: d.representativePrice?.chargeAmount ?? null,
    currency: d.representativePrice?.currency ?? 'EUR',
    duration: d.duration ?? null,
    ...(() => {
      const a = d.addresses;
      const p = a?.meeting?.[0] ?? a?.arrival?.[0] ?? a?.departure?.[0] ?? a?.entrance?.[0] ?? a?.attraction?.[0] ?? null;
      return {
        address: p?.address ?? d.location?.address ?? d.address ?? null,
        city: d.ufiDetails?.bCityName ?? p?.city ?? d.location?.city ?? null,
        lat: p?.latitude != null ? parseFloat(p.latitude) : null,
        lng: p?.longitude != null ? parseFloat(p.longitude) : null,
      };
    })(),
    freeCancellation: d.cancellationPolicy?.hasFreeCancellation ?? false,
    whatsIncluded: (d.whatsIncluded ?? []).slice(0, 6).map((i) => i.item ?? i.name ?? String(i)),
    reviews: (Array.isArray(d.reviews?.reviews) ? d.reviews.reviews : []).slice(0, 5).map((r) => ({
      author: r.user?.name ?? 'Anónimo',
      rating: r.numericRating ?? null,
      text: r.content ?? '',
      date: r.epochMs ? new Date(r.epochMs).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    })),
  };
}

module.exports = { searchAttractionsByCity, getAttractionDetails };
