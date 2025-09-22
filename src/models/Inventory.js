const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product.variants'
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse is required']
  },
  quantity: {
    available: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
      default: 0
    },
    reserved: {
      type: Number,
      required: true,
      min: [0, 'Reserved quantity cannot be negative'],
      default: 0
    },
    incoming: {
      type: Number,
      default: 0,
      min: [0, 'Incoming quantity cannot be negative']
    },
    outgoing: {
      type: Number,
      default: 0,
      min: [0, 'Outgoing quantity cannot be negative']
    }
  },
  thresholds: {
    lowStock: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative']
    },
    highStock: {
      type: Number,
      default: 1000,
      min: [0, 'High stock threshold cannot be negative']
    },
    reorderPoint: {
      type: Number,
      default: 5,
      min: [0, 'Reorder point cannot be negative']
    },
    reorderQuantity: {
      type: Number,
      default: 50,
      min: [0, 'Reorder quantity cannot be negative']
    }
  },
  cost: {
    unit: {
      type: Number,
      min: [0, 'Unit cost cannot be negative']
    },
    total: {
      type: Number,
      min: [0, 'Total cost cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    lastUpdated: Date
  },
  location: {
    aisle: String,
    shelf: String,
    bin: String,
    zone: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'quarantine', 'discontinued'],
    default: 'active'
  },
  movements: [{
    type: {
      type: String,
      enum: [
        'inbound',
        'outbound',
        'transfer',
        'adjustment',
        'reservation',
        'release',
        'return',
        'damage',
        'loss'
      ],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: String,
    reference: String, // Order ID, Transfer ID, etc.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  alerts: [{
    type: {
      type: String,
      enum: [
        'low_stock',
        'high_stock',
        'reorder_point',
        'negative_stock',
        'expired',
        'damaged',
        'quarantine'
      ],
      required: true
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  analytics: {
    turnoverRate: {
      type: Number,
      default: 0
    },
    averageStock: {
      type: Number,
      default: 0
    },
    stockoutDays: {
      type: Number,
      default: 0
    },
    lastMovement: Date,
    movementCount: {
      type: Number,
      default: 0
    }
  },
  expiry: {
    hasExpiry: {
      type: Boolean,
      default: false
    },
    expiryDate: Date,
    batchNumber: String,
    lotNumber: String
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  lastAudit: {
    date: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    variance: Number,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total quantity
inventorySchema.virtual('totalQuantity').get(function() {
  return this.quantity.available + this.quantity.reserved;
});

// Virtual for is low stock
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity.available <= this.thresholds.lowStock;
});

// Virtual for is high stock
inventorySchema.virtual('isHighStock').get(function() {
  return this.quantity.available >= this.thresholds.highStock;
});

// Virtual for needs reorder
inventorySchema.virtual('needsReorder').get(function() {
  return this.quantity.available <= this.thresholds.reorderPoint;
});

// Virtual for stock value
inventorySchema.virtual('stockValue').get(function() {
  return this.quantity.available * (this.cost.unit || 0);
});

// Indexes
inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });
inventorySchema.index({ warehouse: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ 'quantity.available': 1 });
inventorySchema.index({ 'expiry.expiryDate': 1 });
inventorySchema.index({ supplier: 1 });
inventorySchema.index({ createdAt: -1 });

// Pre-save middleware to validate quantities
inventorySchema.pre('save', function(next) {
  if (this.quantity.available < 0) {
    return next(new Error('Available quantity cannot be negative'));
  }
  if (this.quantity.reserved < 0) {
    return next(new Error('Reserved quantity cannot be negative'));
  }
  if (this.quantity.reserved > this.quantity.available) {
    return next(new Error('Reserved quantity cannot exceed available quantity'));
  }
  next();
});

// Pre-save middleware to update analytics
inventorySchema.pre('save', function(next) {
  if (this.isModified('quantity.available')) {
    this.analytics.averageStock = (this.analytics.averageStock + this.quantity.available) / 2;
    this.analytics.lastMovement = new Date();
    this.analytics.movementCount += 1;
  }
  next();
});

// Instance method to add movement
inventorySchema.methods.addMovement = function(movementData) {
  this.movements.push({
    ...movementData,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to reserve quantity
inventorySchema.methods.reserve = function(quantity, reason, reference, userId) {
  if (this.quantity.available < quantity) {
    throw new Error('Insufficient available quantity');
  }

  this.quantity.available -= quantity;
  this.quantity.reserved += quantity;

  this.addMovement({
    type: 'reservation',
    quantity: -quantity,
    reason,
    reference,
    user: userId
  });

  return this.save();
};

// Instance method to release quantity
inventorySchema.methods.release = function(quantity, reason, reference, userId) {
  if (this.quantity.reserved < quantity) {
    throw new Error('Insufficient reserved quantity');
  }

  this.quantity.available += quantity;
  this.quantity.reserved -= quantity;

  this.addMovement({
    type: 'release',
    quantity,
    reason,
    reference,
    user: userId
  });

  return this.save();
};

// Instance method to adjust quantity
inventorySchema.methods.adjust = function(quantity, reason, userId) {
  const oldQuantity = this.quantity.available;
  this.quantity.available += quantity;

  if (this.quantity.available < 0) {
    this.quantity.available = oldQuantity;
    throw new Error('Adjustment would result in negative quantity');
  }

  this.addMovement({
    type: 'adjustment',
    quantity,
    reason,
    user: userId
  });

  return this.save();
};

// Instance method to transfer quantity
inventorySchema.methods.transfer = function(quantity, toWarehouse, reason, userId) {
  if (this.quantity.available < quantity) {
    throw new Error('Insufficient available quantity for transfer');
  }

  this.quantity.available -= quantity;
  this.quantity.outgoing += quantity;

  this.addMovement({
    type: 'transfer',
    quantity: -quantity,
    reason: `${reason} - Transfer to ${toWarehouse}`,
    user: userId
  });

  return this.save();
};

// Instance method to check alerts
inventorySchema.methods.checkAlerts = function() {
  const alerts = [];

  // Low stock alert
  if (this.isLowStock && !this.alerts.some(alert => alert.type === 'low_stock' && alert.isActive)) {
    alerts.push({
      type: 'low_stock',
      message: `Low stock alert: ${this.quantity.available} units remaining`,
      severity: 'high'
    });
  }

  // High stock alert
  if (this.isHighStock && !this.alerts.some(alert => alert.type === 'high_stock' && alert.isActive)) {
    alerts.push({
      type: 'high_stock',
      message: `High stock alert: ${this.quantity.available} units in stock`,
      severity: 'medium'
    });
  }

  // Reorder point alert
  if (this.needsReorder && !this.alerts.some(alert => alert.type === 'reorder_point' && alert.isActive)) {
    alerts.push({
      type: 'reorder_point',
      message: `Reorder point reached: ${this.quantity.available} units remaining`,
      severity: 'critical'
    });
  }

  // Negative stock alert
  if (this.quantity.available < 0 && !this.alerts.some(alert => alert.type === 'negative_stock' && alert.isActive)) {
    alerts.push({
      type: 'negative_stock',
      message: `Negative stock detected: ${this.quantity.available} units`,
      severity: 'critical'
    });
  }

  // Add new alerts
  this.alerts.push(...alerts);
  return this.save();
};

// Static method to find low stock items
inventorySchema.statics.findLowStock = function() {
  return this.find({
    $expr: {
      $lte: ['$quantity.available', '$thresholds.lowStock']
    },
    status: 'active'
  }).populate('product warehouse');
};

// Static method to find items needing reorder
inventorySchema.statics.findNeedingReorder = function() {
  return this.find({
    $expr: {
      $lte: ['$quantity.available', '$thresholds.reorderPoint']
    },
    status: 'active'
  }).populate('product warehouse supplier');
};

// Static method to get inventory summary
inventorySchema.statics.getSummary = function(warehouseId) {
  const match = warehouseId ? { warehouse: warehouseId } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalValue: { $sum: { $multiply: ['$quantity.available', '$cost.unit'] } },
        lowStockItems: {
          $sum: {
            $cond: [
              { $lte: ['$quantity.available', '$thresholds.lowStock'] },
              1,
              0
            ]
          }
        },
        outOfStockItems: {
          $sum: {
            $cond: [
              { $eq: ['$quantity.available', 0] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Inventory', inventorySchema);
