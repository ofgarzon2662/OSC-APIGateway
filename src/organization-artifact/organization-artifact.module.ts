import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../organization/organization.entity';
import { ArtifactEntity } from '../artifact/artifact.entity';
import { OrganizationArtifactService } from './organization-artifact.service';
import { OrganizationArtifactController } from './organization-artifact.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity, ArtifactEntity])],
  controllers: [OrganizationArtifactController],
  providers: [OrganizationArtifactService],
  exports: [OrganizationArtifactService],
})
export class OrganizationArtifactModule {}
