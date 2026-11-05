const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, budgetController.getBudget);

module.exports = router;

