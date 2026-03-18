const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../Middleware/auth');

// GET /api/users/:id
router.get('/:id', userController.getUserProfile);

// PUT /api/users/:id (auth required)
router.put('/:id', verifyToken, userController.updateUserProfile);

module.exports = router;
