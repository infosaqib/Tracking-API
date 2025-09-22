const ProductService = require('../services/ProductService');
const { validate, productSchemas } = require('../middleware/validation');
const logger = require('../config/logger');

class ProductController {
  /**
   * Create a new product
   */
  async createProduct(req, res) {
    try {
      const product = await ProductService.createProduct(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      logger.error('Create product controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'CREATE_PRODUCT_FAILED'
      });
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const { includeInactive } = req.query;
      
      const product = await ProductService.getProductById(
        id, 
        includeInactive === 'true'
      );
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Get product controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'PRODUCT_NOT_FOUND'
      });
    }
  }

  /**
   * Get products with filters
   */
  async getProducts(req, res) {
    try {
      const filters = {
        search: req.query.search,
        category: req.query.category,
        subcategory: req.query.subcategory,
        brand: req.query.brand,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        inStock: req.query.inStock === 'true',
        status: req.query.status,
        tags: req.query.tags,
        seller: req.query.seller
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort || 'createdAt',
        order: req.query.order || 'desc'
      };

      const result = await ProductService.getProducts(filters, pagination);
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get products controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get products',
        code: 'GET_PRODUCTS_FAILED'
      });
    }
  }

  /**
   * Update product
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      
      const product = await ProductService.updateProduct(
        id, 
        req.body, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      logger.error('Update product controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'UPDATE_PRODUCT_FAILED'
      });
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      
      const result = await ProductService.deleteProduct(id, req.user.id);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Delete product controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'DELETE_PRODUCT_FAILED'
      });
    }
  }

  /**
   * Update product inventory
   */
  async updateInventory(req, res) {
    try {
      const { id } = req.params;
      const { warehouseId, quantity, operation = 'set' } = req.body;
      
      const product = await ProductService.updateInventory(
        id, 
        warehouseId, 
        quantity, 
        operation, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'Inventory updated successfully',
        data: product
      });
    } catch (error) {
      logger.error('Update inventory controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'UPDATE_INVENTORY_FAILED'
      });
    }
  }

  /**
   * Reserve product inventory
   */
  async reserveInventory(req, res) {
    try {
      const { id } = req.params;
      const { quantity, orderId } = req.body;
      
      const result = await ProductService.reserveInventory(
        id, 
        quantity, 
        orderId, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Reserve inventory controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'RESERVE_INVENTORY_FAILED'
      });
    }
  }

  /**
   * Release product inventory
   */
  async releaseInventory(req, res) {
    try {
      const { id } = req.params;
      const { quantity, orderId } = req.body;
      
      const result = await ProductService.releaseInventory(
        id, 
        quantity, 
        orderId, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Release inventory controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'RELEASE_INVENTORY_FAILED'
      });
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(req, res) {
    try {
      const sellerId = req.user.role === 'admin' ? req.query.seller : req.user.id;
      
      const products = await ProductService.getLowStockProducts(sellerId);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Get low stock products controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get low stock products',
        code: 'GET_LOW_STOCK_FAILED'
      });
    }
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { fromDate, toDate } = req.query;
      
      const analytics = await ProductService.getProductAnalytics(id, {
        fromDate,
        toDate
      });
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get product analytics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product analytics',
        code: 'GET_PRODUCT_ANALYTICS_FAILED'
      });
    }
  }

  /**
   * Sync product to channels
   */
  async syncToChannels(req, res) {
    try {
      const { id } = req.params;
      const { channels } = req.body;
      
      const results = await ProductService.syncToChannels(
        id, 
        channels, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'Product sync initiated',
        data: results
      });
    } catch (error) {
      logger.error('Sync to channels controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'SYNC_TO_CHANNELS_FAILED'
      });
    }
  }

  /**
   * Search products
   */
  async searchProducts(req, res) {
    try {
      const { q: query, category, brand, minPrice, maxPrice, limit } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
          code: 'MISSING_SEARCH_QUERY'
        });
      }

      const filters = {
        category,
        brand,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        limit: limit ? parseInt(limit) : 20
      };

      const products = await ProductService.searchProducts(query, filters);
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Search products controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        code: 'SEARCH_PRODUCTS_FAILED'
      });
    }
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(req, res) {
    try {
      const { sku } = req.params;
      
      const Product = require('../models/Product');
      const product = await Product.findOne({ sku: sku.toUpperCase() })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('seller', 'firstName lastName email');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Get product by SKU controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product',
        code: 'GET_PRODUCT_FAILED'
      });
    }
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(req, res) {
    try {
      const { slug } = req.params;
      
      const Product = require('../models/Product');
      const product = await Product.findOne({ 'seo.slug': slug })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('seller', 'firstName lastName email');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Get product by slug controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get product',
        code: 'GET_PRODUCT_FAILED'
      });
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const Product = require('../models/Product');
      const products = await Product.find({
        status: 'active',
        'analytics.rating.average': { $gte: 4.0 }
      })
        .populate('category', 'name slug')
        .populate('seller', 'firstName lastName')
        .sort({ 'analytics.rating.average': -1, 'analytics.purchases': -1 })
        .limit(parseInt(limit));
      
      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      logger.error('Get featured products controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get featured products',
        code: 'GET_FEATURED_PRODUCTS_FAILED'
      });
    }
  }

  /**
   * Get related products
   */
  async getRelatedProducts(req, res) {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;
      
      const Product = require('../models/Product');
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      const relatedProducts = await Product.find({
        _id: { $ne: id },
        category: product.category,
        status: 'active'
      })
        .populate('category', 'name slug')
        .populate('seller', 'firstName lastName')
        .sort({ 'analytics.rating.average': -1 })
        .limit(parseInt(limit));
      
      res.json({
        success: true,
        data: relatedProducts
      });
    } catch (error) {
      logger.error('Get related products controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get related products',
        code: 'GET_RELATED_PRODUCTS_FAILED'
      });
    }
  }
}

module.exports = new ProductController();
