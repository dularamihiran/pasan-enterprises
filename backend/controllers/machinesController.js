const Machine = require('../models/Machine');

// <shipment>-PEIA-<box>-<machine>, e.g. K1-PEIA-003-001
const SERIAL_NUMBER_PATTERN = /^[A-Z0-9]+-PEIA-\d{3,}-\d{3,}$/;

const normalizeSerialNumbers = (list) => list.map(sn => String(sn).trim().toUpperCase());

// Returns an error message, or null if the serial numbers are well-formed,
// unique within the list, and not already used by any machine (available or sold)
const checkSerialNumbers = async (serialNumbers) => {
  const invalid = serialNumbers.filter(sn => !SERIAL_NUMBER_PATTERN.test(sn));
  if (invalid.length > 0) {
    return `Invalid serial number format: ${invalid.join(', ')}. Expected format like K1-PEIA-003-001`;
  }

  const duplicates = serialNumbers.filter((sn, i) => serialNumbers.indexOf(sn) !== i);
  if (duplicates.length > 0) {
    return `Duplicate serial numbers: ${[...new Set(duplicates)].join(', ')}`;
  }

  const machinesWithSerials = await Machine.find({
    $or: [
      { availableSerialNumbers: { $in: serialNumbers } },
      { 'soldSerialNumbers.serialNumber': { $in: serialNumbers } }
    ]
  }).select('itemId availableSerialNumbers soldSerialNumbers');

  if (machinesWithSerials.length > 0) {
    const taken = new Set();
    machinesWithSerials.forEach(m => {
      m.availableSerialNumbers.forEach(sn => taken.add(sn));
      m.soldSerialNumbers.forEach(s => taken.add(s.serialNumber));
    });
    const conflicts = serialNumbers.filter(sn => taken.has(sn));
    return `These serial numbers already exist: ${conflicts.join(', ')}`;
  }

  return null;
};

// @desc    Get all machines
// @route   GET /api/machines
// @access  Public
const getAllMachines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const category = req.query.category;
    const search = req.query.search;
    const status = req.query.status;

    // Build query
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { itemId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle status filter
    if (status && status !== 'all') {
      console.log('Status filter received:', status); // Debug log
      switch (status) {
        case 'in-stock':
          query.quantity = { $gt: 2 }; // Greater than 2 for in-stock
          console.log('Applied in-stock filter'); // Debug log
          break;
        case 'low-stock':
          query.quantity = { $gte: 1, $lte: 2 }; // Between 1 and 2 for low-stock
          console.log('Applied low-stock filter'); // Debug log
          break;
        case 'out-of-stock':
          query.quantity = 0; // Exactly 0 for out-of-stock
          console.log('Applied out-of-stock filter'); // Debug log
          break;
        default:
          console.log('Unknown status filter:', status); // Debug log
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2)); // Debug log

    // Execute query with pagination
    const machines = await Machine.find(query)
      .sort({ dateAdded: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination info
    const total = await Machine.countDocuments(query);

    res.json({
      success: true,
      count: machines.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: machines
    });
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single machine by ID
// @route   GET /api/machines/:id
// @access  Public
const getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      data: machine
    });
  } catch (error) {
    console.error('Error fetching machine:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new machine
// @route   POST /api/machines
// @access  Public
const createMachine = async (req, res) => {
  try {
    let { itemId, name, category, description, price, quantity } = req.body;

    console.log('Received machine data (raw):', { itemId, name, category, description, price, quantity }); // Debug log
    console.log('Category value (raw):', `"${category}"`, 'Length:', category?.length); // Debug log
    
    // Trim all string values and remove any hidden whitespace/control characters
    itemId = itemId?.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '');
    name = name?.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '');
    category = category?.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '');
    description = description?.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    console.log('After cleaning - Category:', `"${category}"`, 'Length:', category?.length); // Debug log
    
    // Debug: Check for hidden characters
    const validCategories = [
      'Packing Machine',
      'Filling Machine',
      'Sealing Machine',
      'Capping Machine',
      'Date Coding Machine',
      'Dehydrator Machine',
      'Optional Line Equipment',
      'Mixing Machine',
      'Labelling Machine',
      'Grinding Machine',
      'Food machine',
      'Other'
    ];
    
    if (category) {
      console.log('Category char codes:', Array.from(category).map(c => c.charCodeAt(0))); // Debug log
      console.log('Valid categories:', validCategories);
      console.log('Is category valid?', validCategories.includes(category));
      
      // Manual validation before MongoDB
      if (!validCategories.includes(category)) {
        console.error('Category not found in valid list. Exact matches:');
        validCategories.forEach(validCat => {
          console.log(`  "${validCat}" === "${category}": ${validCat === category}`);
        });
        return res.status(400).json({
          success: false,
          message: `Invalid category. Please select from the predefined list.`,
          receivedCategory: category,
          validCategories: validCategories
        });
      }
    }

    // Check if machine with itemId already exists
    const existingMachine = await Machine.findOne({ itemId });
    if (existingMachine) {
      return res.status(400).json({
        success: false,
        message: 'Machine with this Item ID already exists'
      });
    }

    // Optional serial numbers (one per unit), e.g. K1-PEIA-003-001
    let serialNumbers = [];
    if (Array.isArray(req.body.serialNumbers) && req.body.serialNumbers.length > 0) {
      serialNumbers = normalizeSerialNumbers(req.body.serialNumbers);

      if (serialNumbers.length !== Number(quantity)) {
        return res.status(400).json({
          success: false,
          message: `Number of serial numbers (${serialNumbers.length}) must match quantity (${quantity})`
        });
      }

      const serialError = await checkSerialNumbers(serialNumbers);
      if (serialError) {
        return res.status(400).json({ success: false, message: serialError });
      }
    }

    // Logged-in user's name (optional - set by optionalAuth middleware)
    const userFullName = req.user?.fullName;

    // Create new machine with already-trimmed values
    const machine = new Machine({
      itemId,
      name,
      category,
      description,
      price,
      quantity,
      availableSerialNumbers: serialNumbers,
      ...(userFullName && { addedBy: userFullName, lastUpdatedBy: userFullName })
    });

    const savedMachine = await machine.save();

    res.status(201).json({
      success: true,
      message: 'Machine added successfully',
      data: savedMachine
    });
  } catch (error) {
    console.error('Error creating machine:', error);
    console.error('Error name:', error.name); // Debug log
    console.error('Error details:', error.errors); // Debug log
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => {
        console.log('Validation error field:', err.path, 'Value:', err.value, 'Message:', err.message); // Debug log
        return `${err.path}: ${err.message}`;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors,
        details: error.message // Include full error message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update machine
// @route   PUT /api/machines/:id
// @access  Public
const updateMachine = async (req, res) => {
  try {
    const { itemId, name, category, description, price, quantity } = req.body;

    // Check if itemId is being updated and if it already exists
    if (itemId) {
      const existingMachine = await Machine.findOne({ 
        itemId, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingMachine) {
        return res.status(400).json({
          success: false,
          message: 'Machine with this Item ID already exists'
        });
      }
    }

    // Record who made this update. If no logged-in user is available, clear the
    // field so an old name isn't shown next to the new "Last Updated" date.
    const userFullName = req.user?.fullName;
    const update = { itemId, name, category, description, price, quantity };
    if (userFullName) {
      update.lastUpdatedBy = userFullName;
    } else {
      update.$unset = { lastUpdatedBy: 1 };
    }

    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      message: 'Machine updated successfully',
      data: machine
    });
  } catch (error) {
    console.error('Error updating machine:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Add serial numbers to an existing machine
// @route   POST /api/machines/:id/serial-numbers
// @body    { serialNumbers: string[], increaseQuantity: boolean }
//          increaseQuantity = false -> serials are for units already in stock
//                                      (quantity unchanged)
//          increaseQuantity = true  -> serials are for newly arrived units
//                                      (quantity increases by the serial count)
// @access  Public (optional auth)
const addSerialNumbers = async (req, res) => {
  try {
    if (!Array.isArray(req.body.serialNumbers) || req.body.serialNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one serial number is required'
      });
    }

    const serialNumbers = normalizeSerialNumbers(req.body.serialNumbers);
    const increaseQuantity = req.body.increaseQuantity === true;

    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    if (!increaseQuantity) {
      const unitsWithoutSerials = Math.max(machine.quantity - machine.availableSerialNumbers.length, 0);
      if (serialNumbers.length > unitsWithoutSerials) {
        return res.status(400).json({
          success: false,
          message: `${machine.itemId} has ${machine.quantity} unit(s) in stock and ${machine.availableSerialNumbers.length} already have serial numbers, so only ${unitsWithoutSerials} more can be added. To add serials for newly arrived units, choose to increase the stock quantity.`
        });
      }
    }

    const serialError = await checkSerialNumbers(serialNumbers);
    if (serialError) {
      return res.status(400).json({ success: false, message: serialError });
    }

    // Atomic update; avoids re-validating unrelated fields on older documents
    const update = { $push: { availableSerialNumbers: { $each: serialNumbers } } };
    if (increaseQuantity) {
      update.$inc = { quantity: serialNumbers.length };
    }
    const userFullName = req.user?.fullName;
    if (userFullName) {
      update.$set = { lastUpdatedBy: userFullName };
    } else {
      update.$unset = { lastUpdatedBy: 1 };
    }

    const updatedMachine = await Machine.findByIdAndUpdate(req.params.id, update, { new: true });

    res.json({
      success: true,
      message: `${serialNumbers.length} serial number(s) added to ${updatedMachine.itemId}`,
      data: updatedMachine
    });
  } catch (error) {
    console.error('Error adding serial numbers:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete machine
// @route   DELETE /api/machines/:id
// @access  Public
const deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findByIdAndDelete(req.params.id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }

    res.json({
      success: true,
      message: 'Machine deleted successfully',
      data: machine
    });
  } catch (error) {
    console.error('Error deleting machine:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Machine not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get machine categories
// @route   GET /api/machines/categories
// @access  Public
const getMachineCategories = async (req, res) => {
  try {
    const categories = await Machine.distinct('category');
    
    // Get count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await Machine.countDocuments({ category });
        return { name: category, count };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update machine stock (for internal use by sales)
// @route   PATCH /api/machines/:id/stock
// @access  Private (used by sales controller)
const updateMachineStock = async (machineId, quantityToReduce) => {
  try {
    const machine = await Machine.findById(machineId);
    
    if (!machine) {
      throw new Error('Machine not found');
    }
    
    if (machine.quantity < quantityToReduce) {
      throw new Error(`Insufficient stock. Available: ${machine.quantity}, Requested: ${quantityToReduce}`);
    }
    
    machine.quantity -= quantityToReduce;
    await machine.save();
    
    return machine;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  addSerialNumbers,
  deleteMachine,
  getMachineCategories,
  updateMachineStock
};