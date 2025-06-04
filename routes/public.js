const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Homepage - Show all rooms
router.get('/', publicController.getHomepage);

// Properties page with filtering
router.get('/properties', publicController.getProperties);

// Room details page
router.get('/room/:id', publicController.getRoomDetails);

module.exports = router;
