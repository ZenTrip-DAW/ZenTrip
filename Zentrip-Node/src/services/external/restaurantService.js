const axios = require('axios');
const { AppError } = require('../../errors');

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

const buildKey = () => {
  if (!PLACES_API_KEY) {
    throw new AppError('Falta configurar GOOGLE_PLACES_API_KEY en el entorno.', 500, 'MISSING_PLACES_API_KEY');
  }
  return PLACES_API_KEY;
};

const searchRestaurants = async ({ query, pagetoken }) => {
  const params = {
    query: `restaurantes en ${query}`,
    type: 'restaurant',
    language: 'es',
    key: buildKey(),
  };
  if (pagetoken) params.pagetoken = pagetoken;

  const response = await axios.get(`${BASE_URL}/textsearch/json`, { params });
  const data = response.data;

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new AppError(`Google Places error: ${data.status}`, 502, 'PLACES_API_ERROR');
  }

  const restaurants = (data.results || []).map((r) => ({
    placeId: r.place_id,
    name: r.name,
    address: r.formatted_address,
    rating: r.rating ?? null,
    userRatingsTotal: r.user_ratings_total ?? null,
    priceLevel: r.price_level ?? null,
    types: r.types ?? [],
    openNow: r.opening_hours?.open_now ?? null,
    photo: r.photos?.[0]
      ? `${BASE_URL}/photo?maxwidth=400&photoreference=${r.photos[0].photo_reference}&key=${buildKey()}`
      : null,
    location: r.geometry?.location ?? null,
  }));

  return {
    status: true,
    data: restaurants,
    nextPageToken: data.next_page_token ?? null,
  };
};

const getRestaurantDetails = async ({ placeId }) => {
  const fields = [
    'name', 'place_id', 'formatted_address', 'formatted_phone_number',
    'rating', 'user_ratings_total', 'price_level', 'opening_hours',
    'website', 'photos', 'reviews', 'types', 'geometry',
  ].join(',');

  const response = await axios.get(`${BASE_URL}/details/json`, {
    params: { place_id: placeId, fields, language: 'es', key: buildKey() },
  });

  const data = response.data;
  if (data.status !== 'OK') {
    throw new AppError(`Google Places error: ${data.status}`, 502, 'PLACES_API_ERROR');
  }

  const r = data.result;
  return {
    status: true,
    data: {
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address,
      phone: r.formatted_phone_number ?? null,
      website: r.website ?? null,
      rating: r.rating ?? null,
      userRatingsTotal: r.user_ratings_total ?? null,
      priceLevel: r.price_level ?? null,
      openingHours: r.opening_hours?.weekday_text ?? [],
      openNow: r.opening_hours?.open_now ?? null,
      photos: (r.photos || []).slice(0, 6).map((p) =>
        `${BASE_URL}/photo?maxwidth=600&photoreference=${p.photo_reference}&key=${buildKey()}`
      ),
      reviews: (r.reviews || []).slice(0, 3).map((rev) => ({
        author: rev.author_name,
        rating: rev.rating,
        text: rev.text,
        time: rev.relative_time_description,
      })),
      types: r.types ?? [],
      location: r.geometry?.location ?? null,
    },
  };
};

module.exports = { searchRestaurants, getRestaurantDetails };
