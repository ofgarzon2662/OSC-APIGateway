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

@Controller('artifacts')
@UseInterceptors(BusinessErrorsInterceptor)
export class ArtifactController {
  constructor(private readonly artifactService: ArtifactService) {}

  // Obtener todos los artifacts
  @Get()
  async findAll(): Promise<ArtifactEntity[]> {
    return this.artifactService.findAll();
  }

  // Obtener un artifact por id
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ArtifactEntity> {
    return this.artifactService.findOne(id);
  }

  // Crear un artifact
  @Post()
  async create(
    @Param('organizationId') organizationId: string,
    @Body() artifactDto: ArtifactDto,
  ) {
    const artifact: Partial<ArtifactEntity> = plainToInstance(
      ArtifactEntity,
      artifactDto,
    );
    return await this.artifactService.create(artifact, organizationId);
  }

  // Actualizar un artifact

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
