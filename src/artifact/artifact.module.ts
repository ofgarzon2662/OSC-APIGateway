import { Module } from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { ArtifactController } from './artifact.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtifactEntity } from './artifact.entity';
import { OrganizationEntity } from '../organization/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtifactEntity, OrganizationEntity])
  ],
  controllers: [ArtifactController],
  providers: [ArtifactService],
  exports: [ArtifactService]
})
export class ArtifactModule {}
