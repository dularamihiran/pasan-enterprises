const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');

const toNumber = (value, fallback = 0) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
};

const round2 = (num) => Math.round(num * 100) / 100;

// @desc    Create (save) a new quotation
// @route   POST /api/quotations
// @access  Private (requires logged-in user)
const createQuotation = async (req, res) => {
  try {
    const { customerInfo = {}, items = [], extras = [], discountAmount = 0 } = req.body;

    // ---- Validation ----
    const errors = [];
    if (!customerInfo.name || !String(customerInfo.name).trim()) {
      errors.push('Customer name is required');
    }
    if (!customerInfo.phone || !String(customerInfo.phone).trim()) {
      errors.push('Customer phone is required');
    }
    if (!Array.isArray(items) || items.length === 0) {
      errors.push('At least one item is required');
    }
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    // ---- Build items & recompute totals server-side ----
    // Unit prices are VAT inclusive (same logic as the Quotation page).
    let subtotal = 0;
    let vatAmount = 0;

    const quotationItems = items.map((item) => {
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPrice = Math.max(0, toNumber(item.unitPrice));
      const vatPercentage = Math.min(100, Math.max(0, toNumber(item.vatPercentage, 18)));
      const warrantyMonths = Math.max(0, parseInt(item.warrantyMonths, 10) || 0);

      const baseUnitPrice = unitPrice / (1 + vatPercentage / 100);
      const lineBase = baseUnitPrice * quantity;
      const lineTotal = unitPrice * quantity;
      const lineVat = lineTotal - lineBase;

      subtotal += lineBase;
      vatAmount += lineVat;

      return {
        machineId: mongoose.Types.ObjectId.isValid(item.machineId) ? item.machineId : undefined,
        itemId: item.itemId || '',
        name: item.name,
        description: item.extraDescription ?? item.description ?? '',
        quantity,
        unitPrice,
        vatPercentage,
        warrantyMonths,
        basePrice: round2(lineBase),
        vatAmount: round2(lineVat),
        totalPrice: round2(lineTotal)
      };
    });

    const quotationExtras = (Array.isArray(extras) ? extras : [])
      .map((extra) => ({
        description: String(extra.description || '').trim(),
        amount: Math.max(0, toNumber(extra.amount))
      }))
      .filter((extra) => extra.description && extra.amount > 0);

    const extrasTotal = quotationExtras.reduce((sum, extra) => sum + extra.amount, 0);
    const totalBeforeDiscount = subtotal + vatAmount;
    const discount = Math.min(Math.max(0, toNumber(discountAmount)), totalBeforeDiscount);
    const finalTotal = totalBeforeDiscount - discount + extrasTotal;

    const quotation = await Quotation.create({
      quotationNumber: `QT-${Date.now()}`,
      customerInfo: {
        name: String(customerInfo.name).trim(),
        phone: String(customerInfo.phone).trim(),
        email: customerInfo.email || '',
        nic: customerInfo.nic || '',
        address: customerInfo.address || ''
      },
      items: quotationItems,
      extras: quotationExtras,
      subtotal: round2(subtotal),
      vatAmount: round2(vatAmount),
      discountAmount: round2(discount),
      extrasTotal: round2(extrasTotal),
      finalTotal: round2(finalTotal),
      createdBy: {
        userId: req.user._id,
        fullName: req.user.fullName
      }
    });

    res.status(201).json({
      success: true,
      message: 'Quotation saved successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to save quotation',
      error: error.message
    });
  }
};

module.exports = {
  createQuotation
};
