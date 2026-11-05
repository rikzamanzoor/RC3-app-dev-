const AppError = require('../utils/AppError');

/**
 * Validates and converts PKR decimal amount into integer paisa.
 * @param {number|string} amount - PKR amount from request
 * @param {string} [fieldName='amount'] - Field name for error reporting
 * @param {boolean} [allowZero=false] - Whether 0 is allowed
 * @returns {number} Integer paisa
 */
function toPaisa(amount, fieldName = 'amount', allowZero = false) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new AppError('VALIDATION_ERROR', `${fieldName} must be a valid number.`, 400, fieldName);
  }

  if (allowZero ? amount < 0 : amount <= 0) {
    throw new AppError('NON_POSITIVE_AMOUNT', `${fieldName} must be greater than zero.`, 400, fieldName);
  }

  // Check decimal places (at most 2 decimals allowed)
  const amountStr = amount.toString();
  const decimalPart = amountStr.includes('.') ? amountStr.split('.')[1] : '';
  if (decimalPart.length > 2) {
    throw new AppError('VALIDATION_ERROR', `${fieldName} cannot have more than 2 decimal places.`, 400, fieldName);
  }

  return Math.round(amount * 100);
}

/**
 * Converts integer paisa into PKR float with 2 decimal places.
 * @param {number} paisa - Integer paisa
 * @returns {number} PKR rounded to 2 decimal places
 */
function fromPaisa(paisa) {
  if (!Number.isInteger(paisa)) {
    paisa = Math.round(paisa);
  }
  return Number((paisa / 100).toFixed(2));
}

module.exports = {
  toPaisa,
  fromPaisa
};

