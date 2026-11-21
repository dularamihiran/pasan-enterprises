const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  addSerialNumbers,
  getSerialInventory,
  deleteMachine,
  getMachineCategories
} = require('../controllers/machinesController');

// @route   GET /api/machines/categories
// @desc    Get machine categories
// @access  Public
router.get('/categories', getMachineCategories);

// @route   GET /api/machines/serial-inventory
// @desc    Machines with available/sold serial numbers and totals
// @access  Public
// (must stay above /:id so "serial-inventory" isn't treated as an ID)
router.get('/serial-inventory', getSerialInventory);

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

// @route   POST /api/machines/:id/serial-numbers
// @desc    Add serial numbers to an existing machine (records lastUpdatedBy)
// @access  Public (optional auth)
router.post('/:id/serial-numbers', optionalAuth, addSerialNumbers);

// @route   DELETE /api/machines/:id
// @desc    Delete machine
// @access  Public
router.delete('/:id', deleteMachine);

module.exports = router;