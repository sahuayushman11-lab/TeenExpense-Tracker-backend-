const express = require('express');
const userController = require('../controllers/userController');
const { updateProfileValidator } = require('../validators/authValidator');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidator, validate, userController.updateProfile);

module.exports = router;
