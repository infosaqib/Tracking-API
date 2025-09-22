
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    uppercase: true,
    trim: true
  },
  barcode: {
    type: String,
    sparse: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  price: {
    current: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Price cannot be negative']
    },
    original: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  attributes: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'color', 'size'],
      default: 'text'
    }
  }],
  variants: [{
    name: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true,
      uppercase: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    attributes: [{
      name: String,
      value: String
    }],
    images: [String],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  inventory: {
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative']
    },
    reserved: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative']
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackQuantity: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in', 'm', 'ft'],
      default: 'cm'
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['g', 'kg', 'lb', 'oz'],
        default: 'kg'
      }
    }
  },
  seo: {
    title: String,
    description: String,
    keywords: [String],
    slug: {
      type: String,
      lowercase: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  channels: [{
    name: {
      type: String,
      required: true,
      enum: ['website', 'amazon', 'ebay', 'etsy', 'shopify', 'woocommerce']
    },
    externalId: String,
    isActive: {
      type: Boolean,
      default: true
    },
    lastSync: Date,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'error'],
      default: 'pending'
    }
  }],
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    wishlist: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    }
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingClass: String
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  digitalFiles: [{
    name: String,
    url: String,
    size: Number,
    type: String
  }],
  availability: {
    startDate: Date,
    endDate: Date,
    isAvailable: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for available quantity
productSchema.virtual('availableQuantity').get(function() {
  if (!this.inventory.trackQuantity) return null;
  return Math.max(0, this.inventory.quantity - this.inventory.reserved);
});

// Virtual for is in stock
productSchema.virtual('isInStock').get(function() {
  if (!this.inventory.trackQuantity) return true;
  return this.availableQuantity > 0 || this.inventory.allowBackorder;
});

// Virtual for is low stock
productSchema.virtual('isLowStock').get(function() {
  if (!this.inventory.trackQuantity) return false;
  return this.availableQuantity <= this.inventory.lowStockThreshold;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.price.original || this.price.original <= this.price.current) return 0;
  return Math.round(((this.price.original - this.price.current) / this.price.original) * 100);
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ barcode: 1 }, { unique: true, sparse: true });
productSchema.index({ 'seo.slug': 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'price.current': 1 });
productSchema.index({ 'analytics.rating.average': -1 });
productSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.seo.slug) {
    this.seo.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Pre-save middleware to validate inventory
productSchema.pre('save', function(next) {
  if (this.inventory.trackQuantity) {
    if (this.inventory.quantity < 0) {
      return next(new Error('Inventory quantity cannot be negative'));
    }
    if (this.inventory.reserved < 0) {
      return next(new Error('Reserved quantity cannot be negative'));
    }
    if (this.inventory.reserved > this.inventory.quantity) {
      return next(new Error('Reserved quantity cannot exceed available quantity'));
    }
  }
  next();
});

// Instance method to update inventory
productSchema.methods.updateInventory = function(quantity, operation = 'set') {
  if (!this.inventory.trackQuantity) {
    throw new Error('Inventory tracking is disabled for this product');
  }

  switch (operation) {
    case 'set':
      this.inventory.quantity = quantity;
      break;
    case 'add':
      this.inventory.quantity += quantity;
      break;
    case 'subtract':
      this.inventory.quantity -= quantity;
      break;
    default:
      throw new Error('Invalid inventory operation');
  }

  if (this.inventory.quantity < 0) {
    throw new Error('Insufficient inventory');
  }

  return this.save();
};

// Instance method to reserve inventory
productSchema.methods.reserveInventory = function(quantity) {
  if (!this.inventory.trackQuantity) {
    return true;
  }

  if (this.availableQuantity < quantity && !this.inventory.allowBackorder) {
    throw new Error('Insufficient inventory');
  }

  this.inventory.reserved += quantity;
  return this.save();
};

// Instance method to release inventory
productSchema.methods.releaseInventory = function(quantity) {
  if (!this.inventory.trackQuantity) {
    return true;
  }

  this.inventory.reserved = Math.max(0, this.inventory.reserved - quantity);
  return this.save();
};

// Static method to find products by category
productSchema.statics.findByCategory = function(categoryId) {
  return this.find({ category: categoryId, status: 'active' });
};

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.find({
    'inventory.trackQuantity': true,
    $expr: {
      $lte: [
        { $subtract: ['$inventory.quantity', '$inventory.reserved'] },
        '$inventory.lowStockThreshold'
      ]
    }
  });
};

module.exports = mongoose.model('Product', productSchema);
