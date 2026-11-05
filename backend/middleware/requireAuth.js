const AppError = require('../utils/AppError');
const authService = require('../services/authService');

function requireAuth(req, res, next) {
  const isAuthRequired = process.env.AUTH_REQUIRED !== 'false';

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (!isAuthRequired) {
      // Pass-through testing mode: supply default demo member M01 (Ali)
      req.user = {
        id: 1,
        member_id: 'M01',
        username: 'ali',
        name: 'Ali'
      };
      return next();
    }
    return next(new AppError('UNAUTHORIZED', 'Missing or malformed Authorization header.', 401));
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    if (!isAuthRequired) {
      req.user = { id: 1, member_id: 'M01', username: 'ali', name: 'Ali' };
      return next();
    }
    return next(new AppError('UNAUTHORIZED', 'Missing authorization token.', 401));
  }

  try {
    const decoded = authService.verifyToken(token);
    // Fetch user details
    const user = authService.getUserById(decoded.sub);
    req.user = user;
    next();
  } catch (err) {
    if (!isAuthRequired) {
      req.user = { id: 1, member_id: 'M01', username: 'ali', name: 'Ali' };
      return next();
    }
    next(err);
  }
}

module.exports = requireAuth;

