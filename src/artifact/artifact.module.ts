import { Module } from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtifactController } from './artifact.controller';
import { ArtifactEntity } from './artifact.entity';
import { OrganizationArtifactModule } from '../organization-artifact/organization-artifact.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtifactEntity]), // Solo necesitamos la entidad de artefactos
    OrganizationArtifactModule, // Importamos el nuevo módulo de relaciones
  ],
  providers: [ArtifactService],
  controllers: [ArtifactController],
})
export class ArtifactModule {}
