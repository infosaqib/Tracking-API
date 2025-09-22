const Order = require('../models/Order');
const Product = require('../models/Product');
const TrackingLog = require('../models/TrackingLog');
const ProductService = require('./ProductService');
const PaymentService = require('./PaymentService');
const logger = require('../config/logger');

class OrderService {
  /**
   * Create a new order
   */
  async createOrder(orderData, customerId) {
    try {
      // Validate products and calculate totals
      const { items, totals } = await this.validateAndCalculateOrder(orderData.items);

      // Create order
      const order = new Order({
        customer: customerId,
        items,
        shipping: orderData.shipping,
        billing: orderData.billing,
        payment: {
          method: orderData.payment.method,
          amount: totals
        },
        notes: orderData.notes
      });

      // Reserve inventory for all items
      for (const item of items) {
        await ProductService.reserveInventory(
          item.product._id,
          item.quantity,
          order._id,
          customerId
        );
      }

      await order.save();

      // Process payment
      const paymentResult = await PaymentService.processPayment({
        orderId: order._id,
        amount: totals.total,
        currency: totals.currency,
        method: orderData.payment.method,
        customerId
      });

      // Update order with payment result
      order.payment.status = paymentResult.status;
      order.payment.transactionId = paymentResult.transactionId;
      order.payment.gatewayResponse = paymentResult.gatewayResponse;

      if (paymentResult.status === 'completed') {
        order.status = 'confirmed';
        order.payment.paidAt = new Date();
      }

      await order.save();

      // Create tracking log
      await this.createTrackingLog(order._id);

      logger.info('Order created successfully', { 
        orderId: order._id, 
        customerId, 
        total: totals.total 
      });

      return order;
    } catch (error) {
      logger.error('Create order error:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId, userId, userRole = 'buyer') {
    try {
      const order = await Order.findById(orderId)
        .populate('customer', 'firstName lastName email')
        .populate('items.product', 'name sku price images')
        .populate('items.variant', 'name sku price');

      if (!order) {
        throw new Error('Order not found');
      }

      // Check access permissions
      if (userRole !== 'admin' && order.customer._id.toString() !== userId.toString()) {
        throw new Error('Not authorized to view this order');
      }

      return order;
    } catch (error) {
      logger.error('Get order error:', error);
      throw error;
    }
  }

  /**
   * Get orders with filters and pagination
   */
  async getOrders(filters = {}, pagination = {}, userId = null, userRole = 'buyer') {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'createdAt', 
        order = 'desc',
        status,
        paymentStatus,
        carrier,
        fromDate,
        toDate
      } = filters;

      const skip = (page - 1) * limit;
      const query = {};

      // Apply user-based filtering
      if (userRole !== 'admin' && userId) {
        query.customer = userId;
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // Payment status filter
      if (paymentStatus) {
        query['payment.status'] = paymentStatus;
      }

      // Carrier filter
      if (carrier) {
        query['shipping.carrier'] = carrier;
      }

      // Date range filter
      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate);
        if (toDate) query.createdAt.$lte = new Date(toDate);
      }

      // Sort options
      const sortOrder = order === 'desc' ? -1 : 1;
      let sortObj = { [sort]: sortOrder };

      // Special sorting for total
      if (sort === 'total') {
        sortObj = { 'payment.amount.total': sortOrder };
      }

      const orders = await Order.find(query)
        .populate('customer', 'firstName lastName email')
        .populate('items.product', 'name sku price images')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get orders error:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, notes, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const oldStatus = order.status;
      await order.updateStatus(status, notes, userId);

      // Handle status-specific logic
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        await this.cancelOrder(orderId);
      } else if (status === 'shipped' && oldStatus !== 'shipped') {
        await this.shipOrder(orderId);
      } else if (status === 'delivered' && oldStatus !== 'delivered') {
        await this.deliverOrder(orderId);
      }

      logger.info('Order status updated', { 
        orderId, 
        oldStatus, 
        newStatus: status, 
        userId 
      });

      return order;
    } catch (error) {
      logger.error('Update order status error:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (['delivered', 'cancelled'].includes(order.status)) {
        throw new Error('Cannot cancel order in current status');
      }

      // Release reserved inventory
      for (const item of order.items) {
        await ProductService.releaseInventory(
          item.product,
          item.quantity,
          orderId,
          order.customer
        );
      }

      // Process refund if payment was completed
      if (order.payment.status === 'completed') {
        const refundResult = await PaymentService.processRefund({
          orderId: order._id,
          amount: order.payment.amount.total,
          reason: 'Order cancelled'
        });

        order.payment.status = 'refunded';
        order.payment.refundedAt = new Date();
        order.payment.refundAmount = refundResult.amount;
      }

      order.status = 'cancelled';
      await order.save();

      logger.info('Order cancelled', { orderId });

      return order;
    } catch (error) {
      logger.error('Cancel order error:', error);
      throw error;
    }
  }

  /**
   * Ship order
   */
  async shipOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update inventory - convert reserved to outgoing
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product && product.inventory.trackQuantity) {
          product.inventory.reserved -= item.quantity;
          product.inventory.quantity -= item.quantity;
          await product.save();
        }
      }

      // Update tracking status
      const trackingLog = await TrackingLog.findOne({ order: orderId });
      if (trackingLog) {
        await trackingLog.addTimelineEvent({
          status: 'shipped',
          description: 'Order has been shipped',
          source: 'system'
        });
      }

      order.status = 'shipped';
      order.fulfillment.shippedAt = new Date();
      await order.save();

      logger.info('Order shipped', { orderId });

      return order;
    } catch (error) {
      logger.error('Ship order error:', error);
      throw error;
    }
  }

  /**
   * Deliver order
   */
  async deliverOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Update tracking status
      const trackingLog = await TrackingLog.findOne({ order: orderId });
      if (trackingLog) {
        await trackingLog.updateDelivery({
          date: new Date(),
          time: new Date().toTimeString().slice(0, 5)
        });
      }

      order.status = 'delivered';
      order.tracking.status = 'delivered';
      order.tracking.actualDelivery = new Date();
      order.shipping.actualDelivery = new Date();
      await order.save();

      logger.info('Order delivered', { orderId });

      return order;
    } catch (error) {
      logger.error('Deliver order error:', error);
      throw error;
    }
  }

  /**
   * Process return request
   */
  async processReturn(orderId, returnData, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order is eligible for return
      if (!['delivered', 'shipped'].includes(order.status)) {
        throw new Error('Order is not eligible for return');
      }

      // Check return window (e.g., 30 days)
      const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      if (order.createdAt < new Date(Date.now() - returnWindow)) {
        throw new Error('Return window has expired');
      }

      // Add return request
      order.returns.push({
        ...returnData,
        requestedAt: new Date()
      });

      await order.save();

      logger.info('Return request processed', { orderId, userId });

      return order;
    } catch (error) {
      logger.error('Process return error:', error);
      throw error;
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(filters = {}) {
    try {
      const { fromDate, toDate, groupBy = 'day' } = filters;
      
      const matchQuery = {};
      if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate);
      }

      const groupFormat = groupBy === 'day' ? '%Y-%m-%d' : 
                        groupBy === 'month' ? '%Y-%m' : '%Y';

      const analytics = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $dateToString: { format: groupFormat, date: '$createdAt' }
            },
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$payment.amount.total' },
            averageOrderValue: { $avg: '$payment.amount.total' },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return analytics;
    } catch (error) {
      logger.error('Get order analytics error:', error);
      throw error;
    }
  }

  /**
   * Validate and calculate order
   */
  async validateAndCalculateOrder(items) {
    try {
      const validatedItems = [];
      let subtotal = 0;

      for (const itemData of items) {
        const product = await Product.findById(itemData.product);
        if (!product) {
          throw new Error(`Product not found: ${itemData.product}`);
        }

        if (product.status !== 'active') {
          throw new Error(`Product is not available: ${product.name}`);
        }

        // Check inventory
        if (product.inventory.trackQuantity) {
          const availableQuantity = product.availableQuantity;
          if (availableQuantity < itemData.quantity) {
            throw new Error(`Insufficient inventory for ${product.name}. Available: ${availableQuantity}`);
          }
        }

        // Calculate item total
        const itemPrice = product.price.current;
        const itemTotal = itemPrice * itemData.quantity;

        validatedItems.push({
          product: product._id,
          variant: itemData.variant,
          quantity: itemData.quantity,
          price: itemPrice,
          total: itemTotal,
          attributes: itemData.attributes || []
        });

        subtotal += itemTotal;
      }

      // Calculate totals
      const tax = subtotal * 0.1; // 10% tax - should be configurable
      const shipping = 0; // Free shipping for now
      const discount = 0; // No discount for now
      const total = subtotal + tax + shipping - discount;

      return {
        items: validatedItems,
        totals: {
          subtotal,
          tax,
          shipping,
          discount,
          total,
          currency: 'USD'
        }
      };
    } catch (error) {
      logger.error('Validate order error:', error);
      throw error;
    }
  }

  /**
   * Create tracking log for order
   */
  async createTrackingLog(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const trackingLog = new TrackingLog({
        order: orderId,
        carrier: {
          name: order.shipping.carrier || 'local',
          trackingNumber: order.tracking.carrierTrackingNumber || order.tracking.trackingId
        },
        estimatedDelivery: order.shipping.estimatedDelivery
      });

      await trackingLog.save();

      // Update order with tracking ID
      order.tracking.trackingId = trackingLog.trackingId;
      await order.save();

      logger.info('Tracking log created', { orderId, trackingId: trackingLog.trackingId });

      return trackingLog;
    } catch (error) {
      logger.error('Create tracking log error:', error);
      throw error;
    }
  }

  /**
   * Get order by tracking ID
   */
  async getOrderByTrackingId(trackingId) {
    try {
      const trackingLog = await TrackingLog.findOne({ trackingId })
        .populate('order')
        .populate({
          path: 'order',
          populate: {
            path: 'customer',
            select: 'firstName lastName email'
          }
        });

      if (!trackingLog) {
        throw new Error('Tracking not found');
      }

      return {
        tracking: trackingLog,
        order: trackingLog.order
      };
    } catch (error) {
      logger.error('Get order by tracking ID error:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();
