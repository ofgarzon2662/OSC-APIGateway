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
import { ClubService } from './club.service';
import { ClubEntity } from './club.entity';
import { ClubDto } from './club.dto';
import { plainToInstance } from 'class-transformer';

@Controller('clubs')
@UseInterceptors(BusinessErrorsInterceptor)

export class ClubController {
    constructor(private readonly clubService: ClubService) {}
    
    // Obtener todos los clubs
    @Get()
    async findAll() {
        return await this.clubService.findAll();
    }
    
    // Obtener un club por id
    @Get(':clubId')
    async findOne(@Param('clubId') clubId: string) {
        return await this.clubService.findOne(clubId);
    }
    
    // Crear un club
    @Post()
    async create(@Body() clubDto: ClubDto) {
        const club: ClubEntity = plainToInstance(ClubEntity, clubDto);
        return await this.clubService.create(club);
    }
    
    // Actualizar un club
    @Put(':clubId')
    async update(
        @Param('clubId') clubId: string,
        @Body() clubDto: ClubDto,
    ) {
        const club: ClubEntity = plainToInstance(ClubEntity, clubDto);
        return await this.clubService.update(clubId, club);
    }
    
    // Eliminar un club
    @Delete(':clubId')
    @HttpCode(204)
    async delete(@Param('clubId') clubId: string) {
        return this.clubService.delete(clubId);
    }
    }