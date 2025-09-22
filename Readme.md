# Tracking API

A comprehensive e-commerce tracking API with real-time updates and multi-carrier support.

## 🚀 Features

- **Product Management**: CRUD operations with multi-channel sync
- **User Authentication**: Secure JWT-based auth with role-based access
- **Order Processing**: Complete order lifecycle management
- **Real-time Tracking**: WebSocket-based live updates
- **Multi-carrier Support**: UPS, FedEx, DHL, and local carriers
- **Inventory Management**: Automated syncing and low-stock alerts
- **Payment Integration**: Stripe, PayPal, and other payment methods
- **Analytics**: Google Analytics integration and custom reporting

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for session and data caching
- **Real-time**: Socket.io for WebSocket connections
- **Authentication**: JWT tokens with refresh mechanism
- **Validation**: Joi for request validation
- **Security**: Helmet, rate limiting, input sanitization
- **Documentation**: Swagger/OpenAPI 3.0
- **Deployment**: Docker with Docker Compose

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 6.0+
- Redis 7.0+
- Docker & Docker Compose (for containerized deployment)

## 🛠️ Installation

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tracking-api
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   # For production
   docker-compose up -d
   
   # For development
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Or use the startup script**
   ```bash
   # Linux/Mac
   ./scripts/start.sh
   
   # Windows
   scripts/start.bat
   ```

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod
   
   # Redis
   redis-server
   ```

4. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **API Health**: http://localhost:3000/health

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh-token` - Refresh access token

#### Products
- `GET /api/v1/products` - List products
- `POST /api/v1/products` - Create product (seller/admin)
- `GET /api/v1/products/:id` - Get product details
- `PUT /api/v1/products/:id` - Update product

#### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id/status` - Update order status

#### Tracking
- `GET /api/v1/tracking/:trackingId` - Get tracking info
- `POST /api/v1/tracking` - Create tracking log
- `PUT /api/v1/tracking/:id/status` - Update tracking status

#### Webhooks
- `POST /api/v1/webhooks/carrier` - Carrier webhook
- `POST /api/v1/webhooks/payment` - Payment webhook
- `POST /api/v1/webhooks/inventory` - Inventory webhook

## 🔌 Real-time Features

### WebSocket Events

Connect to `ws://localhost:3000` with JWT authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Subscribe to tracking updates
socket.emit('subscribe_tracking', { trackingId: 'TRK-1234567890' });

// Listen for updates
socket.on('tracking_update', (data) => {
  console.log('Tracking update:', data);
});
```

## 🔒 Security Features

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Rate Limiting**: Per-user and per-IP limits
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Mongoose ODM protection
- **XSS Protection**: Input sanitization
- **CORS**: Configurable cross-origin policies
- **Helmet**: Security headers
- **API Key Authentication**: For external integrations

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📄 License

This project is licensed under the MIT License.
