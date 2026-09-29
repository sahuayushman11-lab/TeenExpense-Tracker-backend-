const express = require('express');
const authController = require('../controllers/authController');
const { registerValidator, loginValidator, updateProfileValidator } = require('../validators/authValidator');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public Authentication endpoints with brute-force rate limiter
router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/logout', authController.logout);

// Protected Auth endpoints
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, updateProfileValidator, validate, authController.updateProfile);

module.exports = router;
