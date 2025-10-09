const express = require('express');
const router = express.Router();
const {
  getMonthlyRevenue,
  getTotalOrders,
  getThisYearRevenue,
  getLowStock,
  getTotalItems,
  getMonthlyGraph,
  getBestSellingMachines
} = require('../controllers/dashboardController');

// Dashboard routes
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/total-orders', getTotalOrders);
router.get('/this-year-revenue', getThisYearRevenue);
router.get('/low-stock', getLowStock);
router.get('/total-items', getTotalItems);
router.get('/monthly-graph', getMonthlyGraph);
router.get('/best-selling-machines', getBestSellingMachines);

module.exports = router;
