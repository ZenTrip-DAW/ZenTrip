const axios = require('axios');
const { AppError } = require('../../errors');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`;

const rapidApiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST,
  'Content-Type': 'application/json',
};

const searchCarLocation = async ({ query }) => {
  const nominatimHeaders = { 'User-Agent': 'ZenTrip/1.0 (contact@zentrip.app)' };

  const [cityRes, airportRes] = await Promise.all([
    axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query, format: 'json', limit: 4, addressdetails: 1 },
      headers: nominatimHeaders,
    }),
    axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: `${query} airport`, format: 'json', limit: 3, addressdetails: 1 },
      headers: nominatimHeaders,
    }),
  ]);

  const toResult = (r, isAirport) => ({
    name: isAirport
      ? (r.display_name.split(',')[0].trim())
      : (r.display_name.split(',')[0].trim()),
    city: r.address?.city || r.address?.town || r.address?.village || r.address?.county || null,
    country: r.address?.country || null,
    type: isAirport ? 'airport' : (r.type || r.class || 'city'),
    coordinates: { latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) },
  });

  const airports = (airportRes.data ?? []).map((r) => toResult(r, true));
  const cities   = (cityRes.data ?? []).map((r) => toResult(r, false));

  const seen = new Set();
  const results = [...airports, ...cities].filter((r) => {
    const key = `${r.coordinates.latitude.toFixed(3)},${r.coordinates.longitude.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { status: true, message: 'Success', data: results };
};

const searchCarRentals = async ({
  pickUpLatitude,
  pickUpLongitude,
  dropOffLatitude,
  dropOffLongitude,
  pickUpDate,
  dropOffDate,
  pickUpTime = '10:00',
  dropOffTime = '10:00',
  driverAge = 30,
  currencyCode = 'EUR',
  location,
  units = 'metric',
  languageCode = 'en-us',
}) => {
  const toUtcDate = (value) => new Date(`${value}T00:00:00Z`);
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const pickUp = toUtcDate(pickUpDate);
  const dropOff = toUtcDate(dropOffDate);

  if (pickUp < todayUtc) {
    throw new AppError('La fecha de recogida no puede ser una fecha pasada.', 400, 'VALIDATION_ERROR');
  }
  if (dropOff <= pickUp) {
    throw new AppError('La fecha de devolución debe ser posterior a la de recogida.', 400, 'VALIDATION_ERROR');
  }

  const params = {
    pick_up_latitude: pickUpLatitude,
    pick_up_longitude: pickUpLongitude,
    drop_off_latitude: dropOffLatitude,
    drop_off_longitude: dropOffLongitude,
    pick_up_date: pickUpDate,
    drop_off_date: dropOffDate,
    pick_up_time: pickUpTime,
    drop_off_time: dropOffTime,
    driver_age: driverAge,
    currency_code: currencyCode,
    units,
    languagecode: languageCode,
  };

  if (location) params.location = location;

  const response = await axios.get(`${BASE_URL}/cars/searchCarRentals`, {
    headers: rapidApiHeaders,
    params,
  });

  return response.data;
};

const getVehicleDetails = async ({
  vehicleId,
  searchKey,
  units = 'metric',
  currencyCode = 'EUR',
  languageCode = 'en-us',
}) => {
  const response = await axios.get(`${BASE_URL}/cars/vehicleDetails`, {
    headers: rapidApiHeaders,
    params: {
      vehicle_id: vehicleId,
      search_key: searchKey,
      units,
      currency_code: currencyCode,
      languagecode: languageCode,
    },
  });
  return response.data;
};

module.exports = { searchCarLocation, searchCarRentals, getVehicleDetails };
