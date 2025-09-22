require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tracking_api',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // External API Keys
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox'
  },

  // Google Analytics
  googleAnalytics: {
    id: process.env.GOOGLE_ANALYTICS_ID,
    apiKey: process.env.GOOGLE_ANALYTICS_API_KEY
  },

  // Firebase Configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: process.env.FIREBASE_AUTH_URI,
    tokenUri: process.env.FIREBASE_TOKEN_URI
  },

  // Carrier API Keys
  carriers: {
    ups: {
      apiKey: process.env.UPS_API_KEY,
      username: process.env.UPS_USERNAME,
      password: process.env.UPS_PASSWORD,
      accessLicense: process.env.UPS_ACCESS_LICENSE
    },
    fedex: {
      apiKey: process.env.FEDEX_API_KEY,
      secretKey: process.env.FEDEX_SECRET_KEY,
      accountNumber: process.env.FEDEX_ACCOUNT_NUMBER
    },
    dhl: {
      apiKey: process.env.DHL_API_KEY,
      username: process.env.DHL_USERNAME,
      password: process.env.DHL_PASSWORD
    }
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@trackingapi.com',
      name: process.env.FROM_NAME || 'Tracking API'
    }
  },

  // Security
  security: {
    webhookSecret: process.env.WEBHOOK_SECRET,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key'
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },

  // Queue Configuration
  queue: {
    redisUrl: process.env.QUEUE_REDIS_URL || 'redis://localhost:6379',
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 5
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
    prefix: process.env.CACHE_PREFIX || 'tracking_api'
  },

  // Feature Flags
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    predictiveAnalytics: process.env.ENABLE_PREDICTIVE_ANALYTICS === 'true',
    realTimeTracking: process.env.ENABLE_REAL_TIME_TRACKING === 'true',
    multiCarrier: process.env.ENABLE_MULTI_CARRIER === 'true',
    aiRecommendations: process.env.ENABLE_AI_RECOMMENDATIONS === 'true'
  },

  // AI/ML Configuration
  ai: {
    tensorflowModelPath: process.env.TENSORFLOW_MODEL_PATH || './models/tracking-predictions',
    ml5ModelUrl: process.env.ML5_MODEL_URL
  },

  // Monitoring
  monitoring: {
    newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

module.exports = config;
