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

import { ArtifactService } from './artifact.service';
import { ArtifactEntity } from './artifact.entity';
import { plainToInstance } from 'class-transformer';
import { ArtifactDto } from './artifact.dto';
import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';

@Controller('organizations/:organizationId/artifacts')
@UseInterceptors(BusinessErrorsInterceptor)
export class ArtifactController {
  constructor(private readonly artifactService: ArtifactService) {}

  // Get All artifacts
  @Get()
  async findAll(): Promise<ArtifactEntity[]> {
    return this.artifactService.findAll();
  }

  // Get One Artifact
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ArtifactEntity> {
    return this.artifactService.findOne(id);
  }

  // Create One artifact
  @Post()
  async create(@Body() artifactDto: ArtifactDto) {
    const artifact: Partial<ArtifactEntity> = plainToInstance(
      ArtifactEntity,
      artifactDto,
    );
    return await this.artifactService.create(artifact);
  }

  // Update an artifact

  @Put(':artifactId')
  async update(
    @Param('artifactId') artifactId: string,
    @Body() @Body() artifactDto: ArtifactDto,
  ) {
    const artifact: ArtifactEntity = plainToInstance(
      ArtifactEntity,
      artifactDto,
    );
    return await this.artifactService.update(artifactId, artifact);
  }

  // Eliminar un artifact

  @Delete(':artifactId')
  @HttpCode(204)
  async delte(@Param('artifactId') artifactId: string) {
    return this.artifactService.delete(artifactId);
  }
}
