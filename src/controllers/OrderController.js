const OrderService = require('../services/OrderService');
const { validate, orderSchemas } = require('../middleware/validation');
const logger = require('../config/logger');

class OrderController {
  /**
   * Create a new order
   */
  async createOrder(req, res) {
    try {
      const order = await OrderService.createOrder(req.body, req.user.id);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      logger.error('Create order controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'CREATE_ORDER_FAILED'
      });
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      
      const order = await OrderService.getOrderById(
        id, 
        req.user.id, 
        req.user.role
      );
      
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      logger.error('Get order controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'ORDER_NOT_FOUND'
      });
    }
  }

  /**
   * Get orders with filters
   */
  async getOrders(req, res) {
    try {
      const filters = {
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        carrier: req.query.carrier,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sort: req.query.sort || 'createdAt',
        order: req.query.order || 'desc'
      };

      const result = await OrderService.getOrders(
        filters, 
        pagination, 
        req.user.id, 
        req.user.role
      );
      
      res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get orders controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get orders',
        code: 'GET_ORDERS_FAILED'
      });
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      const order = await OrderService.updateOrderStatus(
        id, 
        status, 
        notes, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      logger.error('Update order status controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'UPDATE_ORDER_STATUS_FAILED'
      });
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      
      const order = await OrderService.cancelOrder(id);
      
      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      logger.error('Cancel order controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'CANCEL_ORDER_FAILED'
      });
    }
  }

  /**
   * Ship order
   */
  async shipOrder(req, res) {
    try {
      const { id } = req.params;
      
      const order = await OrderService.shipOrder(id);
      
      res.json({
        success: true,
        message: 'Order shipped successfully',
        data: order
      });
    } catch (error) {
      logger.error('Ship order controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'SHIP_ORDER_FAILED'
      });
    }
  }

  /**
   * Deliver order
   */
  async deliverOrder(req, res) {
    try {
      const { id } = req.params;
      
      const order = await OrderService.deliverOrder(id);
      
      res.json({
        success: true,
        message: 'Order delivered successfully',
        data: order
      });
    } catch (error) {
      logger.error('Deliver order controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'DELIVER_ORDER_FAILED'
      });
    }
  }

  /**
   * Process return request
   */
  async processReturn(req, res) {
    try {
      const { id } = req.params;
      
      const order = await OrderService.processReturn(
        id, 
        req.body, 
        req.user.id
      );
      
      res.json({
        success: true,
        message: 'Return request processed successfully',
        data: order
      });
    } catch (error) {
      logger.error('Process return controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'PROCESS_RETURN_FAILED'
      });
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(req, res) {
    try {
      const { fromDate, toDate, groupBy } = req.query;
      
      const analytics = await OrderService.getOrderAnalytics({
        fromDate,
        toDate,
        groupBy
      });
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get order analytics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order analytics',
        code: 'GET_ORDER_ANALYTICS_FAILED'
      });
    }
  }

  /**
   * Get order by tracking ID
   */
  async getOrderByTrackingId(req, res) {
    try {
      const { trackingId } = req.params;
      
      const result = await OrderService.getOrderByTrackingId(trackingId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get order by tracking ID controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'ORDER_NOT_FOUND'
      });
    }
  }

  /**
   * Get order timeline
   */
  async getOrderTimeline(req, res) {
    try {
      const { id } = req.params;
      
      const Order = require('../models/Order');
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Check access permissions
      if (req.user.role !== 'admin' && order.customer.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this order',
          code: 'ACCESS_DENIED'
        });
      }
      
      res.json({
        success: true,
        data: order.timeline
      });
    } catch (error) {
      logger.error('Get order timeline controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order timeline',
        code: 'GET_ORDER_TIMELINE_FAILED'
      });
    }
  }

  /**
   * Get order summary
   */
  async getOrderSummary(req, res) {
    try {
      const { id } = req.params;
      
      const Order = require('../models/Order');
      const order = await Order.findById(id)
        .populate('customer', 'firstName lastName email')
        .populate('items.product', 'name sku price images');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Check access permissions
      if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this order',
          code: 'ACCESS_DENIED'
        });
      }

      const summary = {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.payment.status,
        total: order.payment.amount.total,
        currency: order.payment.currency,
        customer: order.customer,
        items: order.items,
        shipping: order.shipping,
        tracking: order.tracking,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Get order summary controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order summary',
        code: 'GET_ORDER_SUMMARY_FAILED'
      });
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      
      const Order = require('../models/Order');
      const matchQuery = {};
      
      if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate);
      }

      // Add user filter for non-admin users
      if (req.user.role !== 'admin') {
        matchQuery.customer = req.user.id;
      }

      const stats = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$payment.amount.total' },
            averageOrderValue: { $avg: '$payment.amount.total' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            confirmedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            shippedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
            },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            },
            cancelledOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
      };
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get order statistics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get order statistics',
        code: 'GET_ORDER_STATISTICS_FAILED'
      });
    }
  }

  /**
   * Export orders
   */
  async exportOrders(req, res) {
    try {
      const { format = 'csv', fromDate, toDate, status } = req.query;
      
      const filters = { fromDate, toDate, status };
      const pagination = { page: 1, limit: 10000 }; // Large limit for export
      
      const result = await OrderService.getOrders(
        filters, 
        pagination, 
        req.user.id, 
        req.user.role
      );

      // TODO: Implement actual export logic based on format
      // For now, just return the data
      res.json({
        success: true,
        message: 'Orders exported successfully',
        data: result.orders,
        count: result.orders.length
      });
    } catch (error) {
      logger.error('Export orders controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export orders',
        code: 'EXPORT_ORDERS_FAILED'
      });
    }
  }
}

module.exports = new OrderController();
