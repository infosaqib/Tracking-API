/* eslint-disable @typescript-eslint/no-use-before-define */
import { PrismaService } from '@app/prisma';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  VendorServiceType,
  VendorStages,
  VendorStatuses,
} from '@prisma/client';
import * as request from 'supertest';
import { VendorMatchType } from './dto/potential-vendor-response.dto';
import { RfpModule } from './rfp.module';

describe('RfpController - Potential Vendors (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test data IDs
  const testRfpId = 'test-rfp-123';
  const testPropertyId = 'test-property-456';
  const testServiceId = 'test-service-789';
  const testVendorId = 'test-vendor-123';
  const testStateId = 'test-state-123';
  const testCityId = 'test-city-456';
  const testCountyId = 'test-county-789';
  const testTenantId = 'test-tenant-123';
  const testClientId = 'test-client-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RfpModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // Clean up test data
    await cleanupTestData();

    // Set up test data
    await setupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  async function cleanupTestData() {
    // Clean up in reverse dependency order
    await prismaService.client.rfpProperties.deleteMany({
      where: { rfpId: testRfpId },
    });
    await prismaService.client.vendorServicableAreas.deleteMany({
      where: { vendorId: testVendorId },
    });
    await prismaService.client.vendorServices.deleteMany({
      where: { vendorId: testVendorId },
    });
    await prismaService.client.vendors.deleteMany({
      where: { id: testVendorId },
    });
    await prismaService.client.rfps.deleteMany({
      where: { id: testRfpId },
    });
    await prismaService.client.clientProperties.deleteMany({
      where: { id: testPropertyId },
    });
    await prismaService.client.services.deleteMany({
      where: { id: testServiceId },
    });
    await prismaService.client.client.deleteMany({
      where: { id: testClientId },
    });
    await prismaService.client.cities.deleteMany({
      where: { id: testCityId },
    });
    await prismaService.client.states.deleteMany({
      where: { id: testStateId },
    });
    await prismaService.client.tenants.deleteMany({
      where: { id: testTenantId },
    });
  }

  async function setupTestData() {
    // Create tenant
    await prismaService.client.tenants.create({
      data: {
        id: testTenantId,
        name: 'Test Tenant',
        type: 'CONNEXUS',
      },
    });

    // Create client
    await prismaService.client.client.create({
      data: {
        id: testClientId,
        name: 'Test Client',
        tenantId: testTenantId,
      },
    });

    // Create state
    await prismaService.client.states.create({
      data: {
        id: testStateId,
        stateName: 'Test State',
        countryId: 'default-country-id', // Assuming a default country exists
      },
    });

    // Create city
    await prismaService.client.cities.create({
      data: {
        id: testCityId,
        cityName: 'Test City',
        stateId: testStateId,
      },
    });

    // Create service
    await prismaService.client.services.create({
      data: {
        id: testServiceId,
        servicesName: 'Test Service',
        status: 'ACTIVE',
      },
    });

    // Create property
    await prismaService.client.clientProperties.create({
      data: {
        id: testPropertyId,
        name: 'Test Property',
        clientId: testClientId,
        tenantId: testTenantId,
        stateId: testStateId,
        cityId: testCityId,
        countyId: testCountyId,
        status: 'ACTIVE',
        type: 'OFFICE',
      },
    });

    // Create RFP
    await prismaService.client.rfps.create({
      data: {
        id: testRfpId,
        rfpName: 'Test RFP',
        description: 'Test RFP Description',
        clientId: testClientId,
        serviceId: testServiceId,
        portfolioType: 'SINGLE_PROPERTY',
        status: 'DRAFT',
      },
    });

    // Create RFP-Property association
    await prismaService.client.rfpProperties.create({
      data: {
        rfpId: testRfpId,
        clientPropertyId: testPropertyId,
        createdById: 'test-user-id',
      },
    });

    // Create vendor
    await prismaService.client.vendors.create({
      data: {
        id: testVendorId,
        name: 'Test Vendor',
        status: VendorStatuses.ACTIVE,
        stage: VendorStages.CNX_APPROVED,
        tenantId: testTenantId,
        stateId: testStateId,
        cityId: testCityId,
        address: '123 Test Street',
        vendorWebsite: 'https://testvendor.com',
      },
    });

    // Create vendor service
    await prismaService.client.vendorServices.create({
      data: {
        vendorId: testVendorId,
        serviceId: testServiceId,
        vendorServiceType: VendorServiceType.PRIMARY_SERVICE,
        tenantId: testTenantId,
      },
    });

    // Create vendor serviceable area (state-wide coverage)
    await prismaService.client.vendorServicableAreas.create({
      data: {
        vendorId: testVendorId,
        countryId: 'default-country-id',
        stateId: testStateId,
        createdById: 'test-user-id',
      },
    });
  }

  describe('GET /:rfpId/properties/:propertyId/potential-vendors', () => {
    it('should return potential vendors successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const vendor = response.body.data[0];
      expect(vendor).toHaveProperty('id', testVendorId);
      expect(vendor).toHaveProperty('name', 'Test Vendor');
      expect(vendor).toHaveProperty('status', VendorStatuses.ACTIVE);
      expect(vendor).toHaveProperty('stage', VendorStages.CNX_APPROVED);
      expect(vendor).toHaveProperty(
        'matchType',
        VendorMatchType.STATE_WIDE_COVERAGE,
      );
      expect(vendor).toHaveProperty('matchingServiceableArea');
    });

    it('should return 404 for non-existent RFP', async () => {
      const nonExistentRfpId = 'non-existent-rfp';

      const response = await request(app.getHttpServer())
        .get(
          `/rfp/${nonExistentRfpId}/properties/${testPropertyId}/potential-vendors`,
        )
        .expect(404);

      expect(response.body.message).toBe('RFP not found');
    });

    it('should return 404 for non-existent property', async () => {
      const nonExistentPropertyId = 'non-existent-property';

      const response = await request(app.getHttpServer())
        .get(
          `/rfp/${testRfpId}/properties/${nonExistentPropertyId}/potential-vendors`,
        )
        .expect(404);

      expect(response.body.message).toBe('Property not found');
    });

    it('should return 404 when property is not associated with RFP', async () => {
      // Create another property not associated with the RFP
      const unassociatedPropertyId = 'unassociated-property';
      await prismaService.client.clientProperties.create({
        data: {
          id: unassociatedPropertyId,
          name: 'Unassociated Property',
          clientId: testClientId,
          tenantId: testTenantId,
          stateId: testStateId,
          status: 'ACTIVE',
          type: 'OFFICE',
        },
      });

      const response = await request(app.getHttpServer())
        .get(
          `/rfp/${testRfpId}/properties/${unassociatedPropertyId}/potential-vendors`,
        )
        .expect(404);

      expect(response.body.message).toBe(
        'Property is not associated with this RFP',
      );

      // Cleanup
      await prismaService.client.clientProperties.delete({
        where: { id: unassociatedPropertyId },
      });
    });

    it('should filter vendors by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .query({ status: [VendorStatuses.ACTIVE] })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(VendorStatuses.ACTIVE);
    });

    it('should filter vendors by stage', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .query({ stage: [VendorStages.CNX_APPROVED] })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].stage).toBe(VendorStages.CNX_APPROVED);
    });

    it('should return empty results when filtering by non-matching status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .query({ status: [VendorStatuses.INACTIVE] })
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.pagination).toHaveProperty('itemsPerPage', 5);
      expect(response.body.pagination).toHaveProperty('totalItems');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should handle sorting correctly', async () => {
      // Create another vendor for sorting test
      const secondVendorId = 'second-vendor-456';
      await prismaService.client.vendors.create({
        data: {
          id: secondVendorId,
          name: 'Another Vendor',
          status: VendorStatuses.ACTIVE,
          stage: VendorStages.CNX_APPROVED,
          tenantId: testTenantId,
          stateId: testStateId,
        },
      });

      await prismaService.client.vendorServices.create({
        data: {
          vendorId: secondVendorId,
          serviceId: testServiceId,
          vendorServiceType: VendorServiceType.PRIMARY_SERVICE,
          tenantId: testTenantId,
        },
      });

      await prismaService.client.vendorServicableAreas.create({
        data: {
          vendorId: secondVendorId,
          countryId: 'default-country-id',
          stateId: testStateId,
          createdById: 'test-user-id',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .query({ sort: 'name', sortDirection: 'asc' })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Another Vendor');
      expect(response.body.data[1].name).toBe('Test Vendor');

      // Cleanup
      await prismaService.client.vendorServicableAreas.deleteMany({
        where: { vendorId: secondVendorId },
      });
      await prismaService.client.vendorServices.deleteMany({
        where: { vendorId: secondVendorId },
      });
      await prismaService.client.vendors.delete({
        where: { id: secondVendorId },
      });
    });

    it('should handle continental US coverage vendors', async () => {
      // Update vendor to have continental US coverage
      await prismaService.client.vendors.update({
        where: { id: testVendorId },
        data: { vendorServiceCoverContinentalUs: true },
      });

      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .expect(200);

      expect(response.body.data[0].matchType).toBe(
        VendorMatchType.CONTINENTAL_US_COVERAGE,
      );
      expect(response.body.data[0].vendorServiceCoverContinentalUs).toBe(true);
    });

    it('should handle outside RFP interest vendors', async () => {
      // Update vendor to be interested in outside RFPs
      await prismaService.client.vendors.update({
        where: { id: testVendorId },
        data: { vendorInterestedReceiveRfpOutside: true },
      });

      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .expect(200);

      expect(response.body.data[0].matchType).toBe(
        VendorMatchType.OUTSIDE_RFP_INTEREST,
      );
      expect(response.body.data[0].vendorInterestedReceiveRfpOutside).toBe(
        true,
      );
    });

    it('should handle city-specific coverage vendors', async () => {
      // Update serviceable area to be city-specific
      await prismaService.client.vendorServicableAreas.updateMany({
        where: { vendorId: testVendorId },
        data: { cityId: testCityId },
      });

      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .expect(200);

      expect(response.body.data[0].matchType).toBe(
        VendorMatchType.CITY_COVERAGE,
      );
      expect(response.body.data[0].matchingServiceableArea.cityId).toBe(
        testCityId,
      );
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rfp/${testRfpId}/properties/${testPropertyId}/potential-vendors`)
        .query({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.message).toContain('status');
    });

    it('should return 400 for invalid UUID format', async () => {
      const invalidUuid = 'invalid-uuid';

      await request(app.getHttpServer())
        .get(
          `/rfp/${invalidUuid}/properties/${testPropertyId}/potential-vendors`,
        )
        .expect(400);
    });
  });
});
