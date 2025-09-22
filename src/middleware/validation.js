const Joi = require('joi');
const { body, query, param, validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Validation middleware factory
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation error:', { errors, body: req.body });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        code: 'VALIDATION_ERROR'
      });
    }

    // Update request with sanitized data
    req[property] = error ? req[property] : error.value;
    next();
  };
};

/**
 * Express-validator middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    logger.warn('Validation error:', { errors: formattedErrors });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

// Common validation schemas
const commonSchemas = {
  // ObjectId validation
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),

  // Email validation
  email: Joi.string().email().lowercase().trim().required(),

  // Password validation
  password: Joi.string().min(6).max(128).required(),

  // Phone validation
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),

  // Currency validation
  currency: Joi.string().length(3).uppercase().default('USD'),

  // Date validation
  date: Joi.date().iso().optional(),

  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: Joi.string().min(1).max(50).trim().required(),
    lastName: Joi.string().min(1).max(50).trim().required(),
    role: Joi.string().valid('buyer', 'seller', 'admin').default('buyer'),
    phone: commonSchemas.phone,
    businessInfo: Joi.object({
      companyName: Joi.string().max(100).optional(),
      businessType: Joi.string().max(50).optional(),
      taxId: Joi.string().max(50).optional(),
      website: Joi.string().uri().optional(),
      description: Joi.string().max(500).optional()
    }).optional()
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(1).max(50).trim().optional(),
    lastName: Joi.string().min(1).max(50).trim().optional(),
    phone: commonSchemas.phone,
    profile: Joi.object({
      avatar: Joi.string().uri().optional(),
      address: Joi.object({
        street: Joi.string().max(200).optional(),
        city: Joi.string().max(100).optional(),
        state: Joi.string().max(100).optional(),
        zipCode: Joi.string().max(20).optional(),
        country: Joi.string().max(100).optional()
      }).optional(),
      preferences: Joi.object({
        language: Joi.string().length(2).default('en'),
        currency: commonSchemas.currency,
        notifications: Joi.object({
          email: Joi.boolean().default(true),
          sms: Joi.boolean().default(false),
          push: Joi.boolean().default(true)
        }).optional()
      }).optional()
    }).optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  })
};

// Product validation schemas
const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(200).trim().required(),
    description: Joi.string().min(1).max(2000).required(),
    shortDescription: Joi.string().max(500).optional(),
    sku: Joi.string().min(1).max(50).uppercase().trim().required(),
    barcode: Joi.string().max(50).optional(),
    category: commonSchemas.objectId,
    subcategory: commonSchemas.objectId.optional(),
    brand: Joi.string().max(100).optional(),
    price: Joi.object({
      current: Joi.number().min(0).required(),
      original: Joi.number().min(0).optional(),
      currency: commonSchemas.currency
    }).required(),
    images: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().max(200).optional(),
      isPrimary: Joi.boolean().default(false),
      order: Joi.number().integer().min(0).default(0)
    })).optional(),
    attributes: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required(),
      type: Joi.string().valid('text', 'number', 'boolean', 'color', 'size').default('text')
    })).optional(),
    inventory: Joi.object({
      quantity: Joi.number().integer().min(0).default(0),
      lowStockThreshold: Joi.number().integer().min(0).default(10),
      trackQuantity: Joi.boolean().default(true),
      allowBackorder: Joi.boolean().default(false)
    }).optional(),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional(),
      unit: Joi.string().valid('cm', 'in', 'm', 'ft').default('cm'),
      weight: Joi.object({
        value: Joi.number().min(0).optional(),
        unit: Joi.string().valid('g', 'kg', 'lb', 'oz').default('kg')
      }).optional()
    }).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    status: Joi.string().valid('draft', 'active', 'inactive', 'archived').default('draft'),
    visibility: Joi.string().valid('public', 'private', 'unlisted').default('public')
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(200).trim().optional(),
    description: Joi.string().min(1).max(2000).optional(),
    shortDescription: Joi.string().max(500).optional(),
    brand: Joi.string().max(100).optional(),
    price: Joi.object({
      current: Joi.number().min(0).optional(),
      original: Joi.number().min(0).optional(),
      currency: commonSchemas.currency
    }).optional(),
    images: Joi.array().items(Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().max(200).optional(),
      isPrimary: Joi.boolean().default(false),
      order: Joi.number().integer().min(0).default(0)
    })).optional(),
    attributes: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      value: Joi.string().required(),
      type: Joi.string().valid('text', 'number', 'boolean', 'color', 'size').default('text')
    })).optional(),
    inventory: Joi.object({
      quantity: Joi.number().integer().min(0).optional(),
      lowStockThreshold: Joi.number().integer().min(0).optional(),
      trackQuantity: Joi.boolean().optional(),
      allowBackorder: Joi.boolean().optional()
    }).optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    status: Joi.string().valid('draft', 'active', 'inactive', 'archived').optional(),
    visibility: Joi.string().valid('public', 'private', 'unlisted').optional()
  }),

  query: Joi.object({
    search: Joi.string().max(100).optional(),
    category: commonSchemas.objectId.optional(),
    subcategory: commonSchemas.objectId.optional(),
    brand: Joi.string().max(100).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    inStock: Joi.boolean().optional(),
    status: Joi.string().valid('draft', 'active', 'inactive', 'archived').optional(),
    tags: Joi.string().optional(),
    sort: Joi.string().valid('name', 'price', 'createdAt', 'updatedAt', 'rating').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    page: commonSchemas.pagination.page,
    limit: commonSchemas.pagination.limit
  })
};

// Order validation schemas
const orderSchemas = {
  create: Joi.object({
    items: Joi.array().items(Joi.object({
      product: commonSchemas.objectId.required(),
      variant: commonSchemas.objectId.optional(),
      quantity: Joi.number().integer().min(1).required(),
      attributes: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        value: Joi.string().required()
      })).optional()
    })).min(1).required(),
    shipping: Joi.object({
      address: Joi.object({
        firstName: Joi.string().min(1).max(50).trim().required(),
        lastName: Joi.string().min(1).max(50).trim().required(),
        company: Joi.string().max(100).optional(),
        street: Joi.string().min(1).max(200).trim().required(),
        city: Joi.string().min(1).max(100).trim().required(),
        state: Joi.string().min(1).max(100).trim().required(),
        zipCode: Joi.string().min(1).max(20).trim().required(),
        country: Joi.string().min(1).max(100).trim().required(),
        phone: commonSchemas.phone.optional()
      }).required(),
      method: Joi.string().required(),
      carrier: Joi.string().valid('ups', 'fedex', 'dhl', 'usps', 'local', 'custom').optional(),
      notes: Joi.string().max(500).optional()
    }).required(),
    billing: Joi.object({
      address: Joi.object({
        firstName: Joi.string().min(1).max(50).trim().optional(),
        lastName: Joi.string().min(1).max(50).trim().optional(),
        company: Joi.string().max(100).optional(),
        street: Joi.string().min(1).max(200).trim().optional(),
        city: Joi.string().min(1).max(100).trim().optional(),
        state: Joi.string().min(1).max(100).trim().optional(),
        zipCode: Joi.string().min(1).max(20).trim().optional(),
        country: Joi.string().min(1).max(100).trim().optional(),
        phone: commonSchemas.phone.optional()
      }).optional(),
      useShippingAddress: Joi.boolean().default(true)
    }).optional(),
    payment: Joi.object({
      method: Joi.string().valid('stripe', 'paypal', 'bank_transfer', 'cash_on_delivery', 'cryptocurrency').required()
    }).required(),
    notes: Joi.object({
      customer: Joi.string().max(500).optional(),
      internal: Joi.string().max(500).optional(),
      shipping: Joi.string().max(500).optional()
    }).optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid(
      'pending', 'confirmed', 'processing', 'shipped',
      'delivered', 'cancelled', 'refunded', 'returned', 'failed'
    ).required(),
    notes: Joi.string().max(500).optional()
  }),

  query: Joi.object({
    status: Joi.string().valid(
      'pending', 'confirmed', 'processing', 'shipped',
      'delivered', 'cancelled', 'refunded', 'returned', 'failed'
    ).optional(),
    paymentStatus: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled').optional(),
    carrier: Joi.string().optional(),
    fromDate: commonSchemas.date,
    toDate: commonSchemas.date,
    sort: Joi.string().valid('createdAt', 'updatedAt', 'orderNumber', 'total').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    page: commonSchemas.pagination.page,
    limit: commonSchemas.pagination.limit
  })
};

// Tracking validation schemas
const trackingSchemas = {
  create: Joi.object({
    order: commonSchemas.objectId.required(),
    carrier: Joi.object({
      name: Joi.string().valid('ups', 'fedex', 'dhl', 'usps', 'local', 'custom').required(),
      trackingNumber: Joi.string().required(),
      service: Joi.string().optional(),
      accountNumber: Joi.string().optional()
    }).required(),
    estimatedDelivery: commonSchemas.date.optional(),
    metadata: Joi.object({
      packageWeight: Joi.number().min(0).optional(),
      packageDimensions: Joi.object({
        length: Joi.number().min(0).optional(),
        width: Joi.number().min(0).optional(),
        height: Joi.number().min(0).optional(),
        unit: Joi.string().valid('cm', 'in', 'm', 'ft').default('cm')
      }).optional(),
      specialInstructions: Joi.string().max(500).optional(),
      insuranceValue: Joi.number().min(0).optional(),
      declaredValue: Joi.number().min(0).optional(),
      customsValue: Joi.number().min(0).optional(),
      customsDescription: Joi.string().max(200).optional(),
      hazardousMaterials: Joi.boolean().default(false),
      temperatureControlled: Joi.boolean().default(false),
      fragile: Joi.boolean().default(false)
    }).optional()
  }),

  addEvent: Joi.object({
    status: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.object({
      name: Joi.string().optional(),
      address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        zipCode: Joi.string().optional(),
        country: Joi.string().optional()
      }).optional(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).optional(),
        longitude: Joi.number().min(-180).max(180).optional()
      }).optional()
    }).optional(),
    details: Joi.object().optional(),
    isDelivered: Joi.boolean().default(false),
    isException: Joi.boolean().default(false)
  }),

  query: Joi.object({
    status: Joi.string().valid(
      'pending', 'confirmed', 'picked_up', 'in_transit',
      'out_for_delivery', 'delivered', 'exception', 'returned', 'cancelled', 'delayed'
    ).optional(),
    carrier: Joi.string().optional(),
    fromDate: commonSchemas.date,
    toDate: commonSchemas.date,
    sort: Joi.string().valid('createdAt', 'updatedAt', 'status', 'estimatedDelivery').default('createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    page: commonSchemas.pagination.page,
    limit: commonSchemas.pagination.limit
  })
};

// Express-validator rules
const validationRules = {
  // User validation rules
  user: {
    register: [
      body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
      body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (1-50 characters)'),
      body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (1-50 characters)'),
      body('role').optional().isIn(['buyer', 'seller', 'admin']).withMessage('Invalid role')
    ],
    login: [
      body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
      body('password').notEmpty().withMessage('Password is required')
    ]
  },

  // Product validation rules
  product: {
    create: [
      body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Product name is required (1-200 characters)'),
      body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Description is required (1-2000 characters)'),
      body('sku').trim().isLength({ min: 1, max: 50 }).withMessage('SKU is required (1-50 characters)'),
      body('category').isMongoId().withMessage('Valid category ID is required'),
      body('price.current').isNumeric().isFloat({ min: 0 }).withMessage('Current price must be a positive number'),
      body('price.currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
    ]
  },

  // Order validation rules
  order: {
    create: [
      body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
      body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
      body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
      body('shipping.address.firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
      body('shipping.address.lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
      body('shipping.address.street').trim().isLength({ min: 1, max: 200 }).withMessage('Street address is required'),
      body('shipping.address.city').trim().isLength({ min: 1, max: 100 }).withMessage('City is required'),
      body('shipping.address.state').trim().isLength({ min: 1, max: 100 }).withMessage('State is required'),
      body('shipping.address.zipCode').trim().isLength({ min: 1, max: 20 }).withMessage('ZIP code is required'),
      body('shipping.address.country').trim().isLength({ min: 1, max: 100 }).withMessage('Country is required'),
      body('payment.method').isIn(['stripe', 'paypal', 'bank_transfer', 'cash_on_delivery', 'cryptocurrency']).withMessage('Invalid payment method')
    ]
  },

  // Common parameter validation
  params: {
    id: [param('id').isMongoId().withMessage('Valid ID is required')],
    trackingId: [param('trackingId').isLength({ min: 1 }).withMessage('Tracking ID is required')]
  },

  // Query validation
  query: {
    pagination: [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('sort').optional().isString().withMessage('Sort must be a string'),
      query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
    ]
  }
};

module.exports = {
  validate,
  handleValidationErrors,
  commonSchemas,
  userSchemas,
  productSchemas,
  orderSchemas,
  trackingSchemas,
  validationRules
};
