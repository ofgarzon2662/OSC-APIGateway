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

  // Get All Organizations
  @Get()
  async findAll() {
    return await this.organizationService.findAll();
  }

  // Get One
  @Get(':organizationId')
  async findOne(@Param('organizationId') organizationId: string) {
    return await this.organizationService.findOne(organizationId);
  }

  // Create
  @Post()
  async create(@Body() organizationDto: OrganizationDto) {
    const organization: OrganizationEntity = plainToInstance(
      OrganizationEntity,
      organizationDto,
    );
    return await this.organizationService.create(organization);
  }

  // Update
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

  // Delete
  @Delete(':organizationId')
  @HttpCode(204)
  async delete(@Param('organizationId') organizationId: string) {
    return this.organizationService.delete(organizationId);
  }
}
