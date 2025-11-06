import { Actions, caslSubjects, getAbilityFilters } from '@app/ability';
import { ThrowCaslForbiddenError } from '@app/ability/helpers/casl-helpers';
import { createSubject } from '@app/ability/helpers/create-subject';
import { configs } from '@app/core';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContactType,
  Prisma,
  TenantTypes,
  TenantUserFilterTypes,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  getClientAdminPermissions,
  getpPopertyMangerPermissions,
  isFalse,
} from '../permissions/data/utils/utils';
import { RoleLevel } from '../roles/dto/role-level';
import { CreateClientDto } from './dto/create-client.dto';
import { GetClientsDto } from './dto/get-clients.dto';
import { GetParentCompaniesDto } from './dto/get-parent-companies.';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateThemeHeaderImageDto } from './dto/update-theme-header-image.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prismaService: PrismaClientService) {}

  async update(
    id: string,
    updateClientDto: UpdateClientDto,
    user: RequestUser,
  ) {
    const client = await this.prismaService.client.client.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: {
        tenants: true,
        ApprovedClientVendors: {
          select: {
            vendorId: true,
          },
        },
      },
    });

    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Update,
      createSubject(caslSubjects.Client, client),
    );

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Check if the legal name is different
    if (
      updateClientDto.legalName &&
      client.legalName !== updateClientDto.legalName
    ) {
      const clientWithLegalName =
        await this.prismaService.client.client.findFirst({
          where: {
            legalName: {
              equals: updateClientDto.legalName,
              mode: 'insensitive',
            },
            deletedAt: null,
          },
        });

      if (clientWithLegalName) {
        throw new ConflictException(
          `Client with legal name ${updateClientDto.legalName} already exists`,
        );
      }
    }

    if (
      updateClientDto.parentTenantId &&
      updateClientDto.parentTenantId === id
    ) {
      throw new ConflictException(
        `Parent tenant ID cannot be the same as the client ID`,
      );
    }

    // Validate approved vendors
    const onlyApprovedVendors =
      updateClientDto.onlyApprovedVendors ?? client.onlyApprovedVendors;
    if (!onlyApprovedVendors && updateClientDto.approvedVendorIds?.length) {
      throw new ConflictException(
        'Approved vendors can only be added when onlyApprovedVendors is true',
      );
    }

    const nonApprovedVendors =
      updateClientDto.nonApprovedVendors ?? client.nonApprovedVendors;
    if (!nonApprovedVendors && updateClientDto.nonApprovedVendorIds?.length) {
      throw new ConflictException(
        'Non approved vendors can only be added when nonApprovedVendors is true',
      );
    }

    // Check for overlapping vendor IDs between approved and non-approved vendors in the update payload
    if (
      updateClientDto.approvedVendorIds?.length &&
      updateClientDto.nonApprovedVendorIds?.length
    ) {
      const approvedSet = new Set(updateClientDto.approvedVendorIds);
      const nonApprovedSet = new Set(updateClientDto.nonApprovedVendorIds);

      const overlappingIds = [...approvedSet].filter((vendorId) =>
        nonApprovedSet.has(vendorId),
      );

      if (overlappingIds.length > 0) {
        throw new ConflictException(
          `Vendor IDs [${overlappingIds.join(', ')}] cannot be both approved and non-approved for the same client`,
        );
      }
    }

    // Single query to get current vendor relationships for efficient validation
    const currentVendorRelationships =
      await this.prismaService.client.$transaction([
        this.prismaService.client.approvedClientVendors.findMany({
          where: { clientId: id },
          select: { vendorId: true },
        }),
        this.prismaService.client.clientNotApprovedVendor.findMany({
          where: { clientId: id },
          select: { vendorId: true },
        }),
      ]);

    const [currentApprovedVendors, currentNonApprovedVendors] =
      currentVendorRelationships;
    const currentApprovedSet = new Set(
      currentApprovedVendors.map((v) => v.vendorId),
    );
    const currentNonApprovedSet = new Set(
      currentNonApprovedVendors.map((v) => v.vendorId),
    );

    // Validate approved vendors against current non-approved list (excluding those being moved)
    if (updateClientDto.approvedVendorIds?.length) {
      const newApprovedSet = new Set(updateClientDto.approvedVendorIds);
      const conflictingNonApproved = updateClientDto.approvedVendorIds.filter(
        (vendorId) =>
          currentNonApprovedSet.has(vendorId) && !newApprovedSet.has(vendorId),
      );

      if (conflictingNonApproved.length > 0) {
        throw new ConflictException(
          `Vendors [${conflictingNonApproved.join(', ')}] are already in the non-approved list. Please remove them first.`,
        );
      }
    }

    // Validate non-approved vendors against current approved list (excluding those being moved)
    if (updateClientDto.nonApprovedVendorIds?.length) {
      const newNonApprovedSet = new Set(updateClientDto.nonApprovedVendorIds);
      const conflictingApproved = updateClientDto.nonApprovedVendorIds.filter(
        (vendorId) =>
          currentApprovedSet.has(vendorId) && !newNonApprovedSet.has(vendorId),
      );

      if (conflictingApproved.length > 0) {
        throw new ConflictException(
          `Vendors [${conflictingApproved.join(', ')}] are already in the approved list. Please remove them first.`,
        );
      }
    }

    const updatedClient = await this.prismaService.client.$transaction(
      async (prisma) => {
        if (
          updateClientDto.onlyApprovedVendors &&
          updateClientDto.approvedVendorIds
        ) {
          // Hadle approved vendors
          if (onlyApprovedVendors) {
            await prisma.approvedClientVendors.deleteMany({
              where: {
                clientId: id,
                vendorId: {
                  notIn: updateClientDto.approvedVendorIds,
                },
              },
            });

            const createData: Prisma.ApprovedClientVendorsCreateManyInput[] =
              updateClientDto.approvedVendorIds.map((d) => ({
                clientId: client.id,
                vendorId: d,
              }));

            await prisma.approvedClientVendors.createMany({
              skipDuplicates: true,
              data: createData,
            });
          }
        } else if (isFalse(updateClientDto.onlyApprovedVendors)) {
          await prisma.approvedClientVendors.deleteMany({
            where: {
              clientId: id,
            },
          });
        }

        if (
          updateClientDto.nonApprovedVendors &&
          updateClientDto.nonApprovedVendorIds
        ) {
          if (nonApprovedVendors) {
            await prisma.clientNotApprovedVendor.deleteMany({
              where: {
                clientId: id,
                vendorId: {
                  notIn: updateClientDto.nonApprovedVendorIds,
                },
              },
            });

            const createData: Prisma.ClientNotApprovedVendorCreateManyInput[] =
              updateClientDto.nonApprovedVendorIds.map((d) => ({
                clientId: client.id,
                vendorId: d,
                tenantId: client.tenantId,
                createdById: user?.connexus_user_id,
              }));
            await prisma.clientNotApprovedVendor.createMany({
              skipDuplicates: true,
              data: createData,
            });
          }
        } else if (isFalse(updateClientDto.nonApprovedVendors)) {
          await prisma.clientNotApprovedVendor.deleteMany({
            where: {
              clientId: id,
            },
          });
        }

        const updated = await prisma.client.update({
          where: { id },
          data: {
            name: updateClientDto.name,
            type: updateClientDto.type,
            onlyApprovedVendors: updateClientDto.onlyApprovedVendors,
            nonApprovedVendors: updateClientDto.nonApprovedVendors,
            legalName: updateClientDto.legalName,
            description: updateClientDto.description,
            logoUrl: updateClientDto.logoUrl,
            website: updateClientDto.website,
            updaterId: user?.connexus_user_id,
            status: updateClientDto.status,
          },
          select: {
            id: true,
            name: true,
            type: true,
            onlyApprovedVendors: true,
            nonApprovedVendors: true,
            legalName: true,
            description: true,
            logoUrl: true,
            themeHeaderImageUrl: true,
            website: true,
            status: true,
            ApprovedClientVendors: {
              select: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            ClientNotApprovedVendors: {
              select: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        // Changing parent company
        if (updateClientDto.parentTenantId !== undefined) {
          await prisma.tenants.update({
            where: { id: client.tenantId },
            data: {
              updaterId: user?.connexus_user_id,
              parentTenantId: updateClientDto.parentTenantId,
            },
          });
        }

        if (updateClientDto.name && client.name !== updateClientDto.name) {
          await prisma.tenants.update({
            where: { id: client.tenants[0].id },
            data: {
              name: updateClientDto.name,
              updaterId: user?.connexus_user_id, // Add updater for tenant
            },
          });
        }

        return updated;
      },
    );

    return updatedClient;
  }

  async findAll(filter: GetClientsDto, user: RequestUser) {
    const where: Prisma.ClientWhereInput = {
      deletedAt: null,
    };

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { legalName: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.onlyApprovedVendors !== undefined) {
      where.onlyApprovedVendors = filter.onlyApprovedVendors;
    }

    if (filter.nonApprovedVendors !== undefined) {
      where.nonApprovedVendors = filter.nonApprovedVendors;
    }

    if (filter.parentTenantIds) {
      where.tenant = {
        parentTenantId: { in: filter.parentTenantIds },
      };
    }

    if (filter.types && filter.types.length > 0) {
      where.type = { in: filter.types };
    }

    if (filter.status && filter.status.length > 0) {
      where.status = { in: filter.status };
    }

    const [data, pagination] = await this.prismaService.client.client
      .paginate({
        where: getAbilityFilters({
          condition: where,
          subject: caslSubjects.Client,
          user,
        }),
        select: {
          id: true,
          name: true,
          type: true,
          onlyApprovedVendors: true,
          nonApprovedVendors: true,
          legalName: true,
          description: true,
          logoUrl: true,
          themeHeaderImageUrl: true,
          website: true,
          status: true,
          tenantId: true,

          tenant: {
            select: {
              id: true,
              parentTenant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: getSortInput({
          modelName: Prisma.ModelName.Client,
          sortDirection: filter.sortDirection,
          sort: filter.sort,
          defaultSort: 'createdAt',
        }),
      })
      .withPages(getPaginationInput(filter));

    return {
      data,
      pagination,
    };
  }

  async findOne(id: string, user: RequestUser) {
    const client = await this.prismaService.client.client.findFirstOrThrow({
      where: getAbilityFilters({
        condition: { id, deletedAt: null },
        subject: caslSubjects.Client,
        user,
      }),
      select: {
        id: true,
        name: true,
        type: true,
        onlyApprovedVendors: true,
        nonApprovedVendors: true,
        legalName: true,
        description: true,
        logoUrl: true,
        themeHeaderImageUrl: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            parentTenant: {
              select: {
                id: true,
                name: true,
              },
            },
            childTenants: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        status: true,
        website: true,
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
        ApprovedClientVendors: {
          select: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        ClientNotApprovedVendors: {
          select: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Read,
      createSubject(caslSubjects.Client, client),
    );

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async create(createClientDto: CreateClientDto, user: RequestUser) {
    // Check name
    const client = await this.prismaService.client.client.findFirst({
      where: {
        legalName: {
          equals: createClientDto.legalName,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (client) {
      throw new ConflictException(
        `Client with legal name ${createClientDto.legalName} already exists`,
      );
    }

    // Check if the email is already in use
    const userTenant = await this.prismaService.client.users.findFirst({
      where: { email: createClientDto.email, deletedAt: null },
    });

    if (userTenant) {
      throw new ConflictException(
        `Email ${createClientDto.email} is already in use`,
      );
    }

    // Validate approved vendors
    if (
      !createClientDto.onlyApprovedVendors &&
      createClientDto.approvedVendorIds?.length
    ) {
      throw new ConflictException(
        'Approved vendors can only be added when onlyApprovedVendors is true',
      );
    }

    if (
      !createClientDto.nonApprovedVendors &&
      createClientDto.nonApprovedVendorIds?.length
    ) {
      throw new ConflictException(
        'Non approved vendors can only be added when nonApprovedVendors is true',
      );
    }

    if (
      createClientDto.approvedVendorIds?.length &&
      createClientDto.nonApprovedVendorIds?.length
    ) {
      const approvedSet = new Set(createClientDto.approvedVendorIds);
      const nonApprovedSet = new Set(createClientDto.nonApprovedVendorIds);

      const overlappingIds = [...approvedSet].filter((vendorId) =>
        nonApprovedSet.has(vendorId),
      );

      if (overlappingIds.length > 0) {
        throw new ConflictException(
          `Vendor IDs [${overlappingIds.join(', ')}] cannot be both approved and non-approved for the same client`,
        );
      }
    }

    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Create,
      caslSubjects.Client,
    );

    const tenantId = randomUUID();

    // Use a transaction to create both tenant and client
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
    const [_, newClient] = await this.prismaService.client.$transaction(
      async (prisma) => {
        const tenant = await prisma.tenants.create({
          data: {
            id: tenantId,
            name: createClientDto.name,
            type: TenantTypes.CLIENT,
            parentTenantId: createClientDto.parentTenantId,
            Roles: {
              create: [
                {
                  name: configs.role.admin,
                  roleLevel: RoleLevel.Admin,
                  readOnly: true,
                  rolePermissions: {
                    create: getClientAdminPermissions().map((p) => ({
                      permissionsId: p.id,
                      creatorId: user?.connexus_user_id,
                    })),
                  },
                },
                {
                  name: configs.role.propertyManger,
                  roleLevel: RoleLevel.NonAdmin,
                  readOnly: false,
                  rolePermissions: {
                    create: getpPopertyMangerPermissions().map((p) => ({
                      permissionsId: p.id,
                      creatorId: user?.connexus_user_id,
                    })),
                  },
                },
              ],
            },
            userTenants: {
              create: {
                contactType: ContactType.PRIMARY_CONTACT,
                isPrimaryTenant: true,
                user: {
                  create: {
                    firstName: createClientDto.firstName,
                    lastName: createClientDto.lastName,
                    fullName: `${createClientDto.firstName} ${createClientDto.lastName}`,
                    email: createClientDto.email,
                    phoneNumber: createClientDto.phoneNumber,
                    phoneCode: createClientDto.phoneCode,
                    phoneExtension: createClientDto.phoneExtension,
                    title: createClientDto.title,
                    isInternal: false,
                    authorized: false,
                    creatorId: user?.connexus_user_id,
                  },
                },
              },
            },
          },
        });

        const createdClient = await prisma.client.create({
          data: {
            name: createClientDto.name,
            tenantId,
            type: createClientDto.type,
            logoUrl: createClientDto.logoUrl,
            legalName: createClientDto.legalName,
            description: createClientDto.description,
            onlyApprovedVendors: createClientDto.onlyApprovedVendors,
            nonApprovedVendors: createClientDto.nonApprovedVendors,
            website: createClientDto.website,
            creatorId: user?.connexus_user_id,
            status: createClientDto.status,
            ...(createClientDto.onlyApprovedVendors &&
              createClientDto.approvedVendorIds && {
                ApprovedClientVendors: {
                  create: createClientDto.approvedVendorIds.map((vendorId) => ({
                    vendorId,
                  })),
                },
              }),
            ...(createClientDto.nonApprovedVendors &&
              createClientDto.nonApprovedVendorIds && {
                ClientNotApprovedVendors: {
                  create: createClientDto.nonApprovedVendorIds.map(
                    (vendorId) => ({
                      vendorId,
                      createdById: user?.connexus_user_id,
                      tenantId,
                    }),
                  ),
                },
              }),
          },
          select: {
            id: true,
            name: true,
            type: true,
            onlyApprovedVendors: true,
            nonApprovedVendors: true,
            legalName: true,
            description: true,
            logoUrl: true,
            themeHeaderImageUrl: true,
            website: true,
            tenantId: true,
            ApprovedClientVendors: {
              select: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            ClientNotApprovedVendors: {
              select: {
                vendor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        await prisma.tenants.update({
          where: { id: tenantId },
          data: {
            clientId: createdClient.id,
          },
        });

        return [tenant, createdClient];
      },
    );

    return newClient;
  }

  async remove(id: string, user: RequestUser) {
    const client = await this.prismaService.client.client.findUnique({
      where: { id },
      select: {
        tenants: {
          select: { id: true },
        },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Delete,
      createSubject(caslSubjects.Client, client),
    );

    await this.prismaService.client.$transaction(async (prisma) => {
      await prisma.tenants.updateMany({
        where: { id: { in: client.tenants.map((tenant) => tenant.id) } },
        data: {
          deletedAt: new Date(),
          updaterId: user?.connexus_user_id,
        },
      });

      await prisma.client.updateMany({
        where: { id },
        data: {
          deletedAt: new Date(),
          updaterId: user?.connexus_user_id,
        },
      });
    });

    return { message: `Client with ID ${id} has been removed` };
  }

  async removeMany(ids: string[], user: RequestUser) {
    const clients = await this.prismaService.client.client.findMany({
      where: { id: { in: ids } },
    });

    if (clients.length !== ids.length) {
      throw new NotFoundException(
        `Some clients with IDs ${ids.join(', ')} not found`,
      );
    }

    await this.prismaService.client.$transaction(async (prisma) => {
      await prisma.tenants.updateMany({
        where: { clientId: { in: ids } },
        data: {
          deletedAt: new Date(),
          updaterId: user?.connexus_user_id,
        },
      });

      await prisma.client.updateMany({
        where: { id: { in: ids } },
        data: {
          deletedAt: new Date(),
          updaterId: user?.connexus_user_id,
        },
      });
    });

    return { message: `Clients with IDs ${ids.join(', ')} have been removed` };
  }

  async updateStatus(id: string, input: UpdateStatusDto, user: RequestUser) {
    const { status } = input;
    const client = await this.prismaService.client.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Check if the status is different
    if (client.status === status) {
      throw new ConflictException(
        `Client with ID ${id} already has status ${status}`,
      );
    }

    return this.prismaService.client.client.update({
      where: { id },
      data: {
        status,
        updaterId: user?.connexus_user_id,
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  async updateThemeHeaderImage(
    id: string,
    input: UpdateThemeHeaderImageDto,
    user: RequestUser,
  ) {
    const client = await this.prismaService.client.client.findFirstOrThrow({
      where: { id, deletedAt: null },
    });

    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Update,
      createSubject(caslSubjects.Client, client),
    );

    const { themeHeaderImageUrl } = input;

    // Check if the theme header image URL is different
    if (client.themeHeaderImageUrl === themeHeaderImageUrl) {
      throw new ConflictException(
        `Client with ID ${id} already has the same theme header image URL`,
      );
    }

    return this.prismaService.client.client.update({
      where: { id },
      data: {
        themeHeaderImageUrl,
        updaterId: user?.connexus_user_id,
      },
      select: {
        id: true,
        themeHeaderImageUrl: true,
      },
    });
  }

  async getParentCompanies(input: GetParentCompaniesDto, user: RequestUser) {
    const where: Prisma.ClientWhereInput = getAbilityFilters({
      condition: {
        AND: [{ tenant: { childTenants: { some: {} } } }, { deletedAt: null }],
      },
      subject: caslSubjects.Client,
      user,
    });

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { legalName: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const [data, pagination] = await this.prismaService.client.client
      .paginate({
        where,
        select: {
          id: true,
          name: true,
          legalName: true,
          status: true,
          type: true,
          onlyApprovedVendors: true,
          nonApprovedVendors: true,
          tenantId: true,
        },
        orderBy: getSortInput({
          modelName: Prisma.ModelName.Client,
          sortDirection: input.sortDirection,
          sort: input.sort,
          defaultSort: 'name',
        }),
      })
      .withPages(getPaginationInput(input));

    return {
      data,
      pagination,
    };
  }

  async getWorkSpaces(user: RequestUser) {
    const userTenant = await this.prismaService.client.userTenants.findFirst({
      where: { userId: user.connexus_user_id, isPrimaryTenant: true },
      select: {
        tenantId: true,
        userId: true,
        contactType: true,
        isPrimaryTenant: true,
        tenantUserFilterType: true,
        tenant: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true,
                legalName: true,
                status: true,
                logoUrl: true,
              },
            },
            childTenants: {
              select: {
                id: true,
                name: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    logoUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Make childTenants empty if tenantUserFilterType is Property Manager
    if (userTenant?.tenantUserFilterType === TenantUserFilterTypes.PROPERTY) {
      userTenant.tenant.childTenants = [];
    }

    return userTenant;
  }
}
