## Key Components

1. **src**: The `src` folder contains the main source code for the application.

2. **services**: The `services` folder contains service-related modules, each responsible for a specific domain or functionality.

   - `service-a`: Services related to domain A.
     - `service-a.service.ts`: Contains the implementation of domain A services, such as creation, retrieval, update, and deletion.
   - `service-b`: Services related to domain B.
     - `service-b.service.ts`: Implements services for managing domain B entities, such as creating, retrieving, updating, and deleting.
     - `dto`: Contains Data Transfer Objects (DTOs) for input validation and data transfer.
       - `get-service-b.dto.ts`: Defines the DTO for retrieving domain B entities.
   - `service-c`: Services related to domain C.
     - `service-c.service.ts`: Implements services for managing domain C entities, such as creating, retrieving, updating, and deleting.
     - `service-c-helpers.ts`: Contains helper functions or utility modules specific to domain C.
   - `service-d`: Services related to domain D.
     - `service-d.service.ts`: Implements services for managing domain D entities, such as creating, retrieving, updating, and deleting.

3. **libs**: The `libs` folder contains shared libraries or utility modules.

- `lib-a`: Library A-related extensions and client service.
  - `lib-a.extension.ts`: Defines Library A extensions or custom functionality.
  - `lib-a-client.service.ts`: Provides a service for interacting with Library A client.

4. **prisma**: The `prisma` folder at the root level contains the Prisma schema file (`schema.prisma`), which defines the database schema and models.

5. **DTOs**: DTOs (Data Transfer Objects) are used for input validation and data transfer. They are located in the `dto` folder within the respective module (e.g., `property-services/dto`).

6. **Helpers**: Helper functions or utility modules are placed in separate files within the respective module (e.g., `properties/property-helpers.ts`).

## Naming Convention

The project follows a naming convention of using kebab-case for folder and file names.

## Database Management

The project utilizes Prisma as an ORM (Object-Relational Mapping) tool for database management. The Prisma schema file (`schema.prisma`) defines the database schema and models.

Prisma provides a type-safe and efficient way to interact with the database. It generates a client based on the defined schema, which can be used in the application to perform database operations.

The `prisma-client.service.ts` file in the `libs/prisma` folder provides a service for interacting with the Prisma client. It encapsulates the Prisma client instance and exposes methods for executing database queries and transactions.

## Conclusion

The project's folder structure promotes modularity, separation of concerns, and code organization. By dividing the codebase into modules and services, it enhances maintainability and scalability.

The `services` folder contains domain-specific modules, each responsible for a particular functionality. The `libs` folder houses shared libraries and utility modules that can be used across different parts of the application.

The use of Prisma simplifies database management and provides a type-safe way to interact with the database. The Prisma schema file defines the database schema, and the Prisma client service encapsulates the database operations.

By following this folder structure and leveraging the power of NestJS and Prisma, the project aims to deliver a robust and maintainable application.

## Creating a New App in the Monorepo

To create a new application within this monorepo, follow these steps:

1. **Create a New Module:**

   - Navigate to the `apps` directory.
   - Create a new folder for your application, e.g., `my-new-app`.
   - Inside this folder, create a `src` directory for your source code.

2. **Set Up the Main Module:**

   - Create a `main.ts` file in the `src` directory.
   - Use the following template to set up the main module:

     ```typescript
     import { BootstrapService } from '@app/core';
     import { NestFactory } from '@nestjs/core';
     import { MyNewAppModule } from './my-new-app.module';

     async function bootstrap() {
       const app = await NestFactory.create(MyNewAppModule);

       const bootstrapService = app.get(BootstrapService);
       const port = bootstrapService.getBasePort() + 1; // Adjust port as needed

       await bootstrapService.bootstrap(app, {
         port,
         swaggerOptions: {
           title: 'My New App API',
           description: 'Description of My New App API',
           version: '1.0',
         },
       });
     }

     bootstrap();
     ```

3. **Define the Application Module:**

   - Create a `my-new-app.module.ts` file in the `src` directory.
   - Define your application module and import necessary modules.

4. **Use the Core Library for Bootstrapping:**

   - The `BootstrapService` from the core library is used to handle common bootstrapping tasks such as setting the port and configuring Swagger.

5. **Add Application Logic:**

   - Follow the modular architecture guidelines to add controllers, services, and other components.
   - Use the `services` and `libs` directories for shared logic and utilities.

6. **Run the Application:**

   - Use the following command to start your new application:

     ```bash
     $ yarn run start:my-new-app
     ```

By following these steps, you can create a new application within the monorepo and leverage the core library for consistent bootstrapping and configuration.
