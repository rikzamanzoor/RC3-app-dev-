const AppError = require('../utils/AppError');

/**
 * Express centralized error handling middleware.
 */
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle body-parser JSON syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid JSON payload in request body.'
      }
    });
  }

  // Unexpected internal server errors
  console.error('[500 Error]', err.stack || err.message);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred.'
    }
  });
}

module.exports = errorHandler;

