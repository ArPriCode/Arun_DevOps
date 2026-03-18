const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { verifyToken } = require('../Middleware/auth');

// POST /api/favorites (auth required)
router.post('/', verifyToken, favoritesController.addFavorite);

// DELETE /api/favorites/:id (auth required)
router.delete('/:id', verifyToken, favoritesController.removeFavorite);

module.exports = router;

