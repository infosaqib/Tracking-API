const TrackingLog = require('../models/TrackingLog');
const Order = require('../models/Order');
const logger = require('../config/logger');
const config = require('../config');

class TrackingService {
  /**
   * Create tracking log
   */
  async createTracking(trackingData) {
    try {
      const trackingLog = new TrackingLog(trackingData);
      await trackingLog.save();

      logger.info('Tracking log created', { 
        trackingId: trackingLog.trackingId, 
        orderId: trackingData.order 
      });

      return trackingLog;
    } catch (error) {
      logger.error('Create tracking error:', error);
      throw error;
    }
  }

  /**
   * Get tracking by ID
   */
  async getTrackingById(trackingId) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId)
        .populate('order')
        .populate({
          path: 'order',
          populate: {
            path: 'customer',
            select: 'firstName lastName email'
          }
        });

      if (!tracking) {
        throw new Error('Tracking not found');
      }

      return tracking;
    } catch (error) {
      logger.error('Get tracking error:', error);
      throw error;
    }
  }

  /**
   * Get tracking by carrier tracking number
   */
  async getTrackingByCarrier(carrierName, trackingNumber) {
    try {
      const tracking = await TrackingLog.findByCarrierTracking(carrierName, trackingNumber)
        .populate('order')
        .populate({
          path: 'order',
          populate: {
            path: 'customer',
            select: 'firstName lastName email'
          }
        });

      if (!tracking) {
        throw new Error('Tracking not found');
      }

      return tracking;
    } catch (error) {
      logger.error('Get tracking by carrier error:', error);
      throw error;
    }
  }

  /**
   * Add tracking event
   */
  async addTrackingEvent(trackingId, eventData) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId);
      if (!tracking) {
        throw new Error('Tracking not found');
      }

      await tracking.addTimelineEvent(eventData);

      // Send real-time notification
      await this.sendTrackingNotification(tracking, eventData);

      logger.info('Tracking event added', { 
        trackingId, 
        status: eventData.status 
      });

      return tracking;
    } catch (error) {
      logger.error('Add tracking event error:', error);
      throw error;
    }
  }

  /**
   * Update tracking status
   */
  async updateTrackingStatus(trackingId, status, description, location = null) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId);
      if (!tracking) {
        throw new Error('Tracking not found');
      }

      const eventData = {
        status,
        description,
        location,
        source: 'system'
      };

      await tracking.addTimelineEvent(eventData);

      // Update order status if needed
      await this.updateOrderStatusFromTracking(tracking, status);

      // Send notifications
      await this.sendTrackingNotification(tracking, eventData);

      logger.info('Tracking status updated', { 
        trackingId, 
        status 
      });

      return tracking;
    } catch (error) {
      logger.error('Update tracking status error:', error);
      throw error;
    }
  }

  /**
   * Get tracking timeline
   */
  async getTrackingTimeline(trackingId) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId);
      if (!tracking) {
        throw new Error('Tracking not found');
      }

      return {
        trackingId: tracking.trackingId,
        status: tracking.status.current,
        carrier: tracking.carrier,
        timeline: tracking.timeline,
        estimatedDelivery: tracking.delivery.estimated.date,
        actualDelivery: tracking.delivery.actual.date,
        isDelivered: tracking.isDelivered,
        hasExceptions: tracking.hasExceptions
      };
    } catch (error) {
      logger.error('Get tracking timeline error:', error);
      throw error;
    }
  }

  /**
   * Get tracking summary
   */
  async getTrackingSummary(trackingId) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId);
      if (!tracking) {
        throw new Error('Tracking not found');
      }

      return tracking.getStatusSummary();
    } catch (error) {
      logger.error('Get tracking summary error:', error);
      throw error;
    }
  }

  /**
   * Get all tracking logs with filters
   */
  async getTrackingLogs(filters = {}, pagination = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = 'createdAt', 
        order = 'desc',
        status,
        carrier,
        fromDate,
        toDate
      } = filters;

      const skip = (page - 1) * limit;
      const query = { isActive: true };

      // Status filter
      if (status) {
        query['status.current'] = status;
      }

      // Carrier filter
      if (carrier) {
        query['carrier.name'] = carrier;
      }

      // Date range filter
      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) query.createdAt.$gte = new Date(fromDate);
        if (toDate) query.createdAt.$lte = new Date(toDate);
      }

      // Sort options
      const sortOrder = order === 'desc' ? -1 : 1;
      const sortObj = { [sort]: sortOrder };

      const trackingLogs = await TrackingLog.find(query)
        .populate('order')
        .populate({
          path: 'order',
          populate: {
            path: 'customer',
            select: 'firstName lastName email'
          }
        })
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      const total = await TrackingLog.countDocuments(query);

      return {
        trackingLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get tracking logs error:', error);
      throw error;
    }
  }

  /**
   * Get delayed shipments
   */
  async getDelayedShipments() {
    try {
      const delayedShipments = await TrackingLog.findDelayed()
        .populate('order')
        .populate({
          path: 'order',
          populate: {
            path: 'customer',
            select: 'firstName lastName email'
          }
        });

      return delayedShipments;
    } catch (error) {
      logger.error('Get delayed shipments error:', error);
      throw error;
    }
  }

  /**
   * Add exception to tracking
   */
  async addException(trackingId, exceptionData) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId);
      if (!tracking) {
        throw new Error('Tracking not found');
      }

      await tracking.addException(exceptionData);

      // Send exception notification
      await this.sendExceptionNotification(tracking, exceptionData);

      logger.info('Exception added to tracking', { 
        trackingId, 
        type: exceptionData.type 
      });

      return tracking;
    } catch (error) {
      logger.error('Add exception error:', error);
      throw error;
    }
  }

  /**
   * Resolve exception
   */
  async resolveException(trackingId, exceptionId, resolution) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId);
      if (!tracking) {
        throw new Error('Tracking not found');
      }

      await tracking.resolveException(exceptionId, resolution);

      logger.info('Exception resolved', { 
        trackingId, 
        exceptionId 
      });

      return tracking;
    } catch (error) {
      logger.error('Resolve exception error:', error);
      throw error;
    }
  }

  /**
   * Calculate delivery predictions
   */
  async calculatePredictions(trackingId) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId);
      if (!tracking) {
        throw new Error('Tracking not found');
      }

      await tracking.calculatePredictions();

      logger.info('Predictions calculated', { trackingId });

      return tracking;
    } catch (error) {
      logger.error('Calculate predictions error:', error);
      throw error;
    }
  }

  /**
   * Get tracking analytics
   */
  async getTrackingAnalytics(filters = {}) {
    try {
      const { fromDate, toDate, carrier } = filters;
      
      const matchQuery = { isActive: true };
      if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate);
      }
      if (carrier) {
        matchQuery['carrier.name'] = carrier;
      }

      const analytics = await TrackingLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalShipments: { $sum: 1 },
            deliveredShipments: {
              $sum: { $cond: [{ $eq: ['$status.current', 'delivered'] }, 1, 0] }
            },
            inTransitShipments: {
              $sum: { $cond: [{ $in: ['$status.current', ['picked_up', 'in_transit', 'out_for_delivery']] }, 1, 0] }
            },
            delayedShipments: {
              $sum: { $cond: [{ $eq: ['$status.current', 'delayed'] }, 1, 0] }
            },
            exceptionShipments: {
              $sum: { $cond: [{ $eq: ['$status.current', 'exception'] }, 1, 0] }
            },
            averageTransitTime: { $avg: '$analytics.totalTransitTime' },
            averageSpeed: { $avg: '$analytics.averageSpeed' }
          }
        }
      ]);

      return analytics[0] || {
        totalShipments: 0,
        deliveredShipments: 0,
        inTransitShipments: 0,
        delayedShipments: 0,
        exceptionShipments: 0,
        averageTransitTime: 0,
        averageSpeed: 0
      };
    } catch (error) {
      logger.error('Get tracking analytics error:', error);
      throw error;
    }
  }

  /**
   * Update order status from tracking
   */
  async updateOrderStatusFromTracking(tracking, status) {
    try {
      const order = await Order.findById(tracking.order);
      if (!order) {
        return;
      }

      let orderStatus = order.status;

      switch (status) {
        case 'picked_up':
          if (orderStatus === 'confirmed') {
            orderStatus = 'processing';
          }
          break;
        case 'in_transit':
        case 'out_for_delivery':
          if (['confirmed', 'processing'].includes(orderStatus)) {
            orderStatus = 'shipped';
          }
          break;
        case 'delivered':
          orderStatus = 'delivered';
          break;
        case 'exception':
        case 'returned':
          orderStatus = 'failed';
          break;
      }

      if (orderStatus !== order.status) {
        await order.updateStatus(orderStatus, `Status updated from tracking: ${status}`);
      }
    } catch (error) {
      logger.error('Update order status from tracking error:', error);
    }
  }

  /**
   * Send tracking notification
   */
  async sendTrackingNotification(tracking, eventData) {
    try {
      // Add notification to tracking log
      await tracking.addNotification({
        type: 'email',
        message: `Your shipment status has been updated: ${eventData.description}`,
        status: 'pending'
      });

      // TODO: Implement actual notification sending (email, SMS, push)
      // This would integrate with notification services
      
      logger.info('Tracking notification sent', { 
        trackingId: tracking.trackingId, 
        status: eventData.status 
      });
    } catch (error) {
      logger.error('Send tracking notification error:', error);
    }
  }

  /**
   * Send exception notification
   */
  async sendExceptionNotification(tracking, exceptionData) {
    try {
      // Add notification to tracking log
      await tracking.addNotification({
        type: 'email',
        message: `Exception in your shipment: ${exceptionData.description}`,
        status: 'pending'
      });

      // TODO: Implement actual notification sending
      
      logger.info('Exception notification sent', { 
        trackingId: tracking.trackingId, 
        type: exceptionData.type 
      });
    } catch (error) {
      logger.error('Send exception notification error:', error);
    }
  }

  /**
   * Sync with carrier API
   */
  async syncWithCarrier(trackingId) {
    try {
      const tracking = await TrackingLog.findByTrackingId(trackingId);
      if (!tracking) {
        throw new Error('Tracking not found');
      }

      const carrierName = tracking.carrier.name;
      const trackingNumber = tracking.carrier.trackingNumber;

      // TODO: Implement actual carrier API integration
      // This would call external carrier APIs to get real-time updates
      
      logger.info('Carrier sync completed', { 
        trackingId, 
        carrier: carrierName 
      });

      return tracking;
    } catch (error) {
      logger.error('Sync with carrier error:', error);
      throw error;
    }
  }

  /**
   * Bulk update tracking status
   */
  async bulkUpdateStatus(updates) {
    try {
      const results = [];

      for (const update of updates) {
        try {
          const tracking = await TrackingLog.findByTrackingId(update.trackingId);
          if (tracking) {
            await tracking.addTimelineEvent({
              status: update.status,
              description: update.description,
              source: 'bulk_update'
            });
            results.push({ trackingId: update.trackingId, status: 'success' });
          } else {
            results.push({ trackingId: update.trackingId, status: 'error', error: 'Tracking not found' });
          }
        } catch (error) {
          results.push({ trackingId: update.trackingId, status: 'error', error: error.message });
        }
      }

      logger.info('Bulk tracking update completed', { 
        total: updates.length, 
        successful: results.filter(r => r.status === 'success').length 
      });

      return results;
    } catch (error) {
      logger.error('Bulk update tracking error:', error);
      throw error;
    }
  }
}

module.exports = new TrackingService();
