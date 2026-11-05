const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const membersRoutes = require('./members.routes');
const shoppingRoutes = require('./shopping.routes');
const expensesRoutes = require('./expenses.routes');
const balancesRoutes = require('./balances.routes');
const budgetRoutes = require('./budget.routes');
const settleRoutes = require('./settle.routes');

// Public health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mounted routes
router.use('/auth', authRoutes);
router.use('/members', membersRoutes);
router.use('/shopping', shoppingRoutes);
router.use('/expenses', expensesRoutes);
router.use('/balances', balancesRoutes);
router.use('/budget', budgetRoutes);
router.use('/settle', settleRoutes);

module.exports = router;
