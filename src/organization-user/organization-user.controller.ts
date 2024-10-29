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

import { OrganizationUserService } from './organization-user.service';
import { plainToInstance } from 'class-transformer';
import { UserDto } from '../user/user.dto';
import { UserEntity } from '../user/user.entity';
import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';

@Controller('organizations')
@UseInterceptors(BusinessErrorsInterceptor)
export class OrganizationUserController {
  constructor(
    private readonly organizationUserService: OrganizationUserService,
  ) {}

  // Agrergar un user a un organization
  @Post(':organizationId/members/:memberId')
  async addMemberToOrganization(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return await this.organizationUserService.addMemberToOrganization(
      organizationId,
      memberId,
    );
  }

  // Enontrar miembros de un organization

  @Get(':organizationId/members')
  async findMembersByOrganization(
    @Param('organizationId') organizationId: string,
  ) {
    return await this.organizationUserService.findMembersFromOrganization(
      organizationId,
    );
  }

  // Encontrar un miembro de un organization

  @Get(':organizationId/members/:memberId')
  async findMemberByOrganization(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return await this.organizationUserService.findMemberFromOrganization(
      organizationId,
      memberId,
    );
  }

  // Actualizar miembros de un organization

  @Put(':organizationId/members')
  async updateMembersFromOrganization(
    @Param('organizationId') organizationId: string,
    @Body() usersDto: UserDto[],
  ) {
    const usersEntities: UserEntity[] = plainToInstance(UserEntity, usersDto);

    return await this.organizationUserService.updateMembersFromOrganization(
      organizationId,
      usersEntities,
    );
  }

  // Eliminar un user de un organization

  @Delete(':organizationId/members/:memberId')
  @HttpCode(204)
  async deleteMemberFromOrganization(
    @Param('organizationId') organizationId: string,
    @Param('memberId') memberId: string,
  ) {
    return await this.organizationUserService.deleteMemberFromOrganization(
      organizationId,
      memberId,
    );
  }
}
