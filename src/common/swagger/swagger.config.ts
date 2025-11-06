import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export interface SwaggerOptions {
  title: string;
  description: string;
  version: string;
  apiPath?: string;
  apiRefPath?: string;
  baseUrl?: string;
  servers?: {
    url: string;
    description: string;
  }[];
}

const defaultOptions: SwaggerOptions = {
  title: 'Tracking API',
  description: 'Comprehensive e-commerce tracking API with real-time updates and multi-carrier support',
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
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management')
    .addTag('orders', 'Order management')
    .addTag('tracking', 'Tracking endpoints')
    .addTag('webhooks', 'Webhook management');

  if (mergedOptions.servers) {
    mergedOptions.servers.forEach((server) => {
      docConfig.addServer(server.url, server.description);
    });
  }

  const config = docConfig.build();
  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI at /api-docs
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

  // Serve OpenAPI JSON first (needed for Scalar)
  app.getHttpAdapter().get(`/${mergedOptions.apiPath}/swagger.json`, (req, res) => {
    res.json(document);
  });

  // Custom CSS for sans-serif font
  const customCss = `
    * {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
    }
    #scalar-api-reference {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
    }
  `;

  // Setup Scalar API Reference at /api-reference
  if (mergedOptions.apiRefPath && mergedOptions.baseUrl) {
    const openApiUrl = `${mergedOptions.baseUrl}/${mergedOptions.apiPath}/swagger.json`;
    app.use(
      `/${mergedOptions.apiRefPath}`,
      apiReference({
        spec: {
          url: openApiUrl,
        },
        hideDownloadButton: false,
        customCss: customCss,
      }),
    );
  } else if (mergedOptions.apiRefPath) {
    // Fallback to content if no baseUrl provided
    app.use(
      `/${mergedOptions.apiRefPath}`,
      apiReference({
        spec: {
          content: document,
        },
        hideDownloadButton: false,
        customCss: customCss,
      }),
    );
  }

  // Serve Postman collection JSON generated from OpenAPI
  app.getHttpAdapter().get(`/${mergedOptions.apiPath}/postman.json`, async (req, res) => {
    try {
      // Lazy import to avoid startup cost if not used
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const o2p = require('openapi-to-postmanv2');
      o2p.convert(
        { type: 'json', data: document },
        { includeExample: true, folderStrategy: 'tags' },
        (err: any, conversionResult: any) => {
          if (err || !conversionResult?.result) {
            return res.status(500).json({ 
              success: false, 
              message: 'Conversion failed', 
              error: err || conversionResult 
            });
          }
          return res.json(conversionResult.output[0].data);
        },
      );
    } catch (e) {
      res.status(500).json({ 
        success: false, 
        message: 'openapi-to-postmanv2 not installed', 
        error: String(e) 
      });
    }
  });

  return document;
};

