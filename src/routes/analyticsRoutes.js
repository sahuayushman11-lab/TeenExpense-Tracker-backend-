const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/summary', analyticsController.getSummary);
router.get('/category', analyticsController.getCategoryAnalytics);
router.get('/timeline', analyticsController.getTimelineAnalytics);
router.get('/budget', analyticsController.getBudgetAnalytics);
router.get('/savings', analyticsController.getSavingsAnalytics);

module.exports = router;
