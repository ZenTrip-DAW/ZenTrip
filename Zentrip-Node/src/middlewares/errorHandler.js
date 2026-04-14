const { AppError } = require('../errors');

const mapError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  const statusCode = error.statusCode || error.status || error.response?.status || 500;
  const message = error.response?.data?.message || error.message || 'Error interno del servidor';
  const code = statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';

  return new AppError(message, statusCode, code);
};

const errorHandler = (error, req, res, next) => {
  const normalizedError = mapError(error);

  if (normalizedError.statusCode >= 500) {
    console.error('[ERROR]', {
      path: req.originalUrl,
      method: req.method,
      message: normalizedError.message,
      code: normalizedError.code,
    });
  }

  const payload = {
    error: normalizedError.message,
    code: normalizedError.code,
  };

  if (normalizedError.details) {
    payload.details = normalizedError.details;
  }

  res.status(normalizedError.statusCode).json(payload);
};

module.exports = errorHandler;
