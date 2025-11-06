# Tracking API

A comprehensive e-commerce tracking API built with NestJS, Prisma, PostgreSQL, and pnpm.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role-based access control
- 📦 **Product Management** - Full CRUD operations for products with variants, inventory, and categories
- 🛒 **Order Management** - Complete order processing with payment integration
- 📍 **Real-time Tracking** - Shipment tracking with multi-carrier support (UPS, FedEx, DHL, USPS)
- 🏭 **Warehouse Management** - Multi-warehouse inventory tracking and management
- 📊 **Analytics** - Product and order analytics
- 🔗 **Webhooks** - Webhook support for real-time updates
- 📚 **API Documentation** - Swagger/OpenAPI documentation
- 🛡️ **Security** - Helmet, rate limiting, input validation, and CORS

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Package Manager:** pnpm
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI

## Quick Start

1. **Follow the setup instructions:**
   See [SETUP.md](./setup.md) for detailed installation and configuration steps.

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Initialize database:**
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   ```

5. **Run the application:**
   ```bash
   pnpm start:dev
   ```

## API Endpoints

- **Health Check:** `GET /health`
- **API Documentation:** `GET /api-docs`
- **Authentication:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- **Products:** `GET /api/v1/products`, `POST /api/v1/products`, etc.
- **Orders:** `GET /api/v1/orders`, `POST /api/v1/orders`, etc.
- **Tracking:** `GET /api/v1/tracking/:trackingId`
- **Webhooks:** `POST /api/v1/webhooks`

## Project Structure

```
src/
├── auth/              # Authentication module
├── users/             # User management
├── products/          # Product management
├── orders/            # Order management
├── tracking/          # Tracking functionality
├── webhooks/          # Webhook handling
├── monitoring/        # System monitoring
├── common/            # Shared utilities, guards, decorators
├── config/            # Configuration service
├── prisma/            # Prisma service and module
└── main.ts            # Application entry point
```

## Available Scripts

- `pnpm start:dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start:prod` - Start production server
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint

## License

MIT
