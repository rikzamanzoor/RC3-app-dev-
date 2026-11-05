const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, expenseController.getExpenses);
router.post('/', requireAuth, expenseController.addExpense);

module.exports = router;

