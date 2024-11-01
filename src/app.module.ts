import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { OrganizationModule } from './organization/organization.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
import { OrganizationEntity } from './organization/organization.entity';
import { OrganizationUserModule } from './organization-user/organization-user.module';
import { ArtifactEntity } from './artifact/artifact.entity';
import { ArtifactModule } from './artifact/artifact.module';

@Module({
  imports: [
    UserModule,
    OrganizationModule,
    ArtifactModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'organizationes',
      entities: [UserEntity, OrganizationEntity, ArtifactEntity],
      dropSchema: true,
      synchronize: true,
      keepConnectionAlive: true,
    }),
    OrganizationUserModule,
    ArtifactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
