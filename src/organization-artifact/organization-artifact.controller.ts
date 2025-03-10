import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  HttpCode,
} from '@nestjs/common';
import { OrganizationArtifactService } from './organization-artifact.service';
import { AddArtifactToOrganizationDto } from './dto/add-artifact-to-organization.dto';
import { OrganizationArtifactDto } from './dto/organization-artifact.dto';
import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';
import { UpdateArtifactInOrganizationDto } from './dto/update-artifact-in-organization.dto';

@Controller('organizations-artifacts')
@UseInterceptors(BusinessErrorsInterceptor)
export class OrganizationArtifactController {
  constructor(
    private readonly organizationArtifactService: OrganizationArtifactService,
  ) {}

  @Get('organizations/:organizationId/artifacts')
  async findArtifactsByOrganization(
    @Param('organizationId') organizationId: string,
  ): Promise<OrganizationArtifactDto[]> {
    return this.organizationArtifactService.findArtifactsByOrganization(
      organizationId,
    );
  }

  @Get('organizations/:organizationId/artifacts/:artifactId')
  async findOneArtifactByOrganization(
    @Param('organizationId') organizationId: string,
    @Param('artifactId') artifactId: string,
  ): Promise<OrganizationArtifactDto> {
    return this.organizationArtifactService.findOneArtifactByOrganization(
      organizationId,
      artifactId,
    );
  }

  @Post('add-artifact')
  async addArtifactToOrganization(
    @Body() dto: AddArtifactToOrganizationDto,
  ): Promise<OrganizationArtifactDto> {
    return this.organizationArtifactService.addArtifactToOrganization(dto);
  }

  @Put('organizations/:organizationId/artifacts/:artifactId')
  async updateArtifactInOrganization(
    @Param('organizationId') organizationId: string,
    @Param('artifactId') artifactId: string,
    @Body() dto: UpdateArtifactInOrganizationDto,
  ): Promise<OrganizationArtifactDto> {
    return this.organizationArtifactService.updateArtifactInOrganization(
      organizationId,
      artifactId,
      dto,
    );
  }

  @Delete('organizations/:organizationId/artifacts/:artifactId')
  @HttpCode(204)
  async removeArtifactFromOrganization(
    @Param('artifactId') artifactId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<void> {
    return this.organizationArtifactService.removeArtifactFromOrganization(
      artifactId,
      organizationId,
    );
  }
}
