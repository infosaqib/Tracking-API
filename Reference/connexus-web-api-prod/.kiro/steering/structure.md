# Project Structure

## Monorepo Architecture

This is a NestJS monorepo with multiple applications and shared libraries following a domain-driven design approach.

## Applications (`apps/`)

### Primary Applications

- **`connexus-be/`**: Main API application (port 3000)
- **`sow-rfq/`**: Scope of Work and RFP/RFQ service (port 3004)
- **`background-jobs/`**: Asynchronous job processing service

### Application Structure

```
apps/[app-name]/
├── src/
│   ├── main.ts              # Application bootstrap
│   ├── [app-name].module.ts # Root module
│   └── services/            # Domain services
├── test/                    # E2E tests
├── Dockerfile              # Production container
├── Dockerfile.dev          # Development container
└── tsconfig.app.json       # App-specific TypeScript config
```

## Shared Libraries (`libs/`)

### Core Libraries

- **`core/`**: Bootstrap service, filters, constants, Swagger setup
- **`prisma/`**: Database client, extensions, and models
- **`shared/`**: Common utilities, DTOs, middlewares, AWS services
- **`guards/`**: Authentication and authorization guards
- **`ability/`**: CASL-based permission system
- **`health/`**: Health check endpoints and monitoring
- **`export-data/`**: Data export functionality

### Library Structure

```
libs/[lib-name]/
├── src/
│   ├── index.ts             # Public API exports
│   ├── [lib-name].module.ts # Library module
│   └── [domain-folders]/    # Domain-specific code
└── tsconfig.lib.json        # Library TypeScript config
```

## Service Organization

### Service Module Pattern

Each service follows a consistent structure:

```
services/[domain]/
├── [domain].controller.ts    # REST endpoints
├── [domain].service.ts       # Business logic
├── [domain].module.ts        # Module definition
├── dto/                      # Data Transfer Objects
│   ├── create-[domain].dto.ts
│   ├── update-[domain].dto.ts
│   └── get-[domain].dto.ts
└── helpers/                  # Domain-specific utilities
```

## Database & Migrations (`prisma/`)

```
prisma/
├── schema.prisma            # Database schema definition
├── migrations/              # Database migration files
├── seed/                    # Database seeding scripts
└── dbml/                    # Database documentation
```

## Configuration & Infrastructure

### Environment & Config

- **`.env`**: Environment variables
- **`.env.example`**: Environment template
- **`docker-compose.yml`**: Container orchestration

### Code Quality

- **`.eslintrc.js`**: ESLint configuration (Airbnb + TypeScript)
- **`.prettierrc`**: Code formatting rules
- **`.husky/`**: Git hooks for quality gates

## Path Aliases

Use configured path aliases for clean imports:

```typescript
import { PrismaService } from '@app/prisma';
import { CoreModule } from '@app/core';
import { GuardsModule } from '@app/guards';
import { SharedModule } from '@app/shared';
```

## Naming Conventions

- **Files & Folders**: kebab-case (`user-management.service.ts`)
- **Classes**: PascalCase (`UserManagementService`)
- **Variables & Functions**: camelCase (`getUserById`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_PAGE_SIZE`)
- **Interfaces**: PascalCase with 'I' prefix (`IUserConfig`)
- **Enums**: PascalCase (`UserStatus`)

## Module Dependencies

### Dependency Flow

```
Apps → Shared Libraries → Core Libraries → External Dependencies
```

### Import Rules

- Apps can import from any library
- Libraries should minimize cross-dependencies
- Use barrel exports (`index.ts`) for clean public APIs
- Prefer dependency injection over direct imports

## Creating New Components

### New Service

1. Create service folder in appropriate app's `services/` directory
2. Implement controller, service, module, and DTOs
3. Register module in parent module
4. Add path alias if creating new library

### New Library

1. Generate with NestJS CLI: `nest g library [name]`
2. Update `tsconfig.json` paths
3. Export public API through `index.ts`
4. Document in this structure guide
