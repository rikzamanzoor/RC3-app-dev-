const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database');
const AppError = require('../utils/AppError');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is required in environment variables. Server cannot proceed.');
  }
  return secret;
}

function parseExpiresInSeconds(expiryStr = '12h') {
  if (typeof expiryStr === 'number') return expiryStr;
  const match = expiryStr.match(/^(\d+)([smhd])$/);
  if (!match) return 43200; // default 12 hours in seconds
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 43200;
  }
}

/**
 * Authenticates user credentials and issues a JWT token.
 * @param {string} username 
 * @param {string} password 
 * @returns {object} { token, expires_in, user }
 */
function login(username, password) {
  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    throw new AppError('VALIDATION_ERROR', 'Username and password are required.', 400);
  }

  const normalizedUsername = username.trim().toLowerCase();

  const userRow = db.prepare(`
    SELECT u.id, u.member_id, u.username, u.password_hash, m.name
    FROM users u
    JOIN members m ON u.member_id = m.id
    WHERE u.username = ?
  `).get(normalizedUsername);

  // Use constant-time or dummy comparison on user not found to thwart timing attacks
  if (!userRow) {
    // Run dummy compare to balance timing
    bcrypt.compareSync(password, '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLM1234567890123456');
    throw new AppError('INVALID_CREDENTIALS', 'Invalid username or password.', 401);
  }

  const isMatch = bcrypt.compareSync(password, userRow.password_hash);
  if (!isMatch) {
    throw new AppError('INVALID_CREDENTIALS', 'Invalid username or password.', 401);
  }

  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '12h';
  const expiresInSeconds = parseExpiresInSeconds(expiresIn);

  const payload = {
    sub: userRow.id,
    member_id: userRow.member_id,
    username: userRow.username
  };

  const token = jwt.sign(payload, secret, { expiresIn });

  return {
    token,
    expires_in: expiresInSeconds,
    user: {
      id: userRow.id,
      username: userRow.username,
      member_id: userRow.member_id,
      name: userRow.name
    }
  };
}

/**
 * Retrieves the user profile by user id.
 * @param {number} userId 
 * @returns {object} user { id, username, member_id, name }
 */
function getUserById(userId) {
  const userRow = db.prepare(`
    SELECT u.id, u.member_id, u.username, m.name
    FROM users u
    JOIN members m ON u.member_id = m.id
    WHERE u.id = ?
  `).get(userId);

  if (!userRow) {
    throw new AppError('UNAUTHORIZED', 'User not found or token invalid.', 401);
  }

  return {
    id: userRow.id,
    username: userRow.username,
    member_id: userRow.member_id,
    name: userRow.name
  };
}

/**
 * Verifies a JWT token.
 * @param {string} token 
 * @returns {object} Decoded token payload
 */
function verifyToken(token) {
  const secret = getJwtSecret();
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token.', 401);
  }
}

module.exports = {
  login,
  getUserById,
  verifyToken,
  getJwtSecret
};

