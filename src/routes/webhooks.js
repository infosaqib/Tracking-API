const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/WebhookController');
const { authenticateWebhook } = require('../middleware/auth');

// Test webhook (no authentication required for testing)
router.post('/test', WebhookController.testWebhook);

// Carrier webhooks (authenticated)
router.post('/carrier', 
  authenticateWebhook,
  WebhookController.handleCarrierWebhook
);

router.post('/ups', 
  authenticateWebhook,
  WebhookController.handleUPSWebhook
);

router.post('/fedex', 
  authenticateWebhook,
  WebhookController.handleFedExWebhook
);

router.post('/dhl', 
  authenticateWebhook,
  WebhookController.handleDHLWebhook
);

// Payment webhooks
router.post('/payment', 
  authenticateWebhook,
  WebhookController.handlePaymentWebhook
);

// Inventory webhooks
router.post('/inventory', 
  authenticateWebhook,
  WebhookController.handleInventoryWebhook
);

module.exports = router;
