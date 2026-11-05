const express = require('express');
const router = express.Router();
const settleController = require('../controllers/settleController');
const requireAuth = require('../middleware/requireAuth');

router.post('/', requireAuth, settleController.settle);

module.exports = router;

