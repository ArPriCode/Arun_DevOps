const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { verifyToken } = require('../Middleware/auth');

// GET /api/reviews
router.get('/', reviewsController.getReviews);

// POST /api/reviews (auth required)
router.post('/', verifyToken, reviewsController.createReview);

// PUT /api/reviews/:id (auth required)
router.put('/:id', verifyToken, reviewsController.updateReview);

// DELETE /api/reviews/:id (auth required)
router.delete('/:id', verifyToken, reviewsController.deleteReview);

module.exports = router;

