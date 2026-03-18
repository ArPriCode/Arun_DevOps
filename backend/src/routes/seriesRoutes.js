const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/seriesController');

// GET /api/series
router.get('/', seriesController.getSeries);

// GET /api/series/:id
router.get('/:id', seriesController.getSeriesById);

module.exports = router;

