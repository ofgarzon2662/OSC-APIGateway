import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
import { OrganizationEntity } from './organization/organization.entity';
import { ArtifactEntity } from './artifact/artifact.entity';
import { ArtifactModule } from './artifact/artifact.module';
import { OrganizationArtifactModule } from './organization-artifact/organization-artifact.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    UserModule,
    OrganizationModule,
    ArtifactModule,
    OrganizationArtifactModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'organization',
      entities: [UserEntity, OrganizationEntity, ArtifactEntity],
      dropSchema: true,
      synchronize: true,
      keepConnectionAlive: true,
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
