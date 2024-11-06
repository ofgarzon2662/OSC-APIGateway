import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserController } from './user.controller';
import { OrganizationEntity } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, OrganizationEntity]), // Ensure both entities are available
    OrganizationModule, // Import OrganizationModule if needed
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
