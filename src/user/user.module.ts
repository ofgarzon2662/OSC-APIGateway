import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UserController } from './user.controller';
import { OrganizationEntity } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, OrganizationEntity]), // Ensure both entities are available
    OrganizationModule, // Import OrganizationModule if needed
    forwardRef(() => AuthModule), // Use forwardRef to resolve circular dependency
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // Export UserService to make it available to other modules
})
export class UserModule {}
