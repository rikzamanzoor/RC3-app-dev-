const express = require('express');
const router = express.Router();
const shoppingController = require('../controllers/shoppingController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, shoppingController.getItems);
router.post('/', requireAuth, shoppingController.addItem);
router.post('/checkout', requireAuth, shoppingController.checkout);

module.exports = router;

