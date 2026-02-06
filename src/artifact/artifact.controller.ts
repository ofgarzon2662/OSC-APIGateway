import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  UseInterceptors,
  UseGuards,
  Req,
  UnauthorizedException,
  Query,
  Headers
} from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { ArtifactEntity } from './artifact.entity';
import { CreateArtifactDto } from './dto/create-artifact.dto';
import { UpdateArtifactWorkerDto } from './dto/update-artifact-worker.dto';

import { GetArtifactDto } from './dto/get-artifact.dto';
import { ListArtifactDto } from './dto/list-artifact.dto';
import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { ApiKeyAuthGuard } from '../auth/guards/api-key-auth/api-key-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guards';
import { Roles } from '../shared/decorators/roles.decorators';
import { Role } from '../shared/enums/role.enums';
import { UpdateArtifactUserDto } from './dto/update-artifact-user.dto';
import { GhwService } from './ghw.service';

@Controller('artifacts')
@UseInterceptors(BusinessErrorsInterceptor)
export class ArtifactController {
  constructor(
    private readonly artifactService: ArtifactService,
    private readonly ghwService: GhwService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PI, Role.COLLABORATOR)
  async create(
    @Req() req: any,
    @Body() createArtifactDto: CreateArtifactDto
  ): Promise<ListArtifactDto> {
    if (!req.user || !req.user.username || !req.user.email) {
      throw new UnauthorizedException('User information is missing from token');
    }
    
    // Extraer username y email directamente del token JWT
    const submitterInfo = {
      username: req.user.username,
      email: req.user.email
    };
    
    return await this.artifactService.create(createArtifactDto, submitterInfo);
  }

  @Get()
  async findAll(): Promise<ListArtifactDto[]> {
    return await this.artifactService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string
  ): Promise<GetArtifactDto> {
    return await this.artifactService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(
    @Param('id') id: string
  ): Promise<void> {
    return await this.artifactService.delete(id);
  }

  @Patch(':id')
  @UseGuards(ApiKeyAuthGuard, RolesGuard)
  @Roles(Role.SUBMITTER_LISTENER)
  async updateWorker(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateArtifactWorkerDto,
  ): Promise<ArtifactEntity> {
    return await this.artifactService.updateWorker(id, updateStatusDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PI, Role.COLLABORATOR)
  async updateUser(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateArtifactDetailsDto: UpdateArtifactUserDto,
  ): Promise<ArtifactEntity> {
    return await this.artifactService.updateUser(id, updateArtifactDetailsDto, req?.user?.email);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Param('id') id: string,
    @Query('offset') offsetQ?: string,
    @Query('limit') limitQ?: string,
    @Query('order') orderQ?: 'asc' | 'desc',
    @Query('includeValue') includeValueQ?: string,
    @Headers('x-correlation-id') corrId?: string,
  ): Promise<any> {
    return this.artifactService.getHistory(id, { offset: offsetQ, limit: limitQ, order: orderQ, includeValue: includeValueQ }, corrId);
  }

  @Post(':id/history/refresh')
  @UseGuards(JwtAuthGuard)
  async refreshHistory(
    @Param('id') id: string,
    @Headers('x-correlation-id') corrId?: string,
  ): Promise<any> {
    return this.artifactService.refreshHistory(id, corrId);
  }
}
