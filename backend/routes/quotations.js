const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createQuotation } = require('../controllers/quotationsController');

// @route   POST /api/quotations
// @desc    Save a new quotation (creator taken from the logged-in user)
// @access  Private
router.post('/', authenticateToken, createQuotation);

module.exports = router;
