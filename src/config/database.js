const mongoose = require('mongoose');
const redis = require('ioredis');
const logger = require('./logger');

class Database {
  constructor() {
    this.mongoConnection = null;
    this.redisClient = null;
  }

  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracking_api';
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false,
      };

      this.mongoConnection = await mongoose.connect(mongoUri, options);
      
      logger.info('MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return this.mongoConnection;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async connectRedis() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      };

      this.redisClient = new redis(redisConfig);

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });

      this.redisClient.on('close', () => {
        logger.warn('Redis connection closed');
      });

      await this.redisClient.connect();
      return this.redisClient;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      // Redis is optional for some features, so we don't exit the process
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.mongoConnection) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
      }

      if (this.redisClient) {
        await this.redisClient.quit();
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Error during database disconnection:', error);
    }
  }

  getRedisClient() {
    return this.redisClient;
  }

  getMongoConnection() {
    return this.mongoConnection;
  }
}

module.exports = new Database();
