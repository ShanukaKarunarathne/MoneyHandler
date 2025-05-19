const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// Get daily summary (password protected)
// Change this:
// router.post('/daily/:date?', reportsController.verifyPassword, reportsController.getDailySummary);
// To this:
router.post('/daily/:date', reportsController.verifyPassword, reportsController.getDailySummary);
router.post('/daily', reportsController.verifyPassword, reportsController.getDailySummary);

// Generate and save daily report (password protected)
// Change this:
// router.post('/generate/:date?', reportsController.verifyPassword, reportsController.generateDailyReport);
// To this:
router.post('/generate/:date', reportsController.verifyPassword, reportsController.generateDailyReport);
router.post('/generate', reportsController.verifyPassword, reportsController.generateDailyReport);

module.exports = router;
