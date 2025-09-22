const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validate, productSchemas, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.get('/', 
  optionalAuth,
  ProductController.getProducts
);

router.get('/search', 
  ProductController.searchProducts
);

router.get('/featured', 
  ProductController.getFeaturedProducts
);

router.get('/sku/:sku', 
  ProductController.getProductBySku
);

router.get('/slug/:slug', 
  ProductController.getProductBySlug
);

router.get('/:id', 
  optionalAuth,
  ProductController.getProductById
);

router.get('/:id/related', 
  ProductController.getRelatedProducts
);

// Protected routes
router.use(authenticate);

router.post('/', 
  authorize('seller', 'admin'),
  validate(productSchemas.create, 'body'),
  ProductController.createProduct
);

router.put('/:id', 
  authorize('seller', 'admin'),
  validate(productSchemas.update, 'body'),
  ProductController.updateProduct
);

router.delete('/:id', 
  authorize('seller', 'admin'),
  ProductController.deleteProduct
);

router.put('/:id/inventory', 
  authorize('seller', 'admin'),
  ProductController.updateInventory
);

router.post('/:id/reserve', 
  ProductController.reserveInventory
);

router.post('/:id/release', 
  ProductController.releaseInventory
);

router.get('/:id/analytics', 
  authorize('seller', 'admin'),
  ProductController.getProductAnalytics
);

router.post('/:id/sync', 
  authorize('seller', 'admin'),
  ProductController.syncToChannels
);

// Admin routes
router.get('/low-stock/all', 
  authorize('admin'),
  ProductController.getLowStockProducts
);

// Seller routes
router.get('/low-stock/mine', 
  authorize('seller'),
  ProductController.getLowStockProducts
);

module.exports = router;
