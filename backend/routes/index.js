const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const membersRoutes = require('./members.routes');
const shoppingRoutes = require('./shopping.routes');
const expensesRoutes = require('./expenses.routes');

// Public health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mounted routes
router.use('/auth', authRoutes);
router.use('/members', membersRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/expenses', expensesRoutes);

module.exports = router;
