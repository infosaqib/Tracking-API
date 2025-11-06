import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HealthModule } from '../health.module';

describe('Health Integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        HealthModule.forRoot({
          database: { timeout: 5000 },
          memory: { heapThreshold: 100 * 1024 * 1024 },
          disk: { thresholdPercent: 0.9, path: '/' },
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return health check results', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('details');
      expect(['ok', 'error', 'shutting_down']).toContain(response.body.status);
    });

    it('should include all configured health checks', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details).toHaveProperty('database');
      expect(response.body.details).toHaveProperty('memory_heap');
      expect(response.body.details).toHaveProperty('storage');
    });

    it('should have consistent response structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Verify response structure matches expected format
      expect(response.body).toMatchObject({
        status: expect.stringMatching(/^(ok|error|shutting_down)$/),
        details: expect.objectContaining({
          database: expect.objectContaining({
            status: expect.stringMatching(/^(up|down)$/),
          }),
          memory_heap: expect.objectContaining({
            status: expect.stringMatching(/^(up|down)$/),
          }),
          storage: expect.objectContaining({
            status: expect.stringMatching(/^(up|down)$/),
          }),
        }),
      });
    });
  });

  describe('Custom Configuration', () => {
    it('should work with custom enabled checks', async () => {
      await app.close();

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          HealthModule.forRoot({
            enabledChecks: ['memory', 'disk'],
          }),
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details).not.toHaveProperty('database');
      expect(response.body.details).toHaveProperty('memory_heap');
      expect(response.body.details).toHaveProperty('storage');
    });
  });

  describe('Async Configuration', () => {
    it('should work with forRootAsync', async () => {
      await app.close();

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          HealthModule.forRootAsync({
            useFactory: () => ({
              database: { timeout: 3000 },
              enabledChecks: ['database'],
            }),
          }),
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details).toHaveProperty('database');
      expect(response.body.details).not.toHaveProperty('memory_heap');
      expect(response.body.details).not.toHaveProperty('storage');
    });
  });
});
