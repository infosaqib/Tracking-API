const TrackingService = require('../services/TrackingService');
const OrderService = require('../services/OrderService');
const logger = require('../config/logger');

class WebhookController {
  /**
   * Handle carrier webhook updates
   */
  async handleCarrierWebhook(req, res) {
    try {
      const { carrier, trackingNumber, status, description, location, timestamp } = req.body;

      if (!carrier || !trackingNumber || !status) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: carrier, trackingNumber, status',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Find tracking by carrier tracking number
      const tracking = await TrackingService.getTrackingByCarrier(carrier, trackingNumber);
      
      if (!tracking) {
        logger.warn('Tracking not found for carrier webhook', { carrier, trackingNumber });
        return res.status(404).json({
          success: false,
          message: 'Tracking not found',
          code: 'TRACKING_NOT_FOUND'
        });
      }

      // Add tracking event
      const eventData = {
        status,
        description: description || `Status updated by ${carrier}`,
        location: location ? {
          name: location.name || '',
          address: location.address || {},
          coordinates: location.coordinates || {}
        } : undefined,
        source: 'webhook',
        details: {
          carrier,
          trackingNumber,
          timestamp: timestamp || new Date().toISOString()
        }
      };

      await TrackingService.addTrackingEvent(tracking.trackingId, eventData);

      logger.info('Carrier webhook processed successfully', {
        carrier,
        trackingNumber,
        trackingId: tracking.trackingId,
        status
      });

      res.json({
        success: true,
        message: 'Webhook processed successfully',
        trackingId: tracking.trackingId
      });
    } catch (error) {
      logger.error('Carrier webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        code: 'WEBHOOK_PROCESSING_FAILED'
      });
    }
  }

  /**
   * Handle UPS webhook
   */
  async handleUPSWebhook(req, res) {
    try {
      const { trackingNumber, status, description, location, timestamp } = req.body;

      // Transform UPS data to standard format
      const webhookData = {
        carrier: 'ups',
        trackingNumber,
        status: this.mapUPSStatus(status),
        description: description || `UPS: ${status}`,
        location: location ? {
          name: location.facilityName || '',
          address: {
            city: location.city || '',
            state: location.state || '',
            zipCode: location.postalCode || '',
            country: location.country || ''
          }
        } : undefined,
        timestamp
      };

      return await this.handleCarrierWebhook({ body: webhookData }, res);
    } catch (error) {
      logger.error('UPS webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'UPS webhook processing failed',
        code: 'UPS_WEBHOOK_FAILED'
      });
    }
  }

  /**
   * Handle FedEx webhook
   */
  async handleFedExWebhook(req, res) {
    try {
      const { trackingNumber, status, description, location, timestamp } = req.body;

      // Transform FedEx data to standard format
      const webhookData = {
        carrier: 'fedex',
        trackingNumber,
        status: this.mapFedExStatus(status),
        description: description || `FedEx: ${status}`,
        location: location ? {
          name: location.city || '',
          address: {
            city: location.city || '',
            state: location.stateOrProvinceCode || '',
            zipCode: location.postalCode || '',
            country: location.countryCode || ''
          }
        } : undefined,
        timestamp
      };

      return await this.handleCarrierWebhook({ body: webhookData }, res);
    } catch (error) {
      logger.error('FedEx webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'FedEx webhook processing failed',
        code: 'FEDEX_WEBHOOK_FAILED'
      });
    }
  }

  /**
   * Handle DHL webhook
   */
  async handleDHLWebhook(req, res) {
    try {
      const { trackingNumber, status, description, location, timestamp } = req.body;

      // Transform DHL data to standard format
      const webhookData = {
        carrier: 'dhl',
        trackingNumber,
        status: this.mapDHLStatus(status),
        description: description || `DHL: ${status}`,
        location: location ? {
          name: location.name || '',
          address: {
            city: location.city || '',
            state: location.state || '',
            zipCode: location.postalCode || '',
            country: location.country || ''
          }
        } : undefined,
        timestamp
      };

      return await this.handleCarrierWebhook({ body: webhookData }, res);
    } catch (error) {
      logger.error('DHL webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'DHL webhook processing failed',
        code: 'DHL_WEBHOOK_FAILED'
      });
    }
  }

  /**
   * Handle payment webhook
   */
  async handlePaymentWebhook(req, res) {
    try {
      const { orderId, status, transactionId, amount, currency } = req.body;

      if (!orderId || !status) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: orderId, status',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Update order payment status
      const order = await OrderService.getOrderById(orderId, null, 'admin');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        });
      }

      // Update payment status
      order.payment.status = status;
      order.payment.transactionId = transactionId;
      
      if (status === 'completed') {
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
      } else if (status === 'failed') {
        order.status = 'failed';
      }

      await order.save();

      logger.info('Payment webhook processed successfully', {
        orderId,
        status,
        transactionId
      });

      res.json({
        success: true,
        message: 'Payment webhook processed successfully'
      });
    } catch (error) {
      logger.error('Payment webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Payment webhook processing failed',
        code: 'PAYMENT_WEBHOOK_FAILED'
      });
    }
  }

  /**
   * Handle inventory webhook
   */
  async handleInventoryWebhook(req, res) {
    try {
      const { productId, warehouseId, quantity, operation, reason } = req.body;

      if (!productId || !warehouseId || quantity === undefined || !operation) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: productId, warehouseId, quantity, operation',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Import ProductService here to avoid circular dependency
      const ProductService = require('../services/ProductService');

      // Update inventory
      await ProductService.updateInventory(
        productId,
        warehouseId,
        quantity,
        operation,
        'webhook'
      );

      logger.info('Inventory webhook processed successfully', {
        productId,
        warehouseId,
        quantity,
        operation
      });

      res.json({
        success: true,
        message: 'Inventory webhook processed successfully'
      });
    } catch (error) {
      logger.error('Inventory webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Inventory webhook processing failed',
        code: 'INVENTORY_WEBHOOK_FAILED'
      });
    }
  }

  /**
   * Map UPS status to standard status
   */
  mapUPSStatus(upsStatus) {
    const statusMap = {
      'IN_TRANSIT': 'in_transit',
      'DELIVERED': 'delivered',
      'EXCEPTION': 'exception',
      'PICKED_UP': 'picked_up',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'RETURNED': 'returned',
      'CANCELLED': 'cancelled'
    };

    return statusMap[upsStatus] || 'pending';
  }

  /**
   * Map FedEx status to standard status
   */
  mapFedExStatus(fedexStatus) {
    const statusMap = {
      'IN_TRANSIT': 'in_transit',
      'DELIVERED': 'delivered',
      'EXCEPTION': 'exception',
      'PICKED_UP': 'picked_up',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'RETURNED': 'returned',
      'CANCELLED': 'cancelled'
    };

    return statusMap[fedexStatus] || 'pending';
  }

  /**
   * Map DHL status to standard status
   */
  mapDHLStatus(dhlStatus) {
    const statusMap = {
      'IN_TRANSIT': 'in_transit',
      'DELIVERED': 'delivered',
      'EXCEPTION': 'exception',
      'PICKED_UP': 'picked_up',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'RETURNED': 'returned',
      'CANCELLED': 'cancelled'
    };

    return statusMap[dhlStatus] || 'pending';
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(req, res) {
    try {
      const { type, data } = req.body;

      logger.info('Test webhook received', { type, data });

      res.json({
        success: true,
        message: 'Test webhook received successfully',
        type,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Test webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Test webhook processing failed',
        code: 'TEST_WEBHOOK_FAILED'
      });
    }
  }
}

module.exports = new WebhookController();
