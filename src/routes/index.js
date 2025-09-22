const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const productRoutes = require('./products');
const orderRoutes = require('./orders');
const trackingRoutes = require('./tracking');
const webhookRoutes = require('./webhooks');
const monitoringRoutes = require('./monitoring');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      tracking: '/api/v1/tracking',
      webhooks: '/api/v1/webhooks',
      monitoring: '/api/v1/monitoring'
    },
    documentation: 'https://docs.trackingapi.com'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/tracking', trackingRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/monitoring', monitoringRoutes);

module.exports = router;
