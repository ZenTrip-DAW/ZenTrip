const {
  searchFlightDestinations,
  searchFlights,
  searchFlightsMultiStops,
  getFlightDetails,
  getMinPrice,
  getMinPriceMultiStops,
  getSeatMap,
} = require('../services/external/flightService');

const { AppError } = require('../errors');

// Devuelve destinos sugeridos para búsquedas de vuelos a partir de un texto.
const searchFlightDestinationsController = async (req, res, next) => {
  const { query } = req.query;

  if (!query || !String(query).trim()) {
    return next(new AppError('El parámetro query es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const data = await searchFlightDestinations({ query: String(query).trim() });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

// Devuelve vuelos disponibles entre dos aeropuertos con filtros básicos.
const searchFlightsController = async (req, res, next) => {
  const {
    fromId,
    toId,
    stops,
    pageNo,
    adults,
    children,
    sort,
    cabinClass,
    currencyCode,
    departDate,
    returnDate,
  } = req.query;

  if (!fromId || !toId) {
    return next(new AppError('fromId y toId son obligatorios.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const flights = await searchFlights({
      fromId,
      toId,
      stops,
      pageNo,
      adults,
      children,
      sort,
      cabinClass,
      currencyCode,
      departDate,
      returnDate,
    });

    return res.json(flights);
  } catch (error) {
    return next(error);
  }
};

// Devuelve vuelos con varios tramos/escalas definidos en legs.
const searchFlightsMultiStopsController = async (req, res, next) => {
  const { legs, pageNo, adults, children, sort, cabinClass, currencyCode } = req.query;

  if (!legs) {
    return next(new AppError('legs es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const flights = await searchFlightsMultiStops({
      legs,
      pageNo,
      adults,
      children,
      sort,
      cabinClass,
      currencyCode,
    });

    return res.json(flights);
  } catch (error) {
    return next(error);
  }
};

// Devuelve detalles generales del vuelo consultado.
const getFlightDetailsController = async (req, res, next) => {
  const { currencyCode } = req.query;

  try {
    const flightDetails = await getFlightDetails({ currencyCode });
    return res.json(flightDetails);
  } catch (error) {
    return next(error);
  }
};

// Devuelve el precio mínimo para un vuelo directo o de un solo trayecto.
const getMinPriceController = async (req, res, next) => {
  const { fromId, toId, cabinClass, currencyCode } = req.query;

  if (!fromId || !toId) {
    return next(new AppError('fromId y toId son obligatorios.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const minPrice = await getMinPrice({ fromId, toId, cabinClass, currencyCode });
    return res.json(minPrice);
  } catch (error) {
    return next(error);
  }
};

// Devuelve el precio mínimo para viajes con varios tramos.
const getMinPriceMultiStopsController = async (req, res, next) => {
  const { legs, cabinClass, currencyCode } = req.query;

  if (!legs) {
    return next(new AppError('legs es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const minPrice = await getMinPriceMultiStops({ legs, cabinClass, currencyCode });
    return res.json(minPrice);
  } catch (error) {
    return next(error);
  }
};

// Devuelve el mapa de asientos disponible para el vuelo.
const getSeatMapController = async (req, res, next) => {
  const { currencyCode } = req.query;

  try {
    const seatMap = await getSeatMap({ currencyCode });
    return res.json(seatMap);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  searchFlightDestinationsController,
  searchFlightsController,
  searchFlightsMultiStopsController,
  getFlightDetailsController,
  getMinPriceController,
  getMinPriceMultiStopsController,
  getSeatMapController,
};
