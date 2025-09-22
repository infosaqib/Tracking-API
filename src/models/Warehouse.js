const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
    maxlength: [100, 'Warehouse name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Warehouse code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Warehouse code cannot exceed 10 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    manager: {
      name: String,
      phone: String,
      email: String
    }
  },
  capacity: {
    total: {
      type: Number,
      required: true,
      min: [0, 'Total capacity cannot be negative']
    },
    used: {
      type: Number,
      default: 0,
      min: [0, 'Used capacity cannot be negative']
    },
    unit: {
      type: String,
      enum: ['sqft', 'sqm', 'pallets', 'units'],
      default: 'sqft'
    }
  },
  zones: [{
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['storage', 'picking', 'receiving', 'shipping', 'quarantine', 'cold_storage'],
      default: 'storage'
    },
    capacity: Number,
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  operatingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      open: String, // HH:MM format
      close: String, // HH:MM format
      breakStart: String,
      breakEnd: String
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      open: String,
      close: String,
      breakStart: String,
      breakEnd: String
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      open: String,
      close: String,
      breakStart: String,
      breakEnd: String
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      open: String,
      close: String,
      breakStart: String,
      breakEnd: String
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      open: String,
      close: String,
      breakStart: String,
      breakEnd: String
    },
    saturday: {
      isOpen: { type: Boolean, default: false },
      open: String,
      close: String,
      breakStart: String,
      breakEnd: String
    },
    sunday: {
      isOpen: { type: Boolean, default: false },
      open: String,
      close: String,
      breakStart: String,
      breakEnd: String
    }
  },
  services: [{
    type: {
      type: String,
      enum: [
        'storage',
        'picking',
        'packing',
        'shipping',
        'receiving',
        'inventory_management',
        'quality_control',
        'returns_processing',
        'cross_docking',
        'fulfillment'
      ],
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    capacity: Number,
    cost: {
      type: Number,
      min: [0, 'Cost cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'closed'],
    default: 'active'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  capabilities: {
    temperatureControlled: {
      type: Boolean,
      default: false
    },
    hazardousMaterials: {
      type: Boolean,
      default: false
    },
    fragileHandling: {
      type: Boolean,
      default: false
    },
    highValueSecurity: {
      type: Boolean,
      default: false
    },
    crossDocking: {
      type: Boolean,
      default: false
    },
    sameDayShipping: {
      type: Boolean,
      default: false
    }
  },
  shipping: {
    carriers: [{
      name: {
        type: String,
        enum: ['ups', 'fedex', 'dhl', 'usps', 'local'],
        required: true
      },
      isActive: {
        type: Boolean,
        default: true
      },
      accountNumber: String,
      pickupTime: String,
      cutoffTime: String
    }],
    zones: [{
      name: String,
      countries: [String],
      states: [String],
      zipCodes: [String],
      transitTime: {
        min: Number,
        max: Number,
        unit: {
          type: String,
          enum: ['hours', 'days'],
          default: 'days'
        }
      },
      cost: Number
    }]
  },
  analytics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    lastActivity: Date,
    efficiency: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for available capacity
warehouseSchema.virtual('availableCapacity').get(function() {
  return Math.max(0, this.capacity.total - this.capacity.used);
});

// Virtual for capacity utilization percentage
warehouseSchema.virtual('capacityUtilization').get(function() {
  if (this.capacity.total === 0) return 0;
  return Math.round((this.capacity.used / this.capacity.total) * 100);
});

// Virtual for full address
warehouseSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for is open now
warehouseSchema.virtual('isOpenNow').get(function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().slice(0, 3) + 'day';
  const time = now.toTimeString().slice(0, 5);
  
  const daySchedule = this.operatingHours[day];
  if (!daySchedule || !daySchedule.isOpen) return false;
  
  return time >= daySchedule.open && time <= daySchedule.close;
});

// Indexes
warehouseSchema.index({ code: 1 });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ isDefault: 1 });
warehouseSchema.index({ 'address.city': 1, 'address.state': 1 });
warehouseSchema.index({ 'address.country': 1 });
warehouseSchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to ensure only one default warehouse
warehouseSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Pre-save middleware to validate capacity
warehouseSchema.pre('save', function(next) {
  if (this.capacity.used > this.capacity.total) {
    return next(new Error('Used capacity cannot exceed total capacity'));
  }
  next();
});

// Instance method to check if warehouse can handle order
warehouseSchema.methods.canHandleOrder = function(orderData) {
  // Check capacity
  if (this.capacity.used >= this.capacity.total) {
    return { canHandle: false, reason: 'Insufficient capacity' };
  }
  
  // Check operating hours
  if (!this.isOpenNow) {
    return { canHandle: false, reason: 'Warehouse is closed' };
  }
  
  // Check capabilities
  if (orderData.requiresTemperatureControl && !this.capabilities.temperatureControlled) {
    return { canHandle: false, reason: 'Temperature control not available' };
  }
  
  if (orderData.isHazardous && !this.capabilities.hazardousMaterials) {
    return { canHandle: false, reason: 'Hazardous materials not supported' };
  }
  
  if (orderData.isFragile && !this.capabilities.fragileHandling) {
    return { canHandle: false, reason: 'Fragile handling not available' };
  }
  
  return { canHandle: true };
};

// Instance method to update capacity
warehouseSchema.methods.updateCapacity = function(usedCapacity) {
  this.capacity.used = Math.max(0, usedCapacity);
  
  if (this.capacity.used > this.capacity.total) {
    throw new Error('Used capacity cannot exceed total capacity');
  }
  
  return this.save();
};

// Instance method to get shipping options
warehouseSchema.methods.getShippingOptions = function(destination) {
  const options = [];
  
  for (const carrier of this.shipping.carriers) {
    if (!carrier.isActive) continue;
    
    for (const zone of this.shipping.zones) {
      if (this.isInZone(destination, zone)) {
        options.push({
          carrier: carrier.name,
          transitTime: zone.transitTime,
          cost: zone.cost,
          zone: zone.name
        });
      }
    }
  }
  
  return options;
};

// Instance method to check if destination is in zone
warehouseSchema.methods.isInZone = function(destination, zone) {
  if (zone.countries && zone.countries.includes(destination.country)) {
    return true;
  }
  
  if (zone.states && zone.states.includes(destination.state)) {
    return true;
  }
  
  if (zone.zipCodes && zone.zipCodes.includes(destination.zipCode)) {
    return true;
  }
  
  return false;
};

// Static method to find active warehouses
warehouseSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find default warehouse
warehouseSchema.statics.findDefault = function() {
  return this.findOne({ isDefault: true, status: 'active' });
};

// Static method to find warehouses by location
warehouseSchema.statics.findByLocation = function(city, state, country) {
  const query = {};
  
  if (city) query['address.city'] = new RegExp(city, 'i');
  if (state) query['address.state'] = new RegExp(state, 'i');
  if (country) query['address.country'] = new RegExp(country, 'i');
  
  return this.find(query);
};

// Static method to find warehouses with capacity
warehouseSchema.statics.findWithCapacity = function(requiredCapacity = 0) {
  return this.find({
    status: 'active',
    $expr: {
      $gte: [
        { $subtract: ['$capacity.total', '$capacity.used'] },
        requiredCapacity
      ]
    }
  });
};

module.exports = mongoose.model('Warehouse', warehouseSchema);
