import { AppAbility } from '@app/ability';
import { RequestUser } from '@app/shared';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VendorStages, VendorUnionTypes } from '@prisma/client';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

describe('VendorsService', () => {
  let service: VendorsService;
  let prisma: PrismaClientService;

  const mockUser: RequestUser = {
    connexus_user_id: 'test-user-id',
    Username: 'testuser',
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    tenant_id: 'test-tenant-id',
    user_type: 'test-user-type',
    sub: 'test-sub',
    ability: {} as AppAbility,
  };

  const mockVendor = {
    id: 'test-vendor-id',
    name: 'Test Vendor',
    logo: 'http://example.com/logo.png',
    stage: VendorStages.APPLYING,
    address: '123 Test St',
    recognition: 'Test Recognition',
    certInsurance: 'Test Insurance',
    tenantId: 'test-tenant-id',
    cityId: 'test-city-id',
    stateId: 'test-state-id',
    countyId: 'test-county-id',
    countryId: 'test-country-id',
    createdAt: new Date(),
    modifiedAt: new Date(),
  };

  const mockCreateVendorDto: CreateVendorDto = {
    name: 'Test Vendor',
    logo: 'http://example.com/logo.png',
    address: '123 Test St',
    recognition: 'Test Recognition',
    certInsurance: 'Test Insurance',
    tenantId: 'test-tenant-id',
    cityId: 'test-city-id',
    stateId: 'test-state-id',
    countyId: 'test-county-id',
    countryId: 'test-country-id',
  };

  const mockUpdateVendorDto: UpdateVendorDto = {
    name: 'Updated Vendor',
    logo: 'http://example.com/updated-logo.png',
  };

  const mockPrismaService = {
    client: {
      vendors: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        paginate: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        {
          provide: PrismaClientService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
    prisma = module.get<PrismaClientService>(PrismaClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a vendor', async () => {
      mockPrismaService.client.vendors.create.mockResolvedValue(mockVendor);

      const result = await service.create(mockCreateVendorDto, mockUser);

      expect(result).toEqual(mockVendor);
      expect(mockPrismaService.client.vendors.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockCreateVendorDto.name,
          stage: VendorStages.APPLYING,
          creatorId: mockUser.connexus_user_id,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated vendors', async () => {
      const mockPaginatedResult = {
        data: [mockVendor],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      mockPrismaService.client.vendors.paginate.mockReturnValue({
        withPages: jest.fn().mockResolvedValue([
          [mockVendor],
          {
            total: 1,
            page: 1,
            limit: 10,
          },
        ]),
      });

      const result = await service.findAll({
        page: 1,
        limit: 10,
        stage: VendorStages.APPLYING,
        vendorUnion: VendorUnionTypes.UNION,
      });

      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return a vendor by id', async () => {
      mockPrismaService.client.vendors.findFirst.mockResolvedValue(mockVendor);

      const result = await service.findOne('test-vendor-id');

      expect(result).toEqual(mockVendor);
    });

    it('should throw NotFoundException when vendor not found', async () => {
      mockPrismaService.client.vendors.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a vendor', async () => {
      mockPrismaService.client.vendors.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.client.vendors.update.mockResolvedValue({
        ...mockVendor,
        name: mockUpdateVendorDto.name,
      });

      const result = await service.update(
        'test-vendor-id',
        mockUpdateVendorDto,
        mockUser,
      );

      expect(result.name).toBe(mockUpdateVendorDto.name);
    });

    it('should throw NotFoundException when vendor not found', async () => {
      mockPrismaService.client.vendors.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', mockUpdateVendorDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a vendor', async () => {
      mockPrismaService.client.vendors.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.client.vendors.update.mockResolvedValue({
        ...mockVendor,
        stage: VendorStages.IN_ACTIVE,
      });

      const result = await service.remove('test-vendor-id', mockUser);

      expect(result.stage).toBe(VendorStages.IN_ACTIVE);
    });

    it('should throw NotFoundException when vendor not found', async () => {
      mockPrismaService.client.vendors.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent-id', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
