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

import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';
import { OrganizationService } from './organization.service';
import { OrganizationEntity } from './organization.entity';
import { OrganizationDto } from './organization.dto';
import { plainToInstance } from 'class-transformer';

@Controller('organizations')
@UseInterceptors(BusinessErrorsInterceptor)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // Obtener todos los organizations
  @Get()
  async findAll() {
    return await this.organizationService.findAll();
  }

  // Obtener un organization por id
  @Get(':organizationId')
  async findOne(@Param('organizationId') organizationId: string) {
    return await this.organizationService.findOne(organizationId);
  }

  // Crear un organization
  @Post()
  async create(@Body() organizationDto: OrganizationDto) {
    const organization: OrganizationEntity = plainToInstance(
      OrganizationEntity,
      organizationDto,
    );
    return await this.organizationService.create(organization);
  }

  // Actualizar un organization
  @Put(':organizationId')
  async update(
    @Param('organizationId') organizationId: string,
    @Body() organizationDto: OrganizationDto,
  ) {
    const organization: OrganizationEntity = plainToInstance(
      OrganizationEntity,
      organizationDto,
    );
    return await this.organizationService.update(organizationId, organization);
  }

  // Eliminar un organization
  @Delete(':organizationId')
  @HttpCode(204)
  async delete(@Param('organizationId') organizationId: string) {
    return this.organizationService.delete(organizationId);
  }
}
