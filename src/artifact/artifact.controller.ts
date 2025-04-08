import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { ArtifactEntity } from './artifact.entity';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactDto } from './dto/update-artifact.dto';
import { GetArtifactDto } from './dto/get-artifact.dto';
import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';

@Controller('organization/:organizationId/artifacts')
@UseInterceptors(BusinessErrorsInterceptor)
export class ArtifactController {
  constructor(private readonly artifactService: ArtifactService) {}

  @Post()
  async create(
    @Param('organizationId') organizationId: string,
    @Body() createArtifactDto: CreateArtifactDto
  ): Promise<ArtifactEntity> {
    // Ensure the organizationId in the path matches the one in the DTO
    if (createArtifactDto.organizationId !== organizationId) {
      createArtifactDto.organizationId = organizationId;
    }
    return await this.artifactService.create(createArtifactDto);
  }

  @Get()
  async findAll(): Promise<GetArtifactDto[]> {
    return await this.artifactService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string
  ): Promise<GetArtifactDto> {
    return await this.artifactService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() updateArtifactDto: UpdateArtifactDto,
  ): Promise<ArtifactEntity> {
    return await this.artifactService.update(id, updateArtifactDto);
  }

  @Delete(':id')
  async delete(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string
  ): Promise<void> {
    return await this.artifactService.delete(id);
  }
}
