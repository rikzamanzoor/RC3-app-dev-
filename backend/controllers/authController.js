const authService = require('../services/authService');
const rateLimit = require('../middleware/loginRateLimit');
const AppError = require('../utils/AppError');

function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const result = authService.login(username, password);
    rateLimit.clearFailedAttempts(req);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AppError && err.code === 'INVALID_CREDENTIALS') {
      rateLimit.recordFailedAttempt(req);
    }
    next(err);
  }
}

function getMe(req, res, next) {
  try {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    res.status(200).json(req.user);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getMe
};

