const { searchAttractionsByCity, getAttractionDetails } = require('../services/external/attractionService');
const { AppError } = require('../errors');

const searchAttractionsController = async (req, res, next) => {
  const { query, page, currency_code } = req.query;

  if (!query || query.trim().length < 2) {
    return next(new AppError('query requerido, mínimo 2 caracteres', 400, 'VALIDATION_ERROR'));
  }

  try {
    const data = await searchAttractionsByCity({
      city: query.trim(),
      page: page ? Number(page) : 1,
      currencyCode: currency_code || 'EUR',
    });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

const getAttractionDetailsController = async (req, res, next) => {
  const { slug, currency_code } = req.query;

  if (!slug) {
    return next(new AppError('slug requerido', 400, 'VALIDATION_ERROR'));
  }

  try {
    const data = await getAttractionDetails({ slug, currencyCode: currency_code || 'EUR' });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

module.exports = { searchAttractionsController, getAttractionDetailsController };
