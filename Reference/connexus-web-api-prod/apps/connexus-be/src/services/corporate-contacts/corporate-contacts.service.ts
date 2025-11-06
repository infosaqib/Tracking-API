import { Actions, caslSubjects, getAbilityFilters } from '@app/ability';
import { createCorporateContactSubject } from '@app/ability/permissions/client-corporate-contact-management';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import { ForbiddenError, subject } from '@casl/ability';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, TenantUserFilterTypes } from '@prisma/client';
import { PrismaUserCreateInput } from 'src/types/prisma-create-input';
import { formatEnum } from 'src/utils/formatEnum';
import { CreateCorporateContactDto } from './dto/create-corporate-contact.dto';
import { GetCorporateContactDto } from './dto/get-corporate-contact.dto';
import { UpdateCorporateContactDto } from './dto/update-corporate-contact.dto';

@Injectable()
export class CorporateContactsService {
  constructor(private readonly prismaService: PrismaClientService) {}

  async create(
    createCorporateContactDto: CreateCorporateContactDto,
    user: RequestUser,
  ) {
    // Check email exists
    const userExists = await this.prismaService.client.users.findFirst({
      where: {
        email: createCorporateContactDto.email,
        deletedAt: null,
      },
    });

    if (userExists) {
      throw new ConflictException('User already exists');
    }

    const contactTypeCount = await this.prismaService.client.userTenants.count({
      where: {
        contactType: createCorporateContactDto.contactType,
        deletedAt: null,
        tenantId: createCorporateContactDto.tenantId,
      },
    });

    if (contactTypeCount >= 5) {
      throw new ConflictException(
        `You can only add 5 ${formatEnum(createCorporateContactDto.contactType)}s. Please use Contact Management to add more`,
      );
    }

    const createContactInput: PrismaUserCreateInput = {
      email: createCorporateContactDto.email,
      firstName: createCorporateContactDto.firstName,
      lastName: createCorporateContactDto.lastName,
      isInternal: false,
      title: createCorporateContactDto.title,
      phoneNumber: createCorporateContactDto.phoneNumber,
      phoneCode: createCorporateContactDto.phoneCode,
      phoneExtension: createCorporateContactDto.phoneExtension,
      authorized: false,
      avatarUrl: '',
      creatorId: user?.connexus_user_id,
      fullName: `${createCorporateContactDto.firstName} ${createCorporateContactDto.lastName}`,
      userTenants: {
        create: {
          tenantId: createCorporateContactDto.tenantId,
          contactType: createCorporateContactDto.contactType,
          isPrimaryTenant: true,
          tenantUserFilterType: TenantUserFilterTypes.CLIENT,
        },
      },
    };

    ForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Create,
      createCorporateContactSubject(createContactInput, true),
    );

    return this.prismaService.client.users.create({
      data: createContactInput,
    });
  }

  async update(
    id: string,
    updateCorporateContactDto: UpdateCorporateContactDto,
    user: RequestUser,
  ) {
    const userToUpdate = await this.prismaService.client.users.findUnique({
      where: {
        id,
      },
      include: {
        userTenants: true,
      },
    });

    ForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Update,
      subject(caslSubjects.CorporateContact, userToUpdate),
    );

    const updateInput: Prisma.UsersUpdateInput = {
      firstName: updateCorporateContactDto.firstName,
      lastName: updateCorporateContactDto.lastName,
      phoneNumber: updateCorporateContactDto.phoneNumber,
      phoneCode: updateCorporateContactDto.phoneCode,
      phoneExtension: updateCorporateContactDto.phoneExtension,
      title: updateCorporateContactDto.title,
      updater: {
        connect: {
          id: user.connexus_user_id,
        },
      },
    };

    // Add email to updateInput if provided and user is not authorized
    if (updateCorporateContactDto.email) {
      // Check if email already exists
      const existingUser = await this.prismaService.client.users.findFirst({
        where: {
          email: updateCorporateContactDto.email,
          deletedAt: null,
          id: {
            not: id,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Allow email updates for non-authorized users
      if (!userToUpdate.authorized) {
        updateInput.email = updateCorporateContactDto.email;
      }
    }

    if (updateCorporateContactDto.contactType) {
      updateInput.userTenants = {
        update: {
          data: {
            contactType: updateCorporateContactDto.contactType,
          },
          where: {
            userId_tenantId: {
              userId: userToUpdate.id,
              tenantId: userToUpdate.userTenants[0].tenantId,
            },
          },
        },
      };
    } else if (updateCorporateContactDto.contactType === null) {
      updateInput.userTenants = {
        update: {
          data: {
            contactType: null,
          },
          where: {
            userId_tenantId: {
              userId: userToUpdate.id,
              tenantId: userToUpdate.userTenants[0].tenantId,
            },
          },
        },
      };
    }

    if (
      updateCorporateContactDto.firstName &&
      updateCorporateContactDto.lastName
    ) {
      updateInput.fullName = `${updateCorporateContactDto.firstName} ${updateCorporateContactDto.lastName}`;
    }

    return this.prismaService.client.users.update({
      where: {
        id,
      },
      data: updateInput,
    });
  }

  async remove(id: string, user: RequestUser) {
    const userToDelete = await this.prismaService.client.users.findFirstOrThrow(
      {
        where: {
          id,
          deletedAt: null,
        },
        include: {
          userTenants: true,
        },
      },
    );

    // Check user is authorized to delete
    ForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Delete,
      subject(caslSubjects.CorporateContact, userToDelete),
    );

    if (user.connexus_user_id === userToDelete.id) {
      throw new BadRequestException('You cannot delete your own contact');
    }

    if (userToDelete.authorized) {
      throw new BadRequestException(
        'You cannot delete a contact that is authorized',
      );
    }

    await this.prismaService.client.users.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        updaterId: user.connexus_user_id,
      },
    });

    return {
      message: 'Contact deleted successfully',
    };
  }

  async findAll(input: GetCorporateContactDto, user: RequestUser) {
    const { tenantId, contactType, search, page, limit } = input;

    const where: Prisma.UsersWhereInput = {
      deletedAt: null,
      userTenants: {
        some: {
          tenantId,
        },
      },
    };

    if (contactType) {
      where.userTenants.some.contactType = contactType;
    }

    if (search) {
      where.OR = [
        {
          fullName: { contains: search, mode: 'insensitive' },
        },
        {
          email: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const sort = getSortInput({
      sort: input.sort,
      sortDirection: input.sortDirection,
      defaultSort: 'createdAt',
      modelName: Prisma.ModelName.Users,
    });

    const [data, pagination] = await this.prismaService.client.users
      .paginate({
        where: getAbilityFilters({
          condition: where,
          subject: caslSubjects.CorporateContact,
          user,
        }),
        orderBy: sort,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          title: true,
          phoneNumber: true,
          phoneCode: true,
          phoneExtension: true,
          authorized: true,
          userTenants: {
            select: {
              tenantId: true,
              contactType: true,
            },
          },
        },
      })
      .withPages(getPaginationInput({ page, limit }));

    return {
      data,
      pagination,
    };
  }

  async findOne(id: string, user: RequestUser) {
    const contact = await this.prismaService.client.users.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        title: true,
        phoneNumber: true,
        phoneCode: true,
        phoneExtension: true,
        authorized: true,
        userTenants: {
          select: {
            tenantId: true,
            contactType: true,
          },
        },
      },
    });

    ForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Read,
      createCorporateContactSubject(contact, true),
    );

    return contact;
  }
}
