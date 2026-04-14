const { findHotels, getHotelDetails, getHotelPolicies } = require('../services/external/hotelService');
const { AppError } = require('../errors');

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
};

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError(`${fieldName} debe ser un entero mayor o igual a 1.`, 400, 'VALIDATION_ERROR');
  }
  return parsed;
};

const searchHotelsController = async (req, res, next) => {
  const { city, destId, arrivalDate, departureDate, adults, roomQty, languageCode, currencyCode, pageNumber } = req.query;

  if (!city && !destId) {
    return next(new AppError('city o destId es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  if (!arrivalDate || !departureDate) {
    return next(new AppError('arrivalDate y departureDate son obligatorios.', 400, 'VALIDATION_ERROR'));
  }

  if (!adults) {
    return next(new AppError('adults es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  if (!isValidDateString(arrivalDate) || !isValidDateString(departureDate)) {
    return next(new AppError('arrivalDate y departureDate deben tener formato YYYY-MM-DD.', 400, 'VALIDATION_ERROR'));
  }

  let parsedAdults;
  let parsedRoomQty;
  let parsedPageNumber;

  try {
    parsedAdults = parsePositiveInteger(adults, 'adults');
    if (roomQty !== undefined) parsedRoomQty = parsePositiveInteger(roomQty, 'roomQty');
    if (pageNumber !== undefined) parsedPageNumber = parsePositiveInteger(pageNumber, 'pageNumber');
  } catch (error) {
    return next(error);
  }

  try {
    const result = await findHotels({
      city,
      destId,
      arrivalDate,
      departureDate,
      adults: parsedAdults,
      roomQty: parsedRoomQty,
      languageCode,
      currencyCode,
      pageNumber: parsedPageNumber,
    });

    res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getHotelDetailsController = async (req, res, next) => {
  const { hotelId, arrivalDate, departureDate, adults, childrenAge, roomQty, units, temperatureUnit, languageCode, currencyCode } = req.query;

  if (!hotelId) {
    return next(new AppError('hotelId es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const details = await getHotelDetails({ hotelId, arrivalDate, departureDate, adults, childrenAge, roomQty, units, temperatureUnit, languageCode, currencyCode });
    res.json(details);
  } catch (error) {
    return next(error);
  }
};

const getHotelPoliciesController = async (req, res, next) => {
  const { hotelId, languageCode } = req.query;

  if (!hotelId) {
    return next(new AppError('hotelId es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const policies = await getHotelPolicies({ hotelId, languageCode });
    res.json(policies);
  } catch (error) {
    return next(error);
  }
};

module.exports = { searchHotelsController, getHotelDetailsController, getHotelPoliciesController };
