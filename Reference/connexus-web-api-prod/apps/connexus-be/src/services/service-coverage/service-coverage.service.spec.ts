import { PrismaService } from '@app/prisma';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCoverageService } from './service-coverage.service';

const mockVendorServiceAreas = [
  {
    id: 'area-1',
    vendorId: 'vendor-1',
    stateId: 'state-1',
    cityId: 'city-1',
    countyId: null,
    countryId: 'country-1',
    vendor: {
      tenantId: 'tenant-1',
      vendorServices: [
        {
          serviceId: 'service-1',
          service: {
            id: 'service-1',
            servicesName: 'Test Service',
          },
        },
      ],
    },
  },
];

const mockPrismaService = {
  vendorServicableAreas: {
    findMany: jest.fn(),
  },
  serviceUnitCoverage: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockEventEmitter = {
  on: jest.fn(),
  emit: jest.fn(),
};

describe('ServiceCoverageService', () => {
  let service: ServiceCoverageService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceCoverageService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<ServiceCoverageService>(ServiceCoverageService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleUpdateVendorServiceAreaCoverage', () => {
    it('should process vendor service areas and create coverage successfully', async () => {
      // Mock data
      const payload = { vendorId: 'vendor-1' };

      mockPrismaService.vendorServicableAreas.findMany.mockResolvedValue(
        mockVendorServiceAreas,
      );

      // Mock transaction
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          serviceUnitCoverage: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'coverage-1',
              tenantId: 'tenant-1',
              serviceId: 'service-1',
              geoScope: 'CITY',
              geoId: 'city-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        };

        return await callback(tx);
      });

      // Call the method
      await service.handleUpdateVendorServiceAreaCoverage(payload);

      // Verify interactions
      expect(
        mockPrismaService.vendorServicableAreas.findMany,
      ).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-1' },
        include: {
          vendor: {
            include: {
              vendorServices: {
                include: {
                  service: true,
                },
              },
            },
          },
        },
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();

      // No event emission for success case
    });

    it('should handle case when no service areas are found', async () => {
      const payload = { vendorId: 'vendor-1' };

      mockPrismaService.vendorServicableAreas.findMany.mockResolvedValue([]);

      await service.handleUpdateVendorServiceAreaCoverage(payload);

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should handle existing coverage (not create duplicate)', async () => {
      const payload = { vendorId: 'vendor-1' };

      mockPrismaService.clientvendorServicableAreas.findMany.mockResolvedValue(
        mockVendorServiceAreas,
      );
      mockPrismaService.serviceUnitCoverage.findFirst.mockResolvedValue({
        id: 'existing-coverage',
        tenantId: 'tenant-1',
        serviceId: 'service-1',
        geoScope: 'CITY',
        geoId: 'city-1',
      });

      await service.handleUpdateVendorServiceAreaCoverage(payload);

      expect(
        mockPrismaService.serviceUnitCoverage.create,
      ).not.toHaveBeenCalled();
      // No event emission for success case
    });

    it('should handle errors and throw them', async () => {
      const payload = { vendorId: 'vendor-1' };
      const errorMessage = 'Database connection failed';

      mockPrismaService.vendorServicableAreas.findMany.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        service.handleUpdateVendorServiceAreaCoverage(payload),
      ).rejects.toThrow(errorMessage);
    });

    it('should determine correct geo scope based on available location data', async () => {
      const payload = { vendorId: 'vendor-1' };
      const serviceAreasWithCounty = [
        {
          ...mockVendorServiceAreas[0],
          cityId: null,
          countyId: 'county-1',
        },
      ];

      mockPrismaService.vendorServicableAreas.findMany.mockResolvedValue(
        serviceAreasWithCounty,
      );

      // Mock transaction with county scope
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          serviceUnitCoverage: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'coverage-1',
              tenantId: 'tenant-1',
              serviceId: 'service-1',
              geoScope: 'COUNTY',
              geoId: 'county-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        };

        return await callback(tx);
      });

      await service.handleUpdateVendorServiceAreaCoverage(payload);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();

      // No event emission for success case
    });
  });
});
