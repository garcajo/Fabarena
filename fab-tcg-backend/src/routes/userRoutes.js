const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes with authMiddleware
router.use(authMiddleware);

// DELETE /api/user/me
router.delete('/me', userController.deleteAccount);

module.exports = router;
