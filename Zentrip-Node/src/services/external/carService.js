const axios = require('axios');
const { AppError } = require('../../errors');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'booking-com15.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`;

const rapidApiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': RAPIDAPI_HOST,
};

const searchCarLocation = async ({ query }) => {
  const response = await axios.get(`${BASE_URL}/cars/searchDestination`, {
    headers: rapidApiHeaders,
    params: { query },
  });
  return response.data;
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
