import { Module } from '@nestjs/common';
import { ClubSocioService } from './club-socio.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocioEntity } from '../socio/socio.entity';
import { ClubEntity } from '../club/club.entity';
import { ClubSocioController } from './club-socio.controller';

@Module({
  providers: [ClubSocioService],
  imports: [TypeOrmModule.forFeature([ClubEntity, SocioEntity])],
  controllers: [ClubSocioController],
})
export class ClubSocioModule {}