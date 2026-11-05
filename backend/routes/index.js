const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const membersRoutes = require('./members.routes');

// Public health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mounted routes
router.use('/auth', authRoutes);
router.use('/members', membersRoutes);

module.exports = router;

