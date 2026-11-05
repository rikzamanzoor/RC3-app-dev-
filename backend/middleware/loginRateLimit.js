const AppError = require('../utils/AppError');

// Store: key -> { count, resetTime }
const failedAttempts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

// Periodically clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedAttempts.entries()) {
    if (now > record.resetTime) {
      failedAttempts.delete(key);
    }
  }
}, 30 * 1000).unref();

function getRateLimitKey(req) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown-ip';
  const username = (req.body?.username || '').toString().trim().toLowerCase();
  return `${ip}:${username}`;
}

function checkRateLimit(req, res, next) {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const record = failedAttempts.get(key);

  if (record && now < record.resetTime && record.count >= MAX_FAILED_ATTEMPTS) {
    return next(new AppError('TOO_MANY_ATTEMPTS', 'Too many failed login attempts. Please retry after 60 seconds.', 429));
  }

  next();
}

function recordFailedAttempt(req) {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const record = failedAttempts.get(key);

  if (!record || now > record.resetTime) {
    failedAttempts.set(key, { count: 1, resetTime: now + WINDOW_MS });
  } else {
    record.count += 1;
  }
}

function clearFailedAttempts(req) {
  const key = getRateLimitKey(req);
  failedAttempts.delete(key);
}

module.exports = {
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts
};

