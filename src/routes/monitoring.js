const express = require('express');
const { wrapAsync } = require('../utils/asyncWrapper');
const errorMonitoringService = require('../services/ErrorMonitoringService');
const { globalErrorHandler } = require('../middleware/errorHandler');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /monitoring/health:
 *   get:
 *     summary: Get monitoring health status
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                     totalErrors:
 *                       type: number
 *                     errorHistorySize:
 *                       type: number
 *                     activeCooldowns:
 *                       type: number
 *                     thresholds:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/health', auth.authenticate, auth.authorize(['admin']), wrapAsync(async (req, res) => {
    const healthStatus = errorMonitoringService.getHealthStatus();

    res.json({
        success: true,
        data: healthStatus,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @swagger
 * /monitoring/stats:
 *   get:
 *     summary: Get error statistics
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalErrors:
 *                       type: number
 *                     errorCounts:
 *                       type: object
 *                     recentErrors:
 *                       type: array
 *                     thresholds:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stats', auth.authenticate, auth.authorize(['admin']), wrapAsync(async (req, res) => {
    const stats = errorMonitoringService.getErrorStats();

    res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @swagger
 * /monitoring/trends:
 *   get:
 *     summary: Get error trends
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeWindow
 *         schema:
 *           type: integer
 *           default: 3600000
 *         description: Time window in milliseconds (default 1 hour)
 *     responses:
 *       200:
 *         description: Error trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     timeWindow:
 *                       type: number
 *                     totalErrors:
 *                       type: number
 *                     errorsBySeverity:
 *                       type: object
 *                     errorsByCategory:
 *                       type: object
 *                     errorsByHour:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/trends', auth.authenticate, auth.authorize(['admin']), wrapAsync(async (req, res) => {
    const timeWindow = parseInt(req.query.timeWindow) || 3600000; // 1 hour default
    const trends = errorMonitoringService.getErrorTrends(timeWindow);

    res.json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @swagger
 * /monitoring/reset:
 *   post:
 *     summary: Reset error monitoring data
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resetCounts:
 *                 type: boolean
 *                 default: false
 *               resetHistory:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Monitoring data reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/reset', auth.authenticate, auth.authorize(['admin']), wrapAsync(async (req, res) => {
    const { resetCounts = false, resetHistory = false } = req.body;

    if (resetCounts) {
        errorMonitoringService.resetErrorCounts();
    }

    if (resetHistory) {
        errorMonitoringService.clearErrorHistory();
    }

    res.json({
        success: true,
        message: 'Monitoring data reset successfully',
        resetCounts,
        resetHistory,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @swagger
 * /monitoring/thresholds:
 *   put:
 *     summary: Update alert thresholds
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               critical:
 *                 type: integer
 *                 minimum: 1
 *               high:
 *                 type: integer
 *                 minimum: 1
 *               medium:
 *                 type: integer
 *                 minimum: 1
 *               low:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Thresholds updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 thresholds:
 *                   type: object
 *       400:
 *         description: Invalid threshold values
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/thresholds', auth.authenticate, auth.authorize(['admin']), wrapAsync(async (req, res) => {
    const { critical, high, medium, low } = req.body;

    // Validate threshold values
    const thresholds = {};
    if (critical !== undefined) {
        if (critical < 1) throw new Error('Critical threshold must be at least 1');
        thresholds.critical = critical;
    }
    if (high !== undefined) {
        if (high < 1) throw new Error('High threshold must be at least 1');
        thresholds.high = high;
    }
    if (medium !== undefined) {
        if (medium < 1) throw new Error('Medium threshold must be at least 1');
        thresholds.medium = medium;
    }
    if (low !== undefined) {
        if (low < 1) throw new Error('Low threshold must be at least 1');
        thresholds.low = low;
    }

    errorMonitoringService.updateThresholds(thresholds);

    res.json({
        success: true,
        message: 'Thresholds updated successfully',
        thresholds: errorMonitoringService.alertThresholds,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @swagger
 * /monitoring/toggle:
 *   post:
 *     summary: Enable/disable error monitoring
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Enable or disable error monitoring
 *     responses:
 *       200:
 *         description: Monitoring status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 enabled:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/toggle', auth.authenticate, auth.authorize(['admin']), wrapAsync(async (req, res) => {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
        throw new Error('Enabled must be a boolean value');
    }

    errorMonitoringService.setEnabled(enabled);

    res.json({
        success: true,
        message: `Error monitoring ${enabled ? 'enabled' : 'disabled'}`,
        enabled,
        timestamp: new Date().toISOString()
    });
}));

/**
 * @swagger
 * /monitoring/errors:
 *   get:
 *     summary: Get recent errors
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of errors to return
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low]
 *         description: Filter by severity level
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [validation, authentication, authorization, not_found, conflict, rate_limit, external_service, database, configuration, business_logic, unknown]
 *         description: Filter by error category
 *     responses:
 *       200:
 *         description: Recent errors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                       error:
 *                         type: object
 *                       request:
 *                         type: object
 *                       additional:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/errors', auth.authenticate, auth.authorize(['admin']), wrapAsync(async (req, res) => {
    const { limit = 50, severity, category } = req.query;
    const limitNum = Math.min(parseInt(limit), 100);

    let errors = errorMonitoringService.errorHistory.slice(-limitNum);

    // Filter by severity
    if (severity) {
        errors = errors.filter(error => {
            const errorSeverity = errorMonitoringService.getSeverityLevel(error.error.statusCode || 500);
            return errorSeverity === severity;
        });
    }

    // Filter by category
    if (category) {
        errors = errors.filter(error => {
            const errorCategory = errorMonitoringService.getErrorCategory(error.error);
            return errorCategory === category;
        });
    }

    res.json({
        success: true,
        data: errors,
        count: errors.length,
        filters: { severity, category, limit: limitNum },
        timestamp: new Date().toISOString()
    });
}));

module.exports = router;
