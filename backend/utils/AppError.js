/**
 * Custom application error for uniform API error responses.
 */
class AppError extends Error {
  /**
   * @param {string} code - Contract error code (e.g. VALIDATION_ERROR, INVALID_CREDENTIALS)
   * @param {string} message - Human-readable error description
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 409, 429, 500)
   * @param {string} [field] - Optional field name causing the error
   */
  constructor(code, message, statusCode = 400, field = undefined) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    if (field) {
      this.field = field;
    }
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const errorObj = {
      code: this.code,
      message: this.message
    };
    if (this.field) {
      errorObj.field = this.field;
    }
    return { error: errorObj };
  }
}

module.exports = AppError;

