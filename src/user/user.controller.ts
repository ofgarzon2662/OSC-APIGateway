import { Controller, Post, Get, Param, Delete, Req, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { LocalAuthGuard } from '../auth/guards/local-auth/local-auth.guard';
import { AuthService } from '../auth/auth.service';
import { BusinessErrorsInterceptor } from 'src/shared/interceptors/business-errors.interceptors';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles/roles.guards';
import { Role } from 'src/shared/enums/role.enums';
import { Roles } from 'src/shared/decorators/roles.decorators';
import { UserService } from './user.service';
import { UserCreateDto } from './userCreate.dto';

@Controller('users')
@UseInterceptors(BusinessErrorsInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}
  
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.login(req);
  }

  @Post('register')
  @Roles(Role.ADMIN, Role.PI)
  create(@Body() user: UserCreateDto) {
    return this.userService.create(user);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

}
