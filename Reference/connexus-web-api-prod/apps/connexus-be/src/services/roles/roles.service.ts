import {
  Actions,
  CaslSubject,
  caslSubjects,
  getAbilityFilters,
} from '@app/ability';
import { ThrowCaslForbiddenError } from '@app/ability/helpers/casl-helpers';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import { subject } from '@casl/ability';
import {
  ConflictException,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaRoleCreateInput } from 'src/types/prisma-create-input';
import { permissionList } from '../permissions/data/permission-list';
import { PermissionTypeValues } from '../permissions/dto/permission-types';
import { CreateRoleDto } from './dto/create-role.dto';
import { GetRolesDto } from './dto/get-role.dto';
import { RoleLevel } from './dto/role-level';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prismaService: PrismaClientService) {}

  /**
   * Checks if the user has permission to perform the specified action on the subject
   * @param user The user making the request
   * @param action The action to check permission for
   * @param subjectData The subject to check permission on
   * @throws ForbiddenError if the user doesn't have permission
   */
  private checkPermission(
    user: RequestUser,
    action: Actions,
    subjectData: CaslSubject,
  ): void {
    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      action,
      subjectData,
    );
  }

  // Create  map of permissions
  permissionMap = permissionList.reduce(
    (acc, permission) => {
      acc[permission.id] = permission;
      return acc;
    },
    {} as Record<PermissionTypeValues, (typeof permissionList)[0]>,
  );

  async create(createRoleDto: CreateRoleDto, user: RequestUser) {
    const exists = await this.prismaService.client.roles.findFirst({
      where: {
        name: {
          equals: createRoleDto.name,
          mode: 'insensitive',
        },
        tenantsId: createRoleDto.tenantsId ?? undefined,
        deletedAt: null,
      },
    });

    if (exists) {
      throw new ConflictException('Role name already exists');
    }

    const roleCreateInput: PrismaRoleCreateInput = {
      name: createRoleDto.name,
      tenantsId: createRoleDto.tenantsId,
      creatorId: user?.connexus_user_id,
      roleLevel: RoleLevel.NonAdmin, // 1 - Super Admin, 2 - Admin, 3 - Non Admin user
      rolePermissions: {
        create: createRoleDto.permissions.map((permission) => {
          return {
            permissionsId: permission,
          };
        }),
      },
    };

    const { tenant, ...newRole } = await this.prismaService.client.$transaction(
      async (tx) => {
        const role = await tx.roles.create({
          data: roleCreateInput,
          include: {
            tenant: true,
          },
        });

        this.checkPermission(
          user,
          Actions.Create,
          subject(caslSubjects.Roles, role),
        );

        return role;
      },
    );

    return newRole;
  }

  async findAll(input: GetRolesDto, user: RequestUser) {
    const { limit, page, sort, sortDirection } = input;

    let sortInput: Prisma.RolesOrderByWithRelationInput = {};

    if (sort === 'userCount') {
      sortInput.userRoles = {
        _count: sortDirection,
      };
    } else {
      sortInput = getSortInput({
        sort,
        sortDirection,
        modelName: Prisma.ModelName.Roles,
        defaultSort: 'createdAt',
      });
    }

    const where: Prisma.RolesWhereInput = {
      deletedAt: null,
      roleLevel: {
        not: 0, // Exclude super admin role
      },
    };

    if (input.name) {
      where.name = {
        contains: input.name,
        mode: 'insensitive',
      };
    }

    if (input.tenantId) {
      where.tenantsId = input.tenantId;
    } else {
      where.tenantsId = null;
    }

    // Build tenant filter
    let tenantFilter: Prisma.TenantsWhereInput = {};

    if (input.parentTenantIds?.length) {
      tenantFilter = {
        ...tenantFilter,
        parentTenantId: {
          in: input.parentTenantIds,
        },
      };
    }

    if (input.tenantTypes?.length) {
      delete where.tenantsId;
      tenantFilter = {
        ...tenantFilter,
        type: {
          in: input.tenantTypes,
        },
      };
    }

    if (input.tenantIds?.length) {
      tenantFilter = {
        ...tenantFilter,
        id: {
          in: input.tenantIds,
        },
      };
    }

    where.tenant = tenantFilter;

    const [data, pagination] = await this.prismaService.client.roles
      .paginate({
        orderBy: sortInput,
        where: getAbilityFilters({
          condition: where,
          subject: caslSubjects.Roles,
          user,
        }),
        select: {
          id: true,
          name: true,
          readOnly: true,
          tenant: {
            select: {
              id: true,
              type: true,
              name: true,
              clientId: true,
              vendorId: true,
            },
          },
          rolePermissions: {
            select: {
              permissionsId: true,
              rolesId: true,
            },
          },
          _count: {
            select: {
              userRoles: true,
            },
          },
        },
      })
      .withPages(
        getPaginationInput({
          page,
          limit,
        }),
      );

    const formattedData = data.map((role) => {
      return {
        id: role.id,
        name: role.name,
        readOnly: role.readOnly,
        tenant: role.tenant,
        rolePermissions: role.rolePermissions.map((item) => {
          return {
            rolesId: item.rolesId,
            ...this.permissionMap[item.permissionsId],
          };
        }),
        userCount: role._count?.userRoles,
      };
    });

    return {
      data: formattedData,
      pagination,
    };
  }

  async findOne(id: string, user: RequestUser) {
    const where: Prisma.RolesWhereInput = {
      id,
      deletedAt: null,
    };

    const data = await this.prismaService.client.roles.findFirstOrThrow({
      where: getAbilityFilters({
        condition: where,
        subject: caslSubjects.Roles,
        user,
      }),
      select: {
        name: true,
        tenantsId: true,
        rolePermissions: {
          select: {
            permissionsId: true,
          },
        },
        tenant: {
          select: {
            id: true,
            type: true,
            name: true,
            clientId: true,
            vendorId: true,
            parentTenant: {
              select: {
                id: true,
                name: true,
                clientId: true,
                vendorId: true,
              },
            },
          },
        },
      },
    });

    return data;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: RequestUser) {
    const role = await this.prismaService.client.roles.findFirstOrThrow({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        rolePermissions: true,
        tenant: true,
      },
    });

    this.checkPermission(
      user,
      Actions.Update,
      subject(caslSubjects.Roles, role),
    );

    // Check role is read only
    if (role.readOnly) {
      throw new NotAcceptableException('Role is read only');
    }

    // Check if role name is unique
    if (role.name !== updateRoleDto.name) {
      const exists = await this.prismaService.client.roles.findFirst({
        where: {
          name: {
            equals: updateRoleDto.name,
            mode: 'insensitive',
          },
          tenantsId: role.tenantsId ?? undefined,
          NOT: {
            id,
          },
        },
      });

      if (exists) {
        throw new ConflictException('Role already exists');
      }
    }

    const existingPermissions = role.rolePermissions.map(
      (item) => item.permissionsId,
    );

    // Roles to delete and create
    const toDelete = existingPermissions.filter(
      (permission) => !updateRoleDto.permissions.includes(permission),
    );

    const toCreate = updateRoleDto.permissions.filter(
      (permission) => !existingPermissions.includes(permission),
    );

    return this.prismaService.client.roles.update({
      where: {
        id,
      },
      data: {
        name: updateRoleDto.name,
        updaterId: user?.connexus_user_id,
        rolePermissions: {
          deleteMany: {
            permissionsId: {
              in: toDelete,
            },
          },
          create: toCreate.map((permission) => {
            return {
              permissionsId: permission,
              creatorId: user?.connexus_user_id,
            };
          }),
        },
      },
    });
  }

  /**
   *
   * @param ids
   * @returns { message: string }
   */
  async remove(ids: string[], user: RequestUser) {
    // Check if there is read only role
    const readOnlyRoles = await this.prismaService.client.roles.findMany({
      where: {
        id: {
          in: ids,
        },
        readOnly: true,
        deletedAt: null,
      },
    });

    if (readOnlyRoles.length) {
      const roleNames = readOnlyRoles.map((role) => role.name).join(', ');
      throw new NotAcceptableException(
        `Cannot delete read only roles, ${roleNames} are read only`,
      );
    }

    // Check role permissions
    const roles = await this.prismaService.client.roles.findMany({
      where: {
        id: {
          in: ids,
        },
        deletedAt: null,
      },
      include: {
        tenant: true,
      },
    });

    roles.forEach((role) => {
      this.checkPermission(
        user,
        Actions.Delete,
        subject(caslSubjects.Roles, role),
      );
    });

    // Check roles are connected
    const userRoles = await this.prismaService.client.userRoles.findMany({
      where: {
        role: {
          deletedAt: null,
          id: {
            in: ids,
          },
        },
      },
      select: {
        roleId: true,
        userId: true,
        createdAt: true,
        creatorId: true,
        updaterId: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    //

    if (userRoles.length) {
      const roleNames = userRoles.map((role) => role.role.name).join(', ');
      throw new NotAcceptableException(
        `Cannot delete roles, ${roleNames} are connected to users`,
      );
    }

    // Deleting Roless
    const data = await this.prismaService.client.roles.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (!data.count) {
      throw new NotAcceptableException('No roles found');
    }

    return {
      message: 'Roles deleted successfully',
    };
  }
}
