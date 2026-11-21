const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  processSale,
  validateSale,
  getSalesStats
} = require('../controllers/salesController');

// @route   POST /api/sales/validate
// @desc    Validate sale data before processing
// @access  Public
router.post('/validate', validateSale);

// @route   GET /api/sales/stats
// @desc    Get sales statistics
// @access  Public
router.get('/stats', getSalesStats);

// @route   POST /api/sales
// @desc    Process a sale (processedBy is taken from the logged-in user)
// @access  Private
router.post('/', authenticateToken, processSale);

module.exports = router;