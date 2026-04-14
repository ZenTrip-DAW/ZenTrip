const axios = require('axios');
const { AppError } = require('../errors');

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

const verifyRecaptcha = async (req, res, next) => {
  const { recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return next(new AppError('Token de reCAPTCHA no proporcionado.', 400, 'VALIDATION_ERROR'));
  }

  try {
    const { data } = await axios.post(RECAPTCHA_VERIFY_URL, null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
      },
    });

    if (!data.success) {
      return next(new AppError('reCAPTCHA inválido. Inténtalo de nuevo.', 400, 'RECAPTCHA_INVALID'));
    }

    return next();
  } catch (error) {
    console.error('Error al verificar reCAPTCHA:', error.message);
    return next(new AppError('Error al verificar reCAPTCHA.', 500, 'RECAPTCHA_VERIFY_ERROR'));
  }
};

module.exports = { verifyRecaptcha };
