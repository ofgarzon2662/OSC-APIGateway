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
  Headers,
  BadRequestException,
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
    @Param('id') id: string,
    @Body() updateArtifactDetailsDto: UpdateArtifactUserDto,
  ): Promise<ArtifactEntity> {
    return await this.artifactService.updateUser(id, updateArtifactDetailsDto);
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
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!id || !uuidRegex.test(id)) {
      throw new BadRequestException('Invalid artifactId');
    }
    const artifactId = id.toLowerCase();

    const offset = Math.max(0, Number(offsetQ ?? 0) || 0);
    let limit = Number(limitQ ?? 100) || 100;
    if (limit < 1) limit = 1;
    if (limit > 500) limit = 500;
    const order = (orderQ === 'asc' || orderQ === 'desc') ? orderQ : 'desc';
    const includeValue = includeValueQ === undefined ? true : String(includeValueQ).toLowerCase() !== 'false';

    const correlationId = corrId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      const resp = await this.ghwService.fetchHistory({ artifactId, offset, limit, order, includeValue }, correlationId);
      (resp as any).nextOffset = resp?.hasMore ? offset + limit : undefined;
      return resp;
    } catch (err: any) {
      if (err?.message === 'CONNECT_TIMEOUT' || err?.message === 'READ_TIMEOUT') {
        const { GatewayTimeoutException } = require('@nestjs/common');
        throw new GatewayTimeoutException('Upstream timeout contacting GHW');
      }
      const status = err?.statusCode;
      if (status) {
        const { BadGatewayException } = require('@nestjs/common');
        throw new BadGatewayException(`GHW error ${status}`);
      }
      const { BadGatewayException } = require('@nestjs/common');
      throw new BadGatewayException('GHW error');
    }
  }

  @Post(':id/history/refresh')
  @UseGuards(JwtAuthGuard)
  async refreshHistory(
    @Param('id') id: string,
    @Headers('x-correlation-id') corrId?: string,
  ): Promise<any> {
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!id || !uuidRegex.test(id)) {
      throw new BadRequestException('Invalid artifactId');
    }
    const artifactId = id.toLowerCase();
    const correlationId = corrId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      return await this.ghwService.refresh(artifactId, correlationId);
    } catch (err: any) {
      if (err?.message === 'CONNECT_TIMEOUT' || err?.message === 'READ_TIMEOUT') {
        const { GatewayTimeoutException } = require('@nestjs/common');
        throw new GatewayTimeoutException('Upstream timeout contacting GHW');
      }
      const status = err?.statusCode;
      if (status) {
        const { BadGatewayException } = require('@nestjs/common');
        throw new BadGatewayException(`GHW error ${status}`);
      }
      const { BadGatewayException } = require('@nestjs/common');
      throw new BadGatewayException('GHW error');
    }
  }
}
