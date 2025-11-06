import { AppAbility } from '@app/ability';
import { RequestUser } from '@app/shared';
import { Test, TestingModule } from '@nestjs/testing';
import { VendorStages } from '@prisma/client';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

describe('VendorsController', () => {
  let controller: VendorsController;
  let service: VendorsService;

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
    stage: VendorStages.APPLYING,
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
  };

  const mockVendorsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllBasic: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorsController],
      providers: [
        {
          provide: VendorsService,
          useValue: mockVendorsService,
        },
      ],
    }).compile();

    controller = module.get<VendorsController>(VendorsController);
    service = module.get<VendorsService>(VendorsService);
  });

  describe('create', () => {
    it('should create a vendor', async () => {
      mockVendorsService.create.mockResolvedValue(mockVendor);

      const result = await controller.create(mockCreateVendorDto, mockUser);

      expect(result).toEqual(mockVendor);
      expect(mockVendorsService.create).toHaveBeenCalledWith(
        mockCreateVendorDto,
        mockUser,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of vendors', async () => {
      const mockPaginatedResult = {
        data: [mockVendor],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      mockVendorsService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll({ page: 1, limit: 10 }, mockUser);

      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findAllBasic', () => {
    it('should return basic vendor information', async () => {
      const mockBasicVendors = [
        {
          id: 'test-vendor-id',
          name: 'Test Vendor',
          vendorLegalName: 'Test Vendor Legal Name',
          vendorWebsite: 'http://example.com',
          tenant: {
            id: 'test-tenant-id',
            name: 'Test Tenant',
            type: 'VENDOR',
          },
          accountant: {
            id: 'test-accountant-id',
            email: 'accountant@example.com',
          },
        },
      ];

      mockVendorsService.findAllBasic.mockResolvedValue(mockBasicVendors);

      const result = await controller.findAllBasic({
        search: 'Test',
        status: ['ACTIVE'],
      });

      expect(result).toEqual(mockBasicVendors);
      expect(mockVendorsService.findAllBasic).toHaveBeenCalledWith({
        search: 'Test',
        status: ['ACTIVE'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a vendor', async () => {
      mockVendorsService.findOne.mockResolvedValue(mockVendor);

      const result = await controller.findOne('test-vendor-id');

      expect(result).toEqual(mockVendor);
      expect(mockVendorsService.findOne).toHaveBeenCalledWith('test-vendor-id');
    });
  });

  describe('update', () => {
    it('should update a vendor', async () => {
      const updatedVendor = { ...mockVendor, name: 'Updated Vendor' };
      mockVendorsService.update.mockResolvedValue(updatedVendor);

      const result = await controller.update(
        'test-vendor-id',
        mockUpdateVendorDto,
        mockUser,
      );

      expect(result).toEqual(updatedVendor);
      expect(mockVendorsService.update).toHaveBeenCalledWith(
        'test-vendor-id',
        mockUpdateVendorDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a vendor', async () => {
      const deletedVendor = { ...mockVendor, stage: VendorStages.IN_ACTIVE };
      mockVendorsService.remove.mockResolvedValue(deletedVendor);

      const result = await controller.remove('test-vendor-id', mockUser);

      expect(result).toEqual(deletedVendor);
      expect(mockVendorsService.remove).toHaveBeenCalledWith(
        'test-vendor-id',
        mockUser,
      );
    });
  });
});
