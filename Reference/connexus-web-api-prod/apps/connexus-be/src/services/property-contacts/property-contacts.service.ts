import { Actions, caslSubjects, getAbilityFilters } from '@app/ability';
import { ThrowCaslForbiddenError } from '@app/ability/helpers/casl-helpers';
import { createSubject } from '@app/ability/helpers/create-subject';
import { PrismaService as PrismaClientService } from '@app/prisma';
import { getPaginationInput, getSortInput, RequestUser } from '@app/shared';
import {
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TenantUserFilterTypes } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { CreatePropertyContactDto } from './dto/create-property-contact.dto';
import { GetPropertyContactDto } from './dto/get-property-conatct.dto';
import { PropertyContactPermissionCheckInput } from './dto/types';
import { UpdatePropertyContactDto } from './dto/update-property-contact.dto';

@Injectable()
export class PropertyContactsService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createPropertyContactDto: CreatePropertyContactDto,
    user: RequestUser,
  ) {
    const { propertyId } = createPropertyContactDto;

    const property = await this.prisma.client.clientProperties.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    this.checkUserHasPropertyContactPermission({
      propertyContact: {
        propertyId,
      },
      user,
      action: Actions.Create,
    });

    const creatorId = user.connexus_user_id;

    let userInput: Prisma.UsersCreateNestedOneWithoutPropertyContactsInput = {};

    if (createPropertyContactDto.userData.connect) {
      userInput = {
        connect: { id: createPropertyContactDto.userData.connect.id },
      };
    } else {
      await this.usersService.checkIfEmailExists({
        email: createPropertyContactDto.userData.create.email,
      });

      userInput = {
        create: {
          email: createPropertyContactDto.userData.create.email,
          firstName: createPropertyContactDto.userData.create.firstName,
          lastName: createPropertyContactDto.userData.create.lastName,
          fullName: `${createPropertyContactDto.userData.create.firstName} ${createPropertyContactDto.userData.create.lastName}`,
          phoneCode: createPropertyContactDto.userData.create.phoneCode,
          phoneNumber: createPropertyContactDto.userData.create.phoneNumber,
          phoneExtension:
            createPropertyContactDto.userData.create.phoneExtension,
          title: createPropertyContactDto.userData.create.title,
          isInternal: false,
          creatorId,
          updaterId: creatorId,
          userTenants: {
            create: {
              tenantId: property.tenantId,
              tenantUserFilterType: TenantUserFilterTypes.PROPERTY,
              isPrimaryTenant: true,
            },
          },
        },
      };
    }

    return this.prisma.client.propertyContacts.create({
      data: {
        user: userInput,
        property: { connect: { id: propertyId } },
        creator: { connect: { id: creatorId } },
        updater: { connect: { id: creatorId } },
      },
    });
  }

  async findAll(input: GetPropertyContactDto, user: RequestUser) {
    const where: Prisma.PropertyContactsWhereInput = {
      propertyId: input.propertyId,
      user: {
        deletedAt: null,
      },
      ...(input.search && {
        OR: [
          {
            user: {
              fullName: { contains: input.search, mode: 'insensitive' },
            },
          },
          {
            user: {
              email: { contains: input.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    if (input.contactType) {
      where.user = {
        userTenants: {
          some: {
            contactType: input.contactType,
          },
        },
      };
    }

    const sort = getSortInput({
      modelName: Prisma.ModelName.PropertyContacts,
      sort: input.sort,
      sortDirection: input.sortDirection,
      defaultSort: 'createdAt',
    });

    const [data, pagination] = await this.prisma.client.propertyContacts
      .paginate({
        where: getAbilityFilters({
          condition: where,
          user,
          subject: caslSubjects.PropertyContact,
        }),
        orderBy: sort,
        select: {
          id: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              phoneCode: true,
              phoneExtension: true,
              title: true,
              avatarUrl: true,
              status: true,
              authorized: true,
              userTenants: {
                select: {
                  tenantId: true,
                  contactType: true,
                },
              },
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
    // Check if the property contact belongs to the user
    const propertyContact =
      await this.prisma.client.propertyContacts.findUnique({
        where: {
          id,
        },
      });

    if (!propertyContact) {
      throw new NotFoundException('Property contact not found');
    }

    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      Actions.Delete,
      caslSubjects.PropertyContact,
    );

    // Check if the property is a manager
    const property = await this.prisma.client.clientProperties.findUnique({
      where: {
        id: propertyContact.propertyId,
      },
    });

    if (property?.propertyManagerId === propertyContact.userId) {
      throw new NotAcceptableException('Cannot delete property manager');
    }

    await this.prisma.client.propertyContacts.delete({
      where: {
        id,
      },
    });

    return { message: 'Property contact deleted successfully' };
  }

  async updateOne(
    id: string,
    updatePropertyContactDto: UpdatePropertyContactDto,
    user: RequestUser,
  ) {
    const propertyContact =
      await this.prisma.client.propertyContacts.findFirstOrThrow({
        where: {
          id,
        },
      });

    if (!propertyContact) {
      throw new NotFoundException('Property contact not found');
    }

    this.checkUserHasPropertyContactPermission({
      propertyContact,
      user,
      action: Actions.Update,
    });

    let fullName: string | undefined;

    if (
      updatePropertyContactDto.firstName &&
      updatePropertyContactDto.lastName
    ) {
      fullName = `${updatePropertyContactDto.firstName} ${updatePropertyContactDto.lastName}`;
    }

    // Get user information to check authorized status
    const userToUpdate = await this.prisma.client.users.findUnique({
      where: {
        id: propertyContact.userId,
      },
      select: {
        authorized: true,
      },
    });

    // Check if email already exists when updating email
    if (updatePropertyContactDto.email) {
      const existingUser = await this.prisma.client.users.findFirst({
        where: {
          email: updatePropertyContactDto.email,
          deletedAt: null,
          id: {
            not: propertyContact.userId,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Only include email in update if user is not authorized
    const updateData: Prisma.UsersUpdateInput = {
      firstName: updatePropertyContactDto.firstName,
      lastName: updatePropertyContactDto.lastName,
      fullName,
      phoneCode: updatePropertyContactDto.phoneCode,
      phoneNumber: updatePropertyContactDto.phoneNumber,
      title: updatePropertyContactDto.title,
      phoneExtension: updatePropertyContactDto.phoneExtension,
    };

    // Allow email updates for non-authorized users
    if (updatePropertyContactDto.email && !userToUpdate.authorized) {
      updateData.email = updatePropertyContactDto.email;
    }

    await this.prisma.client.users.update({
      where: {
        id: propertyContact.userId,
      },
      data: updateData,
    });
  }

  private checkUserHasPropertyContactPermission(
    input: PropertyContactPermissionCheckInput,
  ) {
    const { propertyContact, user, action } = input;
    ThrowCaslForbiddenError.from(user.ability).throwUnlessCan(
      action,
      createSubject(caslSubjects.PropertyContact, propertyContact),
    );
  }
}
