const axios = require('axios');
const { AppError } = require('../../errors');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`;

const rapidApiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST,
};

// --- Llamadas directas a la API externa ---

const resolveDestinationByCity = async ({ city, languageCode = 'es' }) => {
  const response = await axios.get(`${BASE_URL}/hotels/searchDestination`, {
    headers: rapidApiHeaders,
    params: {
      query: city,
      languagecode: languageCode,
    },
  });

  const destinations = response.data?.data ?? response.data?.destinations ?? [];
  const normalizedCity = city.trim().toLowerCase();

  const matchedDestination = destinations.find((destination) => {
    const name = String(destination.cityName || destination.name || destination.label || '').toLowerCase();
    const fullName = String(destination.fullName || destination.country || '').toLowerCase();
    return name.includes(normalizedCity) || fullName.includes(normalizedCity);
  }) || destinations[0];

  if (!matchedDestination) {
    throw new AppError(`No se encontró ningún destino para la ciudad "${city}".`, 404, 'DESTINATION_NOT_FOUND');
  }

  return {
    destId: matchedDestination.dest_id || matchedDestination.destId || matchedDestination.id,
    destination: matchedDestination,
  };
};

const searchHotels = async ({
  destId,
  searchType = 'CITY',
  arrivalDate,
  departureDate,
  adults = 1,
  roomQty = 1,
  languageCode = 'es',
  currencyCode = 'EUR',
  pageNumber = 1,
  pageSize = 5,
}) => {
  const response = await axios.get(`${BASE_URL}/hotels/searchHotels`, {
    headers: rapidApiHeaders,
    params: {
      dest_id: destId,
      search_type: searchType,
      arrival_date: arrivalDate,
      departure_date: departureDate,
      adults,
      room_qty: roomQty,
      page_number: pageNumber,
      page_size: pageSize,
      languagecode: languageCode,
      currency_code: currencyCode,
      units: 'metric',
      temperature_unit: 'c',
    },
  });

  return response.data;
};

const getHotelDetails = async ({ hotelId, arrivalDate, departureDate, adults = 1, childrenAge = '', roomQty = 1, units = 'metric', temperatureUnit = 'c', languageCode = 'en-us', currencyCode = 'EUR' }) => {
  const response = await axios.get(`${BASE_URL}/hotels/getHotelDetails`, {
    headers: rapidApiHeaders,
    params: {
      hotel_id: hotelId,
      arrival_date: arrivalDate,
      departure_date: departureDate,
      adults,
      children_age: childrenAge,
      room_qty: roomQty,
      units,
      temperature_unit: temperatureUnit,
      languagecode: languageCode,
      currency_code: currencyCode,
    },
  });

  return response.data;
};

const getHotelPolicies = async ({ hotelId, languageCode = 'en-us' }) => {
  const response = await axios.get(`${BASE_URL}/hotels/getHotelPolicies`, {
    headers: rapidApiHeaders,
    params: {
      hotel_id: hotelId,
      languagecode: languageCode,
    },
  });

  return response.data;
};

// --- Lógica de negocio ---

const findHotels = async ({ city, destId, arrivalDate, departureDate, adults, roomQty, languageCode, currencyCode, pageNumber }) => {
  const toUtcDate = (value) => new Date(`${value}T00:00:00Z`);

  const arrival = toUtcDate(arrivalDate);
  const departure = toUtcDate(departureDate);
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  if (departure <= arrival) {
    throw new AppError('departureDate debe ser posterior a arrivalDate.', 400, 'VALIDATION_ERROR');
  }

  if (arrival < todayUtc) {
    throw new AppError('arrivalDate no puede ser una fecha pasada.', 400, 'VALIDATION_ERROR');
  }

  let resolvedDestId = destId;
  let destination = null;

  if (!resolvedDestId && city) {
    const resolved = await resolveDestinationByCity({ city, languageCode });
    resolvedDestId = resolved.destId;
    destination = resolved.destination;
  }

  if (!resolvedDestId) {
    throw new AppError(`No se pudo resolver la ciudad "${city}".`, 404, 'DESTINATION_NOT_FOUND');
  }

  const pageSize = 5;
  const page = pageNumber || 1;

  const hotels = await searchHotels({
    destId: resolvedDestId,
    arrivalDate,
    departureDate,
    adults,
    roomQty,
    languageCode,
    currencyCode,
    pageNumber: page,
    pageSize,
  });

  return {
    ...hotels,
    meta: {
      city: city || destination?.cityName || destination?.name || null,
      destination,
      destId: resolvedDestId,
      pagination: {
        page,
        pageSize,
      },
    },
  };
};

module.exports = { findHotels, getHotelDetails, getHotelPolicies };
