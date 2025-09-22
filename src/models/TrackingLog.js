const mongoose = require('mongoose');

const trackingLogSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: [true, 'Tracking ID is required'],
    uppercase: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required']
  },
  carrier: {
    name: {
      type: String,
      required: [true, 'Carrier name is required'],
      enum: ['ups', 'fedex', 'dhl', 'usps', 'local', 'custom']
    },
    trackingNumber: {
      type: String,
      required: [true, 'Carrier tracking number is required']
    },
    service: String,
    accountNumber: String
  },
  status: {
    current: {
      type: String,
      required: [true, 'Current status is required'],
      enum: [
        'pending',
        'confirmed',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'exception',
        'returned',
        'cancelled',
        'delayed'
      ],
      default: 'pending'
    },
    previous: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  location: {
    current: {
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    destination: {
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    location: {
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    timestamp: {
      type: Date,
      required: true
    },
    source: {
      type: String,
      enum: ['carrier', 'system', 'manual', 'webhook'],
      default: 'system'
    },
    details: mongoose.Schema.Types.Mixed,
    isDelivered: {
      type: Boolean,
      default: false
    },
    isException: {
      type: Boolean,
      default: false
    }
  }],
  delivery: {
    estimated: {
      date: Date,
      timeWindow: {
        start: String,
        end: String
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    actual: {
      date: Date,
      time: String,
      signature: String,
      recipient: String,
      proof: [{
        type: {
          type: String,
          enum: ['photo', 'signature', 'video', 'document']
        },
        url: String,
        description: String
      }]
    },
    attempts: [{
      attempt: Number,
      date: Date,
      time: String,
      reason: String,
      location: String,
      nextAttempt: Date
    }]
  },
  exceptions: [{
    type: {
      type: String,
      enum: [
        'weather_delay',
        'address_incorrect',
        'recipient_unavailable',
        'damaged_package',
        'customs_hold',
        'delivery_failed',
        'return_to_sender',
        'lost_package',
        'other'
      ],
      required: true
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    resolution: String,
    isResolved: {
      type: Boolean,
      default: false
    }
  }],
  predictions: {
    deliveryDate: Date,
    confidence: Number,
    factors: [{
      name: String,
      impact: {
        type: String,
        enum: ['positive', 'negative', 'neutral']
      },
      weight: Number
    }],
    lastCalculated: Date
  },
  notifications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'webhook'],
      required: true
    },
    recipient: String,
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    response: mongoose.Schema.Types.Mixed
  }],
  webhooks: [{
    url: String,
    secret: String,
    events: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    lastTriggered: Date,
    failureCount: {
      type: Number,
      default: 0
    }
  }],
  analytics: {
    totalTransitTime: Number, // in hours
    averageSpeed: Number, // km/h
    distanceTraveled: Number, // in km
    stopsCount: Number,
    delaysCount: Number,
    customerSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  },
  metadata: {
    packageWeight: Number,
    packageDimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'm', 'ft'],
        default: 'cm'
      }
    },
    specialInstructions: String,
    insuranceValue: Number,
    declaredValue: Number,
    customsValue: Number,
    customsDescription: String,
    hazardousMaterials: {
      type: Boolean,
      default: false
    },
    temperatureControlled: {
      type: Boolean,
      default: false
    },
    fragile: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastWebhookUpdate: Date,
  lastCarrierUpdate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for delivery status
trackingLogSchema.virtual('isDelivered').get(function () {
  return this.status.current === 'delivered';
});

// Virtual for is in transit
trackingLogSchema.virtual('isInTransit').get(function () {
  return ['picked_up', 'in_transit', 'out_for_delivery'].includes(this.status.current);
});

// Virtual for has exceptions
trackingLogSchema.virtual('hasExceptions').get(function () {
  return this.exceptions.some(exception => !exception.isResolved);
});

// Virtual for transit time
trackingLogSchema.virtual('transitTime').get(function () {
  if (!this.timeline.length) return null;

  const firstEvent = this.timeline[0];
  const lastEvent = this.timeline[this.timeline.length - 1];

  return Math.round((lastEvent.timestamp - firstEvent.timestamp) / (1000 * 60 * 60)); // hours
});

// Indexes
trackingLogSchema.index({ trackingId: 1 }, { unique: true });
trackingLogSchema.index({ order: 1 });
trackingLogSchema.index({ 'carrier.trackingNumber': 1 });
trackingLogSchema.index({ 'status.current': 1 });
trackingLogSchema.index({ 'carrier.name': 1 });
trackingLogSchema.index({ createdAt: -1 });
trackingLogSchema.index({ 'delivery.estimated.date': 1 });
trackingLogSchema.index({ isActive: 1 });

// Pre-save middleware to update status
trackingLogSchema.pre('save', function (next) {
  if (this.isModified('timeline') && this.timeline.length > 0) {
    const latestEvent = this.timeline[this.timeline.length - 1];
    this.status.previous = this.status.current;
    this.status.current = latestEvent.status;
    this.status.lastUpdated = latestEvent.timestamp;
  }
  next();
});

// Instance method to add timeline event
trackingLogSchema.methods.addTimelineEvent = function (event) {
  this.timeline.push({
    ...event,
    timestamp: new Date()
  });

  // Update current status
  this.status.previous = this.status.current;
  this.status.current = event.status;
  this.status.lastUpdated = new Date();

  return this.save();
};

// Instance method to add exception
trackingLogSchema.methods.addException = function (exceptionData) {
  this.exceptions.push({
    ...exceptionData,
    reportedAt: new Date()
  });
  return this.save();
};

// Instance method to resolve exception
trackingLogSchema.methods.resolveException = function (exceptionId, resolution) {
  const exception = this.exceptions.id(exceptionId);
  if (exception) {
    exception.isResolved = true;
    exception.resolvedAt = new Date();
    exception.resolution = resolution;
  }
  return this.save();
};

// Instance method to add notification
trackingLogSchema.methods.addNotification = function (notificationData) {
  this.notifications.push({
    ...notificationData,
    sentAt: new Date()
  });
  return this.save();
};

// Instance method to update delivery
trackingLogSchema.methods.updateDelivery = function (deliveryData) {
  this.delivery.actual = {
    ...this.delivery.actual,
    ...deliveryData,
    date: new Date()
  };

  // Mark as delivered
  this.status.current = 'delivered';
  this.status.lastUpdated = new Date();

  return this.save();
};

// Instance method to calculate predictions
trackingLogSchema.methods.calculatePredictions = function () {
  // Simple prediction based on current status and historical data
  const now = new Date();
  let estimatedDelivery = new Date();

  switch (this.status.current) {
    case 'pending':
    case 'confirmed':
      estimatedDelivery.setDate(now.getDate() + 3); // 3 days
      break;
    case 'picked_up':
      estimatedDelivery.setDate(now.getDate() + 2); // 2 days
      break;
    case 'in_transit':
      estimatedDelivery.setDate(now.getDate() + 1); // 1 day
      break;
    case 'out_for_delivery':
      estimatedDelivery.setDate(now.getDate()); // Today
      break;
    default:
      estimatedDelivery = null;
  }

  this.predictions.deliveryDate = estimatedDelivery;
  this.predictions.confidence = this.status.current === 'out_for_delivery' ? 90 : 70;
  this.predictions.lastCalculated = now;

  return this.save();
};

// Instance method to get status summary
trackingLogSchema.methods.getStatusSummary = function () {
  return {
    trackingId: this.trackingId,
    status: this.status.current,
    carrier: this.carrier.name,
    carrierTrackingNumber: this.carrier.trackingNumber,
    lastUpdate: this.status.lastUpdated,
    estimatedDelivery: this.delivery.estimated.date,
    actualDelivery: this.delivery.actual.date,
    isDelivered: this.isDelivered,
    hasExceptions: this.hasExceptions,
    timeline: this.timeline.slice(-5) // Last 5 events
  };
};

// Static method to find by tracking ID
trackingLogSchema.statics.findByTrackingId = function (trackingId) {
  return this.findOne({ trackingId: trackingId.toUpperCase() });
};

// Static method to find by carrier tracking number
trackingLogSchema.statics.findByCarrierTracking = function (carrierName, trackingNumber) {
  return this.findOne({
    'carrier.name': carrierName,
    'carrier.trackingNumber': trackingNumber
  });
};

// Static method to find active tracking logs
trackingLogSchema.statics.findActive = function () {
  return this.find({
    isActive: true,
    'status.current': { $nin: ['delivered', 'cancelled', 'returned'] }
  });
};

// Static method to find delayed shipments
trackingLogSchema.statics.findDelayed = function () {
  const now = new Date();
  return this.find({
    'delivery.estimated.date': { $lt: now },
    'status.current': { $nin: ['delivered', 'cancelled', 'returned'] }
  });
};

module.exports = mongoose.model('TrackingLog', trackingLogSchema);
