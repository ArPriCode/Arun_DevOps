const express = require('express');
const router = express.Router();
const adminSeriesController = require('../controllers/adminSeriesController');
const { verifyToken, requireRole } = require('../Middleware/auth');

// All admin series routes require authentication and admin role
router.use(verifyToken, requireRole('admin'));

// POST /api/admin/series
router.post('/', adminSeriesController.createSeries);

// PUT /api/admin/series/:id
router.put('/:id', adminSeriesController.updateSeries);

// DELETE /api/admin/series/:id
router.delete('/:id', adminSeriesController.deleteSeries);

module.exports = router;


