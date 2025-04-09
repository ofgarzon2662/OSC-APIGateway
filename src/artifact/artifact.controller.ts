import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { ArtifactEntity } from './artifact.entity';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactDto } from './dto/update-artifact.dto';
import { GetArtifactDto } from './dto/get-artifact.dto';
import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guards';
import { Roles } from '../shared/decorators/roles.decorators';
import { Role } from '../shared/enums/role.enums';

@Controller('organizations/:organizationId/artifacts')
@UseInterceptors(BusinessErrorsInterceptor)
export class ArtifactController {
  constructor(private readonly artifactService: ArtifactService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: any,
    @Body() createArtifactDto: CreateArtifactDto
  ): Promise<ArtifactEntity> {
    if (!req.user || !req.user.email) {
      throw new Error('Authenticated user email not found in request.');
    }
    const submitterEmail = req.user.email;
    
    return await this.artifactService.create(createArtifactDto, submitterEmail);
  }

  @Get()
  async findAll(): Promise<GetArtifactDto[]> {
    return await this.artifactService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string
  ): Promise<GetArtifactDto> {
    return await this.artifactService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUBMITTER_LISTENER)
  async update(
    @Param('id') id: string,
    @Body() updateArtifactDto: UpdateArtifactDto,
  ): Promise<ArtifactEntity> {
    return await this.artifactService.update(id, updateArtifactDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(
    @Param('id') id: string
  ): Promise<void> {
    return await this.artifactService.delete(id);
  }
}
