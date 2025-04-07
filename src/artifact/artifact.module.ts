import { Module } from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtifactController } from './artifact.controller';
import { ArtifactEntity } from './artifact.entity';
import { OrganizationEntity } from '../organization/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtifactEntity, OrganizationEntity]),
  ],
  providers: [ArtifactService],
  controllers: [ArtifactController],
})
export class ArtifactModule {}
