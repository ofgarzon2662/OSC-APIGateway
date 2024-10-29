import { Module } from '@nestjs/common';
import { SocioService } from './socio.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocioEntity } from './socio.entity';
import { SocioController } from './socio.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocioEntity])],
  providers: [SocioService],
  controllers: [SocioController]
})

export class SocioModule {}
