const express = require('express');
const insightController = require('../controllers/insightController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', insightController.getInsights);

module.exports = router;
