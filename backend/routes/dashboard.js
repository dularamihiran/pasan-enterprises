const express = require('express');
const router = express.Router();
const {
  getMonthlyRevenue,
  getTotalOrders,
  getAnnualRevenue,
  getLowStock,
  getTotalItems,
  getMonthlyGraph
} = require('../controllers/dashboardController');

// Dashboard routes
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/total-orders', getTotalOrders);
router.get('/annual-revenue', getAnnualRevenue);
router.get('/low-stock', getLowStock);
router.get('/total-items', getTotalItems);
router.get('/monthly-graph', getMonthlyGraph);

module.exports = router;
