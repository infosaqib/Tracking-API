import { PrismaService } from '@app/prisma';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  VendorServiceType,
  VendorStages,
  VendorStatuses,
} from '@prisma/client';
import { GetPotentialVendorsDto } from './dto/get-potential-vendors.dto';
import { VendorMatchType } from './dto/potential-vendor-response.dto';
import { RfpService } from './rfp.service';

describe('RfpService - getPotentialVendors', () => {
  let service: RfpService;
  let mockPrismaService: jest.Mocked<PrismaService>;

  const mockRfpId = 'rfp-123';
  const mockPropertyId = 'property-456';
  const mockServiceId = 'service-789';

  const mockRfp = {
    id: mockRfpId,
    serviceId: mockServiceId,
  };

  const mockProperty = {
    id: mockPropertyId,
    stateId: 'state-123',
    cityId: 'city-456',
    countyId: 'county-789',
  };

  const mockRfpProperty = {
    id: 'rfp-property-123',
  };

  const mockVendor = {
    id: 'vendor-123',
    name: 'Test Vendor',
    logo: 'logo-url',
    status: VendorStatuses.ACTIVE,
    stage: VendorStages.CNX_APPROVED,
    address: '123 Test St',
    vendorWebsite: 'https://test.com',
    vendorServiceCoverContinentalUs: false,
    vendorInterestedReceiveRfpOutside: false,
    city: {
      id: 'city-456',
      cityName: 'Test City',
    },
    state: {
      id: 'state-123',
      stateName: 'Test State',
    },
    country: {
      id: 'country-123',
      countryName: 'Test Country',
    },
    parentCompany: {
      id: 'parent-123',
      name: 'Parent Company',
    },
    tenant: {
      id: 'tenant-123',
      name: 'Test Tenant',
      parentTenant: {
        id: 'parent-tenant-123',
        name: 'Parent Tenant',
      },
    },
    vendorServices: [
      {
        vendorServiceType: VendorServiceType.PRIMARY_SERVICE,
        service: {
          id: mockServiceId,
          servicesName: 'Test Service',
        },
      },
    ],
    vendorServicableAreas: [
      {
        id: 'area-123',
        stateId: 'state-123',
        cityId: null,
        countyId: null,
      },
    ],
  };

  beforeEach(async () => {
    const mockPrismaClient = {
      rfps: {
        findUnique: jest.fn(),
      },
      clientProperties: {
        findUnique: jest.fn(),
      },
      rfpProperties: {
        findFirst: jest.fn(),
      },
      vendors: {
        paginate: jest.fn().mockReturnValue({
          withPages: jest.fn(),
        }),
      },
    };

    mockPrismaService = {
      client: mockPrismaClient,
    } as any;

    const mockSqsService = {
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfpService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: 'SqsService',
          useValue: mockSqsService,
        },
      ],
    }).compile();

    service = module.get<RfpService>(RfpService);
  });

  describe('getPotentialVendors', () => {
    const mockQuery: GetPotentialVendorsDto = {
      page: 1,
      limit: 10,
    };

    beforeEach(() => {
      mockPrismaService.client.rfps.findUnique.mockResolvedValue(mockRfp);
      mockPrismaService.client.clientProperties.findUnique.mockResolvedValue(
        mockProperty,
      );
      mockPrismaService.client.rfpProperties.findFirst.mockResolvedValue(
        mockRfpProperty,
      );
      mockPrismaService.client.vendors.paginate.mockReturnValue({
        withPages: jest.fn().mockResolvedValue([
          [mockVendor],
          {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 10,
          },
        ]),
      } as any);
    });

    it('should successfully return potential vendors', async () => {
      const result = await service.getPotentialVendors(
        mockRfpId,
        mockPropertyId,
        mockQuery,
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'vendor-123',
        name: 'Test Vendor',
        status: VendorStatuses.ACTIVE,
        stage: VendorStages.CNX_APPROVED,
        matchType: VendorMatchType.STATE_WIDE_COVERAGE,
      });
      expect(result.pagination).toBeDefined();
    });

    it('should throw NotFoundException when RFP is not found', async () => {
      mockPrismaService.client.rfps.findUnique.mockResolvedValue(null);

      await expect(
        service.getPotentialVendors(mockRfpId, mockPropertyId, mockQuery),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getPotentialVendors(mockRfpId, mockPropertyId, mockQuery),
      ).rejects.toThrow('RFP not found');
    });

    it('should throw NotFoundException when property is not found', async () => {
      mockPrismaService.client.clientProperties.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.getPotentialVendors(mockRfpId, mockPropertyId, mockQuery),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getPotentialVendors(mockRfpId, mockPropertyId, mockQuery),
      ).rejects.toThrow('Property not found');
    });

    it('should throw NotFoundException when property is not associated with RFP', async () => {
      mockPrismaService.client.rfpProperties.findFirst.mockResolvedValue(null);

      await expect(
        service.getPotentialVendors(mockRfpId, mockPropertyId, mockQuery),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getPotentialVendors(mockRfpId, mockPropertyId, mockQuery),
      ).rejects.toThrow('Property is not associated with this RFP');
    });

    it('should apply status filters correctly', async () => {
      const queryWithFilters: GetPotentialVendorsDto = {
        ...mockQuery,
        status: [VendorStatuses.ACTIVE],
      };

      await service.getPotentialVendors(
        mockRfpId,
        mockPropertyId,
        queryWithFilters,
      );

      expect(mockPrismaService.client.vendors.paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [VendorStatuses.ACTIVE] },
          }),
        }),
      );
    });

    it('should apply stage filters correctly', async () => {
      const queryWithFilters: GetPotentialVendorsDto = {
        ...mockQuery,
        stage: [VendorStages.CNX_APPROVED],
      };

      await service.getPotentialVendors(
        mockRfpId,
        mockPropertyId,
        queryWithFilters,
      );

      expect(mockPrismaService.client.vendors.paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stage: { in: [VendorStages.CNX_APPROVED] },
          }),
        }),
      );
    });

    it('should include service filter in vendor query', async () => {
      await service.getPotentialVendors(mockRfpId, mockPropertyId, mockQuery);

      expect(mockPrismaService.client.vendors.paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vendorServices: {
              some: {
                serviceId: mockServiceId,
              },
            },
          }),
        }),
      );
    });

    it('should handle continental US coverage vendors', async () => {
      const continentalUSVendor = {
        ...mockVendor,
        vendorServiceCoverContinentalUs: true,
      };

      mockPrismaService.client.vendors.paginate.mockReturnValue({
        withPages: jest.fn().mockResolvedValue([
          [continentalUSVendor],
          {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 10,
          },
        ]),
      } as any);

      const result = await service.getPotentialVendors(
        mockRfpId,
        mockPropertyId,
        mockQuery,
      );

      expect(result.data[0].matchType).toBe(
        VendorMatchType.CONTINENTAL_US_COVERAGE,
      );
    });

    it('should handle outside RFP interest vendors', async () => {
      const outsideRfpVendor = {
        ...mockVendor,
        vendorInterestedReceiveRfpOutside: true,
      };

      mockPrismaService.client.vendors.paginate.mockReturnValue({
        withPages: jest.fn().mockResolvedValue([
          [outsideRfpVendor],
          {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 10,
          },
        ]),
      } as any);

      const result = await service.getPotentialVendors(
        mockRfpId,
        mockPropertyId,
        mockQuery,
      );

      expect(result.data[0].matchType).toBe(
        VendorMatchType.OUTSIDE_RFP_INTEREST,
      );
    });

    it('should handle city-specific coverage vendors', async () => {
      const cityVendor = {
        ...mockVendor,
        vendorServicableAreas: [
          {
            id: 'area-city',
            stateId: 'state-123',
            cityId: 'city-456',
            countyId: null,
          },
        ],
      };

      mockPrismaService.client.vendors.paginate.mockReturnValue({
        withPages: jest.fn().mockResolvedValue([
          [cityVendor],
          {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            itemsPerPage: 10,
          },
        ]),
      } as any);

      const result = await service.getPotentialVendors(
        mockRfpId,
        mockPropertyId,
        mockQuery,
      );

      expect(result.data[0].matchType).toBe(VendorMatchType.CITY_COVERAGE);
      expect(result.data[0].matchingServiceableArea).toEqual({
        id: 'area-city',
        stateId: 'state-123',
        cityId: 'city-456',
        countyId: null,
      });
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.client.vendors.paginate.mockImplementation(() => {
        throw dbError;
      });

      await expect(
        service.getPotentialVendors(mockRfpId, mockPropertyId, mockQuery),
      ).rejects.toThrow('Failed to retrieve potential vendors');
    });

    it('should apply pagination correctly', async () => {
      const paginatedQuery: GetPotentialVendorsDto = {
        page: 2,
        limit: 5,
      };

      await service.getPotentialVendors(
        mockRfpId,
        mockPropertyId,
        paginatedQuery,
      );

      expect(
        mockPrismaService.client.vendors.paginate().withPages,
      ).toHaveBeenCalledWith({
        skip: 5, // (page - 1) * limit
        take: 5,
      });
    });

    it('should apply sorting correctly', async () => {
      const sortedQuery: GetPotentialVendorsDto = {
        ...mockQuery,
        sort: 'name',
        sortDirection: 'desc',
      };

      await service.getPotentialVendors(mockRfpId, mockPropertyId, sortedQuery);

      expect(mockPrismaService.client.vendors.paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({
            name: 'desc',
          }),
        }),
      );
    });
  });
});
