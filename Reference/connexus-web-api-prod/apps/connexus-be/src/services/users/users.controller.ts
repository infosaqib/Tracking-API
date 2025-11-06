import { Actions, caslSubjects } from '@app/ability';
import { AuthGuard } from '@app/guards';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { DeleteRolesDto } from '../roles/dto/remove-role.dto';
import { CheckEmailsDto } from './dto/check-emails.dto';
import { CreatePasswordDto } from './dto/create-password';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateContactTypeDto } from './dto/update-contact-type.dto';
import { UpdateItemsPerPageDto } from './dto/update-items-per-page.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { UsersService } from './users.service';

const SUBJECT = [
  caslSubjects.Users,
  caslSubjects.VendorContact,
  caslSubjects.CorporateContact,
];

@RouteController('users', {
  security: 'public',
})
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/create-password')
  createPassword(@Body() input: CreatePasswordDto) {
    return this.usersService.createPassword(input);
  }

  @Post('/validate-token')
  validateToken(@Body() input: ValidateTokenDto) {
    return this.usersService.validateToken(input);
  }

  @Post()
  @CheckPermission(SUBJECT, Actions.Create)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  create(
    @Body() createUserDto: CreateUserDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.usersService.create(createUserDto, user);
  }

  @Post('/deactivate-user/:id')
  @CheckPermission(SUBJECT, Actions.Update)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  deactivateUser(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.usersService.disableUser(id, user);
  }

  @Post('/activate-user/:id')
  @CheckPermission(SUBJECT, Actions.Update)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  activateUser(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.usersService.activateUser(id, user);
  }

  @Post('/resend-invitation/:id')
  @CheckPermission(SUBJECT, Actions.Update)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  resendInvitation(
    @Param('id') id: string,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.usersService.resendInvitation(id, user);
  }

  @Patch('/update-contact-type/:id')
  @CheckPermission(SUBJECT, Actions.Update)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user contact type',
    description: "Update a user's contact type for a specific tenant",
  })
  @ApiResponse({
    status: 200,
    description: 'User contact type updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User contact type updated to Primary Contact successfully',
        },
      },
    },
  })
  updateContactType(
    @Param('id') id: string,
    @Body() updateContactTypeDto: UpdateContactTypeDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.usersService.updateContactType(id, updateContactTypeDto, user);
  }

  @Get('/profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  getMyProfile(@GetRequestUser() user: RequestUser) {
    return this.usersService.getMyProfile(user.email, user);
  }

  @Get()
  @CheckPermission(SUBJECT, Actions.Read)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  findAll(
    @Query() getUserDto: GetUserDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.usersService.findAll(getUserDto, user);
  }

  @Get('search')
  @CheckPermission(SUBJECT, Actions.Read)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  search(
    @Query() searchUserDto: SearchUserDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.usersService.searchUsers(searchUserDto, user);
  }

  @Get(':id')
  @CheckPermission(SUBJECT, Actions.Read)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.usersService.findOne(id, user);
  }

  @Patch('/items-per-page')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update items per page preference',
    description:
      "Update the authenticated user's items per page preference for pagination",
  })
  updateItemsPerPage(
    @Body() updateItemsPerPageDto: UpdateItemsPerPageDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.usersService.updateItemsPerPage(updateItemsPerPageDto, user);
  }

  @Patch(':id')
  @CheckPermission(SUBJECT, Actions.Update)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete()
  @CheckPermission(SUBJECT, Actions.Delete)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  remove(
    @Query() deleteRolesDto: DeleteRolesDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.usersService.remove(deleteRolesDto, user);
  }

  @Post('check-emails')
  @ApiOperation({
    summary: 'Check if emails already exist',
    description:
      'Check if the provided email addresses already exist in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns list of existing emails and existence status',
    schema: {
      type: 'object',
      properties: {
        existingEmails: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of emails that already exist in the system',
          example: ['user1@example.com'],
        },
        exists: {
          type: 'boolean',
          description: 'Indicates if any of the provided emails exist',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid email format',
  })
  async checkEmails(@Body() checkEmailsDto: CheckEmailsDto) {
    return this.usersService.checkEmails({ emails: checkEmailsDto.emails });
  }
}
