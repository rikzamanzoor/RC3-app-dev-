const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, balanceController.getBalances);
router.get('/simplify', requireAuth, balanceController.getSimplify);

module.exports = router;

