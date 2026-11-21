const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachineCategories
} = require('../controllers/machinesController');

// @route   GET /api/machines/categories
// @desc    Get machine categories
// @access  Public
router.get('/categories', getMachineCategories);

// @route   GET /api/machines
// @desc    Get all machines
// @access  Public
router.get('/', getAllMachines);

// @route   GET /api/machines/:id
// @desc    Get single machine by ID
// @access  Public
router.get('/:id', getMachineById);

// @route   POST /api/machines
// @desc    Create new machine (records addedBy when a user is logged in)
// @access  Public (optional auth)
router.post('/', optionalAuth, createMachine);

// @route   PUT /api/machines/:id
// @desc    Update machine (records lastUpdatedBy when a user is logged in)
// @access  Public (optional auth)
router.put('/:id', optionalAuth, updateMachine);

// @route   DELETE /api/machines/:id
// @desc    Delete machine
// @access  Public
router.delete('/:id', deleteMachine);

module.exports = router;