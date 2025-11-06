import { Actions, caslSubjects, getAbilityFilters } from '@app/ability';
import { configs, messages } from '@app/core';
import { PrismaService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  Tenants,
  TenantTypes,
  TenantUserFilterTypes,
  VendorRegistrationType,
  VendorServiceType,
  VendorStages,
  VendorStatuses,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { selectValidKeys } from 'src/utils/prisma';
import {
  getVendorAdminPermissions,
  getVendorBranchAdminPermissions,
  getVendorFranchiseAdminPermissions,
} from '../permissions/data/utils/utils';
import { PermissionType } from '../permissions/dto/permissions.entity';
import { RoleLevel } from '../roles/dto/role-level';
import { CreateVendorDraftDto } from './dto/create-vendor-draft.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { GetSelectedVendorsDto } from './dto/get-selected-vendors.dto';
import { GetVendorsDto } from './dto/get-vendors.dto';
import { UpdateVendorServiceAreaDto } from './dto/update-vendor-service-area';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorWorkspaceResponse } from './entities/vendor.entity';
import {
  baseVendorSelect,
  transformChildCompany,
  transformVendorBase,
} from './utils/vendor.utils';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateVendorDto, user: RequestUser) {
    const { vendorServiceCoverContinentalUs = true, serviceableAreas } = input;

    if (input.legalName) {
      // Check if vendor with same legal name exists
      const existingVendor = await this.prisma.client.vendors.findFirst({
        where: {
          vendorLegalName: {
            equals: input.legalName,
            mode: 'insensitive',
          },
        },
      });

      if (existingVendor) {
        throw new ConflictException(
          `Vendor with legal name ${input.legalName} already exists`,
        );
      }
    }

    if (input.contacts && input.contacts.length) {
      const userEmail = input.contacts.find((c) => c.email)?.email;

      // Check user exists
      const userExists = await this.prisma.client.users.findMany({
        where: { email: userEmail },
      });

      if (userExists?.length) {
        throw new ConflictException(
          `User with email ${userEmail} already exists`,
        );
      }
    }

    if (
      vendorServiceCoverContinentalUs === false &&
      !serviceableAreas?.length
    ) {
      throw new BadRequestException(
        messages.errorMessages.serviceableAreasRequired,
      );
    }

    const tenantId = randomUUID();

    let parentTenant: Tenants | null = null;

    if (input.parentCompanyId) {
      parentTenant = await this.prisma.client.tenants.findFirstOrThrow({
        where: { vendorId: input.parentCompanyId, deletedAt: null },
      });
    }

    let permissions = getVendorAdminPermissions();

    if (input.type === TenantTypes.VENDOR_FRANCHISE) {
      permissions = getVendorFranchiseAdminPermissions();
    }

    if (input.type === TenantTypes.VENDOR_BRANCH) {
      permissions = getVendorBranchAdminPermissions();
    }

    const [, vendor] = await this.prisma.client.$transaction(async (prisma) => {
      // Create tenant first
      const t = await prisma.tenants.create({
        data: {
          id: tenantId,
          name: input.companyName,
          type: input.type,
          parentTenantId: parentTenant?.id,
          Roles: {
            create: {
              name: configs.role.admin,
              roleLevel: RoleLevel.Admin,
              readOnly: true,
              rolePermissions: {
                create: permissions.map((p) => ({
                  permissionsId: p.id,
                  creatorId: user?.connexus_user_id,
                })),
              },
            },
          },
        },
      });

      // Then create the vendor
      const v = await prisma.vendors.create({
        data: {
          name: input.companyName,
          logo: input.logoUrl,
          address: input.address,
          recognition: input.recognitionsAndLicenses,
          note: input.notes,
          vendorSource: input.leadSources,
          vendorLegalName: input.legalName,
          vendorZip: input.zip,
          vendorUnion: input.union,
          vendorWebsite: input.website,
          tenantId,
          cityId: input.cityId,
          stateId: input.stateId,
          countyId: input.countyId,
          countryId: input.countryId,
          stage: VendorStages.APPLYING,
          creatorId: user.connexus_user_id,
          vendorServiceCoverContinentalUs,
          parentCompanyId: input.parentCompanyId,
          certInsurance: null,
          vendorInsuranceNote: input.vendorInsuranceNote,
          vendorInsuranceCertificate: input.vendorInsuranceCertificate,
          vendorInsuranceExpiry: input.vendorInsuranceExpiry,
          status: input.status,
          companyType: input.companyType,
        },
        select: {
          id: true,
          name: true,
          logo: true,
          stage: true,
          address: true,
          recognition: true,
          certInsurance: true,
          companyType: true,
          note: true,
          vendorSource: true,
          vendorLegalName: true,
          vendorUnion: true,
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      // Create contacts
      const users = input.contacts.map((contact) => ({
        id: randomUUID(),
        firstName: contact.firstName,
        lastName: contact.lastName,
        fullName: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        phoneNumber: contact.phoneNumber,
        phoneCode: contact.phoneCode,
        phoneExtension: contact.phoneExtension,
        title: contact.title,
        isInternal: false,
        authorized: false,
        creatorId: user?.connexus_user_id,
        userTenants: {
          tenantId,
          contactType: contact.contactType,
          createdById: user?.connexus_user_id,
          isPrimaryTenant: true,
          tenantUserFilterType: TenantUserFilterTypes.VENDOR,
        },
      }));

      await prisma.users.createMany({
        // Strip user tenants from the users
        data: users.map((u) => ({
          ...u,
          userTenants: undefined,
        })),
      });

      // Add user tenants to the users
      await prisma.userTenants.createMany({
        data: users.map((u) => ({
          userId: u.id,
          tenantId,
          contactType: u.userTenants.contactType,
          createdById: user?.connexus_user_id,
          isPrimaryTenant: true,
          tenantUserFilterType: u.userTenants.tenantUserFilterType,
        })),
      });

      // Update tenant with vendor ID
      await prisma.tenants.update({
        where: { id: tenantId },
        data: {
          vendorId: v.id,
        },
      });

      if (input.services?.length) {
        await prisma.vendorServices.createMany({
          data: input.services.map((s) => ({
            vendorId: v.id,
            serviceId: s,
            vendorServiceType: VendorServiceType.PRIMARY_SERVICE,
          })),
        });
      }

      if (input.additionalServices?.length) {
        await prisma.vendorServices.createMany({
          data: input.additionalServices?.map((s) => ({
            vendorId: v.id,
            serviceId: s,
            vendorServiceType: VendorServiceType.ADDITIONAL_SERVICE,
          })),
        });
      }

      // Create serviceable areas
      if (
        vendorServiceCoverContinentalUs === false &&
        serviceableAreas?.length
      ) {
        await prisma.vendorServicableAreas.createMany({
          data: serviceableAreas.map((s) => ({
            countryId: s.countryId,
            stateId: s.stateId,
            cityId: s.cityId,
            countyId: s.countyId,
            vendorId: v.id,
            createdById: user?.connexus_user_id,
          })),
        });
      }

      return [t, v];
    });

    return vendor;
  }

  async findAll(input: GetVendorsDto, user: RequestUser) {
    const where: Prisma.VendorsWhereInput = {
      ...(input.stage && { stage: input.stage }),
      ...(input.vendorUnion && { vendorUnion: input.vendorUnion }),
      ...(input.tenantId && { tenantId: input.tenantId }),
      ...(input.vendorRegistrationType && {
        vendorRegistrationType: input.vendorRegistrationType,
      }),
    };

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { vendorLegalName: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    if (input.clientId) {
      // If approvalStatus is 'APPROVED', filter vendors that are approved for the client
      if (input.approvalStatus === 'APPROVED') {
        where.ApprovedClientVendors = {
          some: {
            clientId: input.clientId,
          },
        };
      }
      // If approvalStatus is 'NOT_APPROVED', filter vendors that are not approved for the client and not deleted
      else if (input.approvalStatus === 'NOT_APPROVED') {
        where.ClientNotApprovedVendors = {
          some: {
            clientId: input.clientId,
            isDeleted: false,
          },
        };
      }
      // If approvalStatus is not specified, exclude vendors that are not approved for the client and not deleted
      else if (!input.approvalStatus) {
        where.NOT = [
          {
            ClientNotApprovedVendors: {
              some: {
                clientId: input.clientId,
                isDeleted: false,
              },
            },
          },
        ];
      }
    }

    if (input.parentVendorIds?.length) {
      where.parentCompanyId = {
        in: input.parentVendorIds,
      };
    }

    if (input.tenantTypes?.length) {
      where.tenant = { type: { in: input.tenantTypes } };
    }

    if (input.serviceIds?.length) {
      where.vendorServices = {
        some: {
          serviceId: { in: input.serviceIds },
        },
      };
    }

    if (input?.status?.length) {
      where.status = { in: input.status };
    }

    if (input.registrationType) {
      where.vendorRegistrationType = input.registrationType;
    }

    if (input.hasChildren) {
      where.childCompanies = {
        some: {
          tenant: {
            type: TenantTypes.VENDOR,
          },
        },
      };
    }

    if (input.w9Attached === true) {
      where.vendorW9Url = {
        not: null,
      };
    } else if (input.w9Attached === false) {
      where.vendorW9Url = null;
    }

    if (input.coi === true) {
      where.certInsurance = {
        not: null,
      };
    } else if (input.coi === false) {
      where.certInsurance = null;
    }

    const orderBy = getSortInput({
      modelName: Prisma.ModelName.Vendors,
      sortDirection: input.sortDirection,
      sort: input.sort,
      defaultSort: 'createdAt',
      nestedSortLevel: 3,
    });

    const vendorsWhereInput = getAbilityFilters({
      user,
      condition: where,
      subject: caslSubjects.Vendor,
    });

    const [data, pagination] = await this.prisma.client.vendors
      .paginate({
        where: vendorsWhereInput,
        orderBy,
        select: {
          id: true,
          name: true,
          logo: true,
          stage: true,
          address: true,
          recognition: true,
          certInsurance: true,
          companyType: true,
          note: true,
          vendorSource: true,
          vendorLegalName: true,
          vendorUnion: true,
          vendorRegistrationType: true,
          certInsuranceExpiry: true,
          vendorInsuranceCertificate: true,
          vendorInsuranceExpiry: true,
          vendorInsuranceNote: true,
          county: {
            select: {
              id: true,
              name: true,
            },
          },
          parentCompany: {
            select: {
              id: true,
              name: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              _count: {
                select: {
                  userTenants: {
                    where: {
                      user: {
                        deletedAt: null,
                      },
                    },
                  },
                },
              },
              parentTenant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          vendorW9Url: true,
          status: true,
          city: {
            select: {
              id: true,
              cityName: true,
            },
          },
          state: {
            select: {
              id: true,
              stateName: true,
            },
          },
          vendorZip: true,
          vendorServiceCoverContinentalUs: true,
          vendorServices: {
            select: {
              service: {
                select: {
                  id: true,
                  servicesName: true,
                },
              },
            },
          },
        },
      })
      .withPages(getPaginationInput(input));

    return {
      data,
      pagination,
    };
  }

  async findSelectedVendors(input: GetSelectedVendorsDto) {
    const where: Prisma.VendorsWhereInput = {
      ...(input.vendorIds && { id: { in: input.vendorIds } }), // Primary filter for selected vendors
      ...(input.stage && { stage: input.stage }),
      ...(input.vendorUnion && { vendorUnion: input.vendorUnion }),
      ...(input.tenantId && { tenantId: input.tenantId }),
      ...(input.vendorRegistrationType && {
        vendorRegistrationType: input.vendorRegistrationType,
      }),
    };

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { vendorLegalName: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    if (input.clientId) {
      // If approvalStatus is 'APPROVED', filter vendors that are approved for the client
      if (input.approvalStatus === 'APPROVED') {
        where.ApprovedClientVendors = {
          some: {
            clientId: input.clientId,
          },
        };
      }
      // If approvalStatus is 'NOT_APPROVED', filter vendors that are not approved for the client and not deleted
      else if (input.approvalStatus === 'NOT_APPROVED') {
        where.ClientNotApprovedVendors = {
          some: {
            clientId: input.clientId,
            isDeleted: false,
          },
        };
      }
      // If approvalStatus is not specified, exclude vendors that are not approved for the client and not deleted
      else if (!input.approvalStatus) {
        where.NOT = [
          {
            ClientNotApprovedVendors: {
              some: {
                clientId: input.clientId,
                isDeleted: false,
              },
            },
          },
        ];
      }
    }

    if (input.parentVendorIds?.length) {
      where.parentCompanyId = {
        in: input.parentVendorIds,
      };
    }

    if (input.tenantTypes?.length) {
      where.tenant = { type: { in: input.tenantTypes } };
    }

    if (input.serviceIds?.length) {
      where.vendorServices = {
        some: {
          serviceId: { in: input.serviceIds },
        },
      };
    }

    if (input?.status?.length) {
      where.status = { in: input.status };
    }

    if (input.registrationType) {
      where.vendorRegistrationType = input.registrationType;
    }

    if (input.hasChildren) {
      where.childCompanies = {
        some: {
          tenant: {
            type: TenantTypes.VENDOR,
          },
        },
      };
    }

    if (input.w9Attached === true) {
      where.vendorW9Url = {
        not: null,
      };
    } else if (input.w9Attached === false) {
      where.vendorW9Url = null;
    }

    if (input.coi === true) {
      where.certInsurance = {
        not: null,
      };
    } else if (input.coi === false) {
      where.certInsurance = null;
    }

    const orderBy = getSortInput({
      modelName: Prisma.ModelName.Vendors,
      sortDirection: input.sortDirection,
      sort: input.sort,
      defaultSort: 'createdAt',
      nestedSortLevel: 3,
    });

    const [data, pagination] = await this.prisma.client.vendors
      .paginate({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          logo: true,
          stage: true,
          address: true,
          recognition: true,
          certInsurance: true,
          companyType: true,
          note: true,
          vendorSource: true,
          vendorLegalName: true,
          vendorUnion: true,
          vendorRegistrationType: true,
          certInsuranceExpiry: true,
          vendorInsuranceCertificate: true,
          vendorInsuranceExpiry: true,
          vendorInsuranceNote: true,
          county: {
            select: {
              id: true,
              name: true,
            },
          },
          parentCompany: {
            select: {
              id: true,
              name: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              _count: {
                select: {
                  userTenants: {
                    where: {
                      user: {
                        deletedAt: null,
                      },
                    },
                  },
                },
              },
              parentTenant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          vendorW9Url: true,
          status: true,
          city: {
            select: {
              id: true,
              cityName: true,
            },
          },
          state: {
            select: {
              id: true,
              stateName: true,
            },
          },
          vendorZip: true,
          vendorServiceCoverContinentalUs: true,
          vendorServices: {
            select: {
              service: {
                select: {
                  id: true,
                  servicesName: true,
                },
              },
            },
          },
        },
      })
      .withPages(getPaginationInput(input));

    return {
      data,
      pagination,
    };
  }

  async findAllBasic(input: GetVendorsDto) {
    const where: any = {};

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { legalName: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    if (input.status && input.status.length > 0) {
      where.status = { in: input.status };
    }

    if (input.type && input.type.length > 0) {
      where.type = { in: input.type };
    }

    if (input.tenantId) {
      where.tenantId = input.tenantId;
    }

    if (input.stage) {
      where.stage = input.stage;
    }

    if (input.tenantTypes?.length) {
      where.tenant = { type: { in: input.tenantTypes } };
    }

    if (input.parentVendorIds?.length) {
      where.parentCompanyId = {
        in: input.parentVendorIds,
      };
    }

    if (input.tenantTypes?.length) {
      where.tenant = { type: { in: input.tenantTypes } };
    }

    if (input.serviceIds?.length) {
      where.vendorServices = {
        some: {
          serviceId: { in: input.serviceIds },
        },
      };
    }

    if (input?.status?.length) {
      where.status = { in: input.status };
    }

    if (input.registrationType) {
      where.vendorRegistrationType = input.registrationType;
    }

    const data = await this.prisma.client.vendors.findMany({
      where,
      select: {
        id: true,
        name: true,
        vendorLegalName: true,
        accountant: {
          select: {
            id: true,
            email: true,
          },
        },
        vendorWebsite: true,
        tenant: {
          select: {
            id: true,
            name: true,
            type: true,
            _count: {
              select: {
                userTenants: {
                  where: {
                    user: {
                      deletedAt: null,
                    },
                  },
                },
              },
            },
            parentTenant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return data;
  }

  async findOne(id: string) {
    const vendor = await this.prisma.client.vendors.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        logo: true,
        stage: true,
        address: true,
        recognition: true,
        certInsurance: true,
        companyType: true,
        note: true,
        vendorSource: true,
        vendorLegalName: true,
        vendorW9Url: true,
        vendorOwnership: true,
        vendorExperience: true,
        vendorSocialSecurityNumber: true,
        vendorServiceCoverContinentalUs: true,
        vendorInterestedReceiveRfpOutside: true,
        vendorZip: true,
        vendorUnion: true,
        accountantId: true,
        vendorEin: true,
        vendorWebsite: true,
        parentCompanyId: true,
        certInsuranceExpiry: true,
        vendorInsuranceNote: true,
        vendorInsuranceCertificate: true,
        vendorInsuranceExpiry: true,
        accountant: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            title: true,
            phoneCode: true,
            firstName: true,
            lastName: true,
            phoneExtension: true,
          },
        },
        childCompanies: {
          select: {
            id: true,
            name: true,
          },
        },
        vendorServices: {
          select: {
            vendorServiceType: true,
            service: {
              select: {
                id: true,
                servicesName: true,
              },
            },
          },
        },
        vendorRegistrationType: true,
        parentCompany: {
          select: {
            id: true,
            name: true,
            logo: true,
            companyType: true,
          },
        },
        vendorNotes: true,
        status: true,
        cityId: true,
        stateId: true,
        countyId: true,
        countryId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        city: {
          select: {
            id: true,
            cityName: true,
          },
        },
        state: {
          select: {
            id: true,
            stateName: true,
          },
        },
        county: {
          select: {
            id: true,
            name: true,
          },
        },
        country: {
          select: {
            id: true,
            countryName: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return {
      ...vendor,
      vendorServices: vendor.vendorServices.filter(
        (vs) => vs.vendorServiceType === VendorServiceType.PRIMARY_SERVICE,
      ),
      additionalServices: vendor.vendorServices.filter(
        (vs) => vs.vendorServiceType === VendorServiceType.ADDITIONAL_SERVICE,
      ),
    };
  }

  async update(id: string, input: UpdateVendorDto, user: RequestUser) {
    const vendor = await this.prisma.client.vendors.findFirst({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    let { accountantId } = input;

    const hasAccountant =
      accountantId ||
      (input.accountantFirstName &&
        input.accountantLastName &&
        input.accountantEmail);

    if (hasAccountant) {
      // Handle accountant creation if new accountant details are provided
      if (!accountantId) {
        // Check if user with email already exists
        if (input.accountantEmail) {
          const existingUser = await this.prisma.client.users.findFirst({
            where: {
              email: {
                equals: input.accountantEmail,
                mode: 'insensitive',
              },
            },
          });

          if (existingUser) {
            throw new ConflictException(
              `User with email ${input.accountantEmail} already exists`,
            );
          }
        }

        // Create new user for accountant
        const newUser = await this.prisma.client.users.create({
          data: {
            firstName: input.accountantFirstName,
            lastName: input.accountantLastName,
            fullName: `${input.accountantFirstName} ${input.accountantLastName}`,
            email: input.accountantEmail,
            phoneNumber: input.accountantPhone,
            phoneCode: input.accountantPhoneCode,
            phoneExtension: input.accountantPhoneExtension,
            isInternal: false,
            authorized: false,
            creatorId: user.connexus_user_id,
            userTenants: {
              create: {
                tenantId: vendor.tenantId,
                isPrimaryTenant: true,
                tenantUserFilterType: TenantUserFilterTypes.VENDOR,
                createdById: user.connexus_user_id,
              },
            },
          },
        });
        accountantId = newUser.id;
      }
    }

    return this.prisma.client.$transaction(async (prisma) => {
      const updatedVendor = await prisma.vendors.update({
        where: { id },
        data: {
          name: input.companyName,
          logo: input.logoUrl,
          address: input.address,
          recognition: input.recognitionsAndLicenses,
          certInsurance: input.certInsurance,
          companyType: input.companyType,
          note: input.notes,
          vendorSource: input.leadSources,
          vendorLegalName: input.legalName,
          vendorW9Url: input.vendorW9Url,
          vendorOwnership: input.vendorOwnership, // Only update if provided
          vendorExperience: input.vendorExperience,
          vendorSocialSecurityNumber: input.vendorSocialSecurityNumber,
          vendorInterestedReceiveRfpOutside:
            input.vendorInterestedReceiveRfpOutside,
          vendorZip: input.zip,
          vendorUnion: input.union,
          accountantId,
          vendorEin: input.vendorEin,
          vendorWebsite: input.website,
          cityId: input.cityId,
          stateId: input.stateId,
          countyId: input.countyId,
          countryId: input.countryId,
          certInsuranceExpiry: input.certInsuranceExpiry,
          updaterId: user.connexus_user_id,
          vendorInsuranceNote: input.vendorInsuranceNote,
          vendorInsuranceExpiry: input.vendorInsuranceExpiry,
          vendorInsuranceCertificate: input.vendorInsuranceCertificate,
          status: input.status,
        },
        select: {
          id: true,
          ...selectValidKeys({
            schema: Prisma.ModelName.Vendors,
            keys: Object.keys(input),
          }),
        },
      });

      if (input.parentCompanyId !== undefined) {
        let parentCompanyId: null | string = null;
        let parentTenantId: null | string = null;

        if (input.parentCompanyId) {
          const parentCompany = await prisma.vendors.findUnique({
            where: { id: input.parentCompanyId },
          });

          if (!parentCompany) {
            throw new NotFoundException(
              `Parent company with ID ${input.parentCompanyId} not found`,
            );
          }

          parentCompanyId = parentCompany.id;
          parentTenantId = parentCompany.tenantId;
        }

        await prisma.vendors.update({
          where: { id: vendor.id },
          data: {
            parentCompanyId,
          },
        });

        await prisma.tenants.update({
          where: { id: vendor.tenantId },
          data: {
            parentTenantId,
          },
        });
      }

      // Update services
      if (input.services && input.additionalServices) {
        const createServiceInput: Prisma.VendorServicesCreateManyInput[] = [];

        input.services.forEach((service) => {
          createServiceInput.push({
            vendorId: vendor.id,
            serviceId: service,
            createdById: user.connexus_user_id,
            vendorServiceType: VendorServiceType.PRIMARY_SERVICE,
          });
        });

        input.additionalServices?.forEach((service) => {
          createServiceInput.push({
            vendorId: vendor.id,
            serviceId: service,
            createdById: user.connexus_user_id,
            vendorServiceType: VendorServiceType.ADDITIONAL_SERVICE,
          });
        });

        const promiseMap = await Promise.all(
          createServiceInput.map((i) =>
            prisma.vendorServices.upsert({
              where: {
                vendorId_serviceId: {
                  vendorId: vendor.id,
                  serviceId: i.serviceId,
                },
              },
              create: i,
              update: i,
            }),
          ),
        );
        await Promise.all(promiseMap);

        await prisma.vendorServices.deleteMany({
          where: {
            vendorId: vendor.id,
            serviceId: {
              notIn: createServiceInput.map((i) => i.serviceId),
            },
          },
        });
      }

      return updatedVendor;
    });
  }

  async remove(id: string, user: RequestUser) {
    const vendor = await this.prisma.client.vendors.findFirst({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    // Soft delete by updating the stage to INACTIVE
    return this.prisma.client.vendors.update({
      where: { id },
      data: {
        stage: VendorStages.IN_ACTIVE,
        updaterId: user.connexus_user_id,
      },
    });
  }

  async updateStatus(
    vendorId: string,
    input: UpdateVendorStatusDto,
    user: RequestUser,
  ) {
    const vendor = await this.prisma.client.vendors.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    // Check if the status is different
    if (vendor.status === input.status) {
      throw new ConflictException(
        `Vendor with ID ${vendorId} already has status ${input.status}`,
      );
    }

    const updatedVendor = await this.prisma.client.vendors.update({
      where: { id: vendorId },
      data: {
        status: input.status,
        updaterId: user.connexus_user_id,
      },
    });

    return updatedVendor;
  }

  checkVendorCreationPermission(type: TenantTypes, user: RequestUser) {
    const { ability } = user;

    let canCreate = false;

    if (type === TenantTypes.VENDOR) {
      canCreate = ability.can(Actions.Create, caslSubjects.Vendor);
    }

    if (type === TenantTypes.VENDOR_FRANCHISE) {
      canCreate = ability.can(Actions.Create, caslSubjects.VendorFranchise);
    }

    if (type === TenantTypes.VENDOR_BRANCH) {
      canCreate = ability.can(Actions.Create, caslSubjects.VendorBranch);
    }

    if (!canCreate) {
      throw new ForbiddenException(messages.errorMessages.forbidden);
    }
  }

  // Update vendor service area
  async updateVendorServiceArea(
    id: string,
    input: UpdateVendorServiceAreaDto,
    user: RequestUser,
  ) {
    // Check if vendor exists
    const vendor = await this.prisma.client.vendors.findUnique({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.prisma.client.$transaction(async (tx) => {
      // Update vendor's continental US coverage status
      await tx.vendors.update({
        where: { id },
        data: {
          vendorServiceCoverContinentalUs:
            input.vendorServiceCoverContinentalUs,
          vendorInterestedReceiveRfpOutside:
            input.vendorInterestedReceiveRfpOutside,
        },
      });

      // If vendor covers continental US, delete all existing serviceable areas
      if (input.vendorServiceCoverContinentalUs) {
        await tx.vendorServicableAreas.deleteMany({
          where: { vendorId: id },
        });
        return;
      }

      // If not covering continental US, validate serviceable areas
      if (!input.serviceableAreas?.length) {
        throw new BadRequestException(
          messages.errorMessages.serviceableAreasRequired,
        );
      }

      // Get existing serviceable areas
      const existingAreas = await tx.vendorServicableAreas.findMany({
        where: { vendorId: id },
      });

      // Create a unique key for each area to compare
      const getAreaKey = (area: any) =>
        `${area.stateId}-${area.cityId || ''}-${area.countyId || ''}-${area.countryId || ''}`;

      const inputAreaKeys = input.serviceableAreas.map(getAreaKey);

      // Find areas to remove (those not in input)
      const areasToRemove = existingAreas.filter(
        (area) => !inputAreaKeys.includes(getAreaKey(area)),
      );

      // Remove areas not in input
      if (areasToRemove.length) {
        await tx.vendorServicableAreas.deleteMany({
          where: {
            id: {
              in: areasToRemove.map((area) => area.id),
            },
          },
        });
      }

      // Create new serviceable areas
      await tx.vendorServicableAreas.createMany({
        data: input.serviceableAreas.map((area) => ({
          vendorId: id,
          countryId: area.countryId,
          stateId: area.stateId,
          cityId: area.cityId,
          countyId: area.countyId,
          createdById: user.connexus_user_id,
        })),
        skipDuplicates: true,
      });
    });

    return { message: 'Vendor service area updated successfully' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getServiceableAreas(id: string, user: RequestUser) {
    const vendor = await this.prisma.client.vendors.findFirstOrThrow({
      where: { id },
      select: {
        vendorServiceCoverContinentalUs: true,
        vendorInterestedReceiveRfpOutside: true,
        vendorServicableAreas: {
          select: {
            id: true,
            state: {
              select: {
                id: true,
                stateName: true,
              },
            },
            city: {
              select: {
                id: true,
                cityName: true,
              },
            },
            county: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return vendor;
  }

  async createDraft(input: CreateVendorDraftDto, user: RequestUser) {
    const tenantId = randomUUID();
    const { name, clientId } = input;

    const [, vendor] = await this.prisma.client.$transaction(async (prisma) => {
      // Create tenant first
      const t = await prisma.tenants.create({
        data: {
          id: tenantId,
          name,
          type: TenantTypes.VENDOR,
          Roles: {
            create: {
              name: configs.role.admin,
              roleLevel: RoleLevel.Admin,
              readOnly: true,
              rolePermissions: {
                create: getVendorAdminPermissions().map((p) => ({
                  permissionsId: p.id,
                  creatorId: user?.connexus_user_id,
                })),
              },
            },
          },
        },
      });

      // Then create the vendor
      const v = await prisma.vendors.create({
        data: {
          name,
          tenantId,
          stage: VendorStages.APPLYING,
          status: VendorStatuses.DRAFT,
          vendorRegistrationType: VendorRegistrationType.CLIENT_ONBOARDED,
          createdByClientId: clientId,
          creatorId: user.connexus_user_id,
        },
        select: {
          id: true,
          name: true,
          stage: true,
          status: true,
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      // Update tenant with vendor ID
      await prisma.tenants.update({
        where: { id: tenantId },
        data: {
          vendorId: v.id,
        },
      });

      return [t, v];
    });

    return vendor;
  }

  private getVendorWhereWithPermission = (
    user: RequestUser,
    where: Prisma.VendorsWhereInput,
  ) => {
    return getAbilityFilters({
      user,
      condition: where,
      subject: caslSubjects.Vendor,
    });
  };

  async getVendorWorkSpaces(user: RequestUser) {
    let vendors: Array<VendorWorkspaceResponse> = [];
    let logo: string;

    if (user.user_type === PermissionType.vendorBranch) {
      const branches = await this.prisma.client.vendors.findMany({
        where: this.getVendorWhereWithPermission(user, {
          tenant: {
            type: TenantTypes.VENDOR_BRANCH,
            userTenants: {
              some: {
                userId: user.connexus_user_id,
              },
            },
          },
        }),
        select: baseVendorSelect(user.connexus_user_id),
        orderBy: {
          createdAt: 'asc',
        },
      });

      const parentCompanyId = branches[0]?.parentCompanyId;

      if (parentCompanyId) {
        const parentCompany = await this.prisma.client.vendors.findFirst({
          where: { id: parentCompanyId },
        });

        logo = parentCompany?.logo;
      }

      vendors = branches.map((b) => ({
        ...transformVendorBase(b),
      }));
    }

    if (user.user_type === PermissionType.vendor) {
      const parentVendor = await this.prisma.client.vendors.findFirst({
        where: this.getVendorWhereWithPermission(user, {
          tenant: {
            type: TenantTypes.VENDOR,
            userTenants: {
              some: {
                userId: user.connexus_user_id,
              },
            },
          },
        }),
        select: {
          id: true,
          tenantId: true,
          childCompanies: {
            where: {
              tenant: {
                type: TenantTypes.VENDOR,
              },
            },
            select: {
              id: true,
              tenantId: true,
              logo: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
      });

      const vendorIds = [
        parentVendor.id,
        ...parentVendor.childCompanies.map((c) => c.id),
      ];

      const vendor = await this.prisma.client.vendors.findMany({
        where: this.getVendorWhereWithPermission(user, {
          id: {
            in: vendorIds,
          },
        }),
        select: {
          ...baseVendorSelect(),
          tenant: {
            select: {
              id: true,
              name: true,
              type: true,
              userTenants: {
                where: {
                  userId: user.connexus_user_id,
                },
                select: {
                  isPrimaryTenant: true,
                },
              },
            },
          },
          childCompanies: {
            where: {
              OR: [
                this.getVendorWhereWithPermission(user, {
                  tenant: {
                    type: {
                      in: [TenantTypes.VENDOR_BRANCH],
                    },
                  },
                }),
                {
                  tenant: {
                    type: TenantTypes.VENDOR_FRANCHISE,
                  },
                },
              ],
            },
            select: {
              ...baseVendorSelect(),
              tenantId: true,
            },
            orderBy: {
              createdAt: Prisma.SortOrder.desc,
            },
          },
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
      });

      vendors = vendor.map((v) => ({
        ...transformVendorBase(v),
        branches: v.childCompanies
          .filter((c) => c.tenant.type === TenantTypes.VENDOR_BRANCH)
          .map(transformChildCompany),
        franchises: v.childCompanies
          .filter((c) => c.tenant.type === TenantTypes.VENDOR_FRANCHISE)
          .map(transformChildCompany),
      }));
    }

    if (user.user_type === PermissionType.vendorFranchise) {
      const franchises = await this.prisma.client.vendors.findMany({
        where: this.getVendorWhereWithPermission(user, {
          tenant: {
            type: TenantTypes.VENDOR_FRANCHISE,
            userTenants: {
              some: {
                userId: user.connexus_user_id,
              },
            },
          },
        }),
        select: baseVendorSelect(user.connexus_user_id),
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
      });

      vendors = franchises.map(transformVendorBase);

      const parentCompanyId = franchises[0]?.parentCompanyId;

      if (parentCompanyId) {
        const parentCompany = await this.prisma.client.vendors.findFirst({
          where: { id: parentCompanyId },
          select: {
            logo: true,
          },
        });

        logo = parentCompany?.logo;
      }
    }

    const userType = user.user_type.toUpperCase() as TenantTypes;

    const { writableTenants = [] } = user;

    // Add hasWritePermission flag to each vendor, branch, and franchise
    vendors = vendors.map((vendor) => ({
      ...vendor,
      hasWritePermission: writableTenants.includes(vendor.tenantId),
      branches:
        vendor.branches?.map((branch) => ({
          ...branch,
          hasWritePermission: writableTenants.includes(branch.tenantId),
        })) || [],
      franchises:
        vendor.franchises?.map((franchise) => ({
          ...franchise,
          hasWritePermission: writableTenants.includes(franchise.tenantId),
        })) || [],
    }));

    return {
      userType,
      vendors: userType === TenantTypes.VENDOR ? vendors : [],
      branches: userType === TenantTypes.VENDOR_BRANCH ? vendors : [],
      franchises: userType === TenantTypes.VENDOR_FRANCHISE ? vendors : [],
      logo,
    };
  }
}
