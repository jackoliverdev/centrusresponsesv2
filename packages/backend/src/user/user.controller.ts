import { BadRequestException, Body, Controller, HttpException, Post } from '@nestjs/common';
import { UserService } from './user.service';

import { OrganizationId, User } from '@/auth-guard/user.decorator';
import { UserFromRequest } from '@/auth-guard/auth-guard.types';
import { Authorized } from '@/auth-guard/auth-guard';
import {
  AdminUpdateUserDto,
  API,
  RequestBodyType,
  ResponseBodyType,
  USER_ROLES,
} from 'common';
import { FirebaseAuthService } from '@/firebase-auth/firebase-auth.service';
import { SendgridService } from '@/sendgrid/sendgrid.service';
import { OrganizationService } from '@/organization/organization.service';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly firebaseAuthService: FirebaseAuthService,
    private readonly sendgridService: SendgridService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post(API.getOrCreateUser.path)
  @Authorized()
  async getOrCreateUser(
    @User()
    { userId, email }: UserFromRequest,
  ): Promise<ReturnType<typeof API.getOrCreateUser.getTypedResponseBody>> {
    return await this.userService.getUserWithOrganizations(userId, email);
  }

  @Post(API.updateUser.path)
  @Authorized()
  async updateUser(
    @User()
    { userId }: UserFromRequest,
    @Body()
    updateUserDto: ReturnType<typeof API.updateUser.getTypedRequestBody>,
  ): Promise<ReturnType<typeof API.updateUser.getTypedResponseBody>> {
    if (updateUserDto.phone) {
      const user = await this.userService.findUserByPhone(updateUserDto.phone);
      if (user && user.id != userId)
        throw new BadRequestException(
          'Phone number already used by another account',
        );
    }
    await this.userService.updateUserInDatabase(userId, {
      ...updateUserDto,
      ai_user_temperature: typeof updateUserDto.ai_user_temperature !== 'undefined' ? updateUserDto.ai_user_temperature : 0.5,
    });

    return this.userService.getUserWithOrganizations(userId);
  }

  // THIS HAS TO BE ONLY FOR ADMINS

  @Post(API.adminCreateUser.path)
  @Authorized({ requiredRoles: ['admin'] })
  async createUser(
    @Body()
    createUserDto: ReturnType<typeof API.adminCreateUser.getTypedRequestBody>,
    @OrganizationId() organizationId: number,
  ): Promise<ReturnType<typeof API.adminCreateUser.getTypedResponseBody>> {
    const currentUsage = await this.userService.usage(organizationId);
    const usageLimit = await this.organizationService.usageLimitsForOrganization(organizationId);

    if (currentUsage >= usageLimit.users) {
      throw new BadRequestException("You've reached your users limit");
    }

    const {
      email,
      firstName,
      lastName,
      tags,
      is_teamleader,
      password,
      image,
      team_member_ids,
      isAdmin,
      phone,
      address,
      position,
    } = createUserDto;

    if (phone) {
      const user = await this.userService.findUserByPhone(phone);
      if (user)
        throw new BadRequestException(
          'Phone number already used by another account',
        );
    }

    let user;
    try {
      user = await this.firebaseAuthService.createUser(email, password);
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Something went wrong',
      );
    }

    let userWithOrganization;
    try {
      userWithOrganization = await this.userService.createUserInDatabase({
        firebaseUid: user.uid,
        email,
        organizationId: organizationId,
        firstName,
        lastName,
        phone,
        profile: { address, position },
        tags,
        is_teamleader,
        image,
        isAdmin,
        ai_user_temperature: typeof createUserDto.ai_user_temperature !== 'undefined' ? createUserDto.ai_user_temperature : 0.5,
      });
    } catch (e) {
      await this.firebaseAuthService.deleteUser(user.uid);
      throw e;
    }

    if (is_teamleader) {
      for (const id of team_member_ids) {
        await this.userService.updateUserInDatabase(id, {
          teamlead_id: userWithOrganization.user.id,
        });
      }
    }

    try {
      await this.sendgridService.send({
        to: userWithOrganization.user.email,
        subject: 'Welcome to Centrus',
        text: `Welcome to Centrus, ${firstName} ${lastName}!
Email: ${email}
Password: ${password}
      `,
      });
    } catch {}

    return userWithOrganization;
  }

  // @Get('all')
  // async getAllUsers(@Query('organizationId') organizationId?: string) {
  //   return this.userService.getAllUsers(organizationId);
  // }

  // @Get(':id')
  // async getUserById(@Param('id') id: string) {
  //   const user = await this.userService.getUserById(id);
  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${id} not found`);
  //   }
  //   return user;
  // }

  @Post(API.adminUpdateUser.path)
  @Authorized({ requiredRoles: ['admin'] })
  async adminUpdateUser(@Body() updateUserDto: AdminUpdateUserDto) {
    const { id, ...updatePayload } = updateUserDto;
    if (updateUserDto.phone) {
      const user = await this.userService.findUserByPhone(updateUserDto.phone);
      if (user && user.id != id)
        throw new BadRequestException(
          'Phone number already used by another account',
        );
    }
    return this.userService.updateUserInDatabase(
      updateUserDto.id,
      {
        ...updatePayload,
        ai_user_temperature: typeof updatePayload.ai_user_temperature !== 'undefined' ? updatePayload.ai_user_temperature : 0.5,
      },
    );
  }

  @Post(API.adminDeleteUser.path)
  @Authorized({ requiredRoles: ['admin'] })
  async adminDeleteUser(
    @Body() deleteUserDto: RequestBodyType<typeof API.adminDeleteUser>,
  ): Promise<ResponseBodyType<typeof API.adminDeleteUser>> {
    await this.userService.deleteUser(deleteUserDto.id);
    return;
  }

  // @Delete(':id')
  // async deleteUser(@Param('id') id: string) {
  //   return this.userService.deleteUser(id);
  // }

  @Post(API.updateUserAIContext.path)
  @Authorized()
  async updateUserAIContext(
    @User() { userId }: UserFromRequest,
    @Body() updateUserContextDto: RequestBodyType<typeof API.updateUserAIContext>,
  ): Promise<ResponseBodyType<typeof API.updateUserAIContext>> {
    await this.userService.updateUserAIContext(userId, updateUserContextDto.ai_user_context);
    return this.userService.getUserWithOrganizations(userId);
  }

  @Post(API.getUsers.path)
  @Authorized({ requiredRoles: [USER_ROLES.superAdmin] })
  async getUsers(
    @Body() params: ReturnType<
      typeof API.getUsers.getTypedRequestBody
    >,
  ): Promise<ResponseBodyType<typeof API.getUsers>> {
    return await this.userService.getUsers(params);
  }
}
