import { BadRequestException, Body, Controller, Delete, Get, Patch, Param } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  // GET /users/me
  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return this.usersService.sanitize(user);
  }

  // PATCH /users/profile
  @Patch('profile')
  async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, dto);
    return this.usersService.sanitize(user);
  }

  // PATCH /users/password
  @Patch('password')
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  // Validate the role param before passing to Prisma — the router accepts any string,
  // so we guard against unknown values that would cause a Prisma enum cast error.
  @Roles(Role.ADMIN)
  @Patch(':id/role/:role')
  async setRole(@Param('id') id: string, @Param('role') role: string) {
    if (!Object.values(Role).includes(role as Role)) {
      throw new BadRequestException(`Role must be one of: ${Object.values(Role).join(', ')}`);
    }
    const user = await this.usersService.setRole(id, role as Role);
    return this.usersService.sanitize(user);
  }


  // GET /users/linked-accounts -> which providers (Google/GitHub) this
  // account can sign in with, plus whether a password is set.
  @Get('linked-accounts')
  listLinkedAccounts(@CurrentUser('id') userId: string) {
    return this.usersService.listLinkedAccounts(userId);
  }

  // DELETE /users/linked-accounts/:id -> disconnect one provider. Blocked if
  // it's the user's only remaining sign-in method.
  @Delete('linked-accounts/:id')
  unlinkAccount(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.usersService.unlinkAccount(userId, id);
  }
}
