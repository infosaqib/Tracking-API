const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tracking API',
      version: config.apiVersion,
      description: 'Comprehensive e-commerce tracking API with real-time updates and multi-carrier support',
      contact: {
        name: 'API Support',
        email: 'support@trackingapi.com',
        url: 'https://trackingapi.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server'
      },
      {
        url: 'https://api.trackingapi.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        },
        webhookAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Webhook-Signature'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', enum: ['buyer', 'seller', 'admin'], example: 'buyer' },
            isActive: { type: 'boolean', example: true },
            isEmailVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Wireless Headphones' },
            description: { type: 'string', example: 'High-quality wireless headphones with noise cancellation' },
            sku: { type: 'string', example: 'WH-001' },
            price: {
              type: 'object',
              properties: {
                current: { type: 'number', example: 199.99 },
                original: { type: 'number', example: 249.99 },
                currency: { type: 'string', example: 'USD' }
              }
            },
            status: { type: 'string', enum: ['draft', 'active', 'inactive', 'archived'], example: 'active' },
            inventory: {
              type: 'object',
              properties: {
                quantity: { type: 'number', example: 100 },
                reserved: { type: 'number', example: 5 },
                lowStockThreshold: { type: 'number', example: 10 }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            orderNumber: { type: 'string', example: 'ORD-1234567890' },
            customer: { $ref: '#/components/schemas/User' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { $ref: '#/components/schemas/Product' },
                  quantity: { type: 'number', example: 2 },
                  price: { type: 'number', example: 199.99 },
                  total: { type: 'number', example: 399.98 }
                }
              }
            },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned', 'failed'],
              example: 'pending'
            },
            payment: {
              type: 'object',
              properties: {
                method: { type: 'string', example: 'stripe' },
                status: { type: 'string', example: 'completed' },
                amount: {
                  type: 'object',
                  properties: {
                    subtotal: { type: 'number', example: 399.98 },
                    tax: { type: 'number', example: 32.00 },
                    shipping: { type: 'number', example: 9.99 },
                    total: { type: 'number', example: 441.97 }
                  }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        TrackingLog: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            trackingId: { type: 'string', example: 'TRK-1234567890' },
            order: { $ref: '#/components/schemas/Order' },
            carrier: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'ups' },
                trackingNumber: { type: 'string', example: '1Z999AA1234567890' }
              }
            },
            status: {
              type: 'object',
              properties: {
                current: { 
                  type: 'string', 
                  enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned', 'cancelled', 'delayed'],
                  example: 'in_transit'
                },
                lastUpdated: { type: 'string', format: 'date-time' }
              }
            },
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'in_transit' },
                  description: { type: 'string', example: 'Package is in transit' },
                  timestamp: { type: 'string', format: 'date-time' },
                  location: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Distribution Center' },
                      city: { type: 'string', example: 'New York' },
                      state: { type: 'string', example: 'NY' }
                    }
                  }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'ERROR_CODE' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email is required' }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 100 },
            pages: { type: 'number', example: 5 }
          }
        }
      },
      responses: {
        Success: {
          description: 'Success response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Operation completed successfully' },
                  data: { type: 'object' }
                }
              }
            }
          }
        },
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFound: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] },
      { apiKeyAuth: [] }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Products',
        description: 'Product management operations'
      },
      {
        name: 'Orders',
        description: 'Order management operations'
      },
      {
        name: 'Tracking',
        description: 'Package tracking operations'
      },
      {
        name: 'Webhooks',
        description: 'Webhook endpoints for external integrations'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJSDoc(options);

module.exports = {
  specs,
  swaggerUi,
  options
};
