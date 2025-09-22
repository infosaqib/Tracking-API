const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, orderSchemas, handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);

// Order management routes
router.post('/',
    validate(orderSchemas.create, 'body'),
    OrderController.createOrder
);

router.get('/',
    OrderController.getOrders
);

router.get('/statistics',
    OrderController.getOrderStatistics
);

router.get('/analytics',
    OrderController.getOrderAnalytics
);

router.get('/export',
    OrderController.exportOrders
);

router.get('/tracking/:trackingId',
    OrderController.getOrderByTrackingId
);

router.get('/:id',
    OrderController.getOrderById
);

router.get('/:id/timeline',
    OrderController.getOrderTimeline
);

router.get('/:id/summary',
    OrderController.getOrderSummary
);

// Order status management
router.put('/:id/status',
    authorize('admin', 'seller'),
    validate(orderSchemas.updateStatus, 'body'),
    OrderController.updateOrderStatus
);

router.put('/:id/cancel',
    OrderController.cancelOrder
);

router.put('/:id/ship',
    authorize('admin', 'seller'),
    OrderController.shipOrder
);

router.put('/:id/deliver',
    authorize('admin', 'seller'),
    OrderController.deliverOrder
);

// Return management
router.post('/:id/return',
    OrderController.processReturn
);

module.exports = router;
