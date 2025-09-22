const express = require('express');
const http = require('http');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import configuration and services
const config = require('./config');
const database = require('./config/database');
const logger = require('./config/logger');
const SocketService = require('./services/SocketService');

// Import middleware
const { securityMiddleware, requestLogger, notFoundHandler } = require('./middleware/security');
const { handleError, initialize: initializeErrorHandling } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

// Import Swagger
const { specs, swaggerUi } = require('./config/swagger');

class Application {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Security middleware
    securityMiddleware(this.app);

    // Request logging
    this.app.use(requestLogger);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    this.app.use('/docs', express.static(path.join(__dirname, '../docs')));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
        environment: config.nodeEnv,
        uptime: process.uptime()
      });
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Swagger documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Tracking API Documentation'
    }));

    // API routes
    this.app.use(`/api/${config.apiVersion}`, routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Tracking API',
        version: config.apiVersion,
        documentation: '/api-docs',
        health: '/health'
      });
    });

    // 404 handler
    this.app.use(notFoundHandler);
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Initialize global error handling
    initializeErrorHandling();
    
    // Use enhanced error handler
    this.app.use(handleError);
  }

  /**
   * Initialize database connections
   */
  async initializeDatabase() {
    try {
      await database.connectMongoDB();
      await database.connectRedis();
      logger.info('Database connections established');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      process.exit(1);
    }
  }

  /**
   * Initialize Socket.io
   */
  initializeSocket() {
    try {
      SocketService.initialize(this.server);
      logger.info('Socket.io initialized');
    } catch (error) {
      logger.error('Socket.io initialization failed:', error);
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      // Stop accepting new connections
      this.server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connections
          await database.disconnect();
          logger.info('Database connections closed');

          // Close Socket.io
          if (SocketService.io) {
            SocketService.io.close();
            logger.info('Socket.io server closed');
          }

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Initialize database
      await this.initializeDatabase();

      // Create HTTP server
      this.server = http.createServer(this.app);

      // Initialize Socket.io
      this.initializeSocket();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`API Version: ${config.apiVersion}`);
        logger.info(`Health check: http://localhost:${config.port}/health`);
        logger.info(`API Documentation: http://localhost:${config.port}/api-docs`);
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        const bind = typeof config.port === 'string' ? `Pipe ${config.port}` : `Port ${config.port}`;

        switch (error.code) {
          case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
          case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            process.exit(1);
            break;
          default:
            throw error;
        }
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express app instance
   */
  getApp() {
    return this.app;
  }

  /**
   * Get HTTP server instance
   */
  getServer() {
    return this.server;
  }
}

// Create and start application
const app = new Application();

// Start server if this file is run directly
if (require.main === module) {
  app.start().catch((error) => {
    logger.error('Application startup failed:', error);
    process.exit(1);
  });
}

module.exports = app;
