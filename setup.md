# Tracking API - Setup Guide

This guide will help you set up and run the Tracking API project using NestJS, Prisma, pnpm, and PostgreSQL.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18.0.0 or higher) - [Download Node.js](https://nodejs.org/)
- **pnpm** (v8.0.0 or higher) - [Install pnpm](https://pnpm.io/installation)
- **PostgreSQL** (v14 or higher) - [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git** - [Download Git](https://git-scm.com/downloads)

## Installation Steps

### 1. Install pnpm (if not already installed)

**Windows (PowerShell):**

```powershell
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

**macOS/Linux:**

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

**Using npm:**

```bash
npm install -g pnpm
```

### 2. Install Project Dependencies

Navigate to the project directory and install all dependencies using pnpm:

```bash
pnpm install
```

Or if you prefer to install packages one by one:

```bash
# Core NestJS packages
pnpm add @nestjs/common@^10.0.0 @nestjs/core@^10.0.0 @nestjs/platform-express@^10.0.0
pnpm add @nestjs/config@^3.0.0 @nestjs/jwt@^10.0.0 @nestjs/passport@^10.0.0
pnpm add @nestjs/swagger@^7.0.0 @nestjs/throttler@^5.0.0
pnpm add passport@^0.6.0 passport-jwt@^4.0.1
pnpm add @scalar/nestjs-api-reference@^0.3.0

# Prisma
pnpm add @prisma/client@^5.0.0
pnpm add -D prisma@^5.0.0

# Validation and Security
pnpm add class-validator@^0.14.0 class-transformer@^0.5.1
pnpm add bcryptjs@^2.4.3
pnpm add helmet@^7.0.0 compression@^1.7.4
pnpm add rxjs@^7.8.1

# Development Dependencies
pnpm add -D @nestjs/cli@^10.0.0 @nestjs/schematics@^10.0.0
pnpm add -D typescript@^5.2.2 @types/node@^20.8.0
pnpm add -D @types/express@^4.17.17 @types/bcryptjs@^2.4.6 @types/compression@^1.7.5
pnpm add -D @types/passport-jwt@^4.0.0
pnpm add -D ts-node@^10.9.1 tsconfig-paths@^4.2.0
pnpm add -D eslint@^8.51.0 prettier@^3.0.3
pnpm add -D @typescript-eslint/eslint-plugin@^6.7.0 @typescript-eslint/parser@^6.7.0
pnpm add -D jest@^29.7.0 @nestjs/testing@^10.0.0
pnpm add -D @types/jest@^29.5.5 ts-jest@^29.1.1
pnpm add -D supertest@^6.3.3 @types/supertest@^6.0.2
pnpm add -D openapi-to-postmanv2@^4.19.1
```

### 3. Complete Installation Script (All at Once)

For convenience, you can run this script to install all packages:

**Windows (PowerShell):**

```powershell
# All dependencies (prod + dev)
pnpm add @nestjs/common@^10.0.0 @nestjs/core@^10.0.0 @nestjs/platform-express@^10.0.0 @nestjs/config@^3.0.0 @nestjs/jwt@^10.0.0 @nestjs/passport@^10.0.0 @nestjs/swagger@^7.0.0 @nestjs/throttler@^5.0.0 passport@^0.6.0 passport-jwt@^4.0.1 @scalar/nestjs-api-reference@^0.3.0 @prisma/client@^5.0.0 class-validator@^0.14.0 class-transformer@^0.5.1 bcryptjs@^2.4.3 helmet@^7.0.0 compression@^1.7.4 rxjs@^7.8.1 && pnpm add -D prisma@^5.0.0 @nestjs/cli@^10.0.0 @nestjs/schematics@^10.0.0 typescript@^5.2.2 @types/node@^20.8.0 @types/express@^4.17.17 @types/bcryptjs@^2.4.6 @types/compression@^1.7.5 @types/passport-jwt@^4.0.0 ts-node@^10.9.1 tsconfig-paths@^4.2.0 eslint@^8.51.0 prettier@^3.0.3 @typescript-eslint/eslint-plugin@^6.7.0 @typescript-eslint/parser@^6.7.0 jest@^29.7.0 @nestjs/testing@^10.0.0 @types/jest@^29.5.5 ts-jest@^29.1.1 supertest@^6.3.3 @types/supertest@^6.0.2 openapi-to-postmanv2@^4.19.1
```

**macOS/Linux:**

```bash
# All dependencies (prod + dev)
pnpm add @nestjs/common@^10.0.0 @nestjs/core@^10.0.0 @nestjs/platform-express@^10.0.0 @nestjs/config@^3.0.0 @nestjs/jwt@^10.0.0 @nestjs/passport@^10.0.0 @nestjs/swagger@^7.0.0 @nestjs/throttler@^5.0.0 passport@^0.6.0 passport-jwt@^4.0.1 @scalar/nestjs-api-reference@^0.3.0 @prisma/client@^5.0.0 class-validator@^0.14.0 class-transformer@^0.5.1 bcryptjs@^2.4.3 helmet@^7.0.0 compression@^1.7.4 && pnpm add -D prisma@^5.0.0 @nestjs/cli@^10.0.0 @nestjs/schematics@^10.0.0 typescript@^5.2.2 @types/node@^20.8.0 @types/express@^4.17.17 @types/bcryptjs@^2.4.6 @types/compression@^1.7.5 @types/passport-jwt@^4.0.0 ts-node@^10.9.1 tsconfig-paths@^4.2.0 eslint@^8.51.0 prettier@^3.0.3 @typescript-eslint/eslint-plugin@^6.7.0 @typescript-eslint/parser@^6.7.0 jest@^29.7.0 @nestjs/testing@^10.0.0 @types/jest@^29.5.5 ts-jest@^29.1.1 supertest@^6.3.3 @types/supertest@^6.0.2 openapi-to-postmanv2@^4.19.1
```

### 4. Set Up PostgreSQL Database

1. **Install PostgreSQL** if not already installed
2. **Create a new database:**
   ```sql
   CREATE DATABASE tracking_api;
   ```
3. **Note your database connection details:**
   - Host: `localhost` (or your PostgreSQL host)
   - Port: `5432` (default)
   - Database: `tracking_api`
   - Username: `postgres` (or your PostgreSQL username)
   - Password: Your PostgreSQL password

### 5. Configure Environment Variables

1. **Copy the example environment file:**

   Bash (macOS/Linux):

   ```bash
   cp .env.example .env
   ```

   PowerShell (Windows):

   ```powershell
   Copy-Item -Path .env.example -Destination .env
   ```

   If `.env.example` is missing, create it and then copy:

   PowerShell (create `.env.example`):

   ```powershell
   @"
   DATABASE_URL="postgresql://username:password@localhost:5432/tracking_api?schema=public"
   PORT=3000
   NODE_ENV=development
   API_VERSION=v1
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production
   JWT_REFRESH_EXPIRE=30d
   BCRYPT_ROUNDS=12
   CORS_ORIGIN=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   FROM_EMAIL=noreply@trackingapi.com
   FROM_NAME=Tracking API
   STRIPE_SECRET_KEY=
   STRIPE_PUBLISHABLE_KEY=
   PAYPAL_CLIENT_ID=
   PAYPAL_CLIENT_SECRET=
   PAYPAL_MODE=sandbox
   UPS_API_KEY=
   UPS_USERNAME=
   UPS_PASSWORD=
   FEDEX_API_KEY=
   FEDEX_SECRET_KEY=
   DHL_API_KEY=
   DHL_USERNAME=
   DHL_PASSWORD=
   "@ | Set-Content -NoNewline .env.example
   ```

Copy-Item -Path .env.example -Destination .env

````

2. **Edit `.env` file** with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tracking_api?schema=public"

# Server
PORT=3000
NODE_ENV=development
API_VERSION=v1

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
````

### 6. Initialize Prisma

1. **Generate Prisma Client:**

   ```bash
   pnpm prisma:generate
   ```

2. **Run database migrations:**

   ```bash
   pnpm prisma:migrate
   ```

   This will create the database schema based on `prisma/schema.prisma`.

3. **(Optional) Open Prisma Studio to view your database:**
   ```bash
   pnpm prisma:studio
   ```

### 7. Build the Application

```bash
pnpm build
```

### 8. Run the Application

**Development mode (with hot-reload):**

```bash
pnpm start:dev
```

**Production mode:**

```bash
pnpm start:prod
```

The API will be available at:

- **Base URL:** `http://localhost:3000`
- **API Endpoint:** `http://localhost:3000/api/v1`
- **Health Check:** `http://localhost:3000/health`
- **API Documentation:** `http://localhost:3000/api-docs`

## Package List Reference

### Production Dependencies

- `@nestjs/common` - NestJS common utilities
- `@nestjs/core` - NestJS core framework
- `@nestjs/platform-express` - Express platform for NestJS
- `@nestjs/config` - Configuration module
- `@nestjs/jwt` - JWT module
- `@nestjs/passport` - Passport integration
- `@nestjs/swagger` - Swagger/OpenAPI documentation
- `@nestjs/throttler` - Rate limiting
- `@prisma/client` - Prisma ORM client
- `passport` - Authentication middleware
- `passport-jwt` - JWT strategy for Passport
- `class-validator` - Validation decorators
- `class-transformer` - Object transformation
- `bcryptjs` - Password hashing
- `helmet` - Security headers
- `compression` - Response compression

### Development Dependencies

- `@nestjs/cli` - NestJS CLI
- `@nestjs/schematics` - NestJS code generators
- `prisma` - Prisma CLI
- `typescript` - TypeScript compiler
- `@types/*` - TypeScript type definitions
- `ts-node` - TypeScript execution
- `eslint` - Linting
- `prettier` - Code formatting
- `jest` - Testing framework
- `supertest` - HTTP testing

## Common Commands

- `pnpm start:dev` - Start development server with hot-reload
- `pnpm build` - Build the application
- `pnpm start:prod` - Start production server
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:studio` - Open Prisma Studio
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm format` - Format code with Prettier

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Check PostgreSQL user permissions

### Port Already in Use

- Change `PORT` in `.env` file
- Or kill the process using the port

### Prisma Issues

- Run `pnpm prisma:generate` after schema changes
- Run `pnpm prisma:migrate` to apply migrations

### Module Not Found Errors

- Ensure all dependencies are installed: `pnpm install`
- Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`

## Next Steps

1. Explore the API documentation at `http://localhost:3000/api-docs`
2. Test the health endpoint: `curl http://localhost:3000/health`
3. Register a new user via the `/api/v1/auth/register` endpoint
4. Use the JWT token to access protected endpoints

## Support

For issues or questions, please refer to:

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [pnpm Documentation](https://pnpm.io/)
