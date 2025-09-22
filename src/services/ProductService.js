const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const logger = require('../config/logger');

class ProductService {
  /**
   * Create a new product
   */
  async createProduct(productData, sellerId) {
    try {
      // Verify category exists
      const category = await Category.findById(productData.category);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if SKU already exists
      const existingProduct = await Product.findOne({ sku: productData.sku });
      if (existingProduct) {
        throw new Error('Product with this SKU already exists');
      }

      // Create product
      const product = new Product({
        ...productData,
        seller: sellerId
      });

      await product.save();

      // Create inventory entry if warehouse is specified
      if (productData.warehouse) {
        await this.createInventoryEntry(product._id, productData.warehouse, productData.inventory);
      }

      logger.info('Product created successfully', { 
        productId: product._id, 
        sellerId, 
        sku: product.sku 
      });

      return product;
    } catch (error) {
      logger.error('Create product error:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId, includeInactive = false) {
    try {
      const query = { _id: productId };
      if (!includeInactive) {
        query.status = 'active';
      }

      const product = await Product.findOne(query)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('seller', 'firstName lastName email');

      if (!product) {
        throw new Error('Product not found');
      }

      return product;
    } catch (error) {
      logger.error('Get product error:', error);
      throw error;
    }
  }

  /**
   * Get products with filters and pagination
   */
  async getProducts(filters = {}, pagination = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'createdAt', 
        order = 'desc',
        search,
        category,
        subcategory,
        brand,
        minPrice,
        maxPrice,
        inStock,
        status,
        tags,
        seller
      } = filters;

      const skip = (page - 1) * limit;
      const query = {};

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
          { brand: { $regex: search, $options: 'i' } }
        ];
      }

      // Category filter
      if (category) {
        query.category = category;
      }

      // Subcategory filter
      if (subcategory) {
        query.subcategory = subcategory;
      }

      // Brand filter
      if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        query['price.current'] = {};
        if (minPrice !== undefined) {
          query['price.current'].$gte = minPrice;
        }
        if (maxPrice !== undefined) {
          query['price.current'].$lte = maxPrice;
        }
      }

      // Stock filter
      if (inStock !== undefined) {
        if (inStock) {
          query.$or = [
            { 'inventory.trackQuantity': false },
            { $expr: { $gt: [{ $subtract: ['$inventory.quantity', '$inventory.reserved'] }, 0] } }
          ];
        } else {
          query.$and = [
            { 'inventory.trackQuantity': true },
            { $expr: { $lte: [{ $subtract: ['$inventory.quantity', '$inventory.reserved'] }, 0] } }
          ];
        }
      }

      // Status filter
      if (status) {
        query.status = status;
      } else {
        query.status = 'active';
      }

      // Tags filter
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        query.tags = { $in: tagArray.map(tag => tag.toLowerCase().trim()) };
      }

      // Seller filter
      if (seller) {
        query.seller = seller;
      }

      // Sort options
      const sortOrder = order === 'desc' ? -1 : 1;
      let sortObj = { [sort]: sortOrder };

      // Special sorting for price
      if (sort === 'price') {
        sortObj = { 'price.current': sortOrder };
      }

      const products = await Product.find(query)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('seller', 'firstName lastName email')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      const total = await Product.countDocuments(query);

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get products error:', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId, updateData, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check ownership or admin
      if (product.seller.toString() !== userId.toString()) {
        throw new Error('Not authorized to update this product');
      }

      // Update allowed fields
      const allowedFields = [
        'name', 'description', 'shortDescription', 'brand', 'price',
        'images', 'attributes', 'inventory', 'dimensions', 'tags',
        'status', 'visibility', 'seo'
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          product[field] = updateData[field];
        }
      }

      await product.save();

      logger.info('Product updated successfully', { productId, userId });

      return product;
    } catch (error) {
      logger.error('Update product error:', error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(productId, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check ownership or admin
      if (product.seller.toString() !== userId.toString()) {
        throw new Error('Not authorized to delete this product');
      }

      // Soft delete by changing status
      product.status = 'archived';
      await product.save();

      logger.info('Product deleted successfully', { productId, userId });

      return { message: 'Product deleted successfully' };
    } catch (error) {
      logger.error('Delete product error:', error);
      throw error;
    }
  }

  /**
   * Update product inventory
   */
  async updateInventory(productId, warehouseId, quantity, operation = 'set', userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check ownership or admin
      if (product.seller.toString() !== userId.toString()) {
        throw new Error('Not authorized to update this product');
      }

      await product.updateInventory(quantity, operation);

      // Update inventory record if warehouse is specified
      if (warehouseId) {
        const inventory = await Inventory.findOne({ 
          product: productId, 
          warehouse: warehouseId 
        });

        if (inventory) {
          await inventory.adjust(quantity, `Product inventory update - ${operation}`, userId);
        }
      }

      logger.info('Product inventory updated', { 
        productId, 
        warehouseId, 
        quantity, 
        operation, 
        userId 
      });

      return product;
    } catch (error) {
      logger.error('Update inventory error:', error);
      throw error;
    }
  }

  /**
   * Reserve product inventory
   */
  async reserveInventory(productId, quantity, orderId, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.inventory.trackQuantity) {
        return { success: true, message: 'Inventory tracking disabled' };
      }

      await product.reserveInventory(quantity);

      logger.info('Product inventory reserved', { 
        productId, 
        quantity, 
        orderId, 
        userId 
      });

      return { success: true, message: 'Inventory reserved successfully' };
    } catch (error) {
      logger.error('Reserve inventory error:', error);
      throw error;
    }
  }

  /**
   * Release product inventory
   */
  async releaseInventory(productId, quantity, orderId, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.inventory.trackQuantity) {
        return { success: true, message: 'Inventory tracking disabled' };
      }

      await product.releaseInventory(quantity);

      logger.info('Product inventory released', { 
        productId, 
        quantity, 
        orderId, 
        userId 
      });

      return { success: true, message: 'Inventory released successfully' };
    } catch (error) {
      logger.error('Release inventory error:', error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(sellerId = null) {
    try {
      const query = {
        'inventory.trackQuantity': true,
        $expr: {
          $lte: [
            { $subtract: ['$inventory.quantity', '$inventory.reserved'] },
            '$inventory.lowStockThreshold'
          ]
        }
      };

      if (sellerId) {
        query.seller = sellerId;
      }

      const products = await Product.find(query)
        .populate('category', 'name')
        .populate('seller', 'firstName lastName email');

      return products;
    } catch (error) {
      logger.error('Get low stock products error:', error);
      throw error;
    }
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(productId, dateRange = {}) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const { fromDate, toDate } = dateRange;
      const matchQuery = { 'items.product': productId };

      if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate);
      }

      // Import Order model here to avoid circular dependency
      const Order = require('../models/Order');

      const analytics = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$payment.amount.total' },
            averageOrderValue: { $avg: '$payment.amount.total' }
          }
        }
      ]);

      return {
        product: {
          id: product._id,
          name: product.name,
          sku: product.sku
        },
        analytics: analytics[0] || {
          totalOrders: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        }
      };
    } catch (error) {
      logger.error('Get product analytics error:', error);
      throw error;
    }
  }

  /**
   * Sync product to external channels
   */
  async syncToChannels(productId, channels, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check ownership or admin
      if (product.seller.toString() !== userId.toString()) {
        throw new Error('Not authorized to sync this product');
      }

      const syncResults = [];

      for (const channel of channels) {
        try {
          // TODO: Implement actual channel sync logic
          // This would integrate with external APIs like Amazon, eBay, etc.
          
          const channelData = {
            name: channel,
            externalId: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isActive: true,
            lastSync: new Date(),
            syncStatus: 'synced'
          };

          // Update or add channel info
          const existingChannel = product.channels.find(c => c.name === channel);
          if (existingChannel) {
            Object.assign(existingChannel, channelData);
          } else {
            product.channels.push(channelData);
          }

          syncResults.push({
            channel,
            status: 'success',
            externalId: channelData.externalId
          });
        } catch (channelError) {
          logger.error(`Channel sync error for ${channel}:`, channelError);
          syncResults.push({
            channel,
            status: 'error',
            error: channelError.message
          });
        }
      }

      await product.save();

      logger.info('Product synced to channels', { 
        productId, 
        channels, 
        userId, 
        results: syncResults 
      });

      return syncResults;
    } catch (error) {
      logger.error('Sync to channels error:', error);
      throw error;
    }
  }

  /**
   * Create inventory entry
   */
  async createInventoryEntry(productId, warehouseId, inventoryData = {}) {
    try {
      const inventory = new Inventory({
        product: productId,
        warehouse: warehouseId,
        quantity: {
          available: inventoryData.quantity || 0,
          reserved: 0
        },
        thresholds: {
          lowStock: inventoryData.lowStockThreshold || 10,
          highStock: inventoryData.highStockThreshold || 1000,
          reorderPoint: inventoryData.reorderPoint || 5,
          reorderQuantity: inventoryData.reorderQuantity || 50
        }
      });

      await inventory.save();

      logger.info('Inventory entry created', { productId, warehouseId });

      return inventory;
    } catch (error) {
      logger.error('Create inventory entry error:', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query, filters = {}) {
    try {
      const searchQuery = {
        $text: { $search: query },
        status: 'active'
      };

      // Apply additional filters
      if (filters.category) {
        searchQuery.category = filters.category;
      }

      if (filters.brand) {
        searchQuery.brand = { $regex: filters.brand, $options: 'i' };
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        searchQuery['price.current'] = {};
        if (filters.minPrice !== undefined) {
          searchQuery['price.current'].$gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          searchQuery['price.current'].$lte = filters.maxPrice;
        }
      }

      const products = await Product.find(searchQuery)
        .populate('category', 'name slug')
        .populate('seller', 'firstName lastName')
        .sort({ score: { $meta: 'textScore' } })
        .limit(filters.limit || 20);

      return products;
    } catch (error) {
      logger.error('Search products error:', error);
      throw error;
    }
  }
}

module.exports = new ProductService();
