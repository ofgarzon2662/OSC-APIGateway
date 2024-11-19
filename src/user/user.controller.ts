import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';

import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './user.dto';
import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';

@Controller('organizations/:organizationId/users')
@UseInterceptors(BusinessErrorsInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Obtener todos los users
  @Get()
  async findAll(
    @Param('organizationId') organizationId: string,
  ): Promise<UserEntity[]> {
    return this.userService.findAll(organizationId);
  }

  // Obtener un user por id
  @Get(':id')
  async findOne(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
  ): Promise<UserEntity> {
    return this.userService.findOne(organizationId, id);
  }

  // Crear un user
  @Post()
  async create(
    @Param('organizationId') organizationId: string,
    @Body() userDto: UserDto,
  ) {
    const user: UserEntity = plainToInstance(UserEntity, userDto);
    return await this.userService.create(user, organizationId);
  }

  // Actualizar un user

  @Put(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() @Body() userDto: UserDto,
  ) {
    const user: UserEntity = plainToInstance(UserEntity, userDto);
    return await this.userService.update(userId, user);
  }

  // Eliminar un user

  @Delete(':userId')
  @HttpCode(204)
  async delte(@Param('userId') userId: string) {
    return this.userService.delete(userId);
  }
}
