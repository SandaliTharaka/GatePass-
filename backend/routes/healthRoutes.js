const express = require('express');
const router = express.Router();
const { smtpHealth } = require('../controllers/healthController');

// Public health endpoint for SMTP status
router.get('/smtp', smtpHealth);

module.exports = router;
