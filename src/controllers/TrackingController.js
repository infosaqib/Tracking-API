const TrackingService = require('../services/TrackingService');
const { validate, trackingSchemas } = require('../middleware/validation');
const logger = require('../config/logger');

class TrackingController {
  /**
   * Create tracking log
   */
  async createTracking(req, res) {
    try {
      const tracking = await TrackingService.createTracking(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Tracking created successfully',
        data: tracking
      });
    } catch (error) {
      logger.error('Create tracking controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'CREATE_TRACKING_FAILED'
      });
    }
  }

  /**
   * Get tracking by ID
   */
  async getTrackingById(req, res) {
    try {
      const { trackingId } = req.params;
      
      const tracking = await TrackingService.getTrackingById(trackingId);
      
      res.json({
        success: true,
        data: tracking
      });
    } catch (error) {
      logger.error('Get tracking controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'TRACKING_NOT_FOUND'
      });
    }
  }

  /**
   * Get tracking by carrier tracking number
   */
  async getTrackingByCarrier(req, res) {
    try {
      const { carrier, trackingNumber } = req.params;
      
      const tracking = await TrackingService.getTrackingByCarrier(carrier, trackingNumber);
      
      res.json({
        success: true,
        data: tracking
      });
    } catch (error) {
      logger.error('Get tracking by carrier controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'TRACKING_NOT_FOUND'
      });
    }
  }

  /**
   * Add tracking event
   */
  async addTrackingEvent(req, res) {
    try {
      const { trackingId } = req.params;
      
      const tracking = await TrackingService.addTrackingEvent(trackingId, req.body);
      
      res.json({
        success: true,
        message: 'Tracking event added successfully',
        data: tracking
      });
    } catch (error) {
      logger.error('Add tracking event controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'ADD_TRACKING_EVENT_FAILED'
      });
    }
  }

  /**
   * Update tracking status
   */
  async updateTrackingStatus(req, res) {
    try {
      const { trackingId } = req.params;
      const { status, description, location } = req.body;
      
      const tracking = await TrackingService.updateTrackingStatus(
        trackingId, 
        status, 
        description, 
        location
      );
      
      res.json({
        success: true,
        message: 'Tracking status updated successfully',
        data: tracking
      });
    } catch (error) {
      logger.error('Update tracking status controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'UPDATE_TRACKING_STATUS_FAILED'
      });
    }
  }

  /**
   * Get tracking timeline
   */
  async getTrackingTimeline(req, res) {
    try {
      const { trackingId } = req.params;
      
      const timeline = await TrackingService.getTrackingTimeline(trackingId);
      
      res.json({
        success: true,
        data: timeline
      });
    } catch (error) {
      logger.error('Get tracking timeline controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'TRACKING_NOT_FOUND'
      });
    }
  }

  /**
   * Get tracking summary
   */
  async getTrackingSummary(req, res) {
    try {
      const { trackingId } = req.params;
      
      const summary = await TrackingService.getTrackingSummary(trackingId);
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Get tracking summary controller error:', error);
      res.status(404).json({
        success: false,
        message: error.message,
        code: 'TRACKING_NOT_FOUND'
      });
    }
  }

  /**
   * Get all tracking logs
   */
  async getTrackingLogs(req, res) {
    try {
      const filters = {
        status: req.query.status,
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

      const result = await TrackingService.getTrackingLogs(filters, pagination);
      
      res.json({
        success: true,
        data: result.trackingLogs,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get tracking logs controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tracking logs',
        code: 'GET_TRACKING_LOGS_FAILED'
      });
    }
  }

  /**
   * Get delayed shipments
   */
  async getDelayedShipments(req, res) {
    try {
      const shipments = await TrackingService.getDelayedShipments();
      
      res.json({
        success: true,
        data: shipments
      });
    } catch (error) {
      logger.error('Get delayed shipments controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get delayed shipments',
        code: 'GET_DELAYED_SHIPMENTS_FAILED'
      });
    }
  }

  /**
   * Add exception to tracking
   */
  async addException(req, res) {
    try {
      const { trackingId } = req.params;
      
      const tracking = await TrackingService.addException(trackingId, req.body);
      
      res.json({
        success: true,
        message: 'Exception added successfully',
        data: tracking
      });
    } catch (error) {
      logger.error('Add exception controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'ADD_EXCEPTION_FAILED'
      });
    }
  }

  /**
   * Resolve exception
   */
  async resolveException(req, res) {
    try {
      const { trackingId, exceptionId } = req.params;
      const { resolution } = req.body;
      
      const tracking = await TrackingService.resolveException(
        trackingId, 
        exceptionId, 
        resolution
      );
      
      res.json({
        success: true,
        message: 'Exception resolved successfully',
        data: tracking
      });
    } catch (error) {
      logger.error('Resolve exception controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'RESOLVE_EXCEPTION_FAILED'
      });
    }
  }

  /**
   * Calculate delivery predictions
   */
  async calculatePredictions(req, res) {
    try {
      const { trackingId } = req.params;
      
      const tracking = await TrackingService.calculatePredictions(trackingId);
      
      res.json({
        success: true,
        message: 'Predictions calculated successfully',
        data: tracking.predictions
      });
    } catch (error) {
      logger.error('Calculate predictions controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'CALCULATE_PREDICTIONS_FAILED'
      });
    }
  }

  /**
   * Get tracking analytics
   */
  async getTrackingAnalytics(req, res) {
    try {
      const { fromDate, toDate, carrier } = req.query;
      
      const analytics = await TrackingService.getTrackingAnalytics({
        fromDate,
        toDate,
        carrier
      });
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get tracking analytics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tracking analytics',
        code: 'GET_TRACKING_ANALYTICS_FAILED'
      });
    }
  }

  /**
   * Sync with carrier API
   */
  async syncWithCarrier(req, res) {
    try {
      const { trackingId } = req.params;
      
      const tracking = await TrackingService.syncWithCarrier(trackingId);
      
      res.json({
        success: true,
        message: 'Carrier sync completed successfully',
        data: tracking
      });
    } catch (error) {
      logger.error('Sync with carrier controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'CARRIER_SYNC_FAILED'
      });
    }
  }

  /**
   * Bulk update tracking status
   */
  async bulkUpdateStatus(req, res) {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Updates array is required',
          code: 'INVALID_UPDATES'
        });
      }

      const results = await TrackingService.bulkUpdateStatus(updates);
      
      res.json({
        success: true,
        message: 'Bulk update completed',
        data: results
      });
    } catch (error) {
      logger.error('Bulk update status controller error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'BULK_UPDATE_FAILED'
      });
    }
  }

  /**
   * Search tracking
   */
  async searchTracking(req, res) {
    try {
      const { q: query, carrier, status } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
          code: 'MISSING_SEARCH_QUERY'
        });
      }

      const TrackingLog = require('../models/TrackingLog');
      const searchQuery = {
        $or: [
          { trackingId: { $regex: query, $options: 'i' } },
          { 'carrier.trackingNumber': { $regex: query, $options: 'i' } }
        ],
        isActive: true
      };

      if (carrier) {
        searchQuery['carrier.name'] = carrier;
      }

      if (status) {
        searchQuery['status.current'] = status;
      }

      const trackingLogs = await TrackingLog.find(searchQuery)
        .populate('order')
        .populate({
          path: 'order',
          populate: {
            path: 'customer',
            select: 'firstName lastName email'
          }
        })
        .limit(20);

      res.json({
        success: true,
        data: trackingLogs
      });
    } catch (error) {
      logger.error('Search tracking controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search tracking',
        code: 'SEARCH_TRACKING_FAILED'
      });
    }
  }

  /**
   * Get tracking by order ID
   */
  async getTrackingByOrderId(req, res) {
    try {
      const { orderId } = req.params;
      
      const TrackingLog = require('../models/TrackingLog');
      const tracking = await TrackingLog.findOne({ order: orderId })
        .populate('order')
        .populate({
          path: 'order',
          populate: {
            path: 'customer',
            select: 'firstName lastName email'
          }
        });

      if (!tracking) {
        return res.status(404).json({
          success: false,
          message: 'Tracking not found for this order',
          code: 'TRACKING_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: tracking
      });
    } catch (error) {
      logger.error('Get tracking by order ID controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tracking',
        code: 'GET_TRACKING_FAILED'
      });
    }
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStatistics(req, res) {
    try {
      const { fromDate, toDate, carrier } = req.query;
      
      const TrackingLog = require('../models/TrackingLog');
      const matchQuery = { isActive: true };
      
      if (fromDate || toDate) {
        matchQuery.createdAt = {};
        if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate);
        if (toDate) matchQuery.createdAt.$lte = new Date(toDate);
      }

      if (carrier) {
        matchQuery['carrier.name'] = carrier;
      }

      const stats = await TrackingLog.aggregate([
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

      const result = stats[0] || {
        totalShipments: 0,
        deliveredShipments: 0,
        inTransitShipments: 0,
        delayedShipments: 0,
        exceptionShipments: 0,
        averageTransitTime: 0,
        averageSpeed: 0
      };

      // Calculate delivery rate
      result.deliveryRate = result.totalShipments > 0 
        ? Math.round((result.deliveredShipments / result.totalShipments) * 100) 
        : 0;

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Get tracking statistics controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tracking statistics',
        code: 'GET_TRACKING_STATISTICS_FAILED'
      });
    }
  }
}

module.exports = new TrackingController();
