import {
  Actions,
  CaslSubject,
  caslSubjects,
  getAbilityFilters,
} from '@app/ability';
import { ThrowCaslForbiddenError } from '@app/ability/helpers/casl-helpers';
import { configs, messages } from '@app/core';
import { PrismaService } from '@app/prisma';
import {
  CognitoService,
  getPaginationInput,
  getSortInput,
  RequestUser,
} from '@app/shared';
import { AttributeType } from '@aws-sdk/client-cognito-identity-provider';
import { subject } from '@casl/ability';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ContactType,
  Prisma,
  Tenants,
  TenantTypes,
  TenantUserFilterTypes,
  UserStatus,
} from '@prisma/client';
import { EventPayload, EventTypes } from 'src/libs/events/types/event-types';
import { SesService } from 'src/libs/ses/ses.service';
import { PrismaUserCreateInput } from 'src/types/prisma-create-input';
import { formatEnum } from 'src/utils/formatEnum';
import { PermissionsService } from '../permissions/permissions.service';
import { RoleLevel } from '../roles/dto/role-level';
import { CreatePasswordDto } from './dto/create-password';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { RemoveUserDto } from './dto/remove-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateItemsPerPageDto } from './dto/update-items-per-page.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import {
  createInvitationToken,
  verifyInvitationToken,
} from './helpers/jwt-helpers';
import { createInvitationLink } from './helpers/link-helpers';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cognitoService: CognitoService,
    private readonly permissionsService: PermissionsService,
    private readonly sesService: SesService,
  ) {}

  /**
   * Checks if the user has permission to perform the specified action on the subject
   * @param reqUser The user making the request
   * @param action The action to check permission for
   * @param subjectData The subject to check permission on
   * @throws ForbiddenError if the user doesn't have permission
   */
  private checkPermission(
    reqUser: RequestUser,
    action: Actions,
    subjectData: CaslSubject,
  ): void {
    ThrowCaslForbiddenError.from(reqUser.ability).throwUnlessCan(
      action,
      subjectData,
    );
  }

  async create(createUserDto: CreateUserDto, user: RequestUser) {
    const { userRoles = [] } = createUserDto;

    // Check email exists
    const userExists = await this.prismaService.client.users.findFirst({
      where: {
        email: createUserDto.email,
        deletedAt: null,
      },
    });

    if (userExists) {
      throw new ConflictException('User already exists');
    }

    // Check if user is primary/secondary contact for a client/vendor
    if (
      createUserDto.contactType &&
      (
        [
          ContactType.PRIMARY_CONTACT,
          ContactType.SECONDARY_CONTACT,
        ] as ContactType[]
      ).includes(createUserDto.contactType)
    ) {
      const userTenants = await this.prismaService.client.userTenants.count({
        where: {
          contactType: createUserDto.contactType,
          deletedAt: null,
          tenantId: createUserDto.tenantsId,
        },
      });

      if (userTenants >= 5) {
        throw new ConflictException(
          `You can only add 5 ${formatEnum(createUserDto.contactType)}s. Please use Contact Management to add more`,
        );
      }
    }

    let tenant: Tenants | null = null;

    if (createUserDto.tenantsId) {
      tenant = await this.prismaService.client.tenants.findUnique({
        where: {
          id: createUserDto.tenantsId,
        },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
    }

    // Check role exists
    if (userRoles?.length) {
      const roles = await this.prismaService.client.roles.findMany({
        where: {
          id: {
            in: userRoles,
          },
          tenantsId: createUserDto.tenantsId || null,
        },
      });

      if (roles.length !== userRoles.length) {
        throw new NotFoundException('Role not found');
      }
    }

    let tenantUserFilterType: TenantUserFilterTypes;

    if (
      tenant?.type === TenantTypes.VENDOR ||
      tenant?.type === TenantTypes.VENDOR_BRANCH ||
      tenant?.type === TenantTypes.VENDOR_FRANCHISE
    ) {
      tenantUserFilterType = TenantUserFilterTypes.VENDOR;
    } else if (tenant?.type === TenantTypes.CLIENT) {
      tenantUserFilterType = TenantUserFilterTypes.CLIENT;
    }

    const createInput: PrismaUserCreateInput = {
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      isInternal: !createUserDto.tenantsId,
      title: createUserDto.title,
      phoneNumber: createUserDto.phoneNumber,
      phoneCode: createUserDto.phoneCode,
      phoneExtension: createUserDto.phoneExtension,
      authorized: false,
      avatarUrl: createUserDto.avatarUrl,
      creatorId: user?.connexus_user_id,
      fullName: `${createUserDto.firstName} ${createUserDto.lastName}`,
      userRoles: userRoles.length
        ? {
            create: userRoles?.map((roleId) => ({
              roleId,
              creatorId: user?.connexus_user_id,
            })),
          }
        : undefined,

      userTenants: createUserDto.tenantsId
        ? {
            create: {
              tenantId: createUserDto.tenantsId,
              contactType: createUserDto.contactType,
              isPrimaryTenant: true,
              tenantUserFilterType,
            },
          }
        : undefined,
    };

    const newUser = await this.prismaService.client.$transaction(async (db) => {
      const u = await db.users.create({
        data: createInput,
        include: {
          userTenants: {
            include: {
              tenant: true,
            },
          },
        },
      });

      this.checkPermission(
        user,
        Actions.Create,
        subject(caslSubjects.Users, u),
      );

      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        isInternal: u.isInternal,
        title: u.title,
        phoneNumber: u.phoneNumber,
      };
    });

    if (createUserDto.authorized) {
      await this.createCognitoUser(newUser.id);
    }

    return newUser;
  }

  async findAll(getUserDto: GetUserDto, user: RequestUser) {
    const { limit, page, tenantId } = getUserDto;

    const filters: Prisma.UsersWhereInput = {
      deletedAt: null,
      userTenants: {},
    };

    if (!tenantId) {
      filters.isInternal = true;
    }

    if (getUserDto?.status?.length) {
      filters.status = {
        in: getUserDto.status,
      };
    }

    if (getUserDto.search) {
      filters.OR = [
        {
          fullName: {
            contains: getUserDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          firstName: {
            contains: getUserDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          lastName: {
            contains: getUserDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          email: {
            contains: getUserDto.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ];
    }

    if (getUserDto?.roleIds?.length) {
      filters.userRoles = {
        some: {
          roleId: {
            in: getUserDto.roleIds,
          },
        },
      };
    }

    if (getUserDto.authorized !== undefined) {
      filters.authorized = getUserDto.authorized;
    }

    if (getUserDto.contactType || getUserDto.tenantId) {
      filters.userTenants = {
        some: {
          ...(getUserDto.contactType && {
            contactType: { in: getUserDto.contactType },
          }),
          ...(getUserDto.tenantId && { tenantId: getUserDto.tenantId }),
        },
      };
    }

    if (getUserDto.propertyManagersOnly === true) {
      filters.managedProperties = {
        some: {},
      };
    }

    if (getUserDto?.parentTenantIds?.length) {
      filters.userTenants = {
        ...filters.userTenants,
        some: {
          ...(filters.userTenants?.some && filters.userTenants.some),
          tenant: {
            parentTenantId: {
              in: getUserDto.parentTenantIds,
            },
          },
        },
      };
    }

    if (getUserDto.tenantType) {
      filters.isInternal = undefined;
      filters.userTenants = {
        ...(filters.userTenants && filters.userTenants),
        every: {
          ...(filters.userTenants?.every && filters.userTenants.every),
          tenant: {
            type: getUserDto.tenantType,
          },
        },
      };
    }

    if (getUserDto.tenantIds) {
      filters.userTenants = {
        ...(filters.userTenants && filters.userTenants),
        some: {
          tenantId: { in: getUserDto.tenantIds },
        },
      };
    }

    const orderBy = getSortInput({
      sort: getUserDto.sort,
      sortDirection: getUserDto.sortDirection,
      modelName: Prisma.ModelName.Users,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prismaService.client.users
      .paginate({
        where: getAbilityFilters({
          user,
          condition: filters,
          subject: caslSubjects.Users,
        }),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          status: true,
          email: true,
          phoneNumber: true,
          isInternal: true,
          authorized: true,
          phoneCode: true,
          phoneExtension: true,
          title: true,
          userTenants: {
            select: {
              contactType: true,
              isPrimaryTenant: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          userRoles: {
            select: {
              roleId: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy,
      })
      .withPages(getPaginationInput({ page, limit }));

    return {
      data,
      pagination,
    };
  }

  async findOne(id: string, reqUser: RequestUser) {
    const user = await this.prismaService.client.users.findFirst({
      where: getAbilityFilters({
        condition: {
          id,
          deletedAt: null,
        } satisfies Prisma.UsersWhereInput,
        subject: 'Users',
        user: reqUser,
      }),
      select: {
        id: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        firstName: true,
        lastName: true,
        title: true,
        phoneNumber: true,
        phoneCode: true,
        phoneExtension: true,
        authorized: true,
        avatarUrl: true,
        status: true,
        email: true,
        userTenants: {
          select: {
            contactType: true,
            isPrimaryTenant: true,
            userId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                type: true,
                parentTenant: {
                  select: {
                    id: true,
                    name: true,
                    vendorId: true,
                    clientId: true,
                  },
                },
              },
            },
          },
        },
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        managedProperties: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, reqUser: RequestUser) {
    const { userRoles = [] } = updateUserDto;

    const user = await this.prismaService.client.users.findFirstOrThrow({
      where: getAbilityFilters({
        condition: {
          id,
          deletedAt: null,
        } satisfies Prisma.UsersWhereInput,
        subject: 'Users',
        user: reqUser,
      }),
      include: {
        userRoles: {
          select: {
            roleId: true,
          },
        },
        userTenants: {
          where: {
            tenant: {
              type: {
                in: [
                  TenantTypes.CLIENT,
                  TenantTypes.VENDOR,
                  TenantTypes.VENDOR_BRANCH,
                  TenantTypes.VENDOR_FRANCHISE,
                ],
              },
            },
          },
          include: {
            tenant: true,
          },
        },
      },
    });

    this.checkPermission(
      reqUser,
      Actions.Update,
      subject(caslSubjects.Users, user),
    );

    // Check if user is authorized
    if (updateUserDto.authorized && !user.authorized && !userRoles?.length) {
      throw new NotAcceptableException('User must have at least one role');
    }

    const existingUserRoles = user?.userRoles.map((role) => role.roleId);

    const newRoles = userRoles?.filter(
      (roleId) => !existingUserRoles?.includes(roleId),
    );

    const rolesToDelete = existingUserRoles?.filter(
      (roleId) => !userRoles?.includes(roleId),
    );

    if (userRoles.length && newRoles?.length) {
      const roles = await this.prismaService.client.roles.findMany({
        where: {
          id: {
            in: newRoles,
          },
          tenantsId: user?.isInternal
            ? null
            : {
                in: user?.userTenants?.map((tenant) => tenant.tenantId),
              },
        },
      });

      if (roles.length !== newRoles.length) {
        throw new NotFoundException('Role not found');
      }
    }

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Autharized is updated in createCognitoUser method
    let authorize = updateUserDto.authorized;
    if (authorize === user.authorized || authorize === true) {
      authorize = undefined;
    }

    const emailChanged =
      updateUserDto.email && updateUserDto.email !== user.email;

    const updateInput: Prisma.UsersUpdateInput = {
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      phoneNumber: updateUserDto.phoneNumber,
      phoneCode: updateUserDto.phoneCode,
      phoneExtension: updateUserDto.phoneExtension,
      title: updateUserDto.title,
      authorized: authorize,
      avatarUrl: updateUserDto.avatarUrl,
      updater: { connect: { id: reqUser.connexus_user_id } },
      userRoles: userRoles && {
        create: newRoles?.map((roleId) => ({
          roleId,
          creatorId: reqUser.connexus_user_id,
        })),
        deleteMany: {
          roleId: {
            in: rolesToDelete,
          },
        },
      },
    };

    // check email changed
    if (emailChanged) {
      const existingUser = await this.prismaService.client.users.findFirst({
        where: {
          email: updateUserDto.email,
          deletedAt: null,
          id: {
            not: id,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      updateInput.email = updateUserDto.email;
      if (user.authorized) {
        await this.cognitoService.deleteUsers([user.cognitoId]);
        updateInput.authorized = true;
        updateInput.status = UserStatus.PENDING;
        user.authorized = false;
        user.status = UserStatus.PENDING;
      }
    }

    const updated = await this.prismaService.client.users.update({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        authorized: true,
        email: true,
      },
      data: updateInput,
    });

    // Update full name
    if (
      updated.firstName !== user.firstName ||
      updated.lastName !== user.lastName
    ) {
      await this.prismaService.client.users.update({
        where: {
          id,
        },
        data: {
          fullName: `${updated.firstName} ${updated.lastName}`,
        },
      });

      if (user.authorized && !emailChanged) {
        await this.cognitoService.updateUserAttributes({
          attributes: {
            name: `${updated.firstName} ${updated.lastName}`,
            given_name: updated.firstName,
            family_name: updated.lastName,
          },
          username: user.email,
        });
      }
    }

    // Authorize user in cognito
    if (updateUserDto.authorized && user.authorized === false) {
      await this.createCognitoUser(updated.id);
    }

    return updated;
  }

  async remove(removeUserDto: RemoveUserDto, reqUser: RequestUser) {
    const { ids } = removeUserDto;

    const usersDelete = await this.prismaService.client.users.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    // validateSubjectArray(
    //   {
    //     type: caslSubjects.Users,
    //     subjectArray: usersDelete,
    //   },
    //   reqUser.ability,
    //   Actions.Delete,
    // );

    usersDelete.forEach((user) => {
      this.checkPermission(
        reqUser,
        Actions.Delete,
        subject(caslSubjects.Users, user),
      );
    });

    // Check if any read only user role exists
    const userWithReadOnlyRole =
      await this.prismaService.client.users.findFirst({
        where: {
          id: {
            in: ids,
          },
          userRoles: {
            some: {
              role: {
                roleLevel: RoleLevel.SuperAdmin,
              },
            },
          },
        },
      });

    if (userWithReadOnlyRole) {
      throw new NotAcceptableException(
        'Cannot delete user with super admin role',
      );
    }

    await this.prismaService.client.users.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        deletedAt: new Date(),
        updaterId: reqUser.connexus_user_id,
      },
    });

    const cognitoUsernames = usersDelete
      .filter((user) => user.cognitoId)
      .map((cognitoId) => cognitoId.cognitoId);

    await this.cognitoService.deleteUsers(cognitoUsernames);

    return {
      message: 'Users deleted successfully',
    };
  }

  @OnEvent(EventTypes.COGNITO_CREATE_USER)
  async handleCreateUser(payload: EventPayload['payload']) {
    const { userId } = payload;

    await this.createCognitoUser(userId);
  }

  async createCognitoUser(userId: string) {
    const user = await this.prismaService.client.users.findUniqueOrThrow({
      where: {
        id: userId,
      },
      include: {
        userTenants: {
          where: {
            isPrimaryTenant: true,
            tenant: {
              type: {
                in: [
                  TenantTypes.CLIENT,
                  TenantTypes.VENDOR,
                  TenantTypes.VENDOR_BRANCH,
                  TenantTypes.VENDOR_FRANCHISE,
                ],
              },
            },
          },
          select: {
            tenant: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isConnexusUser = user.isInternal;

    if (!user.userTenants.length && !isConnexusUser) {
      throw new NotFoundException('User does not have a primary tenant');
    }

    const tenant = user?.userTenants[0]?.tenant;

    const attributes: AttributeType[] = [
      {
        Name: 'email',
        Value: user.email,
      },
      {
        Name: 'name',
        Value: `${user.firstName} ${user.lastName}`,
      },
      {
        Name: 'given_name',
        Value: user.firstName,
      },
      {
        Name: 'family_name',
        Value: user.lastName,
      },
      {
        Name: 'email_verified',
        Value: 'true',
      },
      {
        Name: 'custom:connexus_user_id',
        Value: user.id,
      },
      {
        Name: 'custom:user_type',
        Value: isConnexusUser ? 'connexus' : tenant.type.toLocaleLowerCase(),
      },
      {
        Name: 'custom:tenant_id',
        Value: tenant?.id || '',
      },
    ];

    const { password, response } = await this.cognitoService.signUp({
      Username: user.email,
      UserAttributes: attributes,
    });

    const cognitoId = response.User.Attributes.find(
      (attribute) => attribute.Name === 'sub',
    )?.Value;

    // Create jwt token
    const token = createInvitationToken(cognitoId, password);

    await this.prismaService.client.users.update({
      where: {
        id: user.id,
      },
      data: {
        cognitoId,
        status: UserStatus.PENDING,
        lastInviteId: token,
        lastInviteSendTime: new Date(),
        authorized: true,
      },
    });

    // Send email
    await this.sesService.sendCustomVerificationEmail({
      email: user.email,
      verificationLink: createInvitationLink(token),
      name: `${user.firstName} ${user.lastName}`,
    });

    return response;
  }

  async getMyProfile(email: string, reqUser: RequestUser) {
    const user = await this.prismaService.client.users.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        phoneNumber: true,
        phoneCode: true,
        email: true,
        avatarUrl: true,
        status: true,
        itemsPerPage: true,
        userTenants: {
          select: {
            isPrimaryTenant: true,
            tenantUserFilterType: true,
            tenant: {
              select: {
                id: true,
                name: true,
                type: true,
                client: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                    type: true,
                  },
                },
                vendor: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: Prisma.SortOrder.asc,
          },
        },
        userRoles: {
          select: {
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
                roleLevel: true,
                rolePermissions: {
                  select: {
                    permissionsId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    const formattedUser = {
      ...user,
      userRoles: user.userRoles.map((role) => {
        return {
          ...role.role,
          rolePermissions: role.role.rolePermissions.map((item) => {
            return {
              ...item,
              ...this.permissionsService.findOne(item.permissionsId),
            };
          }),
        };
      }),
      userType: reqUser.user_type,
      writableTenants: reqUser.writableTenants || [],
      readableTenants: reqUser.readableTenants || [],
    };

    return { profile: formattedUser };
  }

  async disableUser(id: string, reqUser: RequestUser) {
    // Check user is authorized
    const user = await this.prismaService.client.users.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.checkPermission(
      reqUser,
      Actions.Update,
      subject(caslSubjects.Users, user),
    );

    if (!user.authorized) {
      throw new ConflictException('User is not authorized');
    }

    await this.prismaService.client.users.update({
      where: {
        id,
      },
      data: {
        status: UserStatus.INACTIVE,
      },
    });

    await this.cognitoService.disableUser(user.email);

    return {
      message: 'User disabled successfully',
    };
  }

  async activateUser(id: string, reqUser: RequestUser) {
    // Check user is authorized
    const user = await this.prismaService.client.users.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.checkPermission(
      reqUser,
      Actions.Update,
      subject(caslSubjects.Users, user),
    );

    if (user.status === UserStatus.ACTIVE) {
      throw new ConflictException('User is already active');
    }

    await this.prismaService.client.users.update({
      where: {
        id,
      },
      data: {
        status: UserStatus.ACTIVE,
      },
    });

    await this.cognitoService.enableUser(user.email);

    return {
      message: 'User activated successfully',
    };
  }

  /**
   * Updates a user's contact type for a specific tenant
   * @param id The user ID
   * @param updateContactTypeDto The DTO containing tenant ID and contact type
   * @param reqUser The user making the request
   * @returns A success message
   */
  async updateContactType(
    id: string,
    updateContactTypeDto: { tenantId: string; contactType: ContactType },
    reqUser: RequestUser,
  ) {
    // Check if user exists
    const user = await this.prismaService.client.users.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        userTenants: {
          where: {
            tenantId: updateContactTypeDto.tenantId,
          },
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check permissions
    this.checkPermission(
      reqUser,
      Actions.Update,
      subject(caslSubjects.Users, user),
    );

    // Check if user is associated with the tenant
    if (!user.userTenants.length) {
      throw new NotFoundException(
        'User is not associated with the specified tenant',
      );
    }

    // Check if tenant exists
    const tenant = await this.prismaService.client.tenants.findUnique({
      where: {
        id: updateContactTypeDto.tenantId,
        deletedAt: null,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Update the user's contact type for the specified tenant
    await this.prismaService.client.userTenants.updateMany({
      where: {
        userId: id,
        tenantId: updateContactTypeDto.tenantId,
      },
      data: {
        contactType: updateContactTypeDto.contactType,
      },
    });

    return {
      message: `User contact type updated to ${formatEnum(
        updateContactTypeDto.contactType,
      )} successfully`,
    };
  }

  async resendInvitation(id: string, reqUser: RequestUser) {
    // Check status is pending
    const user = await this.prismaService.client.users.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.checkPermission(
      reqUser,
      Actions.Update,
      subject(caslSubjects.Users, user),
    );

    if (user.status !== UserStatus.PENDING) {
      throw new ConflictException('User is not pending');
    }

    const { cognitoId } = user;

    const { password } = await this.cognitoService.createTemporaryPassword(
      user.email,
    );

    // Create jwt token
    const token = createInvitationToken(cognitoId, password);

    await this.sesService.sendCustomVerificationEmail({
      email: user.email,
      verificationLink: createInvitationLink(token),
      name: `${user.firstName} ${user.lastName}`,
    });

    await this.prismaService.client.users.update({
      where: {
        id: user.id,
      },
      data: {
        cognitoId,
        status: UserStatus.PENDING,
        lastInviteId: token,
        lastInviteSendTime: new Date(),
      },
    });

    return {
      message: 'Invitation resent successfully',
    };
  }

  private async validateTokenFn(token: string) {
    const message = messages.user.invalidToken;

    const user = await this.prismaService.client.users.findFirst({
      where: {
        lastInviteId: token,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException(message);
    }

    // Check token is valid
    const decoded = verifyInvitationToken(token);

    if (!decoded) {
      throw new BadRequestException(message);
    }

    // Check last invite time is less than 24 hours
    const currentTime = new Date();
    const lastInviteTime = user.lastInviteSendTime;

    if (!lastInviteTime) {
      throw new BadRequestException(message);
    }

    const diff = currentTime.getTime() - lastInviteTime.getTime();
    const diffInHours = diff / (1000 * 60 * 60);

    if (diffInHours > configs.auth.invitationExpiry) {
      throw new BadRequestException('Invitation link expired');
    }

    return { decoded, user };
  }

  async validateToken(input: ValidateTokenDto) {
    const { token } = input;
    await this.validateTokenFn(token);
    return {
      message: 'Token is valid',
      isValidated: true,
    };
  }

  async createPassword(input: CreatePasswordDto) {
    const { token, password } = input;

    const { user } = await this.validateTokenFn(token);

    // Update password
    await this.cognitoService.setPassword(user.cognitoId, password);

    await this.prismaService.client.users.update({
      where: {
        id: user.id,
      },
      data: {
        lastInviteId: null,
        status: UserStatus.ACTIVE,
        lastInviteSendTime: null,
      },
    });

    return {
      message: 'Password created successfully',
    };
  }

  async bulkCreateUsers(input: Prisma.UsersCreateManyInput[]) {
    const emails = input.map((user) => user.email);
    const phoneNumbers = input
      .filter((user) => user.phoneNumber)
      .map((user) => user.phoneNumber);

    // Check for duplicates within input
    if (new Set(emails).size !== emails.length) {
      throw new ConflictException('Duplicate emails in input');
    }
    if (new Set(phoneNumbers).size !== phoneNumbers.length) {
      throw new ConflictException('Duplicate phone numbers in input');
    }

    // Check if any email or phone number already exists in DB
    const existingUsers = await this.prismaService.client.users.findMany({
      where: {
        OR: [{ email: { in: emails } }, { phoneNumber: { in: phoneNumbers } }],
      },
    });

    if (existingUsers.length > 0) {
      const existingEmails = existingUsers.map((user) => user.email);
      const existingPhones = existingUsers
        .map((user) => user.phoneNumber)
        .filter(Boolean);
      throw new ConflictException(
        `Users already exist with these emails or phone numbers: ${existingEmails.concat(existingPhones).join(', ')}`,
      );
    }

    // Check if user has managed properties
    const userWithManagedProperties =
      await this.prismaService.client.users.findMany({
        where: {
          managedProperties: {
            some: {
              deletedAt: null,
            },
          },
          id: {
            not: {
              in: input.map((user) => user.id),
            },
          },
        },
      });

    if (userWithManagedProperties.length > 0) {
      throw new ConflictException(
        'Users already exist with these managed properties',
      );
    }

    // Create users
    const users = await this.prismaService.client.users.createMany({
      data: input,
    });

    return {
      message: `${users.count} Users created successfully`,
    };
  }

  // Check if phone number or email already exists
  async checkIfEmailExists(input: { email: string }) {
    const { email } = input;

    const where: Prisma.UsersWhereInput = {
      OR: [{ email }],
      deletedAt: null,
    };

    const existingUsers = await this.prismaService.client.users.findFirst({
      where,
    });

    if (existingUsers) {
      if (existingUsers.email === email) {
        throw new ConflictException('Email already exists');
      }
    }
  }

  async checkEmails(input: { emails: string[] }) {
    const { emails } = input;

    const existingUsers = await this.prismaService.client.users.findMany({
      where: {
        email: {
          in: emails,
        },
        deletedAt: null,
      },
      select: {
        email: true,
      },
    });

    const existingEmails = existingUsers.map((user) => user.email);

    return {
      existingEmails,
      exists: existingEmails.length > 0,
    };
  }

  async searchUsers(searchUserDto: SearchUserDto, user: RequestUser) {
    const { limit, page, tenantId } = searchUserDto;

    const andFilters: Prisma.UsersWhereInput[] = [
      {
        OR: [{ status: { not: UserStatus.INACTIVE } }, { status: null }],
      },
    ];

    const filters: Prisma.UsersWhereInput = {
      deletedAt: null,
      userTenants: {},
      AND: andFilters,
    };

    if (!tenantId && !searchUserDto.propertyManagersOnly) {
      filters.isInternal = true;
    }

    if (searchUserDto?.status?.length) {
      filters.OR = [
        {
          status: {
            in: searchUserDto.status,
          },
        },
      ];
    }

    if (searchUserDto.search) {
      andFilters.push({
        OR: [
          {
            fullName: {
              contains: searchUserDto.search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: searchUserDto.search,
              mode: 'insensitive',
            },
          },
        ],
      });
    }
    if (searchUserDto?.roleIds?.length) {
      filters.userRoles = {
        some: {
          roleId: {
            in: searchUserDto.roleIds,
          },
        },
      };
    }

    if (searchUserDto.authorized !== undefined) {
      filters.authorized = searchUserDto.authorized;
    }

    if (searchUserDto.contactType || searchUserDto.tenantId) {
      filters.userTenants = {
        some: {
          ...(searchUserDto.contactType && {
            contactType: { in: searchUserDto.contactType },
          }),
          ...(searchUserDto.tenantId && { tenantId: searchUserDto.tenantId }),
        },
      };
    }

    if (searchUserDto.propertyManagersOnly === true) {
      filters.managedProperties = {
        some: {},
      };
    }

    if (searchUserDto.propertyId) {
      filters.propertyContacts = {
        some: {
          propertyId: searchUserDto.propertyId,
        },
      };
    }

    if (searchUserDto.serviceApprovedUser === true) {
      filters.serviceApprovedByUser = {
        some: {},
      };
    }

    const orderBy = getSortInput({
      sort: searchUserDto.sort,
      sortDirection: searchUserDto.sortDirection,
      modelName: Prisma.ModelName.Users,
      defaultSort: 'createdAt',
    });

    const where = getAbilityFilters({
      user,
      condition: filters,
      subject: caslSubjects.Users,
    });

    const [data, pagination] = await this.prismaService.client.users
      .paginate({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          email: true,
          phoneNumber: true,
          isInternal: true,
          authorized: true,
          phoneCode: true,
          phoneExtension: true,
          title: true,
        },
        orderBy,
      })
      .withPages(getPaginationInput({ page, limit }));

    return {
      data,
      pagination,
    };
  }

  /**
   * Updates the itemsPerPage preference for the authenticated user
   * @param updateItemsPerPageDto The DTO containing the itemsPerPage value
   * @param reqUser The authenticated user making the request
   * @returns A success message
   */
  async updateItemsPerPage(
    updateItemsPerPageDto: UpdateItemsPerPageDto,
    reqUser: RequestUser,
  ) {
    const userId = reqUser.connexus_user_id;

    // Check if user exists
    const user = await this.prismaService.client.users.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update the itemsPerPage preference
    await this.prismaService.client.users.update({
      where: {
        id: userId,
      },
      data: {
        itemsPerPage: updateItemsPerPageDto.itemsPerPage,
      },
    });

    return {
      message: `Items per page preference updated to ${updateItemsPerPageDto.itemsPerPage} successfully`,
    };
  }
}
