import { Module } from '@nestjs/common';
import { OrganizationUserService } from './organization-user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { OrganizationEntity } from '../organization/organization.entity';
import { OrganizationUserController } from './organization-user.controller';

@Module({
  providers: [OrganizationUserService],
  imports: [TypeOrmModule.forFeature([OrganizationEntity, UserEntity])],
  controllers: [OrganizationUserController],
})
export class OrganizationUserModule {}
