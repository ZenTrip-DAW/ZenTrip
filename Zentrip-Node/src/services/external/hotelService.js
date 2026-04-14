const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
//cabecera de la api para las peticiones
const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';
//la que utilizo para las llamadas
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`;

const rapidApiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST,
};

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
    const error = new Error(`No se encontró ningún destino para la ciudad "${city}".`);
    error.status = 404;
    throw error;
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

module.exports = { resolveDestinationByCity, searchHotels, getHotelDetails };


//recibe los parametros ya listos, llama a booking y devuelve la respuesta
//solo hace la llamada  a la api externa