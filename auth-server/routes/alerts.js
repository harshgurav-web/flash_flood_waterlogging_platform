const express = require('express');
const router = express.Router();
const { triggerAlert, testSms } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

// Authenticated route to trigger disaster SMS demo alerts
router.post('/trigger', protect, triggerAlert);

// Development / test SMS route
router.post('/test-sms', protect, testSms);

module.exports = router;
