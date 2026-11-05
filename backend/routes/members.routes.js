const express = require('express');
const router = express.Router();
const membersController = require('../controllers/membersController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, membersController.getMembers);

module.exports = router;

