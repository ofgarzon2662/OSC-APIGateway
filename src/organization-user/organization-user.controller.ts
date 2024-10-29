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

import { ClubSocioService } from './club-socio.service';
import { plainToInstance } from 'class-transformer';
import { SocioDto } from '../socio/socio.dto';
import { SocioEntity } from '../socio/socio.entity';
import { BusinessErrorsInterceptor } from '../shared/interceptors/business-errors.interceptors';

@Controller('clubs')
@UseInterceptors(BusinessErrorsInterceptor)
export class ClubSocioController {
    constructor(private readonly clubSocioService: ClubSocioService) {}

    // Agrergar un socio a un club
    @Post(':clubId/members/:memberId')
    async addMemberToClub(
        @Param('clubId') clubId: string,
        @Param('memberId') memberId: string,
    ) {
        return await this.clubSocioService.addMemberToClub(clubId, memberId);
    }

    // Enontrar miembros de un club

    @Get(':clubId/members')
    async findMembersByClub(@Param('clubId') clubId: string) {
        return await this.clubSocioService.findMembersFromClub(clubId);
    }

    // Encontrar un miembro de un club

    @Get(':clubId/members/:memberId')
    async findMemberByClub(
        @Param('clubId') clubId: string,
        @Param('memberId') memberId: string,
    ) {
        return await this.clubSocioService.findMemberFromClub(clubId, memberId);
    }


    // Actualizar miembros de un club

    @Put(':clubId/members')
    async updateMembersFromClub(
        @Param('clubId') clubId: string,
        @Body() sociosDto: SocioDto[],
    ) {
        const sociosEntities: SocioEntity[] = plainToInstance(SocioEntity, sociosDto);

        return await this.clubSocioService.updateMembersFromClub(clubId, sociosEntities);
    }

    // Eliminar un socio de un club

    @Delete(':clubId/members/:memberId')
    @HttpCode(204)
    async deleteMemberFromClub(
        @Param('clubId') clubId: string,
        @Param('memberId') memberId: string,
    ) {
        return await this.clubSocioService.deleteMemberFromClub(clubId, memberId);
    }
}