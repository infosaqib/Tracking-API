// Vercel serverless function handler for NestJS
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

let app;

async function bootstrap() {
    if (app) {
        return app;
    }

    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    // Import AppModule from compiled dist
    const { AppModule } = require('../dist/app.module');

    const nestApp = await NestFactory.create(AppModule, adapter, {
        logger: false, // Disable default logger for serverless
    });

    const configService = nestApp.get(require('@nestjs/config').ConfigService);
    const apiVersion = configService.get('API_VERSION', 'v1');
    const nodeEnv = configService.get('NODE_ENV', 'production');

    // Security
    nestApp.use(require('helmet')());
    nestApp.use(require('compression')());

    // CORS
    const corsOrigins = configService.get('CORS_ORIGIN', '*').split(',');
    nestApp.enableCors({
        origin: corsOrigins,
        credentials: true,
    });

    // Global validation pipe
    nestApp.useGlobalPipes(
        new (require('@nestjs/common').ValidationPipe)({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global filters
    const { HttpExceptionFilter } = require('../dist/common/filters/http-exception.filter');
    nestApp.useGlobalFilters(new HttpExceptionFilter());

    // Global interceptors
    const { ResponseInterceptor } = require('../dist/common/interceptors/response.interceptor');
    nestApp.useGlobalInterceptors(new ResponseInterceptor());

    // Setup Swagger and Scalar API Reference
    if (nodeEnv !== 'production') {
        const { createSwagger } = require('../dist/common/swagger/swagger.config');
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        createSwagger(nestApp, {
            title: 'Tracking API',
            description:
                'Comprehensive e-commerce tracking API with real-time updates and multi-carrier support',
            version: apiVersion,
            apiPath: 'api-docs',
            apiRefPath: 'api-reference',
            baseUrl: baseUrl,
            servers: [
                {
                    url: `${baseUrl}/api/${apiVersion}`,
                    description: 'API Server',
                },
                {
                    url: baseUrl,
                    description: 'Local Server',
                },
            ],
        });
    }

    // Global prefix
    nestApp.setGlobalPrefix(`api/${apiVersion}`);

    // Health check endpoint (outside of global prefix)
    expressApp.get('/health', (req, res) => {
        res.json({
            success: true,
            message: 'API is running',
            timestamp: new Date().toISOString(),
            version: apiVersion,
            environment: nodeEnv,
        });
    });

    // Root endpoint
    expressApp.get('/', (req, res) => {
        res.json({
            success: true,
            message: 'Tracking API',
            version: apiVersion,
            documentation: '/api-docs',
            health: '/health',
        });
    });

    await nestApp.init();
    app = expressApp;
    return app;
}

module.exports = async (req, res) => {
    const expressApp = await bootstrap();
    expressApp(req, res);
};
