const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const favoritesController = require('../controllers/favoritesController');
const { verifyToken } = require('../Middleware/auth');

// GET /api/user/reviews (auth required)
router.get('/reviews', verifyToken, userController.getUserReviews);

// GET /api/user/favorites (auth required)
router.get('/favorites', verifyToken, favoritesController.getUserFavorites);

module.exports = router;

