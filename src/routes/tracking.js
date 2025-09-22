const express = require('express');
const router = express.Router();
const TrackingController = require('../controllers/TrackingController');
const { authenticate, authorize, authenticateWebhook } = require('../middleware/auth');
const { validate, trackingSchemas, handleValidationErrors } = require('../middleware/validation');

// Public routes (for tracking without authentication)
router.get('/:trackingId', 
  TrackingController.getTrackingById
);

router.get('/:trackingId/timeline', 
  TrackingController.getTrackingTimeline
);

router.get('/:trackingId/summary', 
  TrackingController.getTrackingSummary
);

router.get('/carrier/:carrier/:trackingNumber', 
  TrackingController.getTrackingByCarrier
);

router.get('/order/:orderId', 
  TrackingController.getTrackingByOrderId
);

// Protected routes
router.use(authenticate);

router.post('/', 
  authorize('admin', 'seller'),
  validate(trackingSchemas.create, 'body'),
  TrackingController.createTracking
);

router.get('/', 
  authorize('admin', 'seller'),
  TrackingController.getTrackingLogs
);

router.get('/delayed/all', 
  authorize('admin', 'seller'),
  TrackingController.getDelayedShipments
);

router.get('/analytics', 
  authorize('admin', 'seller'),
  TrackingController.getTrackingAnalytics
);

router.get('/statistics', 
  TrackingController.getTrackingStatistics
);

router.get('/search', 
  TrackingController.searchTracking
);

router.post('/:trackingId/events', 
  authorize('admin', 'seller'),
  validate(trackingSchemas.addEvent, 'body'),
  TrackingController.addTrackingEvent
);

router.put('/:trackingId/status', 
  authorize('admin', 'seller'),
  TrackingController.updateTrackingStatus
);

router.post('/:trackingId/exceptions', 
  authorize('admin', 'seller'),
  TrackingController.addException
);

router.put('/:trackingId/exceptions/:exceptionId/resolve', 
  authorize('admin', 'seller'),
  TrackingController.resolveException
);

router.post('/:trackingId/predictions', 
  authorize('admin', 'seller'),
  TrackingController.calculatePredictions
);

router.post('/:trackingId/sync', 
  authorize('admin', 'seller'),
  TrackingController.syncWithCarrier
);

router.post('/bulk-update', 
  authorize('admin', 'seller'),
  TrackingController.bulkUpdateStatus
);

// Webhook routes (for carrier updates)
router.post('/webhook/carrier', 
  authenticateWebhook,
  TrackingController.addTrackingEvent
);

module.exports = router;
