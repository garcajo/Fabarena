const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, registerRules, loginRules } = require('../middleware/validationMiddleware');

// POST /api/auth/register - with input validation
router.post('/register', registerRules, validate, authController.register);

// POST /api/auth/login - with input validation
router.post('/login', loginRules, validate, authController.login);

module.exports = router;
