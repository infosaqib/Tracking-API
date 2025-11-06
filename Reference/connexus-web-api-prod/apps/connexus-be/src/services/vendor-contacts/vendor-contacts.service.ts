import { Actions, caslSubjects, getAbilityFilters } from '@app/ability';
import { ThrowCaslForbiddenError } from '@app/ability/helpers/casl-helpers';
import { createSubject } from '@app/ability/helpers/create-subject';
import { PrismaService } from '@app/prisma';
import {
  CognitoService,
  getPaginationInput,
  getSortInput,
  RequestUser,
} from '@app/shared';
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
  UserStatus,
} from '@prisma/client';
import { formatEnum } from 'src/utils/formatEnum';
import { UsersService } from '../users/users.service';
import { CreateVendorBranchContactDto } from './dto/create-vendor-branch-contact.dto';
import { CreateVendorContactDto } from './dto/create-vendor-contact.dto';
import { GetVendorContactDto } from './dto/get-vendor-contact.dto';
import { UpdateContactTypeDto } from './dto/update-contact-type.dto';
import { UpdateVendorBranchContactDto } from './dto/update-vendor-branch-contact.dto';
import { UpdateVendorContactDto } from './dto/update-vendor-contact.dto';

@Injectable()
export class VendorContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly cognitoService: CognitoService,
  ) {}

  async create(
    createVendorContactDto: CreateVendorContactDto,
    user: RequestUser,
  ) {
    const { vendorId } = createVendorContactDto;

    const vendor = await this.prisma.client.vendors.findUnique({
      where: { id: vendorId },
      include: {
        tenant: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    this.checkUserHasVendorContactPermission({
      data: {
        contactType: createVendorContactDto.contactType,
        tenantId: vendor.tenantId,
        type: vendor.tenant.type,
      },
      user,
      action: Actions.Create,
    });

    const creatorId = user.connexus_user_id;

    // Check if email exists
    await this.usersService.checkIfEmailExists({
      email: createVendorContactDto.email,
    });

    if (createVendorContactDto.contactType) {
      // Check if contact type count is less than 5
      const contactTypeCount = await this.prisma.client.userTenants.count({
        where: {
          contactType: createVendorContactDto.contactType,
          deletedAt: null,
          tenantId: vendor.tenantId,
          user: {
            deletedAt: null,
          },
        },
      });

      if (contactTypeCount >= 5) {
        throw new ConflictException(
          `You can only add 5 ${formatEnum(createVendorContactDto.contactType)}s. Please use Contact Management to add more`,
        );
      }
    }

    // Create user first
    const newUser = await this.prisma.client.users.create({
      data: {
        email: createVendorContactDto.email,
        firstName: createVendorContactDto.firstName,
        lastName: createVendorContactDto.lastName,
        fullName: `${createVendorContactDto.firstName} ${createVendorContactDto.lastName}`,
        phoneCode: createVendorContactDto.phoneCode,
        phoneNumber: createVendorContactDto.phoneNumber,
        phoneExtension: createVendorContactDto.phoneExtension,
        title: createVendorContactDto.title,
        isInternal: false,
        creatorId,
        userTenants: {
          create: {
            tenantId: vendor.tenantId,
            tenantUserFilterType: TenantUserFilterTypes.VENDOR,
            isPrimaryTenant: true,
            createdById: creatorId,
            contactType: createVendorContactDto.contactType,
          },
        },
      },
    });

    // Then create UserTenants record
    return newUser;
  }

  async findAll(input: GetVendorContactDto, user: RequestUser) {
    const where: Prisma.UserTenantsWhereInput = {
      tenant: {
        vendorId: input.vendorId,
      },
      user: {
        deletedAt: null,
      },
      ...(input.search && {
        user: {
          deletedAt: null,
          OR: [
            {
              fullName: { contains: input.search, mode: 'insensitive' },
            },
            {
              email: { contains: input.search, mode: 'insensitive' },
            },
          ],
        },
      }),
    };

    if (input.contactType) {
      where.contactType = input.contactType;
    }

    const sort = getSortInput({
      modelName: Prisma.ModelName.UserTenants,
      sort: input.sort,
      sortDirection: input.sortDirection,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prisma.client.userTenants
      .paginate({
        where: getAbilityFilters({
          condition: where,
          user,
          subject: caslSubjects.VendorContact,
        }),
        orderBy: sort,
        select: {
          tenantId: true,
          contactType: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneCode: true,
              phoneNumber: true,
              phoneExtension: true,
              title: true,
              avatarUrl: true,
              status: true,
              createdAt: true,
              authorized: true,
            },
          },
        },
      })
      .withPages(
        getPaginationInput({
          limit: input.limit,
          page: input.page,
        }),
      );

    return { data, pagination };
  }

  async remove(id: string, user: RequestUser) {
    const userTenant = await this.prisma.client.userTenants.findFirst({
      where: {
        userId: id,
        tenantUserFilterType: TenantUserFilterTypes.VENDOR,
      },
      include: {
        tenant: true,
      },
    });

    if (!userTenant) {
      throw new NotFoundException('Vendor contact not found');
    }

    this.checkUserHasVendorContactPermission({
      data: {
        contactType: userTenant.contactType,
        tenantId: userTenant.tenantId,
        type: userTenant.tenant.type,
      },
      user,
      action: Actions.Delete,
    });

    // Soft delete the user
    await this.prisma.client.users.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Vendor contact deleted successfully' };
  }

  async updateOne(
    id: string,
    updateVendorContactDto: UpdateVendorContactDto,
    user: RequestUser,
  ) {
    const userTenant = await this.prisma.client.userTenants.findFirst({
      where: {
        userId: id,
        tenantUserFilterType: TenantUserFilterTypes.VENDOR,
        tenant: {
          vendorId: updateVendorContactDto.vendorId,
        },
      },
      include: {
        tenant: {
          select: {
            vendorId: true,
            type: true,
          },
        },
        user: {
          select: {
            authorized: true,
          },
        },
      },
    });

    if (!userTenant) {
      throw new NotFoundException('Vendor contact not found');
    }

    this.checkUserHasVendorContactPermission({
      data: {
        contactType: userTenant.contactType,
        tenantId: userTenant.tenantId,
        type: userTenant.tenant.type,
      },
      user,
      action: Actions.Update,
    });

    // Check if email already exists when updating email
    if (updateVendorContactDto.email) {
      const existingUser = await this.prisma.client.users.findFirst({
        where: {
          email: updateVendorContactDto.email,
          deletedAt: null,
          id: {
            not: id,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    await this.prisma.client.$transaction(async (tx) => {
      let fullName: string | undefined;

      if (updateVendorContactDto.firstName && updateVendorContactDto.lastName) {
        fullName = `${updateVendorContactDto.firstName} ${updateVendorContactDto.lastName}`;
      }

      // Prepare update data
      const updateData: Prisma.UsersUpdateInput = {
        firstName: updateVendorContactDto.firstName,
        lastName: updateVendorContactDto.lastName,
        fullName,
        phoneCode: updateVendorContactDto.phoneCode,
        phoneNumber: updateVendorContactDto.phoneNumber,
        phoneExtension: updateVendorContactDto.phoneExtension,
        title: updateVendorContactDto.title,
      };

      // Allow email updates for non-authorized users
      if (updateVendorContactDto.email && !userTenant.user.authorized) {
        updateData.email = updateVendorContactDto.email;
      }

      await tx.users.update({
        where: { id },
        data: updateData,
      });

      if (
        updateVendorContactDto.contactType &&
        userTenant.contactType !== updateVendorContactDto.contactType
      ) {
        // Check if already 5 users in contact type
        const contactTypeCount = await tx.userTenants.count({
          where: {
            contactType: updateVendorContactDto.contactType,
            tenantId: userTenant.tenantId,
            deletedAt: null,
          },
        });

        if (contactTypeCount >= 5) {
          throw new ConflictException(
            `You can only add 5 ${formatEnum(updateVendorContactDto.contactType)}s. Please use Contact Management to add more`,
          );
        }

        await tx.userTenants.update({
          where: {
            userId_tenantId: {
              userId: id,
              tenantId: userTenant.tenantId,
            },
          },
          data: { contactType: updateVendorContactDto.contactType },
        });
      }
    });
    return { message: 'Vendor contact updated successfully' };
  }

  private checkUserHasVendorContactPermission(input: {
    data: {
      contactType: ContactType;
      tenantId: string;
      type: TenantTypes;
    };
    user: RequestUser;
    action: Actions;
  }) {
    const { data: userTenant, user, action } = input;
    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      action,
      createSubject(caslSubjects.VendorContact, {
        contactType: userTenant.contactType,
        tenant: {
          id: userTenant.tenantId,
          type: userTenant.type,
        },
      }),
    );

    return input;
  }

  async createVendorBranchContact(
    input: CreateVendorBranchContactDto,
    user: RequestUser,
  ) {
    // Check if email exists
    await this.usersService.checkIfEmailExists({
      email: input.email,
    });

    // Validate that only one branch is set as primary
    const primaryBranches = input.branches.filter(
      (branch) => branch.isPrimaryTenant,
    );
    if (primaryBranches.length !== 1) {
      throw new ConflictException(
        'Exactly one branch must be set as primary tenant',
      );
    }

    // Verify all branch tenants exist
    const branchTenants = await this.prisma.client.tenants.findMany({
      where: {
        id: {
          in: input.branches.map((branch) => branch.branchTenantId),
        },
      },
      include: {
        vendor: true,
      },
    });

    if (branchTenants.length !== input.branches.length) {
      throw new NotFoundException('One or more branch tenants not found');
    }

    // Verify all tenants are vendor branches
    const invalidTenants = branchTenants.filter(
      (tenant) => tenant.type !== TenantTypes.VENDOR_BRANCH,
    );
    if (invalidTenants.length > 0) {
      throw new ConflictException(
        'One or more tenants are not vendor branches',
      );
    }

    const creatorId = user.connexus_user_id;

    // Create user with multiple tenant associations
    const newUser = await this.prisma.client.users.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        fullName: `${input.firstName} ${input.lastName}`,
        phoneCode: input.phoneCode,
        phoneNumber: input.phoneNumber,
        phoneExtension: input.phoneExtension,
        title: input.title,
        isInternal: false,
        creatorId,
        userTenants: {
          create: input.branches.map((branch) => ({
            tenantId: branch.branchTenantId,
            tenantUserFilterType: TenantUserFilterTypes.VENDOR,
            isPrimaryTenant: branch.isPrimaryTenant,
            createdById: creatorId,
            contactType: input.contactType,
          })),
        },
      },
      include: {
        userTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (input.authorized) {
      await this.usersService.update(
        newUser.id,
        {
          authorized: input.authorized,
          userRoles: input.userRoles,
        },
        user,
      );
    } else if (input.userRoles?.length > 0) {
      await this.usersService.update(
        newUser.id,
        {
          userRoles: input.userRoles,
        },
        user,
      );
    }

    return newUser;
  }

  async updateBranchContact(
    id: string,
    updateVendorBranchContactDto: UpdateVendorBranchContactDto,
    user: RequestUser,
  ) {
    // Fetch user tenant data outside the transaction
    const userTenant = await this.prisma.client.userTenants.findFirst({
      where: {
        userId: id,
      },
      include: {
        tenant: true,
        user: {
          include: {
            userRoles: {
              select: {
                roleId: true,
              },
            },
          },
        },
      },
    });

    if (!userTenant) {
      throw new NotFoundException('Vendor contact not found');
    }

    // TODO: Enable this later
    // this.checkUserHasVendorContactPermission({
    //   data: {
    //     contactType: userTenant.contactType,
    //     tenantId: userTenant.tenantId,
    //     type: userTenant.tenant.type,
    //   },
    //   user,
    //   action: Actions.Update,
    // });

    // Prepare data outside transaction where possible
    let fullName: string | undefined;
    if (
      updateVendorBranchContactDto.firstName &&
      updateVendorBranchContactDto.lastName
    ) {
      fullName = `${updateVendorBranchContactDto.firstName} ${updateVendorBranchContactDto.lastName}`;
    }

    // Check if email already exists when updating email
    if (updateVendorBranchContactDto.email) {
      const existingUser = await this.prisma.client.users.findFirst({
        where: {
          email: updateVendorBranchContactDto.email,
          deletedAt: null,
          id: {
            not: id,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check contact type limit outside transaction if needed
    let contactTypeCount: number | undefined;
    if (
      updateVendorBranchContactDto.contactType &&
      userTenant.contactType !== updateVendorBranchContactDto.contactType
    ) {
      contactTypeCount = await this.prisma.client.userTenants.count({
        where: {
          contactType: updateVendorBranchContactDto.contactType,
          tenantId: userTenant.tenantId,
          deletedAt: null,
        },
      });

      if (contactTypeCount >= 5) {
        throw new ConflictException(
          `You can only add 5 ${formatEnum(updateVendorBranchContactDto.contactType)}s. Please use Contact Management to add more`,
        );
      }
    }

    // Fetch existing branches outside transaction if needed
    let existingBranches: { tenantId: string }[] = [];
    let existingBranchIds: string[] = [];
    let newBranchIds: string[] = [];
    let branchesToRemove: string[] = [];

    // Always fetch existing branches to handle proper deletion
    existingBranches = await this.prisma.client.userTenants.findMany({
      where: {
        userId: id,
        tenantUserFilterType: TenantUserFilterTypes.VENDOR,
        deletedAt: null,
      },
      select: {
        tenantId: true,
      },
    });

    existingBranchIds = existingBranches.map((b) => b.tenantId);

    if (updateVendorBranchContactDto.branches?.length) {
      // Validate that only one branch is set as primary
      const primaryBranchCount = updateVendorBranchContactDto.branches.filter(
        (branch) => branch.isPrimaryTenant,
      ).length;

      if (primaryBranchCount !== 1) {
        throw new ConflictException(
          'Exactly one branch must be set as primary tenant',
        );
      }

      newBranchIds = updateVendorBranchContactDto.branches.map(
        (b) => b.branchTenantId,
      );
      branchesToRemove = existingBranchIds.filter(
        (branchId) => !newBranchIds.includes(branchId),
      );
    } else {
      // If no branches are provided, mark all existing branches for removal
      // This handles the case when client wants to remove all branches
      branchesToRemove = [...existingBranchIds];
    }

    // Prepare user role updates if needed
    const userRoles = updateVendorBranchContactDto.userRoles || [];
    let userRoleUpdates: Prisma.UsersUpdateInput['userRoles'];

    if (userRoles.length > 0) {
      const existingUserRoles = userTenant.user.userRoles.map(
        (role) => role.roleId,
      );
      const newRoles = userRoles.filter(
        (roleId) => !existingUserRoles.includes(roleId),
      );
      const rolesToDelete = existingUserRoles.filter(
        (roleId) => !userRoles.includes(roleId),
      );

      // Only set up role updates if there are changes
      if (newRoles.length > 0 || rolesToDelete.length > 0) {
        userRoleUpdates = {
          create: newRoles.map((roleId) => ({
            roleId,
            creatorId: user.connexus_user_id,
          })),
          deleteMany: {
            roleId: {
              in: rolesToDelete,
            },
          },
        };
      }
    }

    // Prepare user data for update
    const updateData: Prisma.UsersUpdateInput = {
      firstName: updateVendorBranchContactDto.firstName,
      lastName: updateVendorBranchContactDto.lastName,
      fullName,
      phoneCode: updateVendorBranchContactDto.phoneCode,
      phoneNumber: updateVendorBranchContactDto.phoneNumber,
      phoneExtension: updateVendorBranchContactDto.phoneExtension,
      title: updateVendorBranchContactDto.title,
      updater: { connect: { id: user.connexus_user_id } },
      authorized: updateVendorBranchContactDto.authorized,
      userRoles: userRoleUpdates,
    };

    // Allow email updates for non-authorized users
    if (updateVendorBranchContactDto.email && !userTenant.user.authorized) {
      updateData.email = updateVendorBranchContactDto.email;
    }

    // Handle email change for authorized users
    const emailChanged =
      updateVendorBranchContactDto.email &&
      updateVendorBranchContactDto.email !== userTenant.user.email;
    if (emailChanged && userTenant.user.authorized) {
      // Delete existing Cognito user
      await this.cognitoService.deleteUsers([userTenant.user.cognitoId]);

      // Update user data to reflect unauthorized state
      updateData.email = updateVendorBranchContactDto.email;
      updateData.authorized = true;
      updateData.status = UserStatus.PENDING;
    }

    // Execute transaction with optimized operations
    await this.prisma.client.$transaction(async (tx) => {
      // 1. Update user basic information and roles in a single operation
      await tx.users.update({
        where: { id },
        data: updateData,
      });

      // 2. Update contact type if changed
      if (
        updateVendorBranchContactDto.contactType &&
        userTenant.contactType !== updateVendorBranchContactDto.contactType
      ) {
        await tx.userTenants.update({
          where: {
            userId_tenantId: {
              userId: id,
              tenantId: userTenant.tenantId,
            },
          },
          data: {
            contactType: updateVendorBranchContactDto.contactType,
            modifiedById: user.connexus_user_id,
          },
        });
      }

      // 3. Handle branch associations
      // Always perform branch removal if there are branches to remove
      if (branchesToRemove.length) {
        await tx.userTenants.deleteMany({
          where: {
            userId: id,
            tenantId: {
              in: branchesToRemove,
            },
          },
        });
      }

      // Only perform upserts if new branches are provided
      if (updateVendorBranchContactDto.branches?.length) {
        await Promise.all(
          updateVendorBranchContactDto.branches.map((branch) =>
            tx.userTenants.upsert({
              where: {
                userId_tenantId: {
                  userId: id,
                  tenantId: branch.branchTenantId,
                },
              },
              create: {
                userId: id,
                tenantId: branch.branchTenantId,
                isPrimaryTenant: branch.isPrimaryTenant,
                tenantUserFilterType: TenantUserFilterTypes.VENDOR,
                createdById: user.connexus_user_id,
                contactType: updateVendorBranchContactDto.contactType,
              },
              update: {
                deletedAt: null,
                isPrimaryTenant: branch.isPrimaryTenant,
                modifiedById: user.connexus_user_id,
                contactType: updateVendorBranchContactDto.contactType,
              },
            }),
          ),
        );
      }
    });

    // Handle Cognito user creation if authorization status changed
    if (
      (updateVendorBranchContactDto.authorized !== undefined &&
        userTenant.user.authorized !==
          updateVendorBranchContactDto.authorized &&
        updateVendorBranchContactDto.authorized === true) ||
      (emailChanged && updateVendorBranchContactDto.authorized === true)
    ) {
      await this.usersService.createCognitoUser(id);
    }

    return { message: 'Vendor branch contact updated successfully' };
  }

  async updateContactType(
    id: string,
    updateContactTypeDto: UpdateContactTypeDto,
    user: RequestUser,
  ) {
    const userData = await this.prisma.client.users.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        userTenants: {
          include: {
            tenant: true,
          },
        },
      },
    });
    if (!userData) {
      throw new NotFoundException('User not found');
    }

    // Check if user has permission to update user
    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Update,
      createSubject(caslSubjects.Users, userData),
    );

    // Find the user tenant by userId instead of id
    const userTenant = await this.prisma.client.userTenants.findFirst({
      where: {
        userId: id,
        deletedAt: null,
      },
      include: {
        tenant: {
          include: {
            vendor: true,
          },
        },
        user: true,
      },
    });

    if (!userTenant) {
      throw new NotFoundException('User tenant not found');
    }

    if (updateContactTypeDto.type === TenantTypes.VENDOR) {
      // No contact type change for vendor type, just return the user tenant
      return {
        message: 'Vendor contact type configuration retrieved successfully',
        data: userTenant,
      };
    }

    // VENDOR_BRANCH type
    if (
      !updateContactTypeDto.branchTenantIds ||
      updateContactTypeDto.branchTenantIds.length === 0
    ) {
      throw new ConflictException(
        `Branch tenant IDs are required for ${TenantTypes.VENDOR_BRANCH} type`,
      );
    }

    // Validate that only one branch is primary
    const primaryBranchCount = updateContactTypeDto.branchTenantIds.filter(
      (branch) => branch.isPrimary,
    ).length;

    if (primaryBranchCount !== 1) {
      throw new ConflictException('Only one branch can be set as primary');
    }

    // Verify all branch tenants exist and belong to the vendor
    const branchTenantIds = updateContactTypeDto.branchTenantIds.map(
      (branch) => branch.branchTenantId,
    );

    const branchTenants = await this.prisma.client.tenants.findMany({
      where: {
        id: { in: branchTenantIds },
        vendor: {
          id: userTenant.tenant.vendor?.id,
        },
      },
    });

    if (branchTenants.length !== branchTenantIds.length) {
      throw new ConflictException('One or more branch tenants are invalid');
    }

    // Find existing user-tenant relationships related to these branches
    const existingUserTenants = await this.prisma.client.userTenants.findMany({
      where: {
        userId: id,
        tenant: {
          vendor: {
            id: userTenant.tenant.vendor?.id,
          },
        },
        deletedAt: null,
      },
      select: {
        tenantId: true,
      },
    });

    const existingTenantIds = existingUserTenants.map((ut) => ut.tenantId);

    // Determine which tenants to hard delete (they exist but aren't in the new list)
    const tenantsToDelete = existingTenantIds.filter(
      (tenantId) => !branchTenantIds.includes(tenantId),
    );

    // Execute all operations in a transaction
    const updatedBranchTenants = await this.prisma.client.$transaction(
      async (tx) => {
        // Hard delete user tenants that are not in the new branch list
        if (tenantsToDelete.length > 0) {
          await tx.userTenants.deleteMany({
            where: {
              userId: id,
              tenantId: { in: tenantsToDelete },
            },
          });
        }

        // Then upsert the user tenant records for all branches in the list
        await Promise.all(
          updateContactTypeDto.branchTenantIds.map((branchTenant) =>
            tx.userTenants.upsert({
              where: {
                userId_tenantId: {
                  userId: id,
                  tenantId: branchTenant.branchTenantId,
                },
              },
              create: {
                userId: id,
                tenantId: branchTenant.branchTenantId,
                tenantUserFilterType: TenantUserFilterTypes.VENDOR,
                isPrimaryTenant: branchTenant.isPrimary,
                createdById: user.connexus_user_id,
                contactType: userTenant.contactType,
              },
              update: {
                isPrimaryTenant: branchTenant.isPrimary,
                deletedAt: null,
                modifiedById: user.connexus_user_id,
              },
            }),
          ),
        );

        // Return updated branch tenants
        return tx.userTenants.findMany({
          where: {
            userId: id,
            tenantId: { in: branchTenantIds },
            deletedAt: null,
          },
        });
      },
    );

    const primaryTenant = userData?.userTenants?.find(
      (ut) => ut.isPrimaryTenant,
    )?.tenant;

    const type = primaryTenant?.type;

    if (type !== updateContactTypeDto.type) {
      // Update user attributes in cognito
      await this.cognitoService.updateUserAttributes({
        username: userData.email,
        attributes: {
          'custom:tenant_id': primaryTenant?.id || '',
          'custom:user_type': updateContactTypeDto.type.toLocaleLowerCase(),
        },
      });
    }

    return {
      message: 'Vendor contact type configuration updated successfully',
      data: updatedBranchTenants,
    };
  }
}
