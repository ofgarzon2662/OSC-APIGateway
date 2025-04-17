import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  Body,
  HttpCode,
  Put,
} from '@nestjs/common';
import { LocalAuthGuard } from '../auth/guards/local-auth/local-auth.guard';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Role } from 'src/shared/enums/role.enums';
import { Roles } from 'src/shared/decorators/roles.decorators';
import { UserService } from './user.service';
import { UserCreateDto } from './userCreate.dto';
import { BusinessErrorsInterceptor } from 'src/shared/interceptors/business-errors.interceptors';
import { RolesGuard } from 'src/auth/roles/roles.guards';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OrganizationId } from '../auth/decorators/organization.decorator';
import { User } from '../auth/decorators/user.decorator';
import { UserEntity } from './user.entity';

@Controller('users')
@UseInterceptors(BusinessErrorsInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.login(req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request) {
    const token = req.headers.authorization;
    return this.authService.logout(token);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PI)
  async create(
    @Body() createUserDto: CreateUserDto,
    @OrganizationId() organizationId: string,
    @User() creator: UserEntity
  ) {
    return this.userService.create(createUserDto, organizationId, creator);
  }

  @Get()
  @Roles(Role.ADMIN, Role.PI)
  async findAll(@OrganizationId() organizationId: string) {
    return this.userService.findAll(organizationId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.PI)
  async findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: string
  ) {
    return this.userService.getOne(id, organizationId);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.PI)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @OrganizationId() organizationId: string
  ) {
    return this.userService.update(id, updateUserDto, organizationId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PI)
  async remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: string
  ) {
    return this.userService.remove(id, organizationId);
  }

  @Post('associate-organization')
  @Roles(Role.ADMIN)
  async associateWithOrganization(
    @Param('organizationId') organizationId: string,
    @User() user: UserEntity
  ) {
    return this.userService.associateAdminWithOrganization(user.id, organizationId);
  }
}
