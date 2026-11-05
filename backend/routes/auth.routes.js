const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkRateLimit } = require('../middleware/loginRateLimit');
const requireAuth = require('../middleware/requireAuth');

router.post('/login', checkRateLimit, authController.login);
router.get('/me', requireAuth, authController.getMe);

module.exports = router;

