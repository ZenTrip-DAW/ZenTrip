const { resolveDestinationByCity, searchHotels, getHotelDetails } = require('../services/external/hotelService');
const { AppError } = require('../errors');

const searchHotelsController = async (req, res, next) => {
  const {
    city,
    destId,
    searchType,
    arrivalDate,
    departureDate,
    adults,
    roomQty,
    languageCode,
    currencyCode,
    pageNumber,
  } = req.query;

  if (!city && !destId) {
    return next(new AppError('city o destId es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    let resolvedDestId = destId;
    let destination = null;

    if (!resolvedDestId && city) {
      const resolved = await resolveDestinationByCity({ city, languageCode });
      resolvedDestId = resolved.destId;
      destination = resolved.destination;
    }

    if (!resolvedDestId) {
      return next(new AppError(`No se pudo resolver la ciudad "${city}".`, 404, 'DESTINATION_NOT_FOUND'));
    }

    const hotels = await searchHotels({
      destId: resolvedDestId,
      searchType,
      arrivalDate,
      departureDate,
      adults,
      roomQty,
      languageCode,
      currencyCode,
      pageNumber,
    });

    res.json({
      ...hotels,
      meta: {
        city: city || destination?.cityName || destination?.name || null,
        destination,
        destId: resolvedDestId,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getHotelDetailsController = async (req, res, next) => {
  const {
    hotelId,
    arrivalDate,
    departureDate,
    adults,
    childrenAge,
    roomQty,
    units,
    temperatureUnit,
    languageCode,
    currencyCode,
  } = req.query;

  if (!hotelId) {
    return next(new AppError('hotelId es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const details = await getHotelDetails({
      hotelId,
      arrivalDate,
      departureDate,
      adults,
      childrenAge,
      roomQty,
      units,
      temperatureUnit,
      languageCode,
      currencyCode,
    });

    res.json(details);
  } catch (error) {
    return next(error);
  }
};

module.exports = { searchHotelsController, getHotelDetailsController };
