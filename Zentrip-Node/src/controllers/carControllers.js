const { searchCarLocation, searchCarRentals, getVehicleDetails } = require('../services/external/carService');
const { AppError } = require('../errors');

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
};

const searchCarLocationController = async (req, res, next) => {
  const { query } = req.query;
  if (!query || !query.trim()) {
    return next(new AppError('query es obligatorio.', 400, 'VALIDATION_ERROR'));
  }
  try {
    const result = await searchCarLocation({ query: query.trim() });
    res.json(result);
  } catch (error) {
    return next(error);
  }
};

const searchCarRentalsController = async (req, res, next) => {
  const {
    pickUpLatitude, pickUpLongitude,
    dropOffLatitude, dropOffLongitude,
    pickUpDate, dropOffDate,
    pickUpTime, dropOffTime,
    driverAge, currencyCode, location,
    units, languageCode,
  } = req.query;

  if (!pickUpLatitude || !pickUpLongitude) {
    return next(new AppError('pickUpLatitude y pickUpLongitude son obligatorios.', 400, 'VALIDATION_ERROR'));
  }
  if (!dropOffLatitude || !dropOffLongitude) {
    return next(new AppError('dropOffLatitude y dropOffLongitude son obligatorios.', 400, 'VALIDATION_ERROR'));
  }
  if (!pickUpDate || !dropOffDate) {
    return next(new AppError('pickUpDate y dropOffDate son obligatorios.', 400, 'VALIDATION_ERROR'));
  }
  if (!isValidDateString(pickUpDate) || !isValidDateString(dropOffDate)) {
    return next(new AppError('pickUpDate y dropOffDate deben tener formato YYYY-MM-DD.', 400, 'VALIDATION_ERROR'));
  }

  const parsedDriverAge = driverAge ? Number(driverAge) : 30;
  if (Number.isNaN(parsedDriverAge) || parsedDriverAge < 18) {
    return next(new AppError('driverAge debe ser un número mayor o igual a 18.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const result = await searchCarRentals({
      pickUpLatitude: Number(pickUpLatitude),
      pickUpLongitude: Number(pickUpLongitude),
      dropOffLatitude: Number(dropOffLatitude),
      dropOffLongitude: Number(dropOffLongitude),
      pickUpDate,
      dropOffDate,
      pickUpTime,
      dropOffTime,
      driverAge: parsedDriverAge,
      currencyCode,
      location,
      units,
      languageCode,
    });
    res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getVehicleDetailsController = async (req, res, next) => {
  const { vehicleId, searchKey, units, currencyCode, languageCode } = req.query;

  if (!vehicleId) {
    return next(new AppError('vehicleId es obligatorio.', 400, 'VALIDATION_ERROR'));
  }
  if (!searchKey) {
    return next(new AppError('searchKey es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const result = await getVehicleDetails({ vehicleId, searchKey, units, currencyCode, languageCode });
    res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { searchCarLocationController, searchCarRentalsController, getVehicleDetailsController };
