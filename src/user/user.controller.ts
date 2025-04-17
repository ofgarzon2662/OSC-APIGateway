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
import { UserCreateDto } from './dto/userCreate.dto';
import { BusinessErrorsInterceptor } from 'src/shared/interceptors/business-errors.interceptors';
import { RolesGuard } from 'src/auth/roles/roles.guards';
import { Request } from 'express';
import { User } from '../auth/decorators/user.decorator';
import { UserEntity } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BusinessErrorsInterceptor)
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  async login(@Req() req: Request) {
    return this.authService.login(req.user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.PI)
  async create(
    @Body() createUserDto: UserCreateDto,
    @User() creator: UserEntity
  ) {
    return this.userService.create(createUserDto, creator);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string
  ) {
    return this.userService.getOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UserCreateDto
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.PI)
  async remove(
    @Param('id') id: string
  ) {
    return this.userService.remove(id);
  }
}
