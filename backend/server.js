require('dotenv').config();

// Fail-fast if JWT_SECRET is missing or empty
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.error('FATAL: JWT_SECRET environment variable is missing or empty.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';

// CORS configuration (allow Authorization header)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with 100 kb limit
app.use(express.json({ limit: '100kb' }));

// One-line request logger: METHOD path status duration_ms
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Mount /api
app.use('/api', apiRoutes);

// Centralized error handler
app.use(errorHandler);

// Listen on 0.0.0.0
const server = app.listen(PORT, HOST, () => {
  console.log(`Backend server running on http://${HOST}:${PORT}`);
});

module.exports = { app, server };

