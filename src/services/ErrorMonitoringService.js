const { EventEmitter } = require('events');
const logger = require('../config/logger');
const config = require('../config');

/**
 * Error Monitoring and Alerting Service
 */
class ErrorMonitoringService extends EventEmitter {
  constructor() {
    super();
    this.errorCounts = new Map();
    this.errorHistory = [];
    this.alertThresholds = {
      critical: 1,
      high: 10,
      medium: 50,
      low: 100
    };
    this.alertCooldowns = new Map();
    this.isEnabled = config.monitoring?.enabled || true;
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.on('error', this.handleError.bind(this));
    this.on('thresholdExceeded', this.handleThresholdExceeded.bind(this));
    this.on('alert', this.sendAlert.bind(this));
  }

  /**
   * Track error occurrence
   */
  trackError(error, req = null, additionalData = {}) {
    if (!this.isEnabled) return;

    const errorKey = this.generateErrorKey(error);
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Store error in history
    this.storeErrorHistory(error, req, additionalData);

    // Check thresholds
    this.checkThresholds(errorKey, currentCount + 1, error, req);

    // Emit error event
    this.emit('error', {
      error,
      req,
      additionalData,
      count: currentCount + 1,
      key: errorKey
    });
  }

  /**
   * Generate unique key for error tracking
   */
  generateErrorKey(error) {
    const statusCode = error.statusCode || 500;
    const severity = this.getSeverityLevel(statusCode);
    const category = this.getErrorCategory(error);
    const message = error.message || 'Unknown error';
    
    return `${category}:${severity}:${message.substring(0, 50)}`;
  }

  /**
   * Get severity level based on status code
   */
  getSeverityLevel(statusCode) {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'high';
    if (statusCode >= 300) return 'medium';
    return 'low';
  }

  /**
   * Get error category
   */
  getErrorCategory(error) {
    if (error.name === 'ValidationError') return 'validation';
    if (error.name === 'AuthenticationError') return 'authentication';
    if (error.name === 'AuthorizationError') return 'authorization';
    if (error.name === 'NotFoundError') return 'not_found';
    if (error.name === 'ConflictError') return 'conflict';
    if (error.name === 'RateLimitError') return 'rate_limit';
    if (error.name === 'ExternalServiceError') return 'external_service';
    if (error.name === 'DatabaseError') return 'database';
    if (error.name === 'ConfigurationError') return 'configuration';
    if (error.name === 'BusinessLogicError') return 'business_logic';
    return 'unknown';
  }

  /**
   * Store error in history
   */
  storeErrorHistory(error, req, additionalData) {
    const errorRecord = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        stack: error.stack
      },
      request: req ? {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      } : null,
      additional: additionalData
    };

    this.errorHistory.push(errorRecord);

    // Keep only last 1000 errors
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
  }

  /**
   * Check if thresholds are exceeded
   */
  checkThresholds(errorKey, count, error, req) {
    const severity = this.getSeverityLevel(error.statusCode || 500);
    const threshold = this.alertThresholds[severity];

    if (count >= threshold) {
      // Check cooldown to prevent spam
      const cooldownKey = `${errorKey}:${severity}`;
      const lastAlert = this.alertCooldowns.get(cooldownKey);
      const now = Date.now();
      const cooldownPeriod = this.getCooldownPeriod(severity);

      if (!lastAlert || (now - lastAlert) > cooldownPeriod) {
        this.alertCooldowns.set(cooldownKey, now);
        this.emit('thresholdExceeded', {
          errorKey,
          count,
          threshold,
          severity,
          error,
          req
        });
      }
    }
  }

  /**
   * Get cooldown period based on severity
   */
  getCooldownPeriod(severity) {
    const cooldowns = {
      critical: 5 * 60 * 1000,    // 5 minutes
      high: 15 * 60 * 1000,       // 15 minutes
      medium: 30 * 60 * 1000,     // 30 minutes
      low: 60 * 60 * 1000         // 1 hour
    };
    return cooldowns[severity] || 60 * 60 * 1000;
  }

  /**
   * Handle threshold exceeded
   */
  handleThresholdExceeded(data) {
    const { errorKey, count, threshold, severity, error, req } = data;

    logger.error('Error threshold exceeded', {
      errorKey,
      count,
      threshold,
      severity,
      error: error.message,
      path: req?.path,
      timestamp: new Date().toISOString()
    });

    this.emit('alert', {
      type: 'threshold_exceeded',
      severity,
      message: `Error threshold exceeded: ${errorKey} (${count}/${threshold})`,
      data
    });
  }

  /**
   * Send alert
   */
  async sendAlert(alertData) {
    try {
      // Send to different channels based on severity
      switch (alertData.severity) {
        case 'critical':
          await this.sendCriticalAlert(alertData);
          break;
        case 'high':
          await this.sendHighPriorityAlert(alertData);
          break;
        case 'medium':
          await this.sendMediumPriorityAlert(alertData);
          break;
        case 'low':
          await this.sendLowPriorityAlert(alertData);
          break;
      }
    } catch (error) {
      logger.error('Failed to send alert', {
        error: error.message,
        alertData
      });
    }
  }

  /**
   * Send critical alert
   */
  async sendCriticalAlert(alertData) {
    // In production, integrate with services like:
    // - PagerDuty
    // - Slack
    // - Email
    // - SMS
    
    logger.error('🚨 CRITICAL ALERT', alertData);
    
    // Example: Send to external monitoring service
    if (config.monitoring?.criticalWebhook) {
      await this.sendWebhookAlert(config.monitoring.criticalWebhook, alertData);
    }
  }

  /**
   * Send high priority alert
   */
  async sendHighPriorityAlert(alertData) {
    logger.warn('⚠️ HIGH PRIORITY ALERT', alertData);
    
    if (config.monitoring?.highPriorityWebhook) {
      await this.sendWebhookAlert(config.monitoring.highPriorityWebhook, alertData);
    }
  }

  /**
   * Send medium priority alert
   */
  async sendMediumPriorityAlert(alertData) {
    logger.warn('📊 MEDIUM PRIORITY ALERT', alertData);
    
    if (config.monitoring?.mediumPriorityWebhook) {
      await this.sendWebhookAlert(config.monitoring.mediumPriorityWebhook, alertData);
    }
  }

  /**
   * Send low priority alert
   */
  async sendLowPriorityAlert(alertData) {
    logger.info('ℹ️ LOW PRIORITY ALERT', alertData);
    
    if (config.monitoring?.lowPriorityWebhook) {
      await this.sendWebhookAlert(config.monitoring.lowPriorityWebhook, alertData);
    }
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(webhookUrl, alertData) {
    try {
      const axios = require('axios');
      
      await axios.post(webhookUrl, {
        timestamp: new Date().toISOString(),
        service: 'tracking-api',
        environment: config.nodeEnv,
        ...alertData
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Tracking-API-Monitor/1.0'
        }
      });
    } catch (error) {
      logger.error('Failed to send webhook alert', {
        webhookUrl,
        error: error.message
      });
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.errorHistory.slice(-10),
      thresholds: this.alertThresholds
    };

    return stats;
  }

  /**
   * Get error trends
   */
  getErrorTrends(timeWindow = 3600000) { // 1 hour default
    const now = Date.now();
    const cutoff = now - timeWindow;
    
    const recentErrors = this.errorHistory.filter(error => {
      return new Date(error.timestamp).getTime() > cutoff;
    });

    const trends = {
      timeWindow,
      totalErrors: recentErrors.length,
      errorsBySeverity: {},
      errorsByCategory: {},
      errorsByHour: {}
    };

    recentErrors.forEach(error => {
      const severity = this.getSeverityLevel(error.error.statusCode || 500);
      const category = this.getErrorCategory(error.error);
      const hour = new Date(error.timestamp).getHours();

      trends.errorsBySeverity[severity] = (trends.errorsBySeverity[severity] || 0) + 1;
      trends.errorsByCategory[category] = (trends.errorsByCategory[category] || 0) + 1;
      trends.errorsByHour[hour] = (trends.errorsByHour[hour] || 0) + 1;
    });

    return trends;
  }

  /**
   * Reset error counts
   */
  resetErrorCounts() {
    this.errorCounts.clear();
    this.alertCooldowns.clear();
    logger.info('Error counts and cooldowns reset');
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
    logger.info('Error history cleared');
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    logger.info('Alert thresholds updated', { thresholds: this.alertThresholds });
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    logger.info(`Error monitoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Health check
   */
  getHealthStatus() {
    return {
      enabled: this.isEnabled,
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      errorHistorySize: this.errorHistory.length,
      activeCooldowns: this.alertCooldowns.size,
      thresholds: this.alertThresholds
    };
  }
}

// Create singleton instance
const errorMonitoringService = new ErrorMonitoringService();

module.exports = errorMonitoringService;
