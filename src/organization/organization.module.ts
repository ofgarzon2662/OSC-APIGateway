import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationEntity } from './organization.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './organization.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity])],
  providers: [OrganizationService],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
