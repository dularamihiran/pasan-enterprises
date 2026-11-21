const mongoose = require('mongoose');

// Schema for individual machine line items in a quotation.
// Images are intentionally NOT stored - they are only used for the PDF.
const quotationItemSchema = new mongoose.Schema({
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine'
  },
  itemId: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  // Unit price as entered on the quotation (VAT inclusive)
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  vatPercentage: {
    type: Number,
    default: 18,
    min: [0, 'VAT percentage cannot be negative'],
    max: [100, 'VAT percentage cannot exceed 100']
  },
  warrantyMonths: {
    type: Number,
    default: 12,
    min: [0, 'Warranty months cannot be negative']
  },
  // Line amounts (for quantity), derived from unitPrice and vatPercentage
  basePrice: {
    type: Number,
    default: 0
  },
  vatAmount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  }
}, { _id: false });

const quotationExtraSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Extra charge amount cannot be negative']
  }
}, { _id: false });

const quotationSchema = new mongoose.Schema({
  quotationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerInfo: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    nic: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    }
  },
  items: {
    type: [quotationItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'Quotation must contain at least one item'
    }
  },
  extras: {
    type: [quotationExtraSchema],
    default: []
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  vatAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  extrasTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  finalTotal: {
    type: Number,
    required: true,
    min: 0
  },
  // Logged-in user who created the quotation
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    }
  }
}, {
  timestamps: true // createdAt / updatedAt
});

quotationSchema.index({ createdAt: -1 });
quotationSchema.index({ 'customerInfo.name': 1 });
quotationSchema.index({ 'customerInfo.phone': 1 });
quotationSchema.index({ 'createdBy.userId': 1 });

module.exports = mongoose.model('Quotation', quotationSchema);
