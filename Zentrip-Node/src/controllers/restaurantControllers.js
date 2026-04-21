const { searchRestaurants, getRestaurantDetails } = require('../services/external/restaurantService');
const { AppError } = require('../errors');

const searchRestaurantsController = async (req, res, next) => {
  const { query, pagetoken } = req.query;

  if (!query || query.trim().length < 2) {
    return next(new AppError('query es obligatorio y debe tener al menos 2 caracteres.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const data = await searchRestaurants({ query: query.trim(), pagetoken });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

const getRestaurantDetailsController = async (req, res, next) => {
  const { placeId } = req.query;

  if (!placeId) {
    return next(new AppError('placeId es obligatorio.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const data = await getRestaurantDetails({ placeId });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { searchRestaurantsController, getRestaurantDetailsController };
