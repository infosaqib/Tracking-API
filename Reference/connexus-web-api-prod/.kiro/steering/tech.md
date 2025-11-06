# Technology Stack

## Core Framework & Language

- **NestJS**: Progressive Node.js framework for scalable server-side applications
- **TypeScript**: Strongly typed JavaScript with ES2021 target
- **Node.js**: Runtime environment

## Database & ORM

- **PostgreSQL**: Primary database with PostGIS extension for geographic data
- **Prisma**: Type-safe ORM with code generation and migrations
- **Prisma Extensions**: Pagination and optimization extensions

## AWS Services

- **Amazon Cognito**: User authentication and authorization
- **Amazon S3**: File storage with presigned URLs
- **Amazon SES/SESv2**: Email services
- **Amazon SQS**: Message queuing for background jobs
- **Amazon CloudWatch**: Logging and monitoring

## Build System & Package Management

- **Yarn**: Package manager (preferred over npm)
- **SWC**: Fast TypeScript/JavaScript compiler
- **Webpack**: Module bundler with custom configuration
- **Jest**: Testing framework with SWC transform

## Code Quality & Standards

- **ESLint**: Airbnb TypeScript configuration with Prettier
- **Prettier**: Code formatting with auto end-of-line handling
- **Husky**: Git hooks for pre-commit validation
- **Commitizen**: Conventional commit messages
- **Semantic Release**: Automated versioning and releases

## Monitoring & Observability

- **Sentry**: Error tracking and performance monitoring
- **Prometheus**: Metrics collection
- **Winston**: Structured logging with CloudWatch integration
- **Terminus**: Health checks

## Common Commands

### Development

```bash
# Install dependencies
yarn install

# Start all apps in development
yarn dev

# Start specific apps
yarn start:connexus
yarn start:sow
yarn start:background-jobs

# Start with selective apps
yarn dev:selective --app1=connexus-be --app2=sow-rfq
```

### Database Operations

```bash
# Run migrations
yarn migrate:dev
yarn migrate:deploy

# Generate Prisma client
yarn prisma:generate

# Open Prisma Studio
yarn prisma:studio

# Seed database
yarn prisma:seed

# Reset database
yarn prisma:reset
```

### Code Quality

```bash
# Lint code
yarn lint
yarn lint:fix

# Format code
yarn format

# Run tests
yarn test
yarn test:watch
yarn test:cov
yarn test:e2e
```

### Build & Deploy

```bash
# Build for production
yarn build

# Build with source maps for Sentry
yarn build:with-sourcemaps

# Start production
yarn start:prod
```

## Architecture Notes

- Monorepo structure with multiple applications and shared libraries
- Path aliases configured for clean imports (`@app/core`, `@app/prisma`, etc.)
- SWC compiler for fast builds and hot reloading
- Docker support with multi-stage builds for production
