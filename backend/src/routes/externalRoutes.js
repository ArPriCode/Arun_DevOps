const express = require('express');
const router = express.Router();
const externalController = require('../controllers/externalController');

// GET /api/external/series
router.get('/series', externalController.searchSeries);

// GET /api/external/series/:tmdbId

// router.get('/series/:tmdbId', externalController.getSeriesDetails);

// GET /api/external/genres
router.get('/genres', externalController.getGenres);

module.exports = router;

