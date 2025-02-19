import { Module } from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtifactController } from './artifact.controller';
import { OrganizationEntity } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { ArtifactEntity } from './artifact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtifactEntity, OrganizationEntity]), // Ensure both entities are available
    OrganizationModule, // Import OrganizationModule if needed
  ],
  providers: [ArtifactService],
  controllers: [ArtifactController],
})
export class ArtifactModule {}
