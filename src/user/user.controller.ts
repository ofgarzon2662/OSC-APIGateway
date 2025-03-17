import { Controller, Post, Get, Param, Delete, Req, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { LocalAuthGuard } from '../auth/guards/local-auth/local-auth.guard';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Role } from 'src/shared/enums/role.enums';
import { Roles } from 'src/shared/decorators/roles.decorators';
import { UserService } from './user.service';
import { UserCreateDto } from './userCreate.dto';
import { BusinessErrorsInterceptor } from 'src/shared/interceptors/business-errors.interceptors';
import { RolesGuard } from 'src/auth/roles/roles.guards';

@Controller('users')
@UseInterceptors(BusinessErrorsInterceptor)
export class UserController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}
  
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.login(req);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('register')
  @Roles(Role.ADMIN, Role.PI)
  create(@Body() user: UserCreateDto) {
    return this.userService.create(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username')
  findOne(@Param('username') username: string) {
    return this.userService.getOne(username);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete()
  deleteAll() {
    return this.userService.deleteAll();
  }
}
