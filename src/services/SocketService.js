const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../config/logger');
const TrackingService = require('./TrackingService');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.trackingSubscriptions = new Map();
  }

  /**
   * Initialize Socket.io server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Socket.io server initialized');
  }

  /**
   * Setup Socket.io middleware
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret);

        // Attach user info to socket
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.isActive = decoded.isActive;

        if (!socket.isActive) {
          return next(new Error('Account is deactivated'));
        }

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const userId = socket.userId;
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const maxEvents = 100; // Max events per minute

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, {
          eventCount: 0,
          windowStart: now,
          lastEvent: now
        });
      }

      const userStats = this.connectedUsers.get(userId);

      // Reset window if needed
      if (now - userStats.windowStart > windowMs) {
        userStats.eventCount = 0;
        userStats.windowStart = now;
      }

      // Check rate limit
      if (userStats.eventCount >= maxEvents) {
        return next(new Error('Rate limit exceeded'));
      }

      userStats.eventCount++;
      userStats.lastEvent = now;

      next();
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      const userRole = socket.userRole;

      logger.info('User connected via Socket.io', { userId, userRole });

      // Store user connection
      this.connectedUsers.set(userId, {
        ...this.connectedUsers.get(userId),
        socketId: socket.id,
        connectedAt: new Date()
      });

      // Join user to their personal room
      socket.join(`user:${userId}`);

      // Join admin/seller to admin room
      if (['admin', 'seller'].includes(userRole)) {
        socket.join('admin');
      }

      // Handle tracking subscriptions
      socket.on('subscribe_tracking', (data) => {
        this.handleTrackingSubscription(socket, data);
      });

      socket.on('unsubscribe_tracking', (data) => {
        this.handleTrackingUnsubscription(socket, data);
      });

      socket.on('subscribe_orders', () => {
        this.handleOrderSubscription(socket);
      });

      socket.on('unsubscribe_orders', () => {
        this.handleOrderUnsubscription(socket);
      });

      socket.on('subscribe_analytics', () => {
        this.handleAnalyticsSubscription(socket);
      });

      socket.on('unsubscribe_analytics', () => {
        this.handleAnalyticsUnsubscription(socket);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to Tracking API',
        userId,
        userRole,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle tracking subscription
   */
  handleTrackingSubscription(socket, data) {
    const { trackingId } = data;
    const userId = socket.userId;

    if (!trackingId) {
      socket.emit('error', { message: 'Tracking ID is required' });
      return;
    }

    try {
      // Join tracking room
      socket.join(`tracking:${trackingId}`);

      // Store subscription
      if (!this.trackingSubscriptions.has(trackingId)) {
        this.trackingSubscriptions.set(trackingId, new Set());
      }
      this.trackingSubscriptions.get(trackingId).add(userId);

      logger.info('User subscribed to tracking', { userId, trackingId });

      socket.emit('tracking_subscribed', {
        trackingId,
        message: 'Subscribed to tracking updates'
      });
    } catch (error) {
      logger.error('Tracking subscription error:', error);
      socket.emit('error', { message: 'Failed to subscribe to tracking' });
    }
  }

  /**
   * Handle tracking unsubscription
   */
  handleTrackingUnsubscription(socket, data) {
    const { trackingId } = data;
    const userId = socket.userId;

    if (trackingId) {
      socket.leave(`tracking:${trackingId}`);

      if (this.trackingSubscriptions.has(trackingId)) {
        this.trackingSubscriptions.get(trackingId).delete(userId);
      }

      logger.info('User unsubscribed from tracking', { userId, trackingId });

      socket.emit('tracking_unsubscribed', {
        trackingId,
        message: 'Unsubscribed from tracking updates'
      });
    }
  }

  /**
   * Handle order subscription
   */
  handleOrderSubscription(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;

    // Join order rooms based on user role
    socket.join(`orders:${userId}`);

    if (['admin', 'seller'].includes(userRole)) {
      socket.join('orders:all');
    }

    logger.info('User subscribed to orders', { userId, userRole });

    socket.emit('orders_subscribed', {
      message: 'Subscribed to order updates'
    });
  }

  /**
   * Handle order unsubscription
   */
  handleOrderUnsubscription(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;

    socket.leave(`orders:${userId}`);

    if (['admin', 'seller'].includes(userRole)) {
      socket.leave('orders:all');
    }

    logger.info('User unsubscribed from orders', { userId, userRole });

    socket.emit('orders_unsubscribed', {
      message: 'Unsubscribed from order updates'
    });
  }

  /**
   * Handle analytics subscription
   */
  handleAnalyticsSubscription(socket) {
    const userId = socket.userId;
    const userRole = socket.userRole;

    if (!['admin', 'seller'].includes(userRole)) {
      socket.emit('error', { message: 'Insufficient permissions for analytics' });
      return;
    }

    socket.join('analytics');

    logger.info('User subscribed to analytics', { userId });

    socket.emit('analytics_subscribed', {
      message: 'Subscribed to analytics updates'
    });
  }

  /**
   * Handle analytics unsubscription
   */
  handleAnalyticsUnsubscription(socket) {
    const userId = socket.userId;

    socket.leave('analytics');

    logger.info('User unsubscribed from analytics', { userId });

    socket.emit('analytics_unsubscribed', {
      message: 'Unsubscribed from analytics updates'
    });
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(socket, reason) {
    const userId = socket.userId;

    logger.info('User disconnected via Socket.io', { userId, reason });

    // Clean up user data
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.delete(userId);
    }

    // Clean up tracking subscriptions
    for (const [trackingId, subscribers] of this.trackingSubscriptions) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.trackingSubscriptions.delete(trackingId);
      }
    }
  }

  /**
   * Emit tracking update
   */
  async emitTrackingUpdate(trackingId, updateData) {
    try {
      if (!this.io) {
        logger.warn('Socket.io not initialized');
        return;
      }

      const eventData = {
        trackingId,
        ...updateData,
        timestamp: new Date().toISOString()
      };

      // Emit to tracking room
      this.io.to(`tracking:${trackingId}`).emit('tracking_update', eventData);

      // Emit to admin room for monitoring
      this.io.to('admin').emit('tracking_update', eventData);

      logger.info('Tracking update emitted', { trackingId, event: updateData.status });
    } catch (error) {
      logger.error('Emit tracking update error:', error);
    }
  }

  /**
   * Emit order update
   */
  async emitOrderUpdate(orderId, updateData) {
    try {
      if (!this.io) {
        logger.warn('Socket.io not initialized');
        return;
      }

      const eventData = {
        orderId,
        ...updateData,
        timestamp: new Date().toISOString()
      };

      // Emit to order room
      this.io.to(`orders:${orderId}`).emit('order_update', eventData);

      // Emit to all orders room for admin/seller
      this.io.to('orders:all').emit('order_update', eventData);

      logger.info('Order update emitted', { orderId, event: updateData.status });
    } catch (error) {
      logger.error('Emit order update error:', error);
    }
  }

  /**
   * Emit analytics update
   */
  async emitAnalyticsUpdate(analyticsData) {
    try {
      if (!this.io) {
        logger.warn('Socket.io not initialized');
        return;
      }

      const eventData = {
        ...analyticsData,
        timestamp: new Date().toISOString()
      };

      // Emit to analytics room
      this.io.to('analytics').emit('analytics_update', eventData);

      logger.info('Analytics update emitted', { type: analyticsData.type });
    } catch (error) {
      logger.error('Emit analytics update error:', error);
    }
  }

  /**
   * Emit notification to user
   */
  async emitNotification(userId, notificationData) {
    try {
      if (!this.io) {
        logger.warn('Socket.io not initialized');
        return;
      }

      const eventData = {
        ...notificationData,
        timestamp: new Date().toISOString()
      };

      // Emit to user room
      this.io.to(`user:${userId}`).emit('notification', eventData);

      logger.info('Notification emitted', { userId, type: notificationData.type });
    } catch (error) {
      logger.error('Emit notification error:', error);
    }
  }

  /**
   * Broadcast system message
   */
  async broadcastSystemMessage(message, targetRole = null) {
    try {
      if (!this.io) {
        logger.warn('Socket.io not initialized');
        return;
      }

      const eventData = {
        message,
        type: 'system',
        timestamp: new Date().toISOString()
      };

      if (targetRole) {
        // Send to specific role
        this.io.to('admin').emit('system_message', eventData);
      } else {
        // Broadcast to all connected users
        this.io.emit('system_message', eventData);
      }

      logger.info('System message broadcasted', { message, targetRole });
    } catch (error) {
      logger.error('Broadcast system message error:', error);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.io ? this.io.engine.clientsCount : 0;
  }

  /**
   * Get tracking subscriptions count
   */
  getTrackingSubscriptionsCount() {
    return this.trackingSubscriptions.size;
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      trackingSubscriptions: this.trackingSubscriptions.size,
      totalConnections: this.getConnectedUsersCount(),
      uptime: process.uptime()
    };
  }
}

module.exports = new SocketService();
