const axios = require('axios');
const { AppError } = require('../../errors');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`;

const buildRapidApiHeaders = () => {
  if (!RAPIDAPI_KEY) {
    throw new AppError('Falta configurar RAPIDAPI_KEY en el entorno.', 500, 'MISSING_RAPIDAPI_KEY');
  }

  return {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
    'Content-Type': 'application/json',
  };
};

const callRapidApi = async (path, params = {}) => {
  try {
    const response = await axios.request({
      method: 'GET',
      url: `${BASE_URL}${path}`,
      params,
      headers: buildRapidApiHeaders(),
    });

    return response.data;
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const details = error.response?.data || null;
    const message = details?.message || details?.error || error.message || 'Error llamando a RapidAPI';
    const errorCode = statusCode >= 500 ? 'RAPIDAPI_SERVER_ERROR' : 'RAPIDAPI_REQUEST_ERROR';

    throw new AppError(message, statusCode, errorCode, details);
  }
};

const searchFlightDestinations = async ({ query }) => callRapidApi('/flights/searchDestination', { query });

const searchFlights = async ({ fromId, toId, stops = 'none', pageNo = 1, adults = 1, children, sort = 'BEST', cabinClass = 'ECONOMY', currencyCode = 'AED', departDate, returnDate }) => {
  const params = { fromId, toId, stops, pageNo, adults, sort, cabinClass, currency_code: currencyCode };
  if (departDate) params.departDate = departDate;
  if (returnDate) params.returnDate = returnDate;
  if (children) params.children = children;
  return callRapidApi('/flights/searchFlights', params);
};

const searchFlightsMultiStops = async ({ legs, pageNo = 1, adults = 1, children = '0,17', sort = 'BEST', cabinClass = 'ECONOMY', currencyCode = 'AED' }) => callRapidApi('/flights/searchFlightsMultiStops', {
  legs: typeof legs === 'string' ? legs : JSON.stringify(legs),
  pageNo,
  adults,
  children,
  sort,
  cabinClass,
  currency_code: currencyCode,
});

const getFlightDetails = async ({ currencyCode = 'AED' }) => callRapidApi('/flights/getFlightDetails', {
  currency_code: currencyCode,
});

const getMinPrice = async ({ fromId, toId, cabinClass = 'ECONOMY', currencyCode = 'AED' }) => callRapidApi('/flights/getMinPrice', {
  fromId,
  toId,
  cabinClass,
  currency_code: currencyCode,
});

const getMinPriceMultiStops = async ({ legs, cabinClass = 'ECONOMY,PREMIUM_ECONOMY,BUSINESS,FIRST', currencyCode = 'AED' }) => callRapidApi('/flights/getMinPriceMultiStops', {
  legs: typeof legs === 'string' ? legs : JSON.stringify(legs),
  cabinClass,
  currency_code: currencyCode,
});

const getSeatMap = async ({ currencyCode = 'AED' }) => callRapidApi('/flights/getSeatMap', {
  currency_code: currencyCode,
});

module.exports = {
  searchFlightDestinations,
  searchFlights,
  searchFlightsMultiStops,
  getFlightDetails,
  getMinPrice,
  getMinPriceMultiStops,
  getSeatMap,
};
