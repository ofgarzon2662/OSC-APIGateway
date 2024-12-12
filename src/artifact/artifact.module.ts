import { forwardRef, Module } from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtifactController } from './artifact.controller';
import { OrganizationEntity } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { ArtifactEntity } from './artifact.entity';
import { AppModule } from 'src/app.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArtifactEntity, OrganizationEntity]),
    OrganizationModule,
    forwardRef(() => AppModule),
  ],
  providers: [ArtifactService],
  controllers: [ArtifactController],
})
export class ArtifactModule {}
