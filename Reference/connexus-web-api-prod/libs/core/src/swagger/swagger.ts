import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export interface SwaggerOptions {
  title: string;
  description: string;
  version: string;
  apiPath?: string;
  apiRefPath?: string;
  servers?: {
    url: string;
    description: string;
  }[];
}

const defaultOptions: SwaggerOptions = {
  title: 'API',
  description: 'API description',
  version: '1.0',
  apiPath: 'api-docs',
  apiRefPath: 'api-reference',
};

/**
 * Creates Swagger documentation for a NestJS application
 * @param app NestJS application instance
 * @param options Swagger configuration options
 * @returns Swagger document
 */
export const createSwagger = (
  app: INestApplication,
  options: Partial<SwaggerOptions> = {},
): Record<string, any> => {
  const mergedOptions = { ...defaultOptions, ...options };

  const docConfig = new DocumentBuilder()
    .setTitle(mergedOptions.title)
    .setDescription(mergedOptions.description)
    .setVersion(mergedOptions.version)
    .addBearerAuth();

  if (mergedOptions.servers) {
    mergedOptions.servers.forEach((server) => {
      docConfig.addServer(server.url, server.description);
    });
  }

  const config = docConfig.build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(mergedOptions.apiPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      filter: true,
      showRequestDuration: true,
      docExpansion: 'none',
    },
    customSiteTitle: mergedOptions.title,
    jsonDocumentUrl: `/${mergedOptions.apiPath}/swagger.json`,
  });

  if (mergedOptions.apiRefPath) {
    app.use(
      `/${mergedOptions.apiRefPath}`,
      apiReference({
        theme: 'blue',
        spec: {
          content: document,
        },
        hideDownloadButton: true,
        defaultHttpClient: {
          targetKey: 'node',
          clientKey: 'fetch',
        },
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      }),
    );
  }

  return document;
};
