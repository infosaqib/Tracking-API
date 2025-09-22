const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product.variants'
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    },
    attributes: [{
      name: String,
      value: String
    }]
  }],
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'returned',
      'failed'
    ],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer', 'cash_on_delivery', 'cryptocurrency'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    transactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    amount: {
      subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
      },
      tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative']
      },
      shipping: {
        type: Number,
        default: 0,
        min: [0, 'Shipping cannot be negative']
      },
      discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
      },
      total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
      }
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative']
    }
  },
  shipping: {
    address: {
      firstName: {
        type: String,
        required: true,
        trim: true
      },
      lastName: {
        type: String,
        required: true,
        trim: true
      },
      company: String,
      street: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      },
      zipCode: {
        type: String,
        required: true,
        trim: true
      },
      country: {
        type: String,
        required: true,
        trim: true
      },
      phone: String
    },
    method: {
      type: String,
      required: true
    },
    carrier: {
      type: String,
      enum: ['ups', 'fedex', 'dhl', 'usps', 'local', 'custom']
    },
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    notes: String
  },
  billing: {
    address: {
      firstName: String,
      lastName: String,
      company: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String
    },
    useShippingAddress: {
      type: Boolean,
      default: true
    }
  },
  tracking: {
    trackingId: {
      type: String
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'exception',
        'returned',
        'cancelled'
      ],
      default: 'pending'
    },
    lastUpdate: Date,
    estimatedDelivery: Date,
    actualDelivery: Date,
    carrier: String,
    carrierTrackingNumber: String,
    events: [{
      status: String,
      description: String,
      location: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: mongoose.Schema.Types.Mixed
    }]
  },
  notes: {
    customer: String,
    internal: String,
    shipping: String
  },
  metadata: {
    source: {
      type: String,
      enum: ['website', 'mobile_app', 'api', 'admin'],
      default: 'website'
    },
    userAgent: String,
    ipAddress: String,
    referrer: String,
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String
    }
  },
  timeline: [{
    status: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  fulfillment: {
    warehouse: String,
    pickedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    packedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    shippedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pickedAt: Date,
    packedAt: Date,
    shippedAt: Date
  },
  returns: [{
    reason: {
      type: String,
      enum: [
        'defective',
        'wrong_item',
        'not_as_described',
        'changed_mind',
        'damaged_shipping',
        'other'
      ],
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'received', 'processed', 'completed'],
      default: 'requested'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    refundAmount: Number,
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number,
      reason: String
    }]
  }],
  analytics: {
    conversionValue: Number,
    customerLifetimeValue: Number,
    acquisitionChannel: String,
    campaignId: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for customer full name
orderSchema.virtual('customerName').get(function () {
  return `${this.shipping.address.firstName} ${this.shipping.address.lastName}`;
});

// Virtual for shipping address string
orderSchema.virtual('shippingAddressString').get(function () {
  const addr = this.shipping.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for order total with currency
orderSchema.virtual('totalWithCurrency').get(function () {
  return `${this.payment.currency} ${this.payment.amount.total.toFixed(2)}`;
});

// Indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'tracking.trackingId': 1 }, { unique: true, sparse: true });
orderSchema.index({ 'tracking.carrierTrackingNumber': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shipping.address.zipCode': 1 });
orderSchema.index({ 'payment.transactionId': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to generate tracking ID
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.tracking.trackingId) {
    const count = await this.constructor.countDocuments();
    this.tracking.trackingId = `TRK-${Date.now()}-${(count + 1).toString().padStart(8, '0')}`;
  }
  next();
});

// Pre-save middleware to add timeline entry
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      description: `Order status changed to ${this.status}`,
      timestamp: new Date()
    });
  }
  next();
});

// Instance method to update status
orderSchema.methods.updateStatus = function (newStatus, description, userId) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    description: description || `Status updated to ${newStatus}`,
    user: userId,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to add tracking event
orderSchema.methods.addTrackingEvent = function (event) {
  this.tracking.events.push({
    ...event,
    timestamp: new Date()
  });
  this.tracking.lastUpdate = new Date();
  return this.save();
};

// Instance method to calculate total
orderSchema.methods.calculateTotal = function () {
  const subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + this.payment.amount.tax + this.payment.amount.shipping - this.payment.amount.discount;

  this.payment.amount.subtotal = subtotal;
  this.payment.amount.total = total;

  return this.save();
};

// Static method to find orders by customer
orderSchema.statics.findByCustomer = function (customerId) {
  return this.find({ customer: customerId }).sort({ createdAt: -1 });
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find orders by date range
orderSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', orderSchema);
