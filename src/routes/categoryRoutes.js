const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);

module.exports = router;
